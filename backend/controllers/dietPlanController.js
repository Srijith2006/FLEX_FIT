import { DietPlan, Trainer, Client, Enrollment, Program } from "../models/index.js";

const DAY_NAMES = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

// Calculate totals for a day from all meal slots
const calcDayTotals = (day) => {
  const slots = ["breakfast","midMorning","lunch","eveningSnack","dinner","postWorkout"];
  let cal = 0, pro = 0, car = 0, fat = 0;
  slots.forEach(slot => {
    (day[slot] || []).forEach(item => {
      cal += Number(item.calories) || 0;
      pro += Number(item.protein)  || 0;
      car += Number(item.carbs)    || 0;
      fat += Number(item.fat)      || 0;
    });
  });
  return { totalCalories: Math.round(cal), totalProtein: Math.round(pro), totalCarbs: Math.round(car), totalFat: Math.round(fat) };
};

// Build empty 7-day template
const emptyWeek = () => DAY_NAMES.map((name, i) => ({
  day: i + 1, dayName: name,
  breakfast: [], midMorning: [], lunch: [],
  eveningSnack: [], dinner: [], postWorkout: [],
  totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0,
}));

// ── TRAINER ────────────────────────────────────────────────────────────────────

export const createDietPlan = async (req, res, next) => {
  try {
    const trainer = await Trainer.findOne({ user: req.user._id });
    if (!trainer) return res.status(404).json({ message: "Trainer not found" });

    const { title, description, goal, dailyCalorieTarget, programId, clientId, notes } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required" });

    const days = emptyWeek();

    const plan = await DietPlan.create({
      trainer: trainer._id,
      program: programId || null,
      client:  clientId  || null,
      title, description, goal,
      dailyCalorieTarget: Number(dailyCalorieTarget) || 2000,
      days, notes,
    });

    res.status(201).json({ plan });
  } catch (error) { next(error); }
};

export const myDietPlans = async (req, res, next) => {
  try {
    const trainer = await Trainer.findOne({ user: req.user._id });
    if (!trainer) return res.json({ plans: [] });
    const plans = await DietPlan.find({ trainer: trainer._id, isActive: true })
      .populate("program", "title")
      .populate({ path: "client", populate: { path: "user", select: "name" } })
      .sort({ createdAt: -1 });
    res.json({ plans });
  } catch (error) { next(error); }
};

export const getDietPlan = async (req, res, next) => {
  try {
    const plan = await DietPlan.findById(req.params.planId)
      .populate({ path: "days.breakfast.linkedProduct", select: "name price vendor" })
      .populate({ path: "days.lunch.linkedProduct",     select: "name price vendor" })
      .populate({ path: "days.dinner.linkedProduct",    select: "name price vendor" });
    if (!plan) return res.status(404).json({ message: "Diet plan not found" });
    res.json({ plan });
  } catch (error) { next(error); }
};

// Update a full day's meals
export const updateDietPlanDay = async (req, res, next) => {
  try {
    const trainer = await Trainer.findOne({ user: req.user._id });
    if (!trainer) return res.status(404).json({ message: "Trainer not found" });

    const { planId, dayIndex } = req.params;
    const { breakfast, midMorning, lunch, eveningSnack, dinner, postWorkout } = req.body;

    const plan = await DietPlan.findOne({ _id: planId, trainer: trainer._id });
    if (!plan) return res.status(404).json({ message: "Diet plan not found" });

    const idx = Number(dayIndex);
    if (idx < 0 || idx > 6) return res.status(400).json({ message: "dayIndex must be 0–6" });

    const dayData = {
      ...plan.days[idx].toObject(),
      breakfast:   breakfast   || plan.days[idx].breakfast,
      midMorning:  midMorning  || plan.days[idx].midMorning,
      lunch:       lunch       || plan.days[idx].lunch,
      eveningSnack:eveningSnack|| plan.days[idx].eveningSnack,
      dinner:      dinner      || plan.days[idx].dinner,
      postWorkout: postWorkout || plan.days[idx].postWorkout,
    };

    const totals = calcDayTotals(dayData);
    plan.days[idx] = { ...dayData, ...totals };
    plan.markModified("days");
    await plan.save();

    res.json({ plan });
  } catch (error) { next(error); }
};

export const deleteDietPlan = async (req, res, next) => {
  try {
    const trainer = await Trainer.findOne({ user: req.user._id });
    await DietPlan.findOneAndUpdate(
      { _id: req.params.planId, trainer: trainer._id },
      { isActive: false }
    );
    res.json({ message: "Diet plan removed" });
  } catch (error) { next(error); }
};

// ── CLIENT ─────────────────────────────────────────────────────────────────────

export const clientDietPlans = async (req, res, next) => {
  try {
    const client = await Client.findOne({ user: req.user._id });
    if (!client) return res.json({ plans: [] });

    // Get all programs client is enrolled in
    const enrollments = await Enrollment.find({ client: client._id, status: "active" });
    const programIds  = enrollments.map(e => e.program);

    // Plans assigned to this client directly OR to their programs
    const plans = await DietPlan.find({
      isActive: true,
      $or: [
        { client: client._id },
        { program: { $in: programIds } },
      ],
    })
      .populate("program", "title")
      .populate({
        path: "days",
        populate: {
          path: "breakfast.linkedProduct lunch.linkedProduct dinner.linkedProduct eveningSnack.linkedProduct midMorning.linkedProduct postWorkout.linkedProduct",
          select: "name price imageUrl vendor",
          populate: { path: "vendor", select: "businessName city" },
        },
      })
      .sort({ createdAt: -1 });

    res.json({ plans });
  } catch (error) { next(error); }
};