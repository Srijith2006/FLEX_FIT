import { DailyWorkout, WorkoutCompletion, Trainer, Client, Enrollment, Program } from "../models/index.js";

// ─── TRAINER ──────────────────────────────────────────────────────────────────

// Assign (create or update) a daily workout for a program on a specific date
export const assignDailyWorkout = async (req, res, next) => {
  try {
    const trainer = await Trainer.findOne({ user: req.user._id });
    if (!trainer) return res.status(404).json({ message: "Trainer not found" });

    const { programId } = req.params;
    const { date, title, notes, exercises } = req.body;

    if (!date) return res.status(400).json({ message: "date is required (YYYY-MM-DD)" });

    // Verify this program belongs to this trainer
    const program = await Program.findOne({ _id: programId, trainer: trainer._id });
    if (!program) return res.status(404).json({ message: "Program not found" });

    // Upsert — one workout per program per date
    const workout = await DailyWorkout.findOneAndUpdate(
      { program: programId, date },
      { trainer: trainer._id, title: title || "", notes: notes || "", exercises: exercises || [] },
      { upsert: true, new: true }
    );

    res.status(201).json({ workout });
  } catch (error) { next(error); }
};

// Get all assigned workouts for a program (trainer view)
export const getProgramWorkouts = async (req, res, next) => {
  try {
    const trainer = await Trainer.findOne({ user: req.user._id });
    if (!trainer) return res.status(404).json({ message: "Trainer not found" });

    const { programId } = req.params;
    const program = await Program.findOne({ _id: programId, trainer: trainer._id });
    if (!program) return res.status(404).json({ message: "Program not found" });

    const workouts = await DailyWorkout.find({ program: programId }).sort({ date: 1 });
    res.json({ workouts });
  } catch (error) { next(error); }
};

// Delete a daily workout
export const deleteDailyWorkout = async (req, res, next) => {
  try {
    const trainer = await Trainer.findOne({ user: req.user._id });
    if (!trainer) return res.status(404).json({ message: "Trainer not found" });

    await DailyWorkout.findOneAndDelete({ _id: req.params.workoutId, trainer: trainer._id });
    res.json({ message: "Workout deleted" });
  } catch (error) { next(error); }
};

// ─── CLIENT ───────────────────────────────────────────────────────────────────

// Get today's (or any date's) workout for a program the client is enrolled in
export const getClientWorkout = async (req, res, next) => {
  try {
    const client = await Client.findOne({ user: req.user._id });
    if (!client) return res.status(404).json({ message: "Client not found" });

    const { programId } = req.params;
    const date = req.query.date || new Date().toISOString().split("T")[0]; // default today

    // Verify enrollment
    const enrollment = await Enrollment.findOne({ client: client._id, program: programId, status: "active" });
    if (!enrollment) return res.status(403).json({ message: "Not enrolled in this program" });

    const workout = await DailyWorkout.findOne({ program: programId, date });

    // Also check if this client already logged this workout
    let completion = null;
    if (workout) {
      completion = await WorkoutCompletion.findOne({ dailyWorkout: workout._id, client: client._id });
    }

    res.json({ workout: workout || null, completion: completion || null, date });
  } catch (error) { next(error); }
};

// Get all workouts for an enrolled program (full history view)
export const getClientProgramWorkouts = async (req, res, next) => {
  try {
    const client = await Client.findOne({ user: req.user._id });
    if (!client) return res.status(404).json({ message: "Client not found" });

    const { programId } = req.params;

    const enrollment = await Enrollment.findOne({ client: client._id, program: programId, status: "active" });
    if (!enrollment) return res.status(403).json({ message: "Not enrolled in this program" });

    const workouts = await DailyWorkout.find({ program: programId }).sort({ date: 1 });

    // Get all completions for this client in this program
    const completions = await WorkoutCompletion.find({
      client: client._id,
      program: programId,
    });

    const completionMap = {};
    completions.forEach(c => { completionMap[c.date] = c; });

    res.json({ workouts, completionMap });
  } catch (error) { next(error); }
};

// Client logs their performance against a daily workout
export const completeWorkout = async (req, res, next) => {
  try {
    const client = await Client.findOne({ user: req.user._id });
    if (!client) return res.status(404).json({ message: "Client not found" });

    const { workoutId } = req.params;
    const { completedExercises, bodyWeight, notes } = req.body;

    const workout = await DailyWorkout.findById(workoutId);
    if (!workout) return res.status(404).json({ message: "Workout not found" });

    // Verify enrollment
    const enrollment = await Enrollment.findOne({
      client: client._id,
      program: workout.program,
      status: "active",
    });
    if (!enrollment) return res.status(403).json({ message: "Not enrolled in this program" });

    // Upsert completion
    const completion = await WorkoutCompletion.findOneAndUpdate(
      { dailyWorkout: workoutId, client: client._id },
      {
        program: workout.program,
        date: workout.date,
        completedExercises: completedExercises || [],
        bodyWeight: Number(bodyWeight) || 0,
        notes: notes || "",
        completed: true,
      },
      { upsert: true, new: true }
    );

    // Update client's current weight if provided
    if (bodyWeight && Number(bodyWeight) > 0) {
      await Client.findByIdAndUpdate(client._id, { currentWeight: Number(bodyWeight) });
    }

    res.status(201).json({ completion });
  } catch (error) { next(error); }
};

// Client's full progress for a program — all completions
export const clientProgramProgress = async (req, res, next) => {
  try {
    const client = await Client.findOne({ user: req.user._id });
    if (!client) return res.status(404).json({ message: "Client not found" });

    const { programId } = req.params;

    const completions = await WorkoutCompletion.find({ client: client._id, program: programId })
      .sort({ date: 1 });

    const totalWorkouts = await DailyWorkout.countDocuments({ program: programId });

    res.json({
      completions,
      totalWorkouts,
      completedCount: completions.length,
      percentage: totalWorkouts > 0 ? Math.round((completions.length / totalWorkouts) * 100) : 0,
    });
  } catch (error) { next(error); }
};

// Trainer — see how many clients completed each daily workout
export const workoutCompletionStats = async (req, res, next) => {
  try {
    const trainer = await Trainer.findOne({ user: req.user._id });
    if (!trainer) return res.status(404).json({ message: "Trainer not found" });

    const { programId } = req.params;
    const program = await Program.findOne({ _id: programId, trainer: trainer._id });
    if (!program) return res.status(404).json({ message: "Program not found" });

    const workouts = await DailyWorkout.find({ program: programId }).sort({ date: 1 });

    const stats = await Promise.all(
      workouts.map(async (w) => {
        const count = await WorkoutCompletion.countDocuments({ dailyWorkout: w._id });
        return { workout: w, completedBy: count };
      })
    );

    res.json({ stats, totalEnrolled: program.enrolledCount });
  } catch (error) { next(error); }
};
