import { Trainer } from "../models/index.js";
import { calculateTrainerScore } from "../utils/helpers.js";

// Public: only approved trainers
export const listTrainers = async (req, res, next) => {
  try {
    const trainers = await Trainer.find({ verificationStatus: "approved" })
      .populate("user", "name email")
      .sort({ score: -1 });
    res.json({ trainers });
  } catch (error) {
    next(error);
  }
};

// Admin: all trainers regardless of status
export const listAllTrainers = async (req, res, next) => {
  try {
    const trainers = await Trainer.find({})
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json({ trainers });
  } catch (error) {
    next(error);
  }
};

export const getTrainerProfile = async (req, res, next) => {
  try {
    const trainer = await Trainer.findOne({ user: req.user._id }).populate("user", "name email");
    if (!trainer) return res.status(404).json({ message: "Trainer profile not found" });
    res.json({ trainer });
  } catch (error) {
    next(error);
  }
};

export const updateTrainerProfile = async (req, res, next) => {
  try {
    const trainer = await Trainer.findOne({ user: req.user._id });
    if (!trainer) return res.status(404).json({ message: "Trainer profile not found" });

    const { bio, specialization, yearsOfExperience, hourlyRate } = req.body;
    if (bio !== undefined) trainer.bio = bio;
    if (specialization !== undefined) trainer.specialization = specialization;
    if (yearsOfExperience !== undefined) trainer.yearsOfExperience = Number(yearsOfExperience);
    if (hourlyRate !== undefined) trainer.hourlyRate = Number(hourlyRate);
    trainer.score = calculateTrainerScore(trainer);

    await trainer.save();
    res.json({ trainer });
  } catch (error) {
    next(error);
  }
};

export const submitVerification = async (req, res, next) => {
  try {
    const trainer = await Trainer.findOne({ user: req.user._id });
    if (!trainer) return res.status(404).json({ message: "Trainer profile not found" });

    if (req.file) {
      trainer.certificateUrl = `/uploads/${req.file.filename}`;
    }
    trainer.verificationStatus = "pending";
    await trainer.save();

    res.json({ message: "Verification submitted successfully", trainer });
  } catch (error) {
    next(error);
  }
};

export const reviewVerification = async (req, res, next) => {
  try {
    const { trainerId } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be approved or rejected" });
    }

    const trainer = await Trainer.findByIdAndUpdate(
      trainerId,
      { verificationStatus: status },
      { new: true }
    ).populate("user", "name email");

    if (!trainer) return res.status(404).json({ message: "Trainer not found" });
    res.json({ trainer });
  } catch (error) {
    next(error);
  }
};

export const rateTrainer = async (req, res, next) => {
  try {
    const { trainerId } = req.params;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const trainer = await Trainer.findById(trainerId);
    if (!trainer) return res.status(404).json({ message: "Trainer not found" });

    const totalScore = trainer.avgRating * trainer.totalRatings + Number(rating);
    trainer.totalRatings += 1;
    trainer.avgRating = totalScore / trainer.totalRatings;
    trainer.score = calculateTrainerScore(trainer);
    await trainer.save();

    res.json({ trainer });
  } catch (error) {
    next(error);
  }
};