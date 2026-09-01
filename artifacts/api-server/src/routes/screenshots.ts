import { Router, type IRouter } from "express";
import fs from "fs";
import path from "path";

const router: IRouter = Router();

const WORKSPACE_ROOT = path.resolve(process.env.AGENT_WORKSPACE ?? "/tmp/haley-workspace");
const SCREENSHOTS_DIR = path.join(WORKSPACE_ROOT, "screenshots");

// Serve screenshot files by filename
router.get("/screenshots/:filename", (req, res): void => {
  const filename = path.basename(req.params.filename ?? "");
  if (!filename) { res.status(400).json({ error: "No filename" }); return; }

  const filePath = path.join(SCREENSHOTS_DIR, filename);
  if (!filePath.startsWith(SCREENSHOTS_DIR)) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "Screenshot not found" }); return;
  }

  const ext = path.extname(filename).toLowerCase();
  const mime = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
  res.setHeader("Content-Type", mime);
  res.setHeader("Cache-Control", "public, max-age=60");
  fs.createReadStream(filePath).pipe(res);
});

// List all screenshots
router.get("/screenshots", (_req, res): void => {
  try {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    const files = fs.readdirSync(SCREENSHOTS_DIR)
      .filter(f => /\.(png|jpg|jpeg)$/i.test(f))
      .map(f => ({
        name: f,
        url: `/api/screenshots/${f}`,
        size: fs.statSync(path.join(SCREENSHOTS_DIR, f)).size,
        mtime: fs.statSync(path.join(SCREENSHOTS_DIR, f)).mtime,
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
    res.json({ screenshots: files });
  } catch {
    res.json({ screenshots: [] });
  }
});

export default router;
