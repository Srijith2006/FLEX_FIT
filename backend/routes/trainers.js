import express from "express";
import {
  listTrainers, listAllTrainers, getTrainerProfile, updateTrainerProfile,
  getTrainerOverview, submitVerification, reviewVerification, rateTrainer,
} from "../controllers/trainerController.js";
import { protect, authorize } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/",                       listTrainers);
router.get("/all",                    protect, authorize("admin"),   listAllTrainers);
router.get("/overview",               protect, authorize("trainer"), getTrainerOverview);
router.get("/profile/me",             protect, authorize("trainer"), getTrainerProfile);
router.put("/profile",                protect, authorize("trainer"), updateTrainerProfile);
router.post("/verification",          protect, authorize("trainer"), upload.single("certificate"), submitVerification);
router.patch("/:trainerId/review",    protect, authorize("admin"),   reviewVerification);
router.post("/:trainerId/rating",     protect, authorize("client"),  rateTrainer);

export default router;