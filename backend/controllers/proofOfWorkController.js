import { ProofOfWork, Client, Trainer, Enrollment, Program } from "../models/index.js";

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

// ── TRAINER — see all clients' proofs ─────────────────────────────────────────
export const trainerProofFeed = async (req, res, next) => {
  try {
    const trainer = await Trainer.findOne({ user: req.user._id });
    if (!trainer) return res.json({ proofs: [] });

    // Get all programs by this trainer
    const programs = await Program.find({ trainer: trainer._id }).select("_id");
    const programIds = programs.map(p => p._id);

    // Get all clients enrolled in any of trainer's programs
    const enrollments = await Enrollment.find({ program: { $in: programIds } })
      .populate({ path: "client", populate: { path: "user", select: "name" } });

    const clientIds = [...new Set(enrollments.map(e => String(e.client?._id)).filter(Boolean))];

    // Build clientId → name map
    const clientNameMap = {};
    enrollments.forEach(e => {
      if (e.client?._id) clientNameMap[String(e.client._id)] = e.client.user?.name || "Client";
    });

    // Fetch proofs for all these clients
    const proofs = await ProofOfWork.find({ client: { $in: clientIds } })
      .sort({ date: -1, createdAt: -1 })
      .limit(100);

    // Attach client name to each proof
    const enriched = proofs.map(p => ({
      ...p.toObject(),
      clientName: clientNameMap[String(p.client)] || "Client",
    }));

    res.json({ proofs: enriched });
  } catch (error) { next(error); }
};