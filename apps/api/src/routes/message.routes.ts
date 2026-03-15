import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { messageRateLimiter } from "../middlewares/rateLimit";
import {
  createConversationAndSendMessage,
  getConversation,
  getUnreadMessagesCount,
  listConversations,
  sendMessageInConversation,
} from "../controllers/message.controller";

const router = Router();

router.use(requireAuth);

router.get("/conversations", listConversations);
router.get("/conversations/:id", getConversation);
router.post("/conversations", messageRateLimiter, createConversationAndSendMessage);
router.post("/conversations/:id", messageRateLimiter, sendMessageInConversation);
router.get("/unread-count", getUnreadMessagesCount);

export default router;
