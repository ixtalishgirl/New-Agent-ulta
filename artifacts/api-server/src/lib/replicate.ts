import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

// ══════════════════════════════════════════════════════════════
//  SYSTEM PROMPT — Direct, Smart, Fast & Helpful
// ══════════════════════════════════════════════════════════════
export interface ChatAttachment {
  name: string;
  type: string;
  data?: string; // data URL or base64
  url?: string;
  size?: number;
  textContent?: string;
}

// ══════════════════════════════════════════════════════════════
//  SYSTEM PROMPT — Direct, Smart, Fast & Multimodal Vision
// ══════════════════════════════════════════════════════════════
export const BASE_SYSTEM_PROMPT = `You are an advanced, intelligent, fast, and multimodal AI Assistant with vision and code analysis capabilities.
- Vision & Multimodal: You can see, inspect, and analyze uploaded screenshots, images, charts, and diagrams with high precision. When user shares a screenshot or image, explain what is inside it, read text/UI elements, diagnose issues/errors, and answer questions.
- Code & Files: You can inspect uploaded files, code snippets, logs, and data files, identifying bugs and providing optimized solutions.
- Direct & Clear: Answer directly, clearly, concisely, and accurately without unnecessary hesitation.
- Language: You seamlessly understand and respond in Roman Urdu, Urdu, or English matching the user's preference.
- Format: Use clean Markdown formatting with syntax-highlighted code blocks.`;

export const SYSTEM_PROMPT = BASE_SYSTEM_PROMPT;

export const ACTIVE_NVIDIA_MODEL = "meta/llama-3.2-11b-vision-instruct";
export const AVAILABLE_NVIDIA_MODELS = [
  "meta/llama-3.2-11b-vision-instruct",
  "nvidia/nemotron-3.5-lightning-30b-a3b",
  "google/diffusiongemma-26b-a4b-it",
];

export function buildSystemPrompt(): string {
  return BASE_SYSTEM_PROMPT;
}

function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

function processAttachments(
  userMessage: string,
  attachments?: ChatAttachment[],
): { finalPrompt: string; imageUrls: string[] } {
  let finalPrompt = userMessage;
  const imageUrls: string[] = [];

  if (!attachments || attachments.length === 0) {
    return { finalPrompt, imageUrls };
  }

  const fileSnippets: string[] = [];

  for (const att of attachments) {
    const isImage =
      att.type?.startsWith("image/") ||
      att.data?.startsWith("data:image/") ||
      /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(att.name || "");

    if (isImage) {
      if (att.data && att.data.startsWith("data:image/")) {
        imageUrls.push(att.data);
      } else if (att.data) {
        imageUrls.push(`data:${att.type || "image/png"};base64,${att.data}`);
      } else if (att.url) {
        imageUrls.push(att.url);
      }
    } else if (att.textContent) {
      fileSnippets.push(`\n📁 **[Attached File: ${att.name || "document"}]**\n\`\`\`\n${att.textContent}\n\`\`\``);
    } else if (att.data && !att.data.startsWith("data:")) {
      // Check if it's text base64
      try {
        const decoded = Buffer.from(att.data, "base64").toString("utf8");
        if (/^[\x20-\x7E\s\t\n\r\u0600-\u06FF]+$/.test(decoded.slice(0, 1000))) {
          fileSnippets.push(`\n📁 **[Attached File: ${att.name || "document"}]**\n\`\`\`\n${decoded}\n\`\`\``);
        }
      } catch {}
    }
  }

  if (fileSnippets.length > 0) {
    finalPrompt = `${fileSnippets.join("\n\n")}\n\n${userMessage}`;
  }

  return { finalPrompt, imageUrls };
}

export function getNvidiaApiKey(): string | null {
  if (process.env.NVIDIA_API_KEY && process.env.NVIDIA_API_KEY.trim()) {
    return process.env.NVIDIA_API_KEY.trim();
  }
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim().startsWith("nvapi-")) {
    return process.env.DATABASE_URL.trim();
  }
  try {
    const workspaceRoot = process.env.AGENT_WORKSPACE || "/tmp/workspace";
    const keyFile = path.join(workspaceRoot, "nvidia_key.txt");
    if (fs.existsSync(keyFile)) {
      const k = fs.readFileSync(keyFile, "utf8").trim();
      if (k) return k;
    }
  } catch {}
  return null;
}

export function saveNvidiaApiKey(key: string): void {
  const cleanKey = key.trim();
  process.env.NVIDIA_API_KEY = cleanKey;
  try {
    const workspaceRoot = process.env.AGENT_WORKSPACE || "/tmp/workspace";
    fs.mkdirSync(workspaceRoot, { recursive: true });
    fs.writeFileSync(path.join(workspaceRoot, "nvidia_key.txt"), cleanKey, "utf8");
  } catch {}
}

// ══════════════════════════════════════════════════════════════
//  STREAM GENERATOR — For Realtime Chat Streaming
// ══════════════════════════════════════════════════════════════
export async function* streamLLMResponse(
  history: { role: "user" | "assistant"; content: string }[],
  userMessage: string,
  requestedModel?: string,
  attachments?: ChatAttachment[],
): AsyncGenerator<string, void, unknown> {
  const nvidiaKey = getNvidiaApiKey();
  let streamWorked = false;

  const { finalPrompt, imageUrls } = processAttachments(userMessage, attachments);

  // 1. Try NVIDIA API Streaming
  if (nvidiaKey) {
    try {
      const nvidia = new OpenAI({
        baseURL: "https://integrate.api.nvidia.com/v1",
        apiKey: nvidiaKey,
        timeout: 60_000,
        maxRetries: 1,
      });

      // Construct user message (multimodal if images present)
      let userMsgParam: OpenAI.ChatCompletionUserMessageParam;
      if (imageUrls.length > 0) {
        const contentParts: OpenAI.ChatCompletionContentPart[] = [
          { type: "text", text: finalPrompt || "Please analyze this image/screenshot and tell me what is inside it." },
          ...imageUrls.map((url) => ({
            type: "image_url" as const,
            image_url: { url },
          })),
        ];
        userMsgParam = { role: "user", content: contentParts };
      } else {
        userMsgParam = { role: "user", content: finalPrompt };
      }

      const messages: OpenAI.ChatCompletionMessageParam[] = [
        { role: "system", content: BASE_SYSTEM_PROMPT },
        ...history.slice(-10).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        userMsgParam,
      ];

      const candidateModels = [
        requestedModel,
        ACTIVE_NVIDIA_MODEL,
        "nvidia/nemotron-3.5-lightning-30b-a3b",
        "google/diffusiongemma-26b-a4b-it",
      ].filter(Boolean) as string[];
      const dedupedCandidates = [...new Set(candidateModels)];

      for (const model of dedupedCandidates) {
        try {
          const stream = await nvidia.chat.completions.create({
            model,
            messages,
            max_tokens: 4096,
            temperature: 0.7,
            stream: true,
          });

          for await (const chunk of stream) {
            const rawChoice = chunk.choices[0];
            const delta =
              rawChoice?.delta?.content ||
              ((rawChoice?.delta as Record<string, unknown>)?.reasoning_content as string) ||
              "";
            if (delta) {
              streamWorked = true;
              yield delta;
            }
          }

          if (streamWorked) return;
        } catch (err) {
          console.warn(`NVIDIA streaming with model ${model} failed, trying next:`, err);
        }
      }
    } catch (err) {
      console.warn("NVIDIA streaming error:", err);
    }
  }

  // 2. Fallback to Gemini Streaming
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const userParts: any[] = [];
      if (finalPrompt) userParts.push({ text: finalPrompt });

      for (const imgUrl of imageUrls) {
        const match = imgUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          userParts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          });
        }
      }

      const contents = [
        ...history.slice(-10).map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        {
          role: "user",
          parts: userParts.length > 0 ? userParts : [{ text: userMessage }],
        },
      ];

      const responseStream = await ai.models.generateContentStream({
        model: "gemini-3.7-flash",
        config: {
          systemInstruction: BASE_SYSTEM_PROMPT,
          temperature: 0.7,
        },
        contents,
      });

      for await (const chunk of responseStream) {
        const text = chunk.text || "";
        if (text) {
          streamWorked = true;
          yield text;
        }
      }

      if (streamWorked) return;
    } catch (err) {
      console.warn("Gemini streaming error:", err);
    }
  }

  // 3. Fallback to Single response generator
  const single = await generateReplicateReply(BASE_SYSTEM_PROMPT, history, userMessage, requestedModel, attachments);
  yield single;
}

// ══════════════════════════════════════════════════════════════
//  STANDARD GENERATE FUNCTION
// ══════════════════════════════════════════════════════════════
export async function generateReplicateReply(
  systemPrompt: string,
  history: { role: "user" | "assistant"; content: string }[],
  userMessage: string,
  requestedModel?: string,
  attachments?: ChatAttachment[],
): Promise<string> {
  const nvidiaKey = getNvidiaApiKey();
  let lastNvidiaError: string | null = null;

  const { finalPrompt, imageUrls } = processAttachments(userMessage, attachments);

  // Provider 1: NVIDIA Integrate API
  if (nvidiaKey) {
    try {
      const nvidia = new OpenAI({
        baseURL: "https://integrate.api.nvidia.com/v1",
        apiKey: nvidiaKey,
        timeout: 60_000,
        maxRetries: 1,
      });

      let userMsgParam: OpenAI.ChatCompletionUserMessageParam;
      if (imageUrls.length > 0) {
        const contentParts: OpenAI.ChatCompletionContentPart[] = [
          { type: "text", text: finalPrompt || "Please analyze this image/screenshot and tell me what is inside it." },
          ...imageUrls.map((url) => ({
            type: "image_url" as const,
            image_url: { url },
          })),
        ];
        userMsgParam = { role: "user", content: contentParts };
      } else {
        userMsgParam = { role: "user", content: finalPrompt };
      }

      const messages: OpenAI.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt || BASE_SYSTEM_PROMPT },
        ...history.slice(-10).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        userMsgParam,
      ];

      const priorityModels = [
        requestedModel,
        ACTIVE_NVIDIA_MODEL,
        "nvidia/nemotron-3.5-lightning-30b-a3b",
        "google/diffusiongemma-26b-a4b-it",
      ];
      const dedupedModels = [...new Set(priorityModels)].filter(Boolean) as string[];

      for (const model of dedupedModels) {
        try {
          const completion = await nvidia.chat.completions.create({
            model,
            messages,
            max_tokens: 4096,
            temperature: 0.7,
          });
          const choice = completion.choices[0]?.message;
          const raw =
            choice?.content ||
            ((choice as Record<string, unknown>)?.reasoning_content as string) ||
            "";
          if (raw.trim()) return stripThinking(raw);
        } catch (err) {
          lastNvidiaError = err instanceof Error ? err.message : String(err);
          console.warn(`NVIDIA model ${model} failed, trying next:`, err);
          continue;
        }
      }
    } catch (err) {
      lastNvidiaError = err instanceof Error ? err.message : String(err);
      console.warn("NVIDIA API connection error:", err);
    }
  }

  // Provider 2: Gemini API
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const userParts: any[] = [];
      if (finalPrompt) userParts.push({ text: finalPrompt });

      for (const imgUrl of imageUrls) {
        const match = imgUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          userParts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          });
        }
      }

      const contents = [
        ...history.slice(-10).map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        {
          role: "user",
          parts: userParts.length > 0 ? userParts : [{ text: userMessage }],
        },
      ];

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        config: {
          systemInstruction: systemPrompt || BASE_SYSTEM_PROMPT,
          temperature: 0.7,
        },
        contents,
      });

      const text = response.text || "";
      if (text.trim()) {
        return stripThinking(text);
      }
    } catch (err) {
      console.warn("Gemini API error:", err);
    }
  }

  // Provider 3: OpenAI API
  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt || BASE_SYSTEM_PROMPT },
          ...history.slice(-10).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
          { role: "user", content: finalPrompt },
        ],
        max_tokens: 4096,
        temperature: 0.7,
      });
      const raw = completion.choices[0]?.message?.content ?? "";
      if (raw.trim()) return stripThinking(raw);
    } catch (err) {
      console.warn("OpenAI API error:", err);
    }
  }

  if (nvidiaKey && lastNvidiaError) {
    return `NVIDIA API Key detect hua lekin error aaya:
\`\`\`
${lastNvidiaError}
\`\`\`
Please verify karein ke aapka NVIDIA API key (\`nvapi-...\`) valid hai.`;
  }

  return `Salam! Main aapka AI assistant hoon. Main screenshots, images, code aur files dekh aur samajh sakta hoon.

Active Model: **${ACTIVE_NVIDIA_MODEL}**`;
}
}
