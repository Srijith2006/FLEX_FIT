import express from "express";
import { getClientProfile, updateClientProfile } from "../controllers/clientController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/me", protect, authorize("client"), getClientProfile);
router.put("/me", protect, authorize("client"), updateClientProfile);

export default router;
