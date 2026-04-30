import mongoose from "mongoose";

const trainerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  bio: { type: String, default: "" },
  specialization: [{ type: String }],
  yearsOfExperience: { type: Number, default: 0 },
  hourlyRate: { type: Number, default: 0 },
  verificationStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  certificateUrl: { type: String, default: "" },
  avgRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  score: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("Trainer", trainerSchema);
