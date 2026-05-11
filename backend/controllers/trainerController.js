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

// Trainer — get list of unique enrolled clients with personal details
export const getTrainerClients = async (req, res, next) => {
  try {
    const trainer = await Trainer.findOne({ user: req.user._id });
    if (!trainer) return res.status(404).json({ message: "Trainer not found" });

    // 1. Find all enrollments for this trainer's programs
    const enrollments = await Enrollment.find({ trainer: trainer._id })
      .populate({
        path: "client", // This is the Client model
        populate: { path: "user", select: "name email" } // Get name from User model
      });

    // 2. Filter unique clients and format data
    const uniqueClientsMap = new Map();
    
    enrollments.forEach(enc => {
      if (enc.client && !uniqueClientsMap.has(enc.client._id.toString())) {
        const c = enc.client;
        uniqueClientsMap.set(c._id.toString(), {
          _id: c._id,
          name: c.user?.name || "Unknown",
          goalType: c.goalType,
          currentWeight: c.currentWeight,
          targetWeight: c.targetWeight,
          height: c.height,
          age: c.age,
        });
      }
    });

    res.json({ clients: Array.from(uniqueClientsMap.values()) });
  } catch (error) { next(error); }
};

// ── Trainer Analytics — charts data ──────────────────────────────────────────
export const getTrainerAnalytics = async (req, res, next) => {
  try {
    const trainer = await Trainer.findOne({ user: req.user._id });
    if (!trainer) return res.status(404).json({ message: "Trainer not found" });

    const programs    = await Program.find({ trainer: trainer._id });
    const programIds  = programs.map(p => p._id);

    // ── 1. Monthly revenue — last 6 months ──────────────────────────────
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1); sixMonthsAgo.setHours(0,0,0,0);

    const enrollments = await Enrollment.find({
      program: { $in: programIds },
      createdAt: { $gte: sixMonthsAgo },
    }).populate("program","price title");

    // Group revenue by month
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const revenueMap = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
      revenueMap[key] = { month: key, revenue: 0, clients: 0 };
    }
    enrollments.forEach(e => {
      const d   = new Date(e.createdAt);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
      if (revenueMap[key]) {
        revenueMap[key].revenue += e.amountPaid || e.program?.price || 0;
        revenueMap[key].clients += 1;
      }
    });
    const revenueChart = Object.values(revenueMap);

    // ── 2. Program enrollment comparison ────────────────────────────────
    const programChart = programs.map(p => ({
      name:     p.title.length > 18 ? p.title.slice(0, 18) + "…" : p.title,
      enrolled: p.enrolledCount || 0,
      revenue:  (p.enrolledCount || 0) * (p.price || 0),
      price:    p.price || 0,
    })).sort((a, b) => b.enrolled - a.enrolled).slice(0, 6);

    // ── 3. Completion heatmap — last 28 days ────────────────────────────
    const twentyEightDaysAgo = new Date();
    twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 27);
    twentyEightDaysAgo.setHours(0,0,0,0);

    const completions = await WorkoutCompletion.find({
      program:   { $in: programIds },
      createdAt: { $gte: twentyEightDaysAgo },
    }).select("date");

    const heatmap = {};
    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      heatmap[key] = 0;
    }
    completions.forEach(c => {
      const key = c.date || new Date(c.createdAt).toISOString().split("T")[0];
      if (heatmap[key] !== undefined) heatmap[key]++;
    });
    const heatmapData = Object.entries(heatmap).map(([date, count]) => ({ date, count }));

    // ── 4. Client list with basic progress ──────────────────────────────
    const clientEnrollments = await Enrollment.find({
      program: { $in: programIds }, status: "active",
    })
      .populate({ path: "client", populate: { path: "user", select: "name" } })
      .populate("program", "title")
      .sort({ createdAt: -1 });

    // Deduplicate clients, get their latest completion
    const clientMap = {};
    for (const e of clientEnrollments) {
      const cId = String(e.client?._id);
      if (!cId || clientMap[cId]) continue;
      const lastCompletion = await WorkoutCompletion.findOne({ client: e.client._id })
        .sort({ createdAt: -1 }).select("date createdAt bodyWeight");
      const completionCount = await WorkoutCompletion.countDocuments({
        client: e.client._id, program: { $in: programIds },
      });
      clientMap[cId] = {
        name:          e.client?.user?.name || "Client",
        program:       e.program?.title     || "",
        enrolledAt:    e.createdAt,
        lastActive:    lastCompletion?.createdAt || e.createdAt,
        completions:   completionCount,
        bodyWeight:    lastCompletion?.bodyWeight || 0,
      };
    }
    const clientList = Object.values(clientMap).slice(0, 10);

    res.json({ revenueChart, programChart, heatmapData, clientList });
  } catch (error) { next(error); }
};