import crypto from "crypto";
import Razorpay from "razorpay";
import { Client, Product, Order, Vendor, WorkoutCompletion } from "../models/index.js";

const getRazorpay = () => {
  const key_id     = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) throw new Error("Razorpay keys not configured");
  return new Razorpay({ key_id, key_secret });
};

// Calculate client streak
const getStreak = async (clientId) => {
  const completions = await WorkoutCompletion.find({ client: clientId }).sort({ date: -1 }).select("date");
  const dateSet = new Set(completions.map(c => c.date));
  let streak = 0;
  const d = new Date();
  while (dateSet.has(d.toISOString().split("T")[0])) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
};

// ── Create Order ───────────────────────────────────────────────────────────────
export const createOrder = async (req, res, next) => {
  try {
    const client = await Client.findOne({ user: req.user._id });
    if (!client) return res.status(404).json({ message: "Client profile not found" });

    const { items, deliveryAddress, deliveryPhone, notes } = req.body;
    // items: [{ productId, quantity }]
    if (!items?.length) return res.status(400).json({ message: "No items in order" });

    // Fetch all products
    const productIds = items.map(i => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    // All items must be from same vendor (simplification)
    const vendorIds = [...new Set(products.map(p => String(p.vendor)))];
    if (vendorIds.length > 1) return res.status(400).json({ message: "All items must be from the same vendor" });

    const vendorId = vendorIds[0];
    const streak = await getStreak(client._id);

    // Dynamic pricing
    let streakDiscountPct = 0;
    let streakDays = streak;
    if (streak >= 30) streakDiscountPct = 20;
    else if (streak >= 14) streakDiscountPct = 12;
    else if (streak >= 7)  streakDiscountPct = 7;
    else if (streak >= 3)  streakDiscountPct = 3;

    // Build order items with group buying logic
    let subtotal = 0;
    let totalDiscount = 0;
    const orderItems = items.map(item => {
      const product = products.find(p => String(p._id) === String(item.productId));
      if (!product) throw new Error(`Product ${item.productId} not found`);

      let unitPrice = product.price;
      let groupDiscountApplied = false;

      // Group buying discount
      if (product.groupBuyEnabled && product.currentGroupBuyers >= product.groupBuyThreshold) {
        unitPrice = Math.round(unitPrice * (1 - product.groupBuyDiscount / 100));
        groupDiscountApplied = true;
      }

      // Streak discount on top
      if (streakDiscountPct > 0) {
        const discAmt = Math.round(unitPrice * streakDiscountPct / 100);
        totalDiscount += discAmt * item.quantity;
        unitPrice = unitPrice - discAmt;
      }

      const lineTotal = unitPrice * item.quantity;
      subtotal += product.price * item.quantity;
      return {
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        unitPrice,
        totalPrice: lineTotal,
        groupDiscount: groupDiscountApplied,
      };
    });

    const total = orderItems.reduce((s, i) => s + i.totalPrice, 0);
    const amountInPaise = Math.round(total * 100);

    // Create Razorpay order
    const razorpay = getRazorpay();
    const rzpOrder = await razorpay.orders.create({
      amount:   amountInPaise,
      currency: "INR",
      receipt:  `ord_${Date.now()}`,
    });

    // Save order as pending
    const order = await Order.create({
      client:          client._id,
      vendor:          vendorId,
      items:           orderItems,
      subtotal,
      discount:        totalDiscount,
      total,
      razorpayOrderId: rzpOrder.id,
      deliveryAddress: deliveryAddress || "",
      deliveryPhone:   deliveryPhone || "",
      notes:           notes || "",
      streakDiscount:  streakDiscountPct,
      streakDays,
    });

    // Increment group buyers count for eligible products
    for (const item of items) {
      const product = products.find(p => String(p._id) === String(item.productId));
      if (product?.groupBuyEnabled) {
        await Product.findByIdAndUpdate(product._id, { $inc: { currentGroupBuyers: 1 } });
      }
    }

    res.status(201).json({
      orderId:    rzpOrder.id,
      amount:     amountInPaise,
      currency:   "INR",
      orderDbId:  order._id,
      keyId:      process.env.RAZORPAY_KEY_ID,
      total,
      streakDiscountPct,
      streakDays,
    });
  } catch (error) {
    if (error.message === "Razorpay keys not configured")
      return res.status(500).json({ message: "Payment gateway not configured" });
    next(error);
  }
};

// ── Verify Order Payment ───────────────────────────────────────────────────────
export const verifyOrderPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderDbId } = req.body;

    const expectedSig = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSig !== razorpay_signature) {
      await Order.findByIdAndUpdate(orderDbId, { status: "cancelled" });
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const order = await Order.findByIdAndUpdate(
      orderDbId,
      { status: "confirmed", isPaid: true, razorpayPaymentId: razorpay_payment_id },
      { new: true }
    );

    // Update vendor stats
    await Vendor.findByIdAndUpdate(order.vendor, {
      $inc: { totalOrders: 1, totalRevenue: order.total },
    });

    // Update product sales count
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { totalSold: item.quantity } });
    }

    res.json({ success: true, order });
  } catch (error) { next(error); }
};

// ── Client — my orders ─────────────────────────────────────────────────────────
export const myOrders = async (req, res, next) => {
  try {
    const client = await Client.findOne({ user: req.user._id });
    if (!client) return res.json({ orders: [] });

    const orders = await Order.find({ client: client._id })
      .populate({ path: "items.product", select: "name imageUrl" })
      .populate("vendor", "businessName city")
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (error) { next(error); }
};

// ── Vendor — orders for their products ────────────────────────────────────────
export const vendorOrders = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    const orders = await Order.find({ vendor: vendor._id, isPaid: true })
      .populate({ path: "client", populate: { path: "user", select: "name email phone" } })
      .populate({ path: "items.product", select: "name" })
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (error) { next(error); }
};

// ── Vendor — update order status ───────────────────────────────────────────────
export const updateOrderStatus = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    const { status } = req.body;
    const allowed = ["confirmed","preparing","shipped","delivered","cancelled"];
    if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid status" });

    const order = await Order.findOneAndUpdate(
      { _id: req.params.orderId, vendor: vendor._id },
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ order });
  } catch (error) { next(error); }
};