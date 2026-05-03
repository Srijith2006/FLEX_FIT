import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ["admin","trainer","client","vendor"], default: "client" },
  isActive: { type: Boolean, default: true },
  phone:    { type: String, default: "" },
  // Push notification subscription
  pushSubscription: { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true });

export default mongoose.model("User", userSchema);