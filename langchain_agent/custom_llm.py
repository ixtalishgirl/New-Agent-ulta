"""
Custom self-hosted LLM endpoint client for the Halye agent.

The endpoint is a FastAPI + ngrok server hosting an uncensored Mistral-Nemo-12B
on Kaggle T4 GPUs. Its contract is deliberately tiny:

    POST {"prompt": str, "max_tokens": int}  ->  {"response": str}

Real quirks of the live endpoint that this client absorbs (observed by calling
it, not assumed):

1. It returns `prompt + completion` concatenated. Without stripping the echoed
   prefix, every agent answer would contain the whole prompt again, which reads
   exactly like "the agent is just repeating me".
2. It needs the `ngrok-skip-browser-warning` header, otherwise ngrok serves its
   HTML interstitial page instead of reaching the model.
3. A cold tunnel or a recycled Kaggle session can take tens of seconds, so the
   timeout is generous and configurable via CUSTOM_LLM_TIMEOUT_MS.

The endpoint is a *plain text completion* API (it has no tool-calling schema),
so `CustomLLMChatModel` teaches it the tool contract inside the prompt and then
parses the model's JSON reply back into real LangChain tool calls. That is what
lets the existing AgentExecutor drive it without any tool rewiring.
"""

import os
import re
import json
import time
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger("HalyeCustomLLM")

DEFAULT_URL = "https://pancreas-smashing-breeching.ngrok-free.dev/generate"

ASSISTANT_MARKER = "### ASSISTANT"


def get_config() -> Dict[str, Any]:
    """Reads the endpoint configuration from the environment (with sane fallbacks)."""
    url = (os.environ.get("CUSTOM_LLM_API_URL") or DEFAULT_URL).strip()
    key = (os.environ.get("CUSTOM_LLM_API_KEY") or "").strip()

    def _int(name: str, default: int, low: int, high: int) -> int:
        try:
            value = int(os.environ.get(name, ""))
        except (TypeError, ValueError):
            return default
        return max(low, min(value, high))

    return {
        "url": url,
        "key": key,
        "max_tokens": _int("CUSTOM_LLM_MAX_TOKENS", 1024, 64, 8192),
        "timeout": _int("CUSTOM_LLM_TIMEOUT_MS", 120000, 5000, 600000) / 1000.0,
        "configured": url.startswith("http://") or url.startswith("https://"),
    }


def is_configured() -> bool:
    return bool(get_config()["configured"])


def build_prompt(prompt_text: str,
                 system_instruction: Optional[str] = None,
                 history: Optional[List[Dict[str, str]]] = None) -> str:
    """
    Flattens a system prompt, the conversation history and the user turn into the
    single `prompt` string the endpoint accepts.
    """
    blocks: List[str] = []
    system = (system_instruction or "").strip()
    if system:
        blocks.append("### SYSTEM\n" + system)
    for turn in (history or [])[-6:]:
        text = (turn.get("text") or "").strip()
        if not text:
            continue
        role = "ASSISTANT" if turn.get("role") == "assistant" else "USER"
        blocks.append(f"### {role}\n{text}")
    blocks.append("### USER\n" + (prompt_text or "").strip())
    blocks.append(ASSISTANT_MARKER)
    return "\n\n".join(blocks)


def strip_echoed_prompt(full_prompt: str, raw_response: str) -> str:
    """
    Removes the echoed prompt from the response. Falls back to cutting at the last
    ASSISTANT marker and finally to the raw body, so an upstream formatting change
    degrades instead of duplicating the prompt into every answer.
    """
    text = (raw_response or "").strip()
    prompt = (full_prompt or "").strip()
    if prompt and text.startswith(prompt):
        text = text[len(prompt):].strip()
    elif prompt:
        tail = prompt[-400:].strip()
        index = text.rfind(tail) if tail else -1
        if index >= 0:
            text = text[index + len(tail):].strip()
    marker = text.rfind(ASSISTANT_MARKER)
    if marker >= 0:
        text = text[marker + len(ASSISTANT_MARKER):].strip()
    return text


def query_custom_llm(prompt_text: str,
                     max_tokens: int = 512,
                     system_instruction: Optional[str] = None,
                     history: Optional[List[Dict[str, str]]] = None) -> str:
    """
    Calls the custom LLM endpoint and returns the generated text only.

    Raises RuntimeError with a descriptive message on any failure so callers can
    report a real error instead of silently returning a fabricated answer.
    """
    import requests  # imported lazily so the module can be inspected without it

    config = get_config()
    if not config["configured"]:
        raise RuntimeError("CUSTOM_LLM_NOT_CONFIGURED: CUSTOM_LLM_API_URL is not a valid http(s) URL.")

    full_prompt = build_prompt(prompt_text, system_instruction, history)
    headers = {
        "Content-Type": "application/json",
        # Without this ngrok returns its browser-warning HTML page, not the model output.
        "ngrok-skip-browser-warning": "true",
    }
    if config["key"]:
        headers["Authorization"] = f"Bearer {config['key']}"

    budget = max(1, min(int(max_tokens or config["max_tokens"]), config["max_tokens"]))
    started = time.time()
    try:
        response = requests.post(
            config["url"],
            json={"prompt": full_prompt, "max_tokens": budget},
            headers=headers,
            timeout=config["timeout"],
        )
    except Exception as err:  # network / DNS / timeout
        raise RuntimeError(f"CUSTOM_LLM_UNREACHABLE: {err}") from err

    if response.status_code != 200:
        raise RuntimeError(f"CUSTOM_LLM_HTTP_{response.status_code}: {response.text[:300]}")

    try:
        payload = response.json()
    except ValueError as err:
        raise RuntimeError(
            f"CUSTOM_LLM_BAD_JSON: endpoint did not return JSON ({response.text[:200]!r})"
        ) from err

    raw = ""
    for candidate in (
        payload.get("response"),
        payload.get("text"),
        payload.get("generated_text"),
        (payload.get("choices") or [{}])[0].get("text") if isinstance(payload.get("choices"), list) else None,
    ):
        if isinstance(candidate, str) and candidate.strip():
            raw = candidate
            break

    if not raw:
        raise RuntimeError("CUSTOM_LLM_EMPTY_RESPONSE: endpoint returned 200 but no text.")

    text = strip_echoed_prompt(full_prompt, raw)
    logger.info(
        "Custom LLM answered in %.2fs (prompt=%d chars, completion=%d chars)",
        time.time() - started, len(full_prompt), len(text),
    )
    return text


# ---------------------------------------------------------------------------
# Tool-calling bridge
# ---------------------------------------------------------------------------

def render_tool_specs(tools: List[Any]) -> str:
    """Renders LangChain tools into a compact spec block for the prompt."""
    lines: List[str] = []
    for tool in tools or []:
        name = getattr(tool, "name", None) or "tool"
        description = (getattr(tool, "description", "") or "").strip().split("\n")[0]
        arg_names: List[str] = []
        schema = getattr(tool, "args", None)
        if isinstance(schema, dict):
            arg_names = list(schema.keys())
        signature = ", ".join(arg_names)
        lines.append(f"- {name}({signature}): {description[:200]}")
    return "\n".join(lines)


TOOL_PROTOCOL = (
    "Reply with EXACTLY ONE JSON object and nothing else.\n"
    "To use a tool: "
    '{"tool": "<tool_name>", "args": {"<arg>": "<value>"}}\n'
    "To give the final answer to the user: "
    '{"final_answer": "<your answer>"}\n'
    "Never invent tool output. Ask for a tool when you still need facts."
)


def build_tool_calling_prompt(system_prompt: str,
                              tool_specs: str,
                              history: Optional[List[Dict[str, str]]] = None,
                              user_input: str = "",
                              scratchpad: Optional[List[str]] = None) -> str:
    """Builds the full prompt that teaches the endpoint the tool contract."""
    system_block = (system_prompt or "").strip()
    if tool_specs:
        system_block += "\n\nAVAILABLE TOOLS:\n" + tool_specs
    system_block += "\n\nTOOL PROTOCOL:\n" + TOOL_PROTOCOL

    blocks = ["### SYSTEM\n" + system_block]

    for turn in (history or [])[-6:]:
        text = (turn.get("text") or "").strip()
        if not text:
            continue
        role = "ASSISTANT" if turn.get("role") == "assistant" else "USER"
        blocks.append(f"### {role}\n{text}")

    blocks.append("### USER\n" + (user_input or "").strip())

    if scratchpad:
        blocks.append("### SCRATCHPAD\n" + "\n".join(scratchpad))

    blocks.append(
        "### INSTRUCTION\n"
        "Return the next single JSON object only. "
        "If the scratchpad already contains the observation you needed, answer with final_answer."
    )
    blocks.append(ASSISTANT_MARKER)
    return "\n\n".join(blocks)


def _extract_json_objects(text: str) -> List[Dict[str, Any]]:
    """Finds every balanced top-level JSON object in the text, in order."""
    found: List[Dict[str, Any]] = []
    depth = 0
    start = -1
    in_string = False
    escaped = False
    for index, char in enumerate(text):
        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            continue
        if char == '"':
            in_string = True
        elif char == "{":
            if depth == 0:
                start = index
            depth += 1
        elif char == "}":
            if depth > 0:
                depth -= 1
                if depth == 0 and start >= 0:
                    chunk = text[start:index + 1]
                    try:
                        parsed = json.loads(chunk)
                        if isinstance(parsed, dict):
                            found.append(parsed)
                    except ValueError:
                        pass
                    start = -1
    return found


def parse_tool_decision(text: str) -> Dict[str, Any]:
    """
    Parses the model's reply into either a tool call or a final answer.

    Returns {"tool": name, "args": {...}} or {"final_answer": str}. Falls back to
    treating the whole reply as the final answer when no JSON decision is present,
    so a model that ignores the protocol still produces usable output.
    """
    cleaned = (text or "").strip()
    if not cleaned:
        return {"final_answer": ""}

    fenced = re.findall(r"```(?:json)?\s*([\s\S]*?)```", cleaned, flags=re.IGNORECASE)
    candidates: List[Dict[str, Any]] = []
    for block in fenced:
        candidates.extend(_extract_json_objects(block))
    candidates.extend(_extract_json_objects(cleaned))

    for obj in reversed(candidates):
        tool_name = obj.get("tool") or obj.get("action") or obj.get("name")
        if isinstance(tool_name, str) and tool_name:
            args = obj.get("args")
            if args is None:
                args = obj.get("arguments")
            if args is None:
                args = obj.get("tool_input")
            if isinstance(args, dict):
                return {"tool": tool_name.strip(), "args": args}
        for key in ("final_answer", "answer", "response", "output"):
            value = obj.get(key)
            if isinstance(value, str) and value.strip():
                return {"final_answer": value.strip()}

    # No JSON decision: strip any fence noise and treat the reply as the answer.
    plain = re.sub(r"```[a-z]*", "", cleaned).replace("```", "").strip()
    return {"final_answer": plain}


def render_messages(messages: List[Any]) -> Dict[str, Any]:
    """
    Converts the LangChain message list into (system, history, scratchpad, input).
    AIMessage tool calls become scratchpad Actions, ToolMessages become Observations.
    """
    system_parts: List[str] = []
    history: List[Dict[str, str]] = []
    scratchpad: List[str] = []
    user_input = ""

    for message in messages or []:
        content = message.content
        if isinstance(content, list):
            content = " ".join(
                part.get("text", "") if isinstance(part, dict) else str(part) for part in content
            )
        content = str(content or "")

        kind = type(message).__name__
        if kind == "SystemMessage":
            system_parts.append(content)
        elif kind == "HumanMessage":
            history.append({"role": "user", "text": content})
            user_input = content
        elif kind == "ToolMessage":
            scratchpad.append(f"Observation ({getattr(message, 'name', 'tool')}): {content[:4000]}")
        elif kind == "AIMessage":
            tool_calls = getattr(message, "tool_calls", None) or []
            if tool_calls:
                for call in tool_calls:
                    name = call.get("name") if isinstance(call, dict) else getattr(call, "name", "tool")
                    args = call.get("args") if isinstance(call, dict) else getattr(call, "args", {})
                    scratchpad.append(f"Action: {name}({json.dumps(args, default=str)})")
            else:
                history.append({"role": "assistant", "text": content})
        else:
            history.append({"role": "user", "text": content})
            user_input = content

    # The agent template appends the current user turn as the last human message,
    # so it is already in `history`; drop it from the history list to avoid repeats.
    if history and history[-1]["role"] == "user":
        history = history[:-1]

    return {
        "system": "\n\n".join(part for part in system_parts if part.strip()),
        "history": history,
        "scratchpad": scratchpad,
        "input": user_input,
    }


# ---------------------------------------------------------------------------
# LangChain integration
# ---------------------------------------------------------------------------
LANGCHAIN_AVAILABLE = False
try:
    from langchain_core.language_models.chat_models import BaseChatModel
    from langchain_core.messages import AIMessage
    from langchain_core.outputs import ChatResult, ChatGeneration
    LANGCHAIN_AVAILABLE = True
except Exception:  # pragma: no cover - LangChain optional
    BaseChatModel = object  # type: ignore


if LANGCHAIN_AVAILABLE:

    class CustomLLMChatModel(BaseChatModel):
        """
        LangChain chat model backed by the custom FastAPI + ngrok endpoint.

        The endpoint has no native tool-calling support, so this model renders the
        tool specs into the prompt and parses the JSON reply back into LangChain
        tool calls. That is what lets the existing AgentExecutor use it as-is.
        """

        model_name: str = "custom-llm:mistral-nemo-12b"
        bound_tools: List[Any] = []

        @property
        def _llm_type(self) -> str:
            return "custom_llm_ngrok_endpoint"

        def bind_tools(self, tools: List[Any], **kwargs: Any):
            instance = CustomLLMChatModel(model_name=self.model_name)
            instance.bound_tools = list(tools)
            return instance

        def _generate(self, messages: List[Any], stop: Optional[List[str]] = None, **kwargs: Any) -> ChatResult:
            rendered = render_messages(messages)
            tool_specs = render_tool_specs(self.bound_tools)
            prompt = build_tool_calling_prompt(
                system_prompt=rendered["system"],
                tool_specs=tool_specs,
                history=rendered["history"],
                user_input=rendered["input"],
                scratchpad=rendered["scratchpad"],
            )

            reply = query_custom_llm(prompt, max_tokens=get_config()["max_tokens"])
            decision = parse_tool_decision(reply)

            if decision.get("tool"):
                tool_call = {
                    "id": f"call_custom_{int(time.time() * 1000)}",
                    "name": decision["tool"],
                    "args": decision.get("args") or {},
                }
                print(f"[CustomLLM] Tool call: {tool_call['name']} {tool_call['args']}")
                message = AIMessage(
                    content=f"Thought: invoking `{tool_call['name']}` on the custom engine.",
                    tool_calls=[tool_call],
                )
            else:
                message = AIMessage(content=decision.get("final_answer") or reply)

            return ChatResult(generations=[ChatGeneration(message=message)])


__all__ = [
    "DEFAULT_URL",
    "get_config",
    "is_configured",
    "build_prompt",
    "strip_echoed_prompt",
    "query_custom_llm",
    "build_tool_calling_prompt",
    "parse_tool_decision",
    "render_tool_specs",
    "render_messages",
    "CustomLLMChatModel",
    "LANGCHAIN_AVAILABLE",
]
