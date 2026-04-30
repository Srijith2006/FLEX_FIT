import { Message, User } from "../models/index.js";

export const getConversation = async (req, res, next) => {
  try {
    const { otherUserId } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: otherUserId },
        { sender: otherUserId, receiver: req.user._id },
      ],
    })
      .populate("sender", "name role")
      .populate("receiver", "name role")
      .sort({ createdAt: 1 })
      .limit(200);
    res.json({ messages });
  } catch (error) { next(error); }
};

export const getInbox = async (req, res, next) => {
  try {
    const sent     = await Message.find({ sender: req.user._id }).distinct("receiver");
    const received = await Message.find({ receiver: req.user._id }).distinct("sender");
    const allIds   = [...new Set([...sent.map(String), ...received.map(String)])]
      .filter(id => id !== String(req.user._id));

    const users = await User.find({ _id: { $in: allIds } }).select("name role email");

    const conversations = await Promise.all(
      users.map(async (u) => {
        const last = await Message.findOne({
          $or: [
            { sender: req.user._id, receiver: u._id },
            { sender: u._id,        receiver: req.user._id },
          ],
        }).sort({ createdAt: -1 });
        return { user: u, lastMessage: last };
      })
    );

    conversations.sort(
      (a, b) => new Date(b.lastMessage?.createdAt) - new Date(a.lastMessage?.createdAt)
    );
    res.json({ conversations });
  } catch (error) { next(error); }
};

// REST fallback when socket is not available
export const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, text } = req.body;
    if (!receiverId || !text?.trim())
      return res.status(400).json({ message: "receiverId and text are required" });

    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ message: "Receiver not found" });

    const msg = await saveMessage(req.user._id, receiverId, text.trim());
    res.status(201).json({ message: msg });
  } catch (error) { next(error); }
};

// Called by both Socket.io handler and the REST fallback
export const saveMessage = async (senderId, receiverId, text) => {
  const msg = await Message.create({
    sender:   senderId,
    receiver: receiverId,
    message:  text,
  });
  await msg.populate("sender",   "name role");
  await msg.populate("receiver", "name role");
  return msg;
};