import express from "express";
import { getClientProfile, updateClientProfile, submitSession, getAllClients } from "../controllers/clientController.js";
import { protect, authorize } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/all",             protect, authorize("admin"),  getAllClients);
router.get("/me",              protect, authorize("client"), getClientProfile);
router.put("/me",              protect, authorize("client"), updateClientProfile);
router.post("/submit-session", protect, authorize("client"),
  upload.single("videoFile"), submitSession);

export default router;