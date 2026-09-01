import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, conversationsTable, messagesTable } from "@workspace/db";
import {
  CreateConversationBody,
  GetConversationParams,
  DeleteConversationParams,
  ListMessagesParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/conversations", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      id: conversationsTable.id,
      title: conversationsTable.title,
      model: conversationsTable.model,
      createdAt: conversationsTable.createdAt,
      messageCount: sql<number>`cast(count(${messagesTable.id}) as int)`,
    })
    .from(conversationsTable)
    .leftJoin(messagesTable, eq(messagesTable.conversationId, conversationsTable.id))
    .groupBy(conversationsTable.id)
    .orderBy(sql`${conversationsTable.updatedAt} desc`);

  res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/conversations", async (req, res): Promise<void> => {
  const parsed = CreateConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [conv] = await db
    .insert(conversationsTable)
    .values({
      title: parsed.data.title,
      model: parsed.data.model ?? "deepseek-chat",
    })
    .returning();

  res.status(201).json({ ...conv, createdAt: conv.createdAt.toISOString(), messageCount: 0 });
});

router.get("/conversations/:id", async (req, res): Promise<void> => {
  const params = GetConversationParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [conv] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, params.data.id));

  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, params.data.id))
    .orderBy(messagesTable.createdAt);

  res.json({
    ...conv,
    createdAt: conv.createdAt.toISOString(),
    messages: messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
  });
});

router.delete("/conversations/:id", async (req, res): Promise<void> => {
  const params = DeleteConversationParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(conversationsTable).where(eq(conversationsTable.id, params.data.id));
  res.sendStatus(204);
});

router.get("/conversations/:id/messages", async (req, res): Promise<void> => {
  const params = ListMessagesParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, params.data.id))
    .orderBy(messagesTable.createdAt);

  res.json(messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })));
});

export default router;
