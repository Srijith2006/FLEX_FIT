import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
  program: { type: mongoose.Schema.Types.ObjectId, ref: "Program", required: true },
  trainer: { type: mongoose.Schema.Types.ObjectId, ref: "Trainer", required: true },
  amountPaid: { type: Number, required: true },
  status: { type: String, enum: ["active", "completed", "cancelled"], default: "active" },
  startedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Prevent duplicate enrollments
enrollmentSchema.index({ client: 1, program: 1 }, { unique: true });

export default mongoose.model("Enrollment", enrollmentSchema);