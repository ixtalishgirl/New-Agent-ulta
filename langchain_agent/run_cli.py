"""
CLI runner for Halye LangChain Agentic Brain.
Reads JSON request from stdin or command line arguments, executes via AgentExecutor,
and outputs pure JSON with thoughts, actions, intermediate steps, and memory state.
"""

import sys
import json
import os
import time

# Ensure current working directory and module parent is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.getcwd())

# Suppress noisy warnings
import warnings
warnings.filterwarnings("ignore")

from langchain_agent.agent import agent_brain
from langchain_agent.custom_llm import (
    is_configured as custom_llm_is_configured,
    get_config as custom_llm_get_config,
    query_custom_llm,
)

def main():
    try:
        raw_input = ""
        if len(sys.argv) > 1:
            raw_input = sys.argv[1]
        elif not sys.stdin.isatty():
            raw_input = sys.stdin.read().strip()
            
        data = {}
        if raw_input:
            try:
                data = json.loads(raw_input)
            except Exception:
                data = {"prompt": raw_input}
        else:
            data = {"action": "status"}
            
        action = data.get("action", "run")
        
        if action == "run":
            prompt = data.get("prompt", "")
            framework = data.get("framework", "tool_calling")
            res = agent_brain.run(prompt, framework=framework)
            print(json.dumps(res))
            
        elif action == "tools":
            manifest = agent_brain.get_tools_manifest()
            print(json.dumps({"success": True, "count": len(manifest), "tools": manifest}))
            
        elif action == "memory":
            mem = agent_brain.get_memory_state()
            print(json.dumps({"success": True, "count": len(mem), "messages": mem}))
            
        elif action == "clear_memory":
            res = agent_brain.clear_memory()
            print(json.dumps(res))
            
        elif action == "execute_tool":
            tool_name = data.get("tool_name")
            args = data.get("arguments", {})
            tool_map = {t.name: t for t in agent_brain.tools}
            if tool_name not in tool_map:
                print(json.dumps({"success": False, "error": f"Tool '{tool_name}' not found"}))
                return
            result = tool_map[tool_name].invoke(args)
            print(json.dumps({"success": True, "tool": tool_name, "arguments": args, "result": result}))
            
        elif action == "status":
            mem = agent_brain.get_memory_state()
            custom_cfg = custom_llm_get_config()
            status = {
                "status": "online",
                "model_engine": agent_brain.model_type,
                "uses_custom_llm": getattr(agent_brain, "uses_custom_llm", False),
                "last_executor_error": getattr(agent_brain, "last_executor_error", None),
                "custom_llm": {
                    "configured": custom_cfg["configured"],
                    "url": custom_cfg["url"],
                    "max_tokens": custom_cfg["max_tokens"],
                    "timeout_seconds": custom_cfg["timeout"],
                },
                "memory_turns": len(mem),
                "tools_count": len(agent_brain.tools),
                "tools": [t.name for t in agent_brain.tools],
                "admin_access": "RAW_SUPERUSER"
            }
            print(json.dumps(status))

        elif action == "test_custom_llm":
            prompt = data.get("prompt", "Reply with exactly: PONG")
            started = time.time()
            try:
                reply = query_custom_llm(prompt, max_tokens=128)
                print(json.dumps({
                    "success": True,
                    "configured": custom_llm_is_configured(),
                    "url": custom_llm_get_config()["url"],
                    "prompt": prompt,
                    "response": reply,
                    "latency_ms": int((time.time() - started) * 1000),
                }))
            except Exception as custom_err:
                print(json.dumps({
                    "success": False,
                    "error": str(custom_err),
                    "latency_ms": int((time.time() - started) * 1000),
                }))
            
        else:
            print(json.dumps({"success": False, "error": f"Unknown action: {action}"}))
            
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()
