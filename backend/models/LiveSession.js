import mongoose from "mongoose";

const liveSessionSchema = new mongoose.Schema({
  trainer: { type: mongoose.Schema.Types.ObjectId, ref: "Trainer", required: true },
  program: { type: mongoose.Schema.Types.ObjectId, ref: "Program" }, // optional — session for a specific program
  title: { type: String, required: true },
  description: { type: String, default: "" },
  scheduledAt: { type: Date, required: true },
  durationMinutes: { type: Number, default: 60 },
  meetingLink: { type: String, required: true }, // Zoom / Meet URL
  isOpenToAll: { type: Boolean, default: true }, // if true, all enrolled clients of this trainer can join
}, { timestamps: true });

export default mongoose.model("LiveSession", liveSessionSchema);