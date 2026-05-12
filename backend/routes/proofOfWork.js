import express from "express";
import { uploadProof, myProofs, trainerProofFeed, trainerSessionFeed } from "../controllers/proofOfWorkController.js";
import { protect, authorize } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/upload",          protect, authorize("client"),  upload.single("proof"), uploadProof);
router.get("/mine",             protect, authorize("client"),  myProofs);
router.get("/trainer-feed",     protect, authorize("trainer"), trainerProofFeed);
router.get("/session-tracker",  protect, authorize("trainer"), trainerSessionFeed);  // ← ADD THIS

export default router;