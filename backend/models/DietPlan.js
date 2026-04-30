import mongoose from "mongoose";

const mealSchema = new mongoose.Schema({
  mealType: String,
  items: [String],
  calories: Number
}, { _id: false });

const dietPlanSchema = new mongoose.Schema({
  relationship: { type: mongoose.Schema.Types.ObjectId, ref: "CoachingRelationship", required: true },
  title: { type: String, required: true },
  meals: [mealSchema],
  notes: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.model("DietPlan", dietPlanSchema);
