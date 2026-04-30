import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
  trainer: { type: mongoose.Schema.Types.ObjectId, ref: "Trainer" },
  amount: { type: Number, required: true },
  currency: { type: String, default: "usd" },
  type: { type: String, enum: ["subscription", "trainer_fee"], required: true },
  status: { type: String, enum: ["pending", "paid", "failed"], default: "paid" },
  paymentIntentId: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);
