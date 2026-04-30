import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) return res.status(401).json({ message: "Not authorized, token missing" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "flexfit_secret");
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: "User not found" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Token invalid" });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden for this role" });
  }
  next();
};
