import { Client } from "../models/index.js";

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
