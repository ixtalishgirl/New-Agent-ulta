import https from "https";
import http from "http";
import fs from "fs";
import path from "path";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const API = `https://api.telegram.org/bot${TOKEN}`;
const MEMORY_FILE = "/tmp/haley-workspace/telegram_state.json";

interface TgState {
  chatId: string | null;
  lastUpdateId: number;
}

function loadState(): TgState {
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      return JSON.parse(fs.readFileSync(MEMORY_FILE, "utf8")) as TgState;
    }
  } catch { /* ignore */ }
  return { chatId: null, lastUpdateId: 0 };
}

function saveState(state: TgState): void {
  fs.mkdirSync(path.dirname(MEMORY_FILE), { recursive: true });
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(state, null, 2), "utf8");
}

function tgRequest(method: string, body: Record<string, unknown>): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (!TOKEN) { reject(new Error("TELEGRAM_BOT_TOKEN not set")); return; }
    const data = JSON.stringify(body);
    const url = new URL(`${API}/${method}`);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) },
    };
    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", (c) => { raw += c; });
      res.on("end", () => {
        try { resolve(JSON.parse(raw)); } catch { resolve(raw); }
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

export async function sendTelegram(text: string, chatId?: string): Promise<boolean> {
  if (!TOKEN) return false;
  const state = loadState();
  const cid = chatId ?? state.chatId;
  if (!cid) return false;
  try {
    const MAX = 4000;
    const chunks = [];
    for (let i = 0; i < text.length; i += MAX) chunks.push(text.slice(i, i + MAX));
    for (const chunk of chunks) {
      await tgRequest("sendMessage", { chat_id: cid, text: chunk, parse_mode: "Markdown" });
    }
    return true;
  } catch (e) {
    console.error("Telegram sendMessage error:", e);
    return false;
  }
}

export async function detectChatId(): Promise<string | null> {
  if (!TOKEN) return null;
  try {
    const state = loadState();
    const res = await tgRequest("getUpdates", { offset: state.lastUpdateId + 1, timeout: 5, limit: 10 }) as { ok: boolean; result: Array<{ update_id: number; message?: { chat: { id: number }; text?: string } }> };
    if (res.ok && res.result?.length > 0) {
      for (const upd of res.result) {
        if (upd.message?.chat?.id) {
          const newState: TgState = { chatId: String(upd.message.chat.id), lastUpdateId: upd.update_id };
          saveState(newState);
          return newState.chatId;
        }
      }
    }
    return state.chatId;
  } catch { return loadState().chatId; }
}

export function getChatId(): string | null {
  return loadState().chatId;
}

export function saveChatId(id: string): void {
  const state = loadState();
  state.chatId = id;
  saveState(state);
}

let pollingActive = false;
let incomingHandler: ((text: string, chatId: string) => void) | null = null;

export function setIncomingHandler(fn: (text: string, chatId: string) => void): void {
  incomingHandler = fn;
}

export async function pollOnce(): Promise<void> {
  if (!TOKEN) return;
  try {
    const state = loadState();
    const res = await tgRequest("getUpdates", { offset: state.lastUpdateId + 1, timeout: 0, limit: 10 }) as { ok: boolean; result: Array<{ update_id: number; message?: { chat: { id: number }; text?: string } }> };
    if (res.ok && res.result?.length > 0) {
      let maxId = state.lastUpdateId;
      for (const upd of res.result) {
        maxId = Math.max(maxId, upd.update_id);
        if (upd.message?.chat?.id) {
          const cid = String(upd.message.chat.id);
          if (!state.chatId) {
            state.chatId = cid;
          }
          if (upd.message.text && incomingHandler) {
            incomingHandler(upd.message.text, cid);
          }
        }
      }
      state.lastUpdateId = maxId;
      saveState(state);
    }
  } catch { /* ignore */ }
}

export function startPolling(): void {
  if (pollingActive || !TOKEN) return;
  pollingActive = true;
  const loop = async () => {
    if (!pollingActive) return;
    await pollOnce();
    setTimeout(loop, 2000);
  };
  loop();
}

export function stopPolling(): void {
  pollingActive = false;
}
