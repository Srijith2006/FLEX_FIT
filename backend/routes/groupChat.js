import express from "express";
import { getGroupMessages, sendGroupMessage, myGroupChats } from "../controllers/groupChatController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/mine",                      protect, myGroupChats);
router.get("/:programId",               protect, getGroupMessages);
router.post("/:programId",              protect, sendGroupMessage);

export default router;