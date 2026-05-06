import { Product, Vendor, Client, WorkoutCompletion, TrainerRecommendation, Program, Enrollment } from "../models/index.js";

// ── PUBLIC — list all available products ─────────────────────────────────────
export const listProducts = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const query = { isAvailable: true };
    if (category) query.category = category;
    if (search)   query.name = { $regex: search, $options: "i" };

    const products = await Product.find(query)
      .populate("vendor", "businessName businessType city logoUrl verificationStatus")
      .sort({ totalSold: -1, createdAt: -1 });

    // Only show products from approved vendors
    const verified = products.filter(p => p.vendor?.verificationStatus === "approved");
    res.json({ products: verified });
  } catch (error) { next(error); }
};

export const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId)
      .populate("vendor", "businessName businessType city description");
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ product });
  } catch (error) { next(error); }
};

// ── DYNAMIC PRICING — streak + group buying discounts ────────────────────────
export const getPricingForClient = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const client = await Client.findOne({ user: req.user._id });
    if (!client) return res.status(404).json({ message: "Client not found" });

    const product = await Product.findById(productId).populate("vendor", "businessName");
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Calculate streak
    const completions = await WorkoutCompletion.find({ client: client._id })
      .sort({ date: -1 }).select("date");
    const dateSet = new Set(completions.map(c => c.date));
    let streak = 0;
    const d = new Date();
    while (dateSet.has(d.toISOString().split("T")[0])) { streak++; d.setDate(d.getDate() - 1); }

    // Streak discount tiers
    let streakDiscount = 0, tierLabel = "";
    if      (streak >= 30) { streakDiscount = 20; tierLabel = "🔥 30-Day Legend — 20% off!"; }
    else if (streak >= 14) { streakDiscount = 12; tierLabel = "💪 2-Week Warrior — 12% off!"; }
    else if (streak >= 7)  { streakDiscount =  7; tierLabel = "⚡ Week Streak — 7% off!"; }
    else if (streak >= 3)  { streakDiscount =  3; tierLabel = "✅ 3-Day Starter — 3% off!"; }

    // Group buying discount
    let groupDiscount = 0, groupActive = false;
    if (product.groupBuyEnabled && product.currentGroupBuyers >= product.groupBuyThreshold) {
      groupDiscount = product.groupBuyDiscount;
      groupActive = true;
    }

    const totalDiscountPct = Math.min(streakDiscount + groupDiscount, 35);
    const finalPrice = Math.round(product.price * (1 - totalDiscountPct / 100));

    res.json({
      product, streak, streakDiscount, groupDiscount, groupActive,
      totalDiscountPct, finalPrice, tierLabel,
      groupBuyersNeeded: product.groupBuyEnabled
        ? Math.max(0, product.groupBuyThreshold - (product.currentGroupBuyers || 0)) : 0,
    });
  } catch (error) { next(error); }
};

// ── RULE-BASED MEAL SWAP ──────────────────────────────────────────────────────
export const mealSwap = async (req, res, next) => {
  try {
    const { calories, protein, carbs, fat, preference } = req.body;

    const meals = [
      { name: "Grilled Chicken + Brown Rice", calories: 450, protein: 42, carbs: 38, fat: 8,  tags: ["high_protein","quick"] },
      { name: "Paneer Bhurji + Roti",         calories: 420, protein: 28, carbs: 35, fat: 14, tags: ["veg","high_protein"] },
      { name: "Egg White Omelette + Toast",   calories: 320, protein: 30, carbs: 22, fat: 6,  tags: ["high_protein","quick","low_carb"] },
      { name: "Greek Yogurt + Berries",       calories: 200, protein: 18, carbs: 24, fat: 2,  tags: ["quick","low_carb"] },
      { name: "Tuna Salad Wrap",              calories: 380, protein: 35, carbs: 28, fat: 10, tags: ["high_protein","quick"] },
      { name: "Quinoa + Roasted Vegetables",  calories: 360, protein: 14, carbs: 55, fat: 7,  tags: ["veg","low_carb"] },
      { name: "Sprouts Chaat",               calories: 250, protein: 16, carbs: 30, fat: 4,  tags: ["veg","quick"] },
      { name: "Boiled Eggs + Sweet Potato",  calories: 400, protein: 24, carbs: 42, fat: 10, tags: ["high_protein"] },
    ];

    const target = {
      calories: Number(calories)||400, protein: Number(protein)||30,
      carbs: Number(carbs)||40,        fat: Number(fat)||10,
    };

    const scored = meals
      .filter(m => !preference || m.tags.includes(preference))
      .map(m => ({
        ...m,
        score: Math.abs(m.calories - target.calories) * 0.3 +
               Math.abs(m.protein  - target.protein)  * 2   +
               Math.abs(m.carbs    - target.carbs)    * 1   +
               Math.abs(m.fat      - target.fat)      * 1.5,
      }))
      .sort((a, b) => a.score - b.score);

    res.json({ suggestions: scored.slice(0, 3) });
  } catch (error) { next(error); }
};

// ── TRAINER RECOMMENDATIONS ───────────────────────────────────────────────────
export const addRecommendation = async (req, res, next) => {
  try {
    const { Trainer } = await import("../models/index.js");
    const trainer = await Trainer.findOne({ user: req.user._id });
    if (!trainer) return res.status(404).json({ message: "Trainer not found" });

    const { programId, productId, note } = req.body;
    if (!programId || !productId) return res.status(400).json({ message: "programId and productId required" });

    const rec = await TrainerRecommendation.create({
      trainer: trainer._id, program: programId, product: productId, note: note || "",
    });
    await rec.populate({ path: "product", populate: { path: "vendor", select: "businessName city" } });
    res.status(201).json({ recommendation: rec });
  } catch (error) { next(error); }
};

export const getProgramRecommendations = async (req, res, next) => {
  try {
    const recs = await TrainerRecommendation.find({
      program: req.params.programId, isActive: true,
    }).populate({ path: "product", populate: { path: "vendor", select: "businessName city" } });
    res.json({ recommendations: recs });
  } catch (error) { next(error); }
};

export const removeRecommendation = async (req, res, next) => {
  try {
    await TrainerRecommendation.findByIdAndUpdate(req.params.recId, { isActive: false });
    res.json({ message: "Recommendation removed" });
  } catch (error) { next(error); }
};

// ── PRODUCT RATING ────────────────────────────────────────────────────────────
export const rateProduct = async (req, res, next) => {
  try {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ message: "Rating must be 1–5" });

    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const total = product.avgRating * product.totalRatings + Number(rating);
    product.totalRatings += 1;
    product.avgRating = total / product.totalRatings;
    await product.save();

    res.json({ product });
  } catch (error) { next(error); }
};

// ── CLIENT — all recommendations across all enrolled programs ─────────────────
export const getMyRecommendations = async (req, res, next) => {
  try {
    const { Client, Enrollment } = await import("../models/index.js");
    const client = await Client.findOne({ user: req.user._id });
    if (!client) return res.json({ recommendations: [] });

    const enrollments = await Enrollment.find({ client: client._id, status: "active" });
    const programIds  = enrollments.map(e => e.program);

    if (!programIds.length) return res.json({ recommendations: [] });

    const recs = await TrainerRecommendation.find({
      program:  { $in: programIds },
      isActive: true,
    })
      .populate({ path: "product", populate: { path: "vendor", select: "businessName city" } })
      .populate("program", "title");

    res.json({ recommendations: recs });
  } catch (error) { next(error); }
};
