import { ProofOfWork, Client, Enrollment } from "../models/index.js";

export const uploadProof = async (req, res, next) => {
  try {
    const client = await Client.findOne({ user: req.user._id });
    if (!client) return res.status(404).json({ message: "Client not found" });

    if (!req.file) return res.status(400).json({ message: "No image uploaded" });

    const { date, caption, type, dailyWorkoutId, programId } = req.body;
    const today = date || new Date().toISOString().split("T")[0];

    // Use Cloudinary URL (req.file.path) if available, else fallback to local path
    const imageUrl = req.file.path || `/uploads/${req.file.filename}`;

    const proof = await ProofOfWork.findOneAndUpdate(
      { client: client._id, date: today, type: type || "workout" },
      {
        imageUrl,
        caption:      caption || "",
        dailyWorkout: dailyWorkoutId || null,
        program:      programId || null,
        verified:     true,
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ proof });
  } catch (error) { next(error); }
};

export const myProofs = async (req, res, next) => {
  try {
    const client = await Client.findOne({ user: req.user._id });
    if (!client) return res.json({ proofs: [], streak: 0 });

    const proofs = await ProofOfWork.find({ client: client._id })
      .sort({ date: -1 }).limit(30);

    const dateSet = new Set(proofs.filter(p => p.type === "workout").map(p => p.date));
    let streak = 0;
    const d = new Date();
    while (dateSet.has(d.toISOString().split("T")[0])) { streak++; d.setDate(d.getDate() - 1); }

    res.json({ proofs, streak });
  } catch (error) { next(error); }
};

export const getTrainerFeed = async (req, res, next) => {
  try {
    // 1. Find all active enrollments for the logged-in trainer
    const enrollments = await Enrollment.find({ 
      trainer: req.user._id, 
      status: "active" 
    });

    // 2. Extract the client IDs from those enrollments
    const clientIds = enrollments.map(e => e.client);

    // 3. Find proofs belonging to those clients and populate their names
    const proofs = await ProofOfWork.find({ client: { $in: clientIds } })
      .populate({
        path: "client",
        populate: { path: "user", select: "name" }
      })
      .sort({ date: -1, createdAt: -1 });

    // 4. Format the data to match what ClientProofFeed.jsx expects
    const formatted = proofs.map(p => ({
      _id: p._id,
      imageUrl: p.imageUrl,
      caption: p.caption,
      type: p.type,
      date: p.date,
      clientName: p.client?.user?.name || "Member"
    }));

    res.json({ proofs: formatted });
  } catch (error) {
    next(error);
  }
};