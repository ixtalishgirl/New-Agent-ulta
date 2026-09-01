import { Router, type IRouter } from "express";

const router: IRouter = Router();

// Backward compatibility check
router.get("/chat/stream/status", (_req, res) => {
  res.json({ status: "active", model: "nvidia/nemotron-3-nano-30b-a3b" });
});

export default router;
