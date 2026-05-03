import express from "express";
import {
  listProducts, getProduct, getPricingForClient,
  mealSwap, addRecommendation, getProgramRecommendations, removeRecommendation,
} from "../controllers/marketplaceController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/products",                    listProducts);
router.get("/products/:productId",         getProduct);
router.get("/products/:productId/pricing", protect, authorize("client"), getPricingForClient);
router.post("/meal-swap",                  protect, mealSwap);
router.post("/recommendations",            protect, authorize("trainer"), addRecommendation);
router.get("/recommendations/:programId",  getProgramRecommendations);
router.delete("/recommendations/:recId",  protect, authorize("trainer"), removeRecommendation);

export default router;