import express from "express";
import { createRelationship, myRelationships, updateRelationshipStatus } from "../controllers/coachingController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, authorize("client"), createRelationship);
router.get("/mine", protect, authorize("trainer", "client"), myRelationships);
router.patch("/:relationshipId/status", protect, authorize("trainer", "client", "admin"), updateRelationshipStatus);

export default router;