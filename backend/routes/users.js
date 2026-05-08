import express from "express";
import { getLeaderboard, getMyPoints } from "../controllers/leaderboardController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Accessible to all authenticated users (clients + trainers)
router.get("/leaderboard", protect, getLeaderboard);
router.get("/my-points",   protect, getMyPoints);

export default router;
