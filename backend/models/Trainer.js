import mongoose from "mongoose";

const trainerSchema = new mongoose.Schema({
  user:               { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  // Profile
  bio:                { type: String, default: "" },
  specialization:     [{ type: String }],
  yearsOfExperience:  { type: Number, default: 0 },
  hourlyRate:         { type: Number, default: 0 },
  monthlyRate:        { type: Number, default: 0 },
  // Location & contact
  city:               { type: String, default: "" },
  country:            { type: String, default: "" },
  phone:              { type: String, default: "" },
  instagram:          { type: String, default: "" },
  website:            { type: String, default: "" },
  // Certifications
  certifications:     [{ type: String }],   // e.g. ["ACE CPT", "NASM"]
  languages:          [{ type: String }],   // e.g. ["English", "Hindi"]
  // Fitness focus
  fitnessNiche:       { type: String, default: "" },  // e.g. "Women's Fat Loss"
  trainingStyle:      { type: String, default: "" },  // e.g. "Online + In-Person"
  // Verification
  verificationStatus: { type: String, enum: ["pending","approved","rejected"], default: "pending" },
  certificateUrl:     { type: String, default: "" },
  rejectionReason:    { type: String, default: "" },
  // Ratings
  avgRating:          { type: Number, default: 0 },
  totalRatings:       { type: Number, default: 0 },
  score:              { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("Trainer", trainerSchema);