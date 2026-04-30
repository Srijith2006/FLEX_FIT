import mongoose from "mongoose";

const workoutLogSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
  relationship: { type: mongoose.Schema.Types.ObjectId, ref: "CoachingRelationship" },
  date: { type: Date, default: Date.now },
  completedExercises: [{ name: String, sets: Number, reps: Number, weight: Number }],
  weight: { type: Number, default: 0 },
  notes: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.model("WorkoutLog", workoutLogSchema);
