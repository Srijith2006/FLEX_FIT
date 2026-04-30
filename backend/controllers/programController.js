import { Program, Trainer, Enrollment, Client, Payment } from "../models/index.js";

export const listPrograms = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const query = { isPublished: true };
    if (category) query.category = category;
    if (search) query.title = { $regex: search, $options: "i" };
    const programs = await Program.find(query)
      .populate({ path: "trainer", populate: { path: "user", select: "name email" } })
      .sort({ enrolledCount: -1, createdAt: -1 });
    res.json({ programs });
  } catch (error) { next(error); }
};

export const getProgram = async (req, res, next) => {
  try {
    const program = await Program.findById(req.params.programId)
      .populate({ path: "trainer", populate: { path: "user", select: "name email" } });
    if (!program) return res.status(404).json({ message: "Program not found" });
    res.json({ program });
  } catch (error) { next(error); }
};

export const createProgram = async (req, res, next) => {
  try {
    const trainer = await Trainer.findOne({ user: req.user._id });
    if (!trainer) return res.status(404).json({ message: "Trainer profile not found" });
    if (trainer.verificationStatus !== "approved")
      return res.status(403).json({ message: "Only verified trainers can publish programs" });
    const { title, description, category, durationWeeks, price, days } = req.body;
    if (!title || price === undefined) return res.status(400).json({ message: "title and price are required" });
    const program = await Program.create({
      trainer: trainer._id, title, description, category,
      durationWeeks: Number(durationWeeks) || 4,
      price: Number(price), days: days || [],
    });
    res.status(201).json({ program });
  } catch (error) { next(error); }
};

export const updateProgram = async (req, res, next) => {
  try {
    const trainer = await Trainer.findOne({ user: req.user._id });
    if (!trainer) return res.status(404).json({ message: "Trainer not found" });
    const program = await Program.findOne({ _id: req.params.programId, trainer: trainer._id });
    if (!program) return res.status(404).json({ message: "Program not found" });
    ["title","description","category","durationWeeks","price","days","isPublished"]
      .forEach(f => { if (req.body[f] !== undefined) program[f] = req.body[f]; });
    await program.save();
    res.json({ program });
  } catch (error) { next(error); }
};

export const deleteProgram = async (req, res, next) => {
  try {
    const trainer = await Trainer.findOne({ user: req.user._id });
    await Program.findOneAndDelete({ _id: req.params.programId, trainer: trainer._id });
    res.json({ message: "Program deleted" });
  } catch (error) { next(error); }
};

export const myPrograms = async (req, res, next) => {
  try {
    const trainer = await Trainer.findOne({ user: req.user._id });
    if (!trainer) return res.json({ programs: [] });
    const programs = await Program.find({ trainer: trainer._id }).sort({ createdAt: -1 });
    res.json({ programs });
  } catch (error) { next(error); }
};

export const enrollInProgram = async (req, res, next) => {
  try {
    const client = await Client.findOne({ user: req.user._id });
    if (!client) return res.status(404).json({ message: "Client profile not found" });
    const program = await Program.findById(req.params.programId);
    if (!program) return res.status(404).json({ message: "Program not found" });
    const existing = await Enrollment.findOne({ client: client._id, program: program._id });
    if (existing) return res.status(400).json({ message: "Already enrolled in this program" });
    await Payment.create({
      client: client._id, trainer: program.trainer,
      amount: program.price, type: "subscription", status: "paid",
      paymentIntentId: `prog_${Date.now()}`,
    });
    const enrollment = await Enrollment.create({
      client: client._id, program: program._id,
      trainer: program.trainer, amountPaid: program.price,
    });
    await Program.findByIdAndUpdate(program._id, { $inc: { enrolledCount: 1 } });
    res.status(201).json({ enrollment });
  } catch (error) { next(error); }
};

export const myEnrollments = async (req, res, next) => {
  try {
    const client = await Client.findOne({ user: req.user._id });
    if (!client) return res.json({ enrollments: [] });
    const enrollments = await Enrollment.find({ client: client._id, status: "active" })
      .populate({ path: "program", populate: { path: "trainer", populate: { path: "user", select: "name email" } } })
      .sort({ createdAt: -1 });
    res.json({ enrollments });
  } catch (error) { next(error); }
};

export const programEnrollments = async (req, res, next) => {
  try {
    const trainer = await Trainer.findOne({ user: req.user._id });
    if (!trainer) return res.json({ enrollments: [] });

    const program = await Program.findOne({ _id: req.params.programId, trainer: trainer._id });
    if (!program) return res.status(404).json({ message: "Program not found" });

    const enrollments = await Enrollment.find({ program: program._id, status: "active" })
      .populate({ path: "client", populate: { path: "user", select: "name email" } });

    res.json({ enrollments });
  } catch (error) { next(error); }
};

export const checkEnrollment = async (req, res, next) => {
  try {
    const client = await Client.findOne({ user: req.user._id });
    if (!client) return res.json({ enrolled: false });
    const enrollment = await Enrollment.findOne({ client: client._id, program: req.params.programId });
    res.json({ enrolled: !!enrollment, enrollment });
  } catch (error) { next(error); }
};