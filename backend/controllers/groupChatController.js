import { GroupMessage, Enrollment, Program, Client, Trainer } from "../models/index.js";

// Get group chat history for a program
export const getGroupMessages = async (req, res, next) => {
  try {
    const { programId } = req.params;

    // Verify access — must be enrolled client or the program's trainer
    let hasAccess = false;
    if (req.user.role === "client") {
      const client = await Client.findOne({ user: req.user._id });
      if (client) {
        const enrollment = await Enrollment.findOne({ client: client._id, program: programId, status: "active" });
        hasAccess = !!enrollment;
      }
    } else if (req.user.role === "trainer") {
      const trainer = await Trainer.findOne({ user: req.user._id });
      if (trainer) {
        const program = await Program.findOne({ _id: programId, trainer: trainer._id });
        hasAccess = !!program;
      }
    } else if (req.user.role === "admin") {
      hasAccess = true;
    }

    if (!hasAccess) return res.status(403).json({ message: "Not authorized to view this group" });

    const messages = await GroupMessage.find({ program: programId })
      .populate("sender", "name role")
      .sort({ createdAt: 1 })
      .limit(200);

    // Get member count
    const memberCount = await Enrollment.countDocuments({ program: programId, status: "active" });

    res.json({ messages, memberCount });
  } catch (error) { next(error); }
};

// Send a group message (REST fallback — socket is primary)
export const sendGroupMessage = async (req, res, next) => {
  try {
    const { programId } = req.params;
    const { message, type } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: "Message cannot be empty" });

    const msg = await GroupMessage.create({
      program: programId,
      sender:  req.user._id,
      message: message.trim(),
      type:    type || "text",
    });
    await msg.populate("sender", "name role");
    res.status(201).json({ message: msg });
  } catch (error) { next(error); }
};

// Save group message — called from Socket.io handler
export const saveGroupMessage = async (programId, senderId, text, type = "text") => {
  const msg = await GroupMessage.create({ program: programId, sender: senderId, message: text, type });
  await msg.populate("sender", "name role");
  return msg;
};

// Get all programs' group chats accessible to this user
export const myGroupChats = async (req, res, next) => {
  try {
    let programs = [];
    if (req.user.role === "client") {
      const client = await Client.findOne({ user: req.user._id });
      if (client) {
        const enrollments = await Enrollment.find({ client: client._id, status: "active" })
          .populate({ path: "program", populate: { path: "trainer", populate: { path: "user", select: "name" } } });
        programs = enrollments.map(e => e.program).filter(Boolean);
      }
    } else if (req.user.role === "trainer") {
      const trainer = await Trainer.findOne({ user: req.user._id });
      if (trainer) {
        programs = await Program.find({ trainer: trainer._id, isPublished: true });
      }
    }

    // Attach last message for each
    const chats = await Promise.all(programs.map(async (p) => {
      const last = await GroupMessage.findOne({ program: p._id }).sort({ createdAt: -1 }).populate("sender","name");
      const count = await Enrollment.countDocuments({ program: p._id, status: "active" });
      return { program: p, lastMessage: last, memberCount: count };
    }));

    res.json({ chats });
  } catch (error) { next(error); }
};