import express from "express";
import { createOrder, verifyPayment, webhook, myPayments } from "../controllers/paymentController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Razorpay webhook — raw body needed for signature check
router.post("/webhook", express.raw({ type: "application/json" }), webhook);

router.post("/order",   protect, authorize("client"), createOrder);
router.post("/verify",  protect, authorize("client"), verifyPayment);
router.get("/mine",     protect, authorize("client"), myPayments);
