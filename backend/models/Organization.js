import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  city:     { type: String, default: "" },
  address:  { type: String, default: "" },
  type:     { type: String, enum: ["gym","office","community","university","other"], default: "gym" },
  code:     { type: String, unique: true, sparse: true },  // join code
  members:  [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export default mongoose.model("Organization", organizationSchema);