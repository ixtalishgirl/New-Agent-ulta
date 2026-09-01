import express from "express";
import path from "path";
import fs from "fs";
import app from "./artifacts/api-server/src/app.js";

const PORT = 3000;

async function startServer() {
  // Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        configFile: path.resolve(process.cwd(), "artifacts/ai-agent/vite.config.ts"),
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.error("Failed to start Vite middleware:", err);
    }
  } else {
    // Production static serving
    const clientDist = path.resolve(process.cwd(), "artifacts/ai-agent/dist/public");
    const fallbackDist = path.resolve(process.cwd(), "artifacts/ai-agent/dist");
    const staticDir = fs.existsSync(clientDist) ? clientDist : fallbackDist;

    if (fs.existsSync(staticDir)) {
      app.use(express.static(staticDir));
      app.get("*all", (_req, res) => {
        res.sendFile(path.join(staticDir, "index.html"));
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Eye Sight Helper Agent Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Server startup error:", err);
  process.exit(1);
});
