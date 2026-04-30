import express from "express";
import { uploadFile } from "../controllers/uploadController.js";
import { protect, authorize } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();
router.post("/", protect, authorize("trainer", "admin"), upload.single("file"), uploadFile);

export default router;
