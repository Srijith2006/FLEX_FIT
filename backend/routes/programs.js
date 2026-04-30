import express from "express";
import {
  listPrograms, getProgram, createProgram, updateProgram, deleteProgram,
  myPrograms, enrollInProgram, myEnrollments, checkEnrollment, programEnrollments,
} from "../controllers/programController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/",                              listPrograms);
router.get("/mine",    protect, authorize("trainer"),  myPrograms);
router.get("/enrolled",protect, authorize("client"),   myEnrollments);
router.get("/:programId",                    getProgram);
router.get("/:programId/enrolled",  protect, authorize("client"),  checkEnrollment);
router.get("/:programId/enrollments",protect,authorize("trainer"), programEnrollments);
router.post("/",       protect, authorize("trainer"),  createProgram);
router.put("/:programId",  protect, authorize("trainer"), updateProgram);
router.delete("/:programId",protect,authorize("trainer"), deleteProgram);
router.post("/:programId/enroll", protect, authorize("client"), enrollInProgram);

export default router;