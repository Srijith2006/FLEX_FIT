import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Determine the format from the filename for Cloudinary
    const extension = file.originalname.split(".").pop().toLowerCase();

    return {
      folder: "flexfit",
      // 1. ADD VIDEO FORMATS HERE
      allowed_formats: ["jpg", "jpeg", "png", "pdf", "webp", "mp4", "mov", "avi"],
      public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
      // 2. USE "auto" OR DETECT VIDEO
      // Cloudinary needs resource_type: "video" for mp4/mov to work
      resource_type: (extension === "mp4" || extension === "mov" || extension === "avi") 
        ? "video" 
        : file.mimetype === "application/pdf" ? "raw" : "image",
    };
  },
});

const upload = multer({ storage });
export default upload;