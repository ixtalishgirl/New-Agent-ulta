import { Router, type IRouter } from "express";
import healthRouter from "./health";
import conversationsRouter from "./conversations";
import chatRouter from "./chat";
import chatStreamRouter from "./chat-stream";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(conversationsRouter);
router.use(chatStreamRouter);
router.use(chatRouter);
router.use(settingsRouter);

export default router;
