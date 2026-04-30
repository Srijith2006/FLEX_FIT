import express from "express";
import {
  listTrainers,
  listAllTrainers,
  getTrainerProfile,
  updateTrainerProfile,
  submitVerification,
  reviewVerification,
  rateTrainer,
} from "../controllers/trainerController.js";
import { protect, authorize } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/", listTrainers);                                                          // public — approved only
router.get("/all", protect, authorize("admin"), listAllTrainers);                       // admin — all statuses
router.get("/profile/me", protect, authorize("trainer"), getTrainerProfile);            // trainer — own profile
router.put("/profile", protect, authorize("trainer"), updateTrainerProfile);            // trainer — update profile
router.post("/verification", protect, authorize("trainer"), upload.single("certificate"), submitVerification); // trainer — upload cert
router.patch("/:trainerId/review", protect, authorize("admin"), reviewVerification);    // admin — approve/reject
router.post("/:trainerId/rating", protect, authorize("client"), rateTrainer);           // client — rate trainer

export default router;