import mongoose from "mongoose";

const trainerRecommendationSchema = new mongoose.Schema({
  trainer:  { type: mongoose.Schema.Types.ObjectId, ref: "Trainer",  required: true },
  program:  { type: mongoose.Schema.Types.ObjectId, ref: "Program",  required: true },
  product:  { type: mongoose.Schema.Types.ObjectId, ref: "Product",  required: true },
  note:     { type: String, default: "" },  // trainer's note e.g. "Take post workout"
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("TrainerRecommendation", trainerRecommendationSchema);