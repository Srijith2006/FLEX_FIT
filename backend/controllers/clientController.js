import { WorkoutCompletion, Enrollment, Client } from "../models/index.js";

// Admin — get all clients with profile + enrollment count + flex points
export const getAllClients = async (req, res, next) => {
  try {
    const clients = await Client.find({})
      .populate("user", "name email phone createdAt")
      .sort({ createdAt: -1 });

    // Enrich each client with enrollment count
    const enriched = await Promise.all(clients.map(async (c) => {
      const enrollmentCount = await Enrollment.countDocuments({ client: c._id });
      return {
        _id:               c._id,
        user:              c.user,
        age:               c.age,
        gender:            c.gender,
        height:            c.height,
        currentWeight:     c.currentWeight,
        targetWeight:      c.targetWeight,
        goalType:          c.goalType,
        fitnessLevel:      c.fitnessLevel,
        workoutsPerWeek:   c.workoutsPerWeek,
        healthNotes:       c.healthNotes,
        injuries:          c.injuries,
        subscriptionActive: c.subscriptionActive,
        enrolledPrograms:  enrollmentCount,
        createdAt:         c.createdAt,
        updatedAt:         c.updatedAt,
      };
    }));

    res.json({ clients: enriched });
  } catch (error) { next(error); }
};

export const getClientProfile = async (req, res, next) => {
  try {
    const client = await Client.findOne({ user: req.user._id }).populate("user", "name email");
    if (!client) return res.status(404).json({ message: "Client profile not found" });
    res.json({ client });
  } catch (error) { next(error); }
};

export const updateClientProfile = async (req, res, next) => {
  try {
    let client = await Client.findOne({ user: req.user._id });
    if (!client) client = await Client.create({ user: req.user._id });

    const fields = [
      "age","gender","height","currentWeight","targetWeight",
      "goalType","fitnessLevel","workoutsPerWeek","healthNotes","injuries",
    ];
    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        client[f] = ["age","height","currentWeight","targetWeight","workoutsPerWeek"].includes(f)
          ? Number(req.body[f])
          : req.body[f];
      }
    });

    await client.save();
    res.json({ client });
  } catch (error) { next(error); }
};

export const submitSession = async (req, res, next) => {
  try {
    const client = await Client.findOne({ user: req.user._id });
    if (!client) return res.status(404).json({ message: "Client not found" });

    const { programId, duration, timestamp, notes } = req.body;
    if (!programId) return res.status(400).json({ message: "programId is required" });

    // Verify client is enrolled
    const enrollment = await Enrollment.findOne({
      client: client._id,
      program: programId,
      status: "active",
    });
    if (!enrollment)
      return res.status(403).json({ message: "Not enrolled in this program" });

    const today     = new Date().toISOString().split("T")[0];
    const videoUrl  = req.file ? (req.file.path || `/uploads/${req.file.filename}`) : "";
    const sessionTs = timestamp ? new Date(timestamp) : new Date();

    const completion = await WorkoutCompletion.create({
      client:      client._id,
      program:     programId,
      date:        today,
      duration:    Number(duration) || 0,
      videoUrl,
      notes:       notes || "",
      sessionType: "session_tracker",
      timestamp:   sessionTs,
      completed:   true,
    });

    // Award FlexPoints for session completion
    try {
      const { awardPoints } = await import("./leaderboardController.js");
      await awardPoints(req.user._id, 15, "session_tracker");
    } catch {}

    res.status(201).json({
      completion,
      message: "Session submitted! +15 FlexPoints earned 🔥",
    });
  } catch (error) { next(error); }
};