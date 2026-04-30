export const uploadFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "File is required" });

  return res.status(201).json({
    message: "File uploaded",
    fileUrl: `/uploads/${req.file.filename}`
  });
};
