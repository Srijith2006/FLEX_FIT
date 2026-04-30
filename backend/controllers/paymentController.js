import { Client, Trainer, Payment } from "../models/index.js";

// Lazily import stripe so server still starts without a valid key
let stripeClient = null;
const getStripe = () => {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || key.startsWith("sk_test_your")) {
      return null; // Stripe not configured
    }
    const Stripe = require("stripe");
    stripeClient = Stripe(key);
  }
  return stripeClient;
};

export const createPaymentIntent = async (req, res, next) => {
  try {
    const { amount, type, trainerId } = req.body;
    if (!amount || !type) return res.status(400).json({ message: "amount and type are required" });

    const client = await Client.findOne({ user: req.user._id });
    if (!client) return res.status(404).json({ message: "Client profile not found" });

    const trainer = trainerId ? await Trainer.findById(trainerId) : null;

    const stripe = getStripe();

    // If Stripe isn't configured, create a local payment record as pending
    let intentId = `local_${Date.now()}`;
    let clientSecret = null;

    if (stripe) {
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(Number(amount) * 100),
        currency: "usd",
        metadata: { type, clientId: String(client._id) },
      });
      intentId = intent.id;
      clientSecret = intent.client_secret;
    }

    const payment = await Payment.create({
      client: client._id,
      trainer: trainer?._id,
      amount: Number(amount),
      type,
      paymentIntentId: intentId,
      status: stripe ? "pending" : "paid", // auto-mark paid if no Stripe in dev
    });

    res.status(201).json({ clientSecret, payment, stripeEnabled: !!stripe });
  } catch (error) {
    next(error);
  }
};

export const confirmPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      { status: "paid" },
      { new: true }
    );
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    res.json({ payment });
  } catch (error) {
    next(error);
  }
};

export const myPayments = async (req, res, next) => {
  try {
    const client = await Client.findOne({ user: req.user._id });
    if (!client) return res.status(404).json({ message: "Client profile not found" });

    const payments = await Payment.find({ client: client._id })
      .populate("trainer", "user")
      .sort({ createdAt: -1 });
    res.json({ payments });
  } catch (error) {
    next(error);
  }
};