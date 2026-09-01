import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, conversationsTable, messagesTable } from "@workspace/db";
import fs from "fs";

const router: IRouter = Router();

const WORKSPACE_ROOT = process.env.AGENT_WORKSPACE ?? "/tmp/haley-workspace";

function countFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isFile()) count++;
      else if (e.isDirectory()) count += countFiles(dir + "/" + e.name);
    }
  } catch {}
  return count;
}

router.get("/stats", async (_req, res): Promise<void> => {
  const [convRow] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(conversationsTable);

  const [msgRow] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(messagesTable);

  const models = await db
    .select({ model: conversationsTable.model })
    .from(conversationsTable)
    .groupBy(conversationsTable.model);

  const totalFiles = countFiles(WORKSPACE_ROOT);

  res.json({
    totalConversations: convRow?.count ?? 0,
    totalMessages: msgRow?.count ?? 0,
    totalFiles,
    modelsUsed: models.map((m) => m.model),
  });
});

export default router;
