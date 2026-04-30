import mongoose from "mongoose";

const assignedExerciseSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  sets:        { type: Number, default: 3 },
  reps:        { type: Number, default: 10 },
  weight:      { type: Number, default: 0 },
  restSeconds: { type: Number, default: 60 },
  videoUrl:    { type: String, default: "" },
  notes:       { type: String, default: "" },
}, { _id: false });

const dailyWorkoutSchema = new mongoose.Schema({
  program:    { type: mongoose.Schema.Types.ObjectId, ref: "Program",  required: true },
  trainer:    { type: mongoose.Schema.Types.ObjectId, ref: "Trainer",  required: true },
  date:       { type: String, required: true },   // "YYYY-MM-DD" — same for all enrolled clients
  title:      { type: String, default: "" },
  notes:      { type: String, default: "" },
  exercises:  [assignedExerciseSchema],
}, { timestamps: true });

// One workout per program per date
dailyWorkoutSchema.index({ program: 1, date: 1 }, { unique: true });

export default mongoose.model("DailyWorkout", dailyWorkoutSchema);
