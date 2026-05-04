import mongoose from "mongoose";

const mealItemSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String, default: "" },
  quantity:    { type: String, default: "" },      // e.g. "200g", "1 cup"
  calories:    { type: Number, default: 0 },
  protein:     { type: Number, default: 0 },
  carbs:       { type: Number, default: 0 },
  fat:         { type: Number, default: 0 },
  linkedProduct: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, // vendor product to order
  notes:       { type: String, default: "" },
}, { _id: false });

const dayMealsSchema = new mongoose.Schema({
  day:         { type: Number, required: true },   // 1–7
  dayName:     { type: String, default: "" },      // "Monday"
  breakfast:   [mealItemSchema],
  midMorning:  [mealItemSchema],
  lunch:       [mealItemSchema],
  eveningSnack:[mealItemSchema],
  dinner:      [mealItemSchema],
  postWorkout: [mealItemSchema],
  totalCalories: { type: Number, default: 0 },
  totalProtein:  { type: Number, default: 0 },
  totalCarbs:    { type: Number, default: 0 },
  totalFat:      { type: Number, default: 0 },
}, { _id: false });

const dietPlanSchema = new mongoose.Schema({
  trainer:  { type: mongoose.Schema.Types.ObjectId, ref: "Trainer", required: true },
  program:  { type: mongoose.Schema.Types.ObjectId, ref: "Program" },  // optional — for a program
  client:   { type: mongoose.Schema.Types.ObjectId, ref: "Client" },   // optional — personal plan
  title:    { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  goal:     { type: String, enum: ["weight_loss","muscle_gain","maintenance","endurance"], default: "maintenance" },
  dailyCalorieTarget: { type: Number, default: 2000 },
  days:     [dayMealsSchema],   // 7-day template
  isActive: { type: Boolean, default: true },
  notes:    { type: String, default: "" },
}, { timestamps: true });

export default mongoose.model("DietPlan", dietPlanSchema);