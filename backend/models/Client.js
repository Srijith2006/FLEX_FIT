import mongoose from "mongoose";

const clientSchema = new mongoose.Schema({
  user:               { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  // Physical
  age:                { type: Number, default: 0 },
  gender:             { type: String, enum: ["male", "female", "other", "prefer_not"], default: "prefer_not" },
  height:             { type: Number, default: 0 },   // cm
  currentWeight:      { type: Number, default: 0 },   // kg
  targetWeight:       { type: Number, default: 0 },   // kg
  // Goals
  goalType:           { type: String, enum: ["lose", "gain", "maintain", "endurance", "flexibility"], default: "maintain" },
  fitnessLevel:       { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
  workoutsPerWeek:    { type: Number, default: 3 },
  // Health
  healthNotes:        { type: String, default: "" },
  injuries:           { type: String, default: "" },
  // Subscription
  subscriptionActive: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Client", clientSchema);
