import crypto from "crypto";
import Razorpay from "razorpay";
import { Client, Trainer, Program, Enrollment, Payment } from "../models/index.js";

const getRazorpay = () => {
  const key_id     = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) throw new Error("Razorpay keys not configured");
  return new Razorpay({ key_id, key_secret });
};

// 1. Create Razorpay Order
export const createOrder = async (req, res, next) => {
  try {
    const { programId } = req.body;
    if (!programId) return res.status(400).json({ message: "programId is required" });

    const client = await Client.findOne({ user: req.user._id });
    if (!client) return res.status(404).json({ message: "Client profile not found" });

    const program = await Program.findById(programId)
      .populate({ path: "trainer", populate: { path: "user", select: "name" } });
    if (!program) return res.status(404).json({ message: "Program not found" });

    const existing = await Enrollment.findOne({ client: client._id, program: program._id });
    if (existing) return res.status(400).json({ message: "Already enrolled in this program" });

    const amountInPaise = Math.round(Number(program.price) * 100);

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount:   amountInPaise,
      currency: "INR",
      receipt:  `rcpt_${Date.now()}`,
      notes: {
        programId:   String(program._id),
        programName: program.title,
        clientId:    String(client._id),
      },
    });

    const payment = await Payment.create({
      client:          client._id,
      trainer:         program.trainer._id,
      program:         program._id,
      amount:          program.price,
      currency:        "INR",
      type:            "program_fee",
      status:          "pending",
      razorpayOrderId: order.id,
    });

    res.status(201).json({
      orderId:     order.id,
      amount:      order.amount,
      currency:    order.currency,
      paymentId:   payment._id,
      keyId:       process.env.RAZORPAY_KEY_ID,
      programName: program.title,
      trainerName: program.trainer.user?.name,
    });
  } catch (error) {
    if (error.message === "Razorpay keys not configured")
      return res.status(500).json({ message: "Payment gateway not configured. Contact support." });
    next(error);
  }
};

// 2. Verify & Confirm Payment
export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !paymentId)
      return res.status(400).json({ message: "Missing payment verification fields" });

    const expectedSig = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSig !== razorpay_signature) {
      await Payment.findByIdAndUpdate(paymentId, { status: "failed" });
      return res.status(400).json({ message: "Payment verification failed — invalid signature" });
    }

    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      { status: "paid", razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature },
      { new: true }
    );
    if (!payment) return res.status(404).json({ message: "Payment record not found" });

    const enrollment = await Enrollment.create({
      client:     payment.client,
      program:    payment.program,
      trainer:    payment.trainer,
      amountPaid: payment.amount,
      status:     "active",
    });

    await Program.findByIdAndUpdate(payment.program, { $inc: { enrolledCount: 1 } });

    res.json({ success: true, payment, enrollment });
  } catch (error) {
    if (error.code === 11000) return res.json({ success: true, message: "Already enrolled" });
    next(error);
  }
};

// 3. Webhook
export const webhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const sig      = req.headers["x-razorpay-signature"];
      const expected = crypto.createHmac("sha256", webhookSecret)
        .update(JSON.stringify(req.body)).digest("hex");
      if (sig !== expected) return res.status(400).json({ message: "Invalid signature" });
    }

    const { event, payload } = req.body;
    if (event === "payment.captured") {
      const rp = payload.payment.entity;
      const payment = await Payment.findOne({ razorpayOrderId: rp.order_id });
      if (payment && payment.status !== "paid") {
        await Payment.findByIdAndUpdate(payment._id, { status: "paid", razorpayPaymentId: rp.id });
        const exists = await Enrollment.findOne({ client: payment.client, program: payment.program });
        if (!exists) {
          await Enrollment.create({ client: payment.client, program: payment.program, trainer: payment.trainer, amountPaid: payment.amount, status: "active" });
          await Program.findByIdAndUpdate(payment.program, { $inc: { enrolledCount: 1 } });
        }
      }
    }
    if (event === "payment.failed") {
      const rp = payload.payment.entity;
      await Payment.findOneAndUpdate({ razorpayOrderId: rp.order_id }, { status: "failed" });
    }
    res.status(200).json({ ok: true });
  } catch { res.status(200).json({ ok: true }); }
};

// 4. My Payments
export const myPayments = async (req, res, next) => {
  try {
    const client = await Client.findOne({ user: req.user._id });
    if (!client) return res.status(404).json({ message: "Client profile not found" });
    const payments = await Payment.find({ client: client._id })
      .populate("program", "title")
      .populate({ path: "trainer", populate: { path: "user", select: "name" } })
      .sort({ createdAt: -1 });
    res.json({ payments });
  } catch (error) { next(error); }
};