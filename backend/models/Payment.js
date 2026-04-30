import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  client:          { type: mongoose.Schema.Types.ObjectId, ref: "Client"  },
  trainer:         { type: mongoose.Schema.Types.ObjectId, ref: "Trainer" },
  program:         { type: mongoose.Schema.Types.ObjectId, ref: "Program" },
  amount:          { type: Number, required: true },
  currency:        { type: String, default: "INR" },
  type:            { type: String, enum: ["subscription","program_fee","trainer_fee"], required: true },
  status:          { type: String, enum: ["pending","paid","failed"], default: "pending" },
  // Razorpay fields
  razorpayOrderId:   { type: String, default: "" },
  razorpayPaymentId: { type: String, default: "" },
  razorpaySignature: { type: String, default: "" },
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);