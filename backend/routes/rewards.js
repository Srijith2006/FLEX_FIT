// backend/routes/rewards.js
import express from "express";
import { getMyPoints, getMyCoupons } from "../controllers/rewardsController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/points",  protect, authorize("client"), getMyPoints);
router.get("/coupons", protect, authorize("client"), getMyCoupons);

export default router;