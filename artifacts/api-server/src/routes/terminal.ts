import { Router, type IRouter } from "express";
import { spawn } from "child_process";
import { RunCommandBody } from "@workspace/api-zod";
import path from "path";
import fs from "fs";

const router: IRouter = Router();

const WORKSPACE_ROOT = path.resolve(
  process.env.AGENT_WORKSPACE ?? "/tmp/haley-workspace",
);

router.post("/terminal", async (req, res): Promise<void> => {
  const parsed = RunCommandBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { command, cwd } = parsed.data;

  const workDir = cwd ? path.resolve(cwd) : WORKSPACE_ROOT;
  fs.mkdirSync(workDir, { recursive: true });

  let stdout = "";
  let stderr = "";

  const proc = spawn("/bin/bash", ["-c", command], {
    cwd: workDir,
    timeout: 120_000,
    env: {
      ...process.env,
      HOME: process.env.HOME ?? "/tmp",
      TERM: "xterm-256color",
      PYTHONUNBUFFERED: "1",
      PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH ?? "/tmp/ms-playwright",
    },
  });

  proc.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
  proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });

  proc.on("close", (code) => {
    res.json({ stdout, stderr, exitCode: code ?? 0 });
  });

  proc.on("error", (err) => {
    res.json({ stdout: "", stderr: err.message, exitCode: 1 });
  });
});

export default router;
