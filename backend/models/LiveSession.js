// backend/models/LiveSession.js
const mongoose = require("mongoose");

const liveSessionSchema = new mongoose.Schema(
  {
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trainer",
      required: true,
    },

    // ── NEW: every session must belong to a specific program ──────────────────
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true,          // sessions are always program-scoped now
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

    // The Zoom / Google Meet link — only exposed to enrolled clients (enforced
    // in the controller, not stored encrypted, but access-gated at query time).
    meetingLink: {
      type: String,
      required: true,
      trim: true,
    },

    // ── Legacy field kept for backwards-compat; always false for new sessions ─
    isOpenToAll: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound index so we can cheaply fetch all sessions for a program
liveSessionSchema.index({ program: 1, scheduledAt: 1 });

module.exports = mongoose.model("LiveSession", liveSessionSchema);