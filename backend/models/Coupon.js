import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code:               { type: String, required: true, unique: true, uppercase: true },
  discountPercentage: { type: Number, required: true, min: 1, max: 100 },
  userId:             { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  isUsed:             { type: Boolean, default: false },
  usedAt:             { type: Date, default: null },
  expiryDate:         { type: Date, required: true },
  milestone:          { type: String, default: "" }, // e.g. "10_workouts", "5kg_lost"
}, { timestamps: true });

export default mongoose.model("Coupon", couponSchema);