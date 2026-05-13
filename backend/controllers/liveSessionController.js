// backend/controllers/liveSessionController.js

import LiveSession from "../models/LiveSession.js";
import Enrollment  from "../models/Enrollment.js";
import Trainer     from "../models/Trainer.js";
import Program     from "../models/Program.js";

// ── Helper — find the Trainer document for the authenticated user ──────────────
async function getTrainer(userId) {
  return Trainer.findOne({ user: userId });
}

// ── POST /api/sessions ────────────────────────────────────────────────────────
// Body: { programId, title, description?, scheduledAt, durationMinutes?, meetingLink }
export const createSession = async (req, res) => {
  try {
    const trainer = await getTrainer(req.user._id);
    if (!trainer) return res.status(403).json({ message: "Trainer profile not found." });

    const { programId, title, scheduledAt, meetingLink, description, durationMinutes } = req.body;

    if (!programId)   return res.status(400).json({ message: "programId is required." });
    if (!title)       return res.status(400).json({ message: "title is required." });
    if (!scheduledAt) return res.status(400).json({ message: "scheduledAt is required." });
    if (!meetingLink) return res.status(400).json({ message: "meetingLink is required." });

    // Confirm the program belongs to this trainer
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
// Optional query: ?programId=<id>
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
// Returns sessions only for programs the client is enrolled in.
// Optional query: ?programId=<id>
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

export const getSessionsForProgram = async (req, res) => {
  try {
    const { programId } = req.params;
 
    // ── Client access gate ───────────────────────────────────────────────────
    // If the requester is a client, verify they are enrolled in this program.
    //
    // ⚠️  FIELD NAME NOTE:
    //   - "client" below should match the field on your Enrollment model that
    //     stores the client's profile ObjectId.
    //   - "req.user.clientProfile" should match whatever your `protect`
    //     middleware sets for the logged-in client's profile _id.
    //
    //   Common alternatives — change as needed:
    //     req.user.clientProfile  →  req.user._id  or  req.user.profile
    //     client: ...             →  user: ...      or  clientId: ...
    //
    if (req.user.role === "client") {
      const enrollment = await Enrollment.findOne({
        program: programId,
        client:  req.user.clientProfile,   // ← adjust if your field is named differently
      });
 
      if (!enrollment) {
        return res.status(403).json({
          message: "Access denied. You are not enrolled in this program.",
        });
      }
    }
 
    // ── Fetch sessions for the program ───────────────────────────────────────
    const sessions = await LiveSession.find({ program: programId })
      .populate({
        path:     "trainer",
        populate: { path: "user", select: "name email" },
      })
      .sort({ scheduledAt: 1 });   // upcoming first
 
    return res.json({ sessions });
 
  } catch (err) {
    console.error("getSessionsForProgram error:", err);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};