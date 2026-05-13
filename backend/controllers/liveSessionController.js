// backend/controllers/liveSessionController.js

import LiveSession from "../models/LiveSession.js";
import Enrollment  from "../models/Enrollment.js";
import Trainer     from "../models/Trainer.js";
import Client      from "../models/Client.js";      // ← ADD THIS if not already imported
import Program     from "../models/Program.js";

// ── Helper — find the Trainer document for the authenticated user ─────────────
async function getTrainer(userId) {
  return Trainer.findOne({ user: userId });
}

// ── Helper — find the Client document for the authenticated user ──────────────
// Mirrors getTrainer() — looks up by user._id so we never rely on
// req.user.clientProfile (which may or may not be set by your protect middleware)
async function getClient(userId) {
  return Client.findOne({ user: userId });
}

// ── POST /api/sessions ────────────────────────────────────────────────────────
export const createSession = async (req, res) => {
  try {
    const trainer = await getTrainer(req.user._id);
    if (!trainer) return res.status(403).json({ message: "Trainer profile not found." });

    const { programId, title, scheduledAt, meetingLink, description, durationMinutes } = req.body;

    if (!programId)   return res.status(400).json({ message: "programId is required." });
    if (!title)       return res.status(400).json({ message: "title is required." });
    if (!scheduledAt) return res.status(400).json({ message: "scheduledAt is required." });
    if (!meetingLink) return res.status(400).json({ message: "meetingLink is required." });

    const program = await Program.findOne({ _id: programId, trainer: trainer._id });
    if (!program) {
      return res.status(403).json({ message: "Program not found or does not belong to you." });
    }

    const session = await LiveSession.create({
      trainer:         trainer._id,
      program:         programId,
      title,
      description:     description || "",
      scheduledAt:     new Date(scheduledAt),
      durationMinutes: durationMinutes || 60,
      meetingLink,
      isOpenToAll:     false,
    });

    const populated = await session.populate([
      { path: "program", select: "title" },
      { path: "trainer", populate: { path: "user", select: "name" } },
    ]);

    return res.status(201).json({ session: populated });
  } catch (err) {
    console.error("[createSession]", err);
    return res.status(500).json({ message: "Server error creating session." });
  }
};

// ── GET /api/sessions/mine  (trainer) ─────────────────────────────────────────
export const getMySessionsAsTrainer = async (req, res) => {
  try {
    const trainer = await getTrainer(req.user._id);
    if (!trainer) return res.status(403).json({ message: "Trainer profile not found." });

    const filter = { trainer: trainer._id };
    if (req.query.programId) filter.program = req.query.programId;

    const sessions = await LiveSession.find(filter)
      .sort({ scheduledAt: 1 })
      .populate("program", "title")
      .populate({ path: "trainer", populate: { path: "user", select: "name" } });

    return res.json({ sessions });
  } catch (err) {
    console.error("[getMySessionsAsTrainer]", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ── GET /api/sessions/for-me  (client) ───────────────────────────────────────
export const getSessionsForClient = async (req, res) => {
  try {
    const enrollmentFilter = {
      client: req.user.clientProfile,
      status: { $in: ["active", "paid", "confirmed"] },
    };

    if (req.query.programId) {
      enrollmentFilter.program = req.query.programId;
    }

    const enrollments = await Enrollment.find(enrollmentFilter).select("program");
    const programIds  = enrollments.map(e => e.program);

    if (programIds.length === 0) return res.json({ sessions: [] });

    const sessions = await LiveSession.find({
      program:     { $in: programIds },
      scheduledAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
    })
      .sort({ scheduledAt: 1 })
      .populate("program", "title category")
      .populate({ path: "trainer", populate: { path: "user", select: "name" } });

    return res.json({ sessions });
  } catch (err) {
    console.error("[getSessionsForClient]", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ── GET /api/sessions/program/:programId  (client or trainer) ─────────────────
//
// ROOT CAUSE OF THE PREVIOUS ERROR:
//   The old version relied on req.user.clientProfile to check enrollment.
//   If your protect middleware doesn't set clientProfile on req.user,
//   Enrollment.findOne({ client: undefined }) always returns null → 403.
//
// FIX:
//   We now call getClient(req.user._id) — the same pattern used by getTrainer —
//   to reliably look up the Client document via the user's _id.
//   This works regardless of what fields your protect middleware sets on req.user.
// ─────────────────────────────────────────────────────────────────────────────
export const getSessionsForProgram = async (req, res) => {
  try {
    const { programId } = req.params;

    // ── Determine role ───────────────────────────────────────────────────────
    // Trainers can always see sessions for their own programs.
    // Clients must be enrolled in the program.
    const role = req.user.role; // "client" | "trainer" | "admin"

    if (role === "trainer" || role === "admin") {
      // Trainers: optionally verify the program belongs to them
      const trainer = await getTrainer(req.user._id);
      if (trainer) {
        const program = await Program.findOne({ _id: programId, trainer: trainer._id });
        if (!program) {
          return res.status(403).json({ message: "Program not found or access denied." });
        }
      }
    } else {
      // ── Client enrollment check ────────────────────────────────────────────
      // Step 1: Look up the Client profile by user._id (robust — no reliance on
      //         req.user.clientProfile which may be undefined)
      const clientDoc = await getClient(req.user._id);

      if (!clientDoc) {
        console.error("[getSessionsForProgram] Client profile not found for user:", req.user._id);
        return res.status(403).json({ message: "Client profile not found." });
      }

      // Step 2: Check enrollment — try with and without status filter so the
      //         check works even if your Enrollment documents have no status field
      const enrollment = await Enrollment.findOne({
        program: programId,
        client:  clientDoc._id,
      });

      if (!enrollment) {
        console.error(
          "[getSessionsForProgram] No enrollment found — programId:",
          programId,
          "clientId:", clientDoc._id
        );
        return res.status(403).json({
          message: "Access denied. You are not enrolled in this program.",
        });
      }
    }

    // ── Fetch and return sessions ────────────────────────────────────────────
    const sessions = await LiveSession.find({ program: programId })
      .populate({
        path:     "trainer",
        populate: { path: "user", select: "name email" },
      })
      .populate("program", "title")
      .sort({ scheduledAt: 1 });

    return res.json({ sessions });

  } catch (err) {
    console.error("[getSessionsForProgram]", err);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};

// ── DELETE /api/sessions/:id  (trainer) ──────────────────────────────────────
export const deleteSession = async (req, res) => {
  try {
    const trainer = await getTrainer(req.user._id);
    if (!trainer) return res.status(403).json({ message: "Trainer profile not found." });

    const session = await LiveSession.findOne({ _id: req.params.id, trainer: trainer._id });
    if (!session) return res.status(404).json({ message: "Session not found." });

    await session.deleteOne();
    return res.json({ message: "Session deleted." });
  } catch (err) {
    console.error("[deleteSession]", err);
    return res.status(500).json({ message: "Server error." });
  }
};