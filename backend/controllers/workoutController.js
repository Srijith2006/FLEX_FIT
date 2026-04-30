import { Client, WorkoutProgram, WorkoutLog, DietPlan } from "../models/index.js";

export const createProgram = async (req, res, next) => {
  try {
    const { title, description, days } = req.body;
    if (!title) return res.status(400).json({ message: "Program title is required" });

    const program = await WorkoutProgram.create({
      title,
      description,
      days: days || [],
      trainer: req.user._id,
    });
    res.status(201).json({ program });
  } catch (error) {
    next(error);
  }
};

export const listPrograms = async (req, res, next) => {
  try {
    const { relationshipId } = req.query;
    const query = {};
    if (relationshipId) query.relationship = relationshipId;
    if (req.user.role === "trainer") query.trainer = req.user._id;

    const programs = await WorkoutProgram.find(query).sort({ createdAt: -1 });
    res.json({ programs });
  } catch (error) {
    next(error);
  }
};

export const logWorkout = async (req, res, next) => {
  try {
    const client = await Client.findOne({ user: req.user._id });
    if (!client) return res.status(404).json({ message: "Client profile not found" });

    const { weight, notes, completedExercises } = req.body;

    const log = await WorkoutLog.create({
      client: client._id,
      weight: Number(weight) || 0,
      notes: notes || "",
      completedExercises: completedExercises || [],
      date: new Date(),
    });

    // Update client's current weight if provided
    if (weight && Number(weight) > 0) {
      client.currentWeight = Number(weight);
      await client.save();
    }

    res.status(201).json({ log });
  } catch (error) {
    next(error);
  }
};

export const myLogs = async (req, res, next) => {
  try {
    const client = await Client.findOne({ user: req.user._id });
    if (!client) return res.status(404).json({ message: "Client profile not found" });

    const logs = await WorkoutLog.find({ client: client._id }).sort({ date: -1 }).limit(50);
    res.json({ logs });
  } catch (error) {
    next(error);
  }
};

export const createDietPlan = async (req, res, next) => {
  try {
    const { title, meals, clientId } = req.body;
    if (!title) return res.status(400).json({ message: "Diet plan title is required" });

    const dietPlan = await DietPlan.create({ title, meals, client: clientId, trainer: req.user._id });
    res.status(201).json({ dietPlan });
  } catch (error) {
    next(error);
  }
};

export const listDietPlans = async (req, res, next) => {
  try {
    const client = await Client.findOne({ user: req.user._id });
    if (!client) return res.status(404).json({ message: "Client profile not found" });

    const dietPlans = await DietPlan.find({ client: client._id }).sort({ createdAt: -1 });
    res.json({ dietPlans });
  } catch (error) {
    next(error);
  }
};