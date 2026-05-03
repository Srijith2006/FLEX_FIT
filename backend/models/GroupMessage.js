import mongoose from "mongoose";

const groupMessageSchema = new mongoose.Schema({
  program:  { type: mongoose.Schema.Types.ObjectId, ref: "Program", required: true },
  sender:   { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },
  message:  { type: String, required: true, trim: true },
  type:     { type: String, enum: ["text","announcement"], default: "text" },
}, { timestamps: true });

groupMessageSchema.index({ program: 1, createdAt: 1 });

export default mongoose.model("GroupMessage", groupMessageSchema);