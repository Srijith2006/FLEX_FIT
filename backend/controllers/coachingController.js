import { Client, Trainer, CoachingRelationship } from "../models/index.js";

export const createRelationship = async (req, res, next) => {
  try {
    const client = await Client.findOne({ user: req.user._id });
    if (!client) return res.status(404).json({ message: "Client profile not found" });

    const { trainerId, pricePerMonth } = req.body;
    if (!trainerId) return res.status(400).json({ message: "trainerId is required" });

    const trainer = await Trainer.findById(trainerId);
    if (!trainer) return res.status(404).json({ message: "Trainer not found" });
    if (trainer.verificationStatus !== "approved") {
      return res.status(400).json({ message: "This trainer is not yet verified" });
    }

    // Check for existing active relationship
    const existing = await CoachingRelationship.findOne({
      trainer: trainer._id,
      client: client._id,
      status: "active",
    });
    if (existing) {
      return res.status(400).json({ message: "You already have an active coaching relationship with this trainer" });
    }

    const relationship = await CoachingRelationship.create({
      trainer: trainer._id,
      client: client._id,
      pricePerMonth: Number(pricePerMonth) || 49,
      status: "active",
    });

    res.status(201).json({ relationship });
  } catch (error) {
    next(error);
  }
};

export const myRelationships = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === "trainer") {
      const trainer = await Trainer.findOne({ user: req.user._id });
      if (!trainer) return res.json({ relationships: [] });
      query = { trainer: trainer._id };
    } else {
      const client = await Client.findOne({ user: req.user._id });
      if (!client) return res.json({ relationships: [] });
      query = { client: client._id };
    }

    const relationships = await CoachingRelationship.find(query)
      .populate({ path: "trainer", populate: { path: "user", select: "name email" } })
      .populate({ path: "client", populate: { path: "user", select: "name email" } })
      .sort({ createdAt: -1 });

    res.json({ relationships });
  } catch (error) {
    next(error);
  }
};

export const updateRelationshipStatus = async (req, res, next) => {
  try {
    const { relationshipId } = req.params;
    const { status } = req.body;

    if (!["active", "paused", "ended"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const relationship = await CoachingRelationship.findByIdAndUpdate(
      relationshipId,
      { status },
      { new: true }
    );
    if (!relationship) return res.status(404).json({ message: "Relationship not found" });
    res.json({ relationship });
  } catch (error) {
    next(error);
  }
};