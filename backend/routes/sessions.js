import express from "express";
import {
  createSession, mySessions, deleteSession, clientSessions, programSessions,
} from "../controllers/liveSessionController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/mine", protect, authorize("trainer"), mySessions);
router.get("/for-me", protect, authorize("client"), clientSessions);
router.get("/program/:programId", programSessions);
router.post("/", protect, authorize("trainer"), createSession);
router.delete("/:sessionId", protect, authorize("trainer"), deleteSession);

export default router;