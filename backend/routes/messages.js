import express from "express";
import { getConversation, getInbox, sendMessage } from "../controllers/messageController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/inbox",          protect, getInbox);
router.post("/send",          protect, sendMessage);      // REST fallback
router.get("/:otherUserId",   protect, getConversation);

export default router;