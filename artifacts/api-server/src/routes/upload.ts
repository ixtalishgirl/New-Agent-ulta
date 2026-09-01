import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const WORKSPACE_ROOT = process.env.AGENT_WORKSPACE ?? "/tmp/haley-workspace";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(WORKSPACE_ROOT, "uploads");
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const safe = name.replace(/[^a-z0-9_-]/gi, "_").toLowerCase();
    cb(null, `${safe}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.post("/upload", upload.array("files", 20), (req, res): void => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    res.status(400).json({ error: "No files uploaded" });
    return;
  }

  const saved = files.map((f) => {
    const relativePath = "/uploads/" + f.filename;
    logger.info({ filename: f.filename, size: f.size }, "File uploaded");
    return {
      name: f.originalname,
      path: relativePath,
      type: "file",
      size: f.size,
      mimetype: f.mimetype,
    };
  });

  res.status(201).json({ files: saved });
});

export default router;
