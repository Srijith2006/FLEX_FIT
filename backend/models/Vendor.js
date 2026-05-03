import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema({
  user:               { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  businessName:       { type: String, required: true },
  businessType:       { type: String, enum: ["supplements","meal_kitchen","equipment","apparel","other"], default: "supplements" },
  description:        { type: String, default: "" },
  phone:              { type: String, default: "" },
  address:            { type: String, default: "" },
  city:               { type: String, default: "" },
  gstNumber:          { type: String, default: "" },
  logoUrl:            { type: String, default: "" },
  certificateUrl:     { type: String, default: "" },   // COA / FSSAI
  verificationStatus: { type: String, enum: ["pending","approved","rejected"], default: "pending" },
  rejectionReason:    { type: String, default: "" },
  totalOrders:        { type: Number, default: 0 },
  totalRevenue:       { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("Vendor", vendorSchema);