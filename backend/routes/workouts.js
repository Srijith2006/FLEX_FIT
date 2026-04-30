import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  createProgram,
  listPrograms,
  logWorkout,
  myLogs,
  createDietPlan,
  listDietPlans,
} from "../controllers/workoutController.js";

const router = express.Router();

router.post("/programs", protect, authorize("trainer"), createProgram);
router.get("/programs", protect, authorize("trainer", "client"), listPrograms);
router.post("/logs", protect, authorize("client"), logWorkout);
router.get("/logs/mine", protect, authorize("client"), myLogs);
router.post("/diet-plans", protect, authorize("trainer"), createDietPlan);
router.get("/diet-plans/mine", protect, authorize("client"), listDietPlans);

export default router;