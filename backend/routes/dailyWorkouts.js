import express from "express";
import {
  assignDailyWorkout,
  getProgramWorkouts,
  deleteDailyWorkout,
  getClientWorkout,
  getClientProgramWorkouts,
  completeWorkout,
  clientProgramProgress,
  workoutCompletionStats,
} from "../controllers/dailyWorkoutController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Trainer routes
router.get( "/trainer/:programId",            protect, authorize("trainer"), getProgramWorkouts);
router.post("/trainer/:programId",            protect, authorize("trainer"), assignDailyWorkout);
router.delete("/trainer/workout/:workoutId",  protect, authorize("trainer"), deleteDailyWorkout);
router.get( "/trainer/:programId/stats",      protect, authorize("trainer"), workoutCompletionStats);

// Client routes
router.get( "/client/:programId",             protect, authorize("client"), getClientProgramWorkouts);
router.get( "/client/:programId/day",         protect, authorize("client"), getClientWorkout);       // ?date=YYYY-MM-DD
router.post("/client/complete/:workoutId",    protect, authorize("client"), completeWorkout);
router.get( "/client/:programId/progress",   protect, authorize("client"), clientProgramProgress);

export default router;
