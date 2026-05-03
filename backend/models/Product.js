import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  vendor:       { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
  name:         { type: String, required: true, trim: true },
  description:  { type: String, default: "" },
  category:     { type: String, enum: ["supplement","meal","equipment","apparel","other"], default: "supplement" },
  imageUrl:     { type: String, default: "" },
  price:        { type: Number, required: true, min: 0 },
  originalPrice:{ type: Number, default: 0 },   // for showing discount
  unit:         { type: String, default: "unit" },  // "kg","bottle","pack","serving"
  stock:        { type: Number, default: 0 },
  isAvailable:  { type: Boolean, default: true },
  // Nutrition (for meals/supplements)
  calories:     { type: Number, default: 0 },
  protein:      { type: Number, default: 0 },
  carbs:        { type: Number, default: 0 },
  fat:          { type: Number, default: 0 },
  // Group buying
  groupBuyEnabled:     { type: Boolean, default: false },
  groupBuyThreshold:   { type: Number, default: 10 },      // min buyers for discount
  groupBuyDiscount:    { type: Number, default: 15 },      // percent discount
  currentGroupBuyers:  { type: Number, default: 0 },
  // Ratings
  avgRating:    { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  totalSold:    { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("Product", productSchema);