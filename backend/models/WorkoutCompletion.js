import mongoose from "mongoose";

// Sub-schema for manual exercise logging (Legacy Support)
const completedExerciseSchema = new mongoose.Schema({
  name:   { type: String },
  sets:   { type: Number, default: 0 },
  reps:   { type: Number, default: 0 },
  weight: { type: Number, default: 0 },
}, { _id: false });

const workoutCompletionSchema = new mongoose.Schema({
  // Relations
  client:       { type: mongoose.Schema.Types.ObjectId, ref: "Client",  required: true },
  program:      { type: mongoose.Schema.Types.ObjectId, ref: "Program", required: true },
  dailyWorkout: { type: mongoose.Schema.Types.ObjectId, ref: "DailyWorkout" }, // Null if using Session Tracker
  
  // Date tracking
  date:         { type: String, required: true }, // Format: "YYYY-MM-DD"
  timestamp:    { type: Date, default: Date.now },

  // Manual Logging Fields
  completedExercises: [completedExerciseSchema],
  bodyWeight:   { type: Number, default: 0 },
  notes:        { type: String, default: "" },
  
  // Session Tracker Fields (New)
  duration:     { type: Number, default: 0 }, // Length of session in seconds
  videoUrl:     { type: String, default: "" }, // Path to the uploaded workout video
  sessionType:  { 
    type: String, 
    enum: ["manual", "session_tracker"], 
    default: "manual" 
  },
  
  completed:    { type: Boolean, default: true }
}, { timestamps: true });

/**
 * UPDATED INDEXING LOGIC:
 * Only enforces uniqueness for "manual" sessions that have a valid dailyWorkout ID.
 * This prevents the duplicate key error when dailyWorkout is null.
 */
workoutCompletionSchema.index({ dailyWorkout: 1, client: 1 }, {
  unique: true,
  partialFilterExpression: {
    sessionType: "manual",
    dailyWorkout: { $type: "objectId" } // This ensures nulls are ignored
  },
});

const WorkoutCompletion = mongoose.model("WorkoutCompletion", workoutCompletionSchema);

export default WorkoutCompletion;