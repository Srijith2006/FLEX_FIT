import { LiveSession, Trainer, Enrollment, Client } from "../models/index.js";

export const createSession = async (req, res, next) => {
  try {
    const trainer = await Trainer.findOne({ user: req.user._id });
    if (!trainer) return res.status(404).json({ message: "Trainer not found" });

    const { title, description, scheduledAt, durationMinutes, meetingLink, programId, isOpenToAll } = req.body;
    if (!title || !scheduledAt || !meetingLink)
      return res.status(400).json({ message: "title, scheduledAt and meetingLink are required" });

    const session = await LiveSession.create({
      trainer: trainer._id,
      program: programId || null,
      title, description,
      scheduledAt: new Date(scheduledAt),
      durationMinutes: Number(durationMinutes) || 60,
      meetingLink,
      isOpenToAll: isOpenToAll !== false,
    });
    res.status(201).json({ session });
  } catch (error) { next(error); }
};

export const mySessions = async (req, res, next) => {
  try {
    const trainer = await Trainer.findOne({ user: req.user._id });
    if (!trainer) return res.json({ sessions: [] });

    const sessions = await LiveSession.find({ trainer: trainer._id })
      .populate("program", "title")
      .sort({ scheduledAt: 1 });
    res.json({ sessions });
  } catch (error) { next(error); }
};

export const deleteSession = async (req, res, next) => {
  try {
    const trainer = await Trainer.findOne({ user: req.user._id });
    await LiveSession.findOneAndDelete({ _id: req.params.sessionId, trainer: trainer._id });
    res.json({ message: "Session deleted" });
  } catch (error) { next(error); }
};

// Client — ALL sessions (past + future) for their enrolled programs' trainers
export const clientSessions = async (req, res, next) => {
  try {
    const client = await Client.findOne({ user: req.user._id });
    if (!client) return res.json({ sessions: [] });

    const enrollments = await Enrollment.find({ client: client._id, status: "active" });
    if (!enrollments.length) return res.json({ sessions: [] });

    const trainerIds = [...new Set(enrollments.map(e => String(e.trainer)))];
    const programIds = enrollments.map(e => String(e.program));

    // No date filter — return ALL sessions for enrolled trainers
    // so future sessions always show regardless of how far ahead they are
    const sessions = await LiveSession.find({
      $or: [
        { trainer: { $in: trainerIds } },
        { program: { $in: programIds } },
      ],
    })
      .populate({ path: "trainer", populate: { path: "user", select: "name" } })
      .populate("program", "title")
      .sort({ scheduledAt: 1 });

    res.json({ sessions });
  } catch (error) { next(error); }
};

export const programSessions = async (req, res, next) => {
  try {
    // No date filter — return all sessions for this program
    const sessions = await LiveSession.find({ program: req.params.programId })
      .populate({ path: "trainer", populate: { path: "user", select: "name" } })
      .sort({ scheduledAt: 1 });
    res.json({ sessions });
  } catch (error) { next(error); }
};