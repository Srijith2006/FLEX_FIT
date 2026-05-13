// backend/models/LiveSession.js

import mongoose from "mongoose";

const liveSessionSchema = new mongoose.Schema(
  {
    trainer: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Trainer",
      required: [true, "Trainer is required"],
      index:    true,
    },

    // Every session is scoped to a specific program.
    // Only clients enrolled in this program can see the session.
    program: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Program",
      required: [true, "Program is required"],
      index:    true,
    },

    title: {
      type:      String,
      required:  [true, "Session title is required"],
      trim:      true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },

    description: {
      type:      String,
      default:   "",
      trim:      true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },

    scheduledAt: {
      type:     Date,
      required: [true, "Scheduled date/time is required"],
    },

    durationMinutes: {
      type:    Number,
      default: 60,
      min:     [5,    "Duration must be at least 5 minutes"],
      max:     [480,  "Duration cannot exceed 8 hours"],
    },

    // Meeting link — only exposed to enrolled clients via the controller
    meetingLink: {
      type:     String,
      required: [true, "Meeting link is required"],
      trim:     true,
    },

    // Legacy field — always false for new sessions.
    // Kept so old documents don't break.
    isOpenToAll: {
      type:    Boolean,
      default: false,
    },
  },
  {
    timestamps: true,  // createdAt, updatedAt
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────

// Primary query pattern: "all sessions for this program, sorted by time"
liveSessionSchema.index({ program: 1, scheduledAt: 1 });

// Used by getMySessionsAsTrainer: "all sessions by this trainer"
liveSessionSchema.index({ trainer: 1, scheduledAt: 1 });


// ── Virtuals ──────────────────────────────────────────────────────────────────

// isLive — true when the current time falls within the session window.
// Usable in controller responses without duplicating this logic everywhere.
// Example: if (session.isLive) { ... }
liveSessionSchema.virtual("isLive").get(function () {
  const now   = Date.now();
  const start = new Date(this.scheduledAt).getTime();
  const end   = start + this.durationMinutes * 60 * 1000;
  return now >= start && now <= end;
});

// isUpcoming — true when the session hasn't started yet
liveSessionSchema.virtual("isUpcoming").get(function () {
  return new Date(this.scheduledAt).getTime() > Date.now();
});

// isPast — true when the session window has fully passed
liveSessionSchema.virtual("isPast").get(function () {
  const start = new Date(this.scheduledAt).getTime();
  const end   = start + this.durationMinutes * 60 * 1000;
  return Date.now() > end;
});


// ── Model ─────────────────────────────────────────────────────────────────────

const LiveSession = mongoose.model("LiveSession", liveSessionSchema);

export default LiveSession;