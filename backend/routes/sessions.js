// backend/routes/sessions.js

import express from "express";
import {
  createSession,
  getMySessionsAsTrainer,
  getSessionsForClient,
  getSessionsForProgram,   // ← NEW: add this to your imports
  deleteSession,
} from "../controllers/liveSessionController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post(   "/",                    protect, createSession);
router.get(    "/mine",                protect, getMySessionsAsTrainer);
router.get(    "/for-me",              protect, getSessionsForClient);
router.get(    "/program/:programId",  protect, getSessionsForProgram);  // ← NEW
router.delete( "/:id",                 protect, deleteSession);

export default router;