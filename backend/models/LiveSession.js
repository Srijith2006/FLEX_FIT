// backend/models/LiveSession.js

import mongoose from "mongoose";

const liveSessionSchema = new mongoose.Schema(
  {
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trainer",
      required: true,
    },

    // Every session must belong to a specific program
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    scheduledAt: {
      type: Date,
      required: true,
    },

    durationMinutes: {
      type: Number,
      default: 60,
      min: 5,
    },

    // Only exposed to enrolled clients — access-gated in the controller
    meetingLink: {
      type: String,
      required: true,
      trim: true,
    },

    // Legacy field kept for backwards-compat; always false for new sessions
    isOpenToAll: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound index for efficient per-program queries
liveSessionSchema.index({ program: 1, scheduledAt: 1 });

const LiveSession = mongoose.model("LiveSession", liveSessionSchema);

export default LiveSession;