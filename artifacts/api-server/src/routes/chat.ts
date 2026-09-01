import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, conversationsTable, messagesTable } from "@workspace/db";
import {
  generateReplicateReply,
  streamLLMResponse,
  saveNvidiaApiKey,
  ACTIVE_NVIDIA_MODEL,
} from "../lib/replicate";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// Stop endpoint
router.post("/chat/stop", (_req, res): void => {
  res.json({ stopped: true });
});

// SSE Streaming chat endpoint
router.post("/chat/stream", async (req, res): Promise<void> => {
  const body = req.body as { message?: unknown; conversationId?: unknown; model?: unknown };
  if (!body.message || typeof body.message !== "string") {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const message = body.message;
  let conversationId: number | null = typeof body.conversationId === "number" ? body.conversationId : null;

  // Auto-detect & save NVIDIA API key if user provides it in message
  const nvKeyMatch = message.match(/(nvapi-[A-Za-z0-9_-]{20,})/i) || message.match(/NVIDIA_API_KEY\s*[:=]\s*([A-Za-z0-9_-]+)/i);
  if (nvKeyMatch && nvKeyMatch[1]) {
    saveNvidiaApiKey(nvKeyMatch[1].trim());
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (ev: string, data: unknown) => {
    res.write(`event: ${ev}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // Auto-create or find conversation
    if (!conversationId) {
      const [created] = await db
        .insert(conversationsTable)
        .values({
          title: message.slice(0, 50) || "New Chat",
          model: typeof body.model === "string" ? body.model : ACTIVE_NVIDIA_MODEL,
        })
        .returning();
      conversationId = created.id;
    }
    send("start", { conversationId });

    // Fetch existing messages
    const existingMessages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, conversationId!))
      .orderBy(messagesTable.createdAt);

    // Save user message
    await db.insert(messagesTable).values({
      conversationId: conversationId!,
      role: "user",
      content: message,
    });

    const history = existingMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    send("progress", { stage: "thinking", message: "Generating response..." });

    let fullReply = "";
    const requestedModel = typeof body.model === "string" ? body.model : ACTIVE_NVIDIA_MODEL;

    for await (const chunk of streamLLMResponse(history, message, requestedModel)) {
      fullReply += chunk;
      send("chunk", { chunk, fullReply });
    }

    if (!fullReply.trim()) {
      fullReply = await generateReplicateReply("", history, message, requestedModel);
    }

    // Save assistant reply in DB
    const [savedReply] = await db
      .insert(messagesTable)
      .values({
        conversationId: conversationId!,
        role: "assistant",
        content: fullReply,
      })
      .returning();

    await db
      .update(conversationsTable)
      .set({ updatedAt: new Date() })
      .where(eq(conversationsTable.id, conversationId!));

    send("done", {
      reply: fullReply,
      conversationId,
      messageId: savedReply.id,
      steps: 1,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err }, "Chat stream error");
    send("error", { error: msg });
  } finally {
    res.end();
  }
});

// Standard POST /chat endpoint
router.post("/chat", async (req, res): Promise<void> => {
  const body = req.body as { message?: unknown; conversationId?: unknown; model?: unknown };

  if (!body.message || typeof body.message !== "string") {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const message = body.message;
  let conversationId: number | null = typeof body.conversationId === "number" ? body.conversationId : null;

  // Auto-detect & save NVIDIA API key if user provides it in message
  const nvKeyMatch = message.match(/(nvapi-[A-Za-z0-9_-]{20,})/i) || message.match(/NVIDIA_API_KEY\s*[:=]\s*([A-Za-z0-9_-]+)/i);
  if (nvKeyMatch && nvKeyMatch[1]) {
    saveNvidiaApiKey(nvKeyMatch[1].trim());
  }

  try {
    if (!conversationId) {
      const title = message.slice(0, 50) || "New Chat";
      const [created] = await db
        .insert(conversationsTable)
        .values({ title, model: typeof body.model === "string" ? body.model : ACTIVE_NVIDIA_MODEL })
        .returning();
      conversationId = created.id;
    }

    const existingMessages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, conversationId))
      .orderBy(messagesTable.createdAt);

    await db.insert(messagesTable).values({
      conversationId,
      role: "user",
      content: message,
    });

    const history = existingMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const requestedModel = typeof body.model === "string" ? body.model : ACTIVE_NVIDIA_MODEL;
    const fullReply = await generateReplicateReply("", history, message, requestedModel);

    const [savedReply] = await db
      .insert(messagesTable)
      .values({ conversationId, role: "assistant", content: fullReply })
      .returning();

    await db
      .update(conversationsTable)
      .set({ updatedAt: new Date() })
      .where(eq(conversationsTable.id, conversationId));

    res.json({
      reply: fullReply,
      conversationId,
      messageId: savedReply.id,
      steps: 1,
      model: requestedModel,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

export default router;
