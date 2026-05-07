// backend/utils/milestones.js
import { WorkoutLog, Client, User } from "../models/index.js";
import Coupon from "../models/Coupon.js";
import crypto from "crypto";

const MILESTONES = [
  { id:"10_workouts",  check: (logs) => logs >= 10,  discount: 10, label:"10 Workouts Completed!" },
  { id:"25_workouts",  check: (logs) => logs >= 25,  discount: 15, label:"25 Workouts Completed!" },
  { id:"50_workouts",  check: (logs) => logs >= 50,  discount: 20, label:"50 Workouts Legend!"    },
  { id:"100_workouts", check: (logs) => logs >= 100, discount: 25, label:"Century Club Member!"   },
];

export const checkMilestones = async (userId) => {
  try {
    const client = await Client.findOne({ user: userId });
    if (!client) return;

    const totalLogs = await WorkoutLog.countDocuments({ client: client._id });

    for (const milestone of MILESTONES) {
      if (!milestone.check(totalLogs)) continue;

      // Check if coupon for this milestone already exists for this user
      const existing = await Coupon.findOne({ userId, milestone: milestone.id });
      if (existing) continue;

      // Generate unique code
      const code = `FLEX${milestone.discount}OFF${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30); // valid 30 days

      await Coupon.create({
        code,
        discountPercentage: milestone.discount,
        userId,
        expiryDate: expiry,
        milestone: milestone.id,
      });
    }
  } catch (err) {
    console.error("Milestone check error:", err);
  }
};