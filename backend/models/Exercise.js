import mongoose from "mongoose";

const exerciseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  muscleGroup: { type: String, default: "" },
  instructions: { type: String, default: "" },
  demoVideoUrl: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.model("Exercise", exerciseSchema);
