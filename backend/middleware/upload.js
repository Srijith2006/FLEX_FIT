import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use Cloudinary as multer storage — files go straight to cloud, no local disk
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder:         "flexfit",
    allowed_formats: ["jpg", "jpeg", "png", "pdf", "webp"],
    public_id:      `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    // PDFs stored as raw, images auto-optimized
    resource_type:  file.mimetype === "application/pdf" ? "raw" : "image",
  }),
});

const upload = multer({ storage });
export default upload;