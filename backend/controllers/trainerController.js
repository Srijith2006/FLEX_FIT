import { Trainer, Program, Enrollment, WorkoutCompletion } from "../models/index.js";
import { calculateTrainerScore } from "../utils/helpers.js";

// Public — only approved trainers
export const listTrainers = async (req, res, next) => {
  try {
    const trainers = await Trainer.find({ verificationStatus: "approved" })
      .populate("user", "name email").sort({ score: -1 });
    res.json({ trainers });
  } catch (error) { next(error); }
};

// Admin — all trainers
export const listAllTrainers = async (req, res, next) => {
  try {
    const trainers = await Trainer.find({})
      .populate("user", "name email").sort({ createdAt: -1 });
    res.json({ trainers });
  } catch (error) { next(error); }
};

// Trainer — get own profile
export const getTrainerProfile = async (req, res, next) => {
  try {
    const trainer = await Trainer.findOne({ user: req.user._id }).populate("user", "name email phone");
    if (!trainer) return res.status(404).json({ message: "Trainer profile not found" });
    res.json({ trainer });
  } catch (error) { next(error); }
};

// Trainer — update full profile
export const updateTrainerProfile = async (req, res, next) => {
  try {
    const trainer = await Trainer.findOne({ user: req.user._id });
    if (!trainer) return res.status(404).json({ message: "Trainer profile not found" });

    const fields = [
      "bio","specialization","yearsOfExperience","hourlyRate","monthlyRate",
      "city","country","phone","instagram","website",
      "certifications","languages","fitnessNiche","trainingStyle",
    ];
    fields.forEach(f => { if (req.body[f] !== undefined) trainer[f] = req.body[f]; });
    trainer.score = calculateTrainerScore(trainer);
    await trainer.save();
    res.json({ trainer });
  } catch (error) { next(error); }
};

// Trainer — overview stats (real data)
export const getTrainerOverview = async (req, res, next) => {
  try {
    const trainer = await Trainer.findOne({ user: req.user._id });
    if (!trainer) return res.status(404).json({ message: "Trainer not found" });

    const programs = await Program.find({ trainer: trainer._id });
    const programIds = programs.map(p => p._id);

    const totalEnrolled = programs.reduce((s, p) => s + (p.enrolledCount || 0), 0);
    const totalRevenue  = programs.reduce((s, p) => s + (p.enrolledCount || 0) * (p.price || 0), 0);

    // Completions this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
    const monthlyCompletions = await WorkoutCompletion.countDocuments({
      program: { $in: programIds },
      createdAt: { $gte: startOfMonth },
    });

    res.json({
      totalPrograms:  programs.length,
      totalEnrolled,
      totalRevenue,
      avgRating:      trainer.avgRating,
      totalRatings:   trainer.totalRatings,
      monthlyCompletions,
      verificationStatus: trainer.verificationStatus,
      recentPrograms: programs.slice(0, 3),
    });
  } catch (error) { next(error); }
};

// Trainer — submit verification docs
export const submitVerification = async (req, res, next) => {
  try {
    const trainer = await Trainer.findOne({ user: req.user._id });
    if (!trainer) return res.status(404).json({ message: "Trainer profile not found" });

    if (trainer.verificationStatus === "approved") {
      return res.status(400).json({ message: "Already verified" });
    }

    if (req.file) trainer.certificateUrl = `/uploads/${req.file.filename}`;
    trainer.verificationStatus = "pending";
    await trainer.save();
    res.json({ message: "Verification submitted successfully", trainer });
  } catch (error) { next(error); }
};

// Admin — approve or reject
export const reviewVerification = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    if (!["approved","rejected"].includes(status))
      return res.status(400).json({ message: "Status must be approved or rejected" });

    const trainer = await Trainer.findByIdAndUpdate(
      req.params.trainerId,
      { verificationStatus: status, rejectionReason: rejectionReason || "" },
      { new: true }
    ).populate("user","name email");
    if (!trainer) return res.status(404).json({ message: "Trainer not found" });
    res.json({ trainer });
  } catch (error) { next(error); }
};

// Client — rate trainer
export const rateTrainer = async (req, res, next) => {
  try {
    const { trainerId } = req.params;
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ message: "Rating must be between 1 and 5" });

    const trainer = await Trainer.findById(trainerId);
    if (!trainer) return res.status(404).json({ message: "Trainer not found" });

    const total = trainer.avgRating * trainer.totalRatings + Number(rating);
    trainer.totalRatings += 1;
    trainer.avgRating = total / trainer.totalRatings;
    trainer.score = calculateTrainerScore(trainer);
    await trainer.save();
    res.json({ trainer });
  } catch (error) { next(error); }
};