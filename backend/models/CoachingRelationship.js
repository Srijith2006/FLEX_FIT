import mongoose from "mongoose";

const coachingRelationshipSchema = new mongoose.Schema({
  trainer: { type: mongoose.Schema.Types.ObjectId, ref: "Trainer", required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
  pricePerMonth: { type: Number, required: true },
  status: { type: String, enum: ["active", "paused", "ended"], default: "active" }
}, { timestamps: true });

export default mongoose.model("CoachingRelationship", coachingRelationshipSchema);
