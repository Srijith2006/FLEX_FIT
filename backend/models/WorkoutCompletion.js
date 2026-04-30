import mongoose from "mongoose";

const completedExerciseSchema = new mongoose.Schema({
  name:   { type: String },
  sets:   { type: Number, default: 0 },
  reps:   { type: Number, default: 0 },
  weight: { type: Number, default: 0 },
}, { _id: false });

const workoutCompletionSchema = new mongoose.Schema({
  dailyWorkout: { type: mongoose.Schema.Types.ObjectId, ref: "DailyWorkout", required: true },
  client:       { type: mongoose.Schema.Types.ObjectId, ref: "Client",       required: true },
  program:      { type: mongoose.Schema.Types.ObjectId, ref: "Program",      required: true },
  date:         { type: String, required: true },   // "YYYY-MM-DD"
  completedExercises: [completedExerciseSchema],
  bodyWeight:   { type: Number, default: 0 },
  notes:        { type: String, default: "" },
  completed:    { type: Boolean, default: true },
}, { timestamps: true });

// One completion per client per daily workout
workoutCompletionSchema.index({ dailyWorkout: 1, client: 1 }, { unique: true });

export default mongoose.model("WorkoutCompletion", workoutCompletionSchema);
