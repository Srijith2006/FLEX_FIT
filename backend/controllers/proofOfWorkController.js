import { ProofOfWork, Client } from "../models/index.js";

export const uploadProof = async (req, res, next) => {
  try {
    const client = await Client.findOne({ user: req.user._id });
    if (!client) return res.status(404).json({ message: "Client not found" });

    if (!req.file) return res.status(400).json({ message: "No image uploaded" });

    const { date, caption, type, dailyWorkoutId, programId } = req.body;
    const today = date || new Date().toISOString().split("T")[0];

    // Upsert — one proof per client per day per type
    const proof = await ProofOfWork.findOneAndUpdate(
      { client: client._id, date: today, type: type || "workout" },
      {
        imageUrl:     `/uploads/${req.file.filename}`,
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
    if (!client) return res.json({ proofs: [] });

    const proofs = await ProofOfWork.find({ client: client._id })
      .sort({ date: -1 }).limit(30);

    // Calculate streak from proofs
    const dateSet = new Set(proofs.filter(p => p.type === "workout").map(p => p.date));
    let streak = 0;
    const d = new Date();
    while (dateSet.has(d.toISOString().split("T")[0])) { streak++; d.setDate(d.getDate() - 1); }

    res.json({ proofs, streak });
  } catch (error) { next(error); }
};