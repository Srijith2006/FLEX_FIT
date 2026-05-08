import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product:       { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  name:          { type: String },
  quantity:      { type: Number, required: true, min: 1 },
  unitPrice:     { type: Number, required: true },
  totalPrice:    { type: Number, required: true },
  groupDiscount: { type: Boolean, default: false },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  client:  { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
  vendor:  { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
  items:   [orderItemSchema],
  subtotal:  { type: Number, default: 0 },
  discount:  { type: Number, default: 0 },
  total:     { type: Number, required: true },
  status:    { type: String, enum: ["pending","confirmed","preparing","shipped","delivered","cancelled"], default: "pending" },
  isPaid:    { type: Boolean, default: false },
  razorpayOrderId:   { type: String, default: "" },
  razorpayPaymentId: { type: String, default: "" },
  deliveryAddress: { type: String, default: "" },
  deliveryPhone:   { type: String, default: "" },
  notes:           { type: String, default: "" },
  streakDiscount:  { type: Number, default: 0 },
  streakDays:      { type: Number, default: 0 },
  // Cancellation fields
  cancellationReason: { type: String, default: "" },
  cancelledBy:        { type: String, enum: ["client","vendor","admin","trainer",""], default: "" },
  cancelledAt:        { type: Date, default: null },
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
