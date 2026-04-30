import express from "express";
import { createPaymentIntent, confirmPayment, myPayments } from "../controllers/paymentController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.post("/intent", protect, authorize("client"), createPaymentIntent);
router.patch("/:paymentId/confirm", protect, authorize("client", "admin"), confirmPayment);
router.get("/mine", protect, authorize("client"), myPayments);

export default router;
