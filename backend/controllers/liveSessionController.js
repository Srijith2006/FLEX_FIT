// backend/controllers/liveSessionController.js
const LiveSession = require("../models/LiveSession");
const Enrollment  = require("../models/Enrollment");
const Trainer     = require("../models/Trainer");
const Program     = require("../models/Program");

// ─────────────────────────────────────────────────────────────────────────────
// Helper — find the Trainer document for the authenticated user
// ─────────────────────────────────────────────────────────────────────────────
async function getTrainer(userId) {
  return Trainer.findOne({ user: userId });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/sessions
// Trainer creates a session scoped to one of their programs.
// Body: { programId, title, description?, scheduledAt, durationMinutes?, meetingLink }
// ─────────────────────────────────────────────────────────────────────────────
exports.createSession = async (req, res) => {
  try {
    const trainer = await getTrainer(req.user._id);
    if (!trainer) return res.status(403).json({ message: "Trainer profile not found." });

    const { programId, title, scheduledAt, meetingLink, description, durationMinutes } = req.body;

    // ── Validate required fields ──────────────────────────────────────────────
    if (!programId)    return res.status(400).json({ message: "programId is required." });
    if (!title)        return res.status(400).json({ message: "title is required." });
    if (!scheduledAt)  return res.status(400).json({ message: "scheduledAt is required." });
    if (!meetingLink)  return res.status(400).json({ message: "meetingLink is required." });

    // ── Confirm the program belongs to this trainer ───────────────────────────
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
      isOpenToAll:     false,   // always program-scoped from now on
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

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/sessions/mine  (trainer)
// Returns all sessions the trainer created, optionally filtered by programId.
// Query: ?programId=<id>
// ─────────────────────────────────────────────────────────────────────────────
exports.getMySessionsAsTrainer = async (req, res) => {
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

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/sessions/for-me  (client)
// Returns sessions for programs the client is actively enrolled in.
// The meetingLink is included because access has already been verified via
// enrollment. If the client is not enrolled they simply won't receive
// any sessions at all.
// Query: ?programId=<id>  — narrow to one program
// ─────────────────────────────────────────────────────────────────────────────
exports.getSessionsForClient = async (req, res) => {
  try {
    // Find all enrollments for this client (status: active / paid)
    const enrollmentFilter = {
      client: req.user.clientProfile,   // ObjectId of the Client doc
      status: { $in: ["active", "paid", "confirmed"] },
    };

    // Optionally narrow to a single program
    if (req.query.programId) {
      enrollmentFilter.program = req.query.programId;
    }

    const enrollments = await Enrollment.find(enrollmentFilter).select("program");
    const programIds  = enrollments.map(e => e.program);

    if (programIds.length === 0) {
      return res.json({ sessions: [] });
    }

    // Fetch sessions for those programs, sorted soonest-first
    const sessions = await LiveSession.find({
      program: { $in: programIds },
      // Show sessions from 1 hour ago onwards (still surfacing recently-started ones)
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

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/sessions/:id  (trainer)
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteSession = async (req, res) => {
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