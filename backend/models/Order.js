import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product:      { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name:         { type: String },
  quantity:     { type: Number, default: 1 },
  unitPrice:    { type: Number },
  totalPrice:   { type: Number },
  groupDiscount:{ type: Boolean, default: false },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  client:       { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
  vendor:       { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
  items:        [orderItemSchema],
  subtotal:     { type: Number, required: true },
  discount:     { type: Number, default: 0 },
  total:        { type: Number, required: true },
  status:       { type: String, enum: ["pending","confirmed","preparing","shipped","delivered","cancelled"], default: "pending" },
  // Payment
  razorpayOrderId:   { type: String, default: "" },
  razorpayPaymentId: { type: String, default: "" },
  isPaid:       { type: Boolean, default: false },
  // Delivery
  deliveryAddress: { type: String, default: "" },
  deliveryPhone:   { type: String, default: "" },
  notes:        { type: String, default: "" },
  // Performance-based discount applied
  streakDiscount: { type: Number, default: 0 },
  streakDays:     { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);