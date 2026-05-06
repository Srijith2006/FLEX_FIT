export const uploadFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "File is required" });

  // When using CloudinaryStorage, req.file.path is the full Cloudinary HTTPS URL
  // req.file.filename is the public_id
  const fileUrl = req.file.path;

  return res.status(201).json({
    message: "File uploaded",
    fileUrl,                        // full https://res.cloudinary.com/... URL
    publicId: req.file.filename,    // cloudinary public_id for future deletion
  });
};
