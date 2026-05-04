import express from "express";
import {
  createDietPlan, myDietPlans, getDietPlan,
  updateDietPlanDay, deleteDietPlan, clientDietPlans,
} from "../controllers/dietPlanController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.post("/",                      protect, authorize("trainer"), createDietPlan);
router.get("/mine",                   protect, authorize("trainer"), myDietPlans);
router.get("/client-plans",           protect, authorize("client"),  clientDietPlans);
router.get("/:planId",                protect,                       getDietPlan);
router.put("/:planId/day/:dayIndex",  protect, authorize("trainer"), updateDietPlanDay);
router.delete("/:planId",             protect, authorize("trainer"), deleteDietPlan);

export default router;