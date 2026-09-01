import { Router, type IRouter } from "express";
import {
  getNvidiaApiKey,
  saveNvidiaApiKey,
  ACTIVE_NVIDIA_MODEL,
  AVAILABLE_NVIDIA_MODELS,
} from "../lib/replicate";
import fs from "fs";
import path from "path";

const router: IRouter = Router();

router.get("/settings/nvidia", (_req, res) => {
  const key = getNvidiaApiKey();
  const hasKey = Boolean(key && key.trim().length > 0);
  const maskedKey = hasKey && key
    ? `${key.slice(0, 7)}...${key.slice(-4)}`
    : null;

  res.json({
    hasKey,
    maskedKey,
    activeModel: ACTIVE_NVIDIA_MODEL,
    availableModels: AVAILABLE_NVIDIA_MODELS,
  });
});

router.post("/settings/nvidia", (req, res) => {
  const body = req.body as { key?: unknown };
  if (!body.key || typeof body.key !== "string") {
    res.status(400).json({ error: "NVIDIA API key string is required" });
    return;
  }

  const cleanKey = body.key.trim();
  saveNvidiaApiKey(cleanKey);

  res.json({
    success: true,
    message: `NVIDIA API Key saved successfully and ${ACTIVE_NVIDIA_MODEL} is active!`,
    activeModel: ACTIVE_NVIDIA_MODEL,
    hasKey: true,
    maskedKey: `${cleanKey.slice(0, 7)}...${cleanKey.slice(-4)}`,
  });
});

router.delete("/settings/nvidia", (_req, res) => {
  delete process.env.NVIDIA_API_KEY;
  try {
    const workspaceRoot = process.env.AGENT_WORKSPACE || "/tmp/haley-workspace";
    const keyFile = path.join(workspaceRoot, "nvidia_key.txt");
    if (fs.existsSync(keyFile)) {
      fs.unlinkSync(keyFile);
    }
  } catch {}

  res.json({
    success: true,
    hasKey: false,
    message: "NVIDIA API Key removed",
  });
});

export default router;
