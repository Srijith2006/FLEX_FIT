import mongoose from "mongoose";

const exerciseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sets: { type: Number, default: 3 },
  reps: { type: Number, default: 10 },
  weight: { type: Number, default: 0 },
}, { _id: false });

const daySchema = new mongoose.Schema({
  day: { type: String, default: "Day 1" },
  exercises: [exerciseSchema],
}, { _id: false });

const workoutProgramSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  trainer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  relationship: { type: mongoose.Schema.Types.ObjectId, ref: "CoachingRelationship" },
  days: [daySchema],
}, { timestamps: true });

export default mongoose.model("WorkoutProgram", workoutProgramSchema);