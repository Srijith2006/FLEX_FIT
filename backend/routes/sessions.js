// backend/routes/sessions.js

import express from "express";
import {
  createSession,
  getMySessionsAsTrainer,
  getSessionsForClient,
  deleteSession,
} from "../controllers/liveSessionController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post(   "/",        protect, createSession);
router.get(    "/mine",    protect, getMySessionsAsTrainer);
router.get(    "/for-me",  protect, getSessionsForClient);
router.delete( "/:id",     protect, deleteSession);

export default router;