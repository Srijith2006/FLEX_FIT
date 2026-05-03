import mongoose from "mongoose";

const proofOfWorkSchema = new mongoose.Schema({
  client:       { type: mongoose.Schema.Types.ObjectId, ref: "Client",       required: true },
  dailyWorkout: { type: mongoose.Schema.Types.ObjectId, ref: "DailyWorkout" },
  program:      { type: mongoose.Schema.Types.ObjectId, ref: "Program" },
  date:         { type: String, required: true },   // YYYY-MM-DD
  imageUrl:     { type: String, required: true },   // local upload path
  caption:      { type: String, default: "" },
  type:         { type: String, enum: ["workout","meal"], default: "workout" },
  verified:     { type: Boolean, default: true },   // auto-verified on upload
}, { timestamps: true });

proofOfWorkSchema.index({ client: 1, date: 1, type: 1 }, { unique: true });

export default mongoose.model("ProofOfWork", proofOfWorkSchema);