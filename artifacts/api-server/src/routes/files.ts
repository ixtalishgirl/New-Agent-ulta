import { Router, type IRouter } from "express";
import fs from "fs";
import path from "path";
import archiver from "archiver";
import { CreateFileBody } from "@workspace/api-zod";

const router: IRouter = Router();

const WORKSPACE_ROOT = path.resolve(process.env.AGENT_WORKSPACE ?? "/tmp/haley-workspace");

function ensureWorkspace() {
  if (!fs.existsSync(WORKSPACE_ROOT)) {
    fs.mkdirSync(WORKSPACE_ROOT, { recursive: true });
  }
}

function resolveSafe(filePath: string): string {
  const resolved = path.resolve(WORKSPACE_ROOT, filePath.replace(/^\/+/, ""));
  // Use path.sep to avoid prefix collision (e.g. /tmp/haley-workspace-evil)
  if (resolved !== WORKSPACE_ROOT && !resolved.startsWith(WORKSPACE_ROOT + path.sep)) {
    throw new Error("Path traversal not allowed");
  }
  return resolved;
}

router.get("/files", async (req, res): Promise<void> => {
  ensureWorkspace();
  const dirPath = typeof req.query.path === "string" ? req.query.path : "/";

  let targetPath: string;
  try {
    targetPath = resolveSafe(dirPath);
  } catch {
    res.status(400).json({ error: "Invalid path" });
    return;
  }

  if (!fs.existsSync(targetPath)) {
    res.json([]);
    return;
  }

  try {
    const entries = fs.readdirSync(targetPath, { withFileTypes: true });
    const result = entries.map((e) => {
      const fullPath = path.join(targetPath, e.name);
      let size = 0;
      try {
        size = e.isFile() ? fs.statSync(fullPath).size : 0;
      } catch {}
      const relativePath = "/" + path.relative(WORKSPACE_ROOT, fullPath);
      return {
        name: e.name,
        path: relativePath,
        type: e.isDirectory() ? "dir" : "file",
        size,
      };
    });
    res.json(result);
  } catch {
    res.status(500).json({ error: "Failed to read directory" });
  }
});

router.post("/files", async (req, res): Promise<void> => {
  ensureWorkspace();
  const parsed = CreateFileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let targetPath: string;
  try {
    targetPath = resolveSafe(parsed.data.path);
  } catch {
    res.status(400).json({ error: "Invalid path" });
    return;
  }

  const dir = path.dirname(targetPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(targetPath, parsed.data.content, "utf8");

  const stat = fs.statSync(targetPath);
  const relativePath = "/" + path.relative(WORKSPACE_ROOT, targetPath);
  res.status(201).json({
    name: path.basename(targetPath),
    path: relativePath,
    type: "file",
    size: stat.size,
  });
});

router.get("/files/read", async (req, res): Promise<void> => {
  ensureWorkspace();
  const filePath = typeof req.query.path === "string" ? req.query.path : "";
  if (!filePath) {
    res.status(400).json({ error: "path is required" });
    return;
  }

  let targetPath: string;
  try {
    targetPath = resolveSafe(filePath);
  } catch {
    res.status(400).json({ error: "Invalid path" });
    return;
  }

  if (!fs.existsSync(targetPath)) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  try {
    const content = fs.readFileSync(targetPath, "utf8");
    res.json({ path: filePath, content });
  } catch {
    res.status(500).json({ error: "Failed to read file" });
  }
});

router.delete("/files/delete", async (req, res): Promise<void> => {
  ensureWorkspace();
  const filePath = typeof req.query.path === "string" ? req.query.path : "";
  if (!filePath) {
    res.status(400).json({ error: "path is required" });
    return;
  }

  let targetPath: string;
  try {
    targetPath = resolveSafe(filePath);
  } catch {
    res.status(400).json({ error: "Invalid path" });
    return;
  }

  if (!fs.existsSync(targetPath)) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  try {
    fs.rmSync(targetPath, { recursive: true });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete file" });
  }
});

// Download workspace as ZIP
router.get("/files/zip", async (_req, res): Promise<void> => {
  ensureWorkspace();
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", 'attachment; filename="workspace.zip"');

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.on("error", (err) => {
    res.status(500).send({ error: err.message });
  });

  archive.pipe(res);
  archive.directory(WORKSPACE_ROOT, false);
  await archive.finalize();
});

// Package extension ZIP
router.get("/extensions/pack", async (_req, res): Promise<void> => {
  ensureWorkspace();
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", 'attachment; filename="extension.zip"');

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.on("error", (err) => {
    res.status(500).send({ error: err.message });
  });

  archive.pipe(res);
  archive.directory(WORKSPACE_ROOT, false);
  await archive.finalize();
});

// Download Security Extension ZIP
router.get("/extension/download", async (_req, res): Promise<void> => {
  ensureWorkspace();
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", 'attachment; filename="security-extension.zip"');

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.on("error", (err) => {
    res.status(500).send({ error: err.message });
  });

  archive.pipe(res);
  
  // Inject default manifest if not present in workspace
  const manifestPath = path.join(WORKSPACE_ROOT, "manifest.json");
  if (fs.existsSync(manifestPath)) {
    archive.directory(WORKSPACE_ROOT, false);
  } else {
    archive.append(JSON.stringify({
      manifest_version: 3,
      name: "Sight Helper Security Scanner",
      version: "1.0.0",
      description: "AI Agent Security & Web Scanner Helper Extension",
      permissions: ["activeTab", "scripting"],
      action: { default_title: "Scan Page" }
    }, null, 2), { name: "manifest.json" });
    archive.directory(WORKSPACE_ROOT, false);
  }

  await archive.finalize();
});

export default router;
