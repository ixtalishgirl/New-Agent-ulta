import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import * as schema from "./schema/index.js";
import fs from "fs";
import path from "path";

const { Pool } = pg;

export let pool: pg.Pool | null = null;
let dbInstance: any = null;

const rawDbUrl = process.env.DATABASE_URL?.trim();
if (rawDbUrl && rawDbUrl.startsWith("nvapi-") && !process.env.NVIDIA_API_KEY) {
  process.env.NVIDIA_API_KEY = rawDbUrl;
}

const isValidPgUrl = Boolean(
  rawDbUrl && (rawDbUrl.startsWith("postgres://") || rawDbUrl.startsWith("postgresql://"))
);

if (isValidPgUrl && rawDbUrl) {
  try {
    pool = new Pool({ connectionString: rawDbUrl });
    dbInstance = drizzlePg(pool, { schema });
  } catch (err) {
    console.warn("Failed to connect to DATABASE_URL, falling back to embedded database:", err);
    pool = null;
    dbInstance = null;
  }
}

if (!dbInstance) {
  const workspaceRoot = process.env.AGENT_WORKSPACE || "/tmp/haley-workspace";
  const dbDir = path.join(workspaceRoot, "data", "pgdata");
  try {
    fs.mkdirSync(dbDir, { recursive: true });
  } catch {}
  
  const pglite = new PGlite(dbDir);
  
  // Auto create initial schema
  pglite.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      model TEXT NOT NULL DEFAULT 'deepseek-chat',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `).catch((err: unknown) => {
    console.warn("PGlite table init warning:", err);
  });

  dbInstance = drizzlePglite(pglite, { schema });
}

export const db = dbInstance;
export * from "./schema/index.js";
