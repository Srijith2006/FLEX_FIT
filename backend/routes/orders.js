import express from "express";
import { createOrder, verifyOrderPayment, myOrders, vendorOrders, updateOrderStatus } from "../controllers/orderController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.post("/",                    protect, authorize("client"), createOrder);
router.post("/verify",              protect, authorize("client"), verifyOrderPayment);
router.get("/mine",                 protect, authorize("client"), myOrders);
router.get("/vendor",               protect, authorize("vendor"), vendorOrders);
router.patch("/:orderId/status",    protect, authorize("vendor","admin"), updateOrderStatus);

export default router;