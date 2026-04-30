import mongoose from "mongoose";

const exerciseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sets: { type: Number, default: 3 },
  reps: { type: Number, default: 10 },
  weight: { type: Number, default: 0 },
  restSeconds: { type: Number, default: 60 },
  videoUrl: { type: String, default: "" }, // YouTube / Vimeo link
  notes: { type: String, default: "" },
}, { _id: false });

const daySchema = new mongoose.Schema({
  dayNumber: { type: Number, required: true },
  title: { type: String, default: "" }, // e.g. "Chest & Triceps"
  exercises: [exerciseSchema],
}, { _id: false });

const programSchema = new mongoose.Schema({
  trainer: { type: mongoose.Schema.Types.ObjectId, ref: "Trainer", required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  category: {
    type: String,
    enum: ["weight_loss", "muscle_gain", "strength", "cardio", "flexibility", "general"],
    default: "general",
  },
  durationWeeks: { type: Number, default: 4 },
  price: { type: Number, required: true, min: 0 },
  days: [daySchema],
  enrolledCount: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("Program", programSchema);