// Shared in-memory tool store for Vercel serverless functions.
// Note: serverless instances are ephemeral; tools persist only while the
// instance is warm. For durable storage, connect an external DB.

export interface CustomTool {
  id: string;
  name: string;
  description: string;
  runtime: 'javascript' | 'python' | 'bash';
  code: string;
  createdAt: string;
  invocationsCount: number;
}

const g: any = globalThis as any;
if (!g.__halyeTools) g.__halyeTools = [];

export function getStore(): CustomTool[] {
  return g.__halyeTools as CustomTool[];
}

export function addTool(t: CustomTool): void {
  const store = getStore();
  const idx = store.findIndex((x) => x.name.toLowerCase() === t.name.toLowerCase());
  if (idx >= 0) store.splice(idx, 1);
  store.unshift(t);
}

export function findTool(idOrName: string): CustomTool | undefined {
  const w = String(idOrName).toLowerCase();
  return getStore().find((t) => t.id === idOrName || t.name.toLowerCase() === w || t.id.toLowerCase() === w);
}

export function normalizeRuntime(r: any): 'javascript' | 'python' | 'bash' {
  const v = String(r || 'javascript').toLowerCase();
  if (v.includes('py')) return 'python';
  if (v.includes('bash') || v.includes('sh')) return 'bash';
  return 'javascript';
}
