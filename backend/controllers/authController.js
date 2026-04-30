import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, Trainer, Client } from "../models/index.js";

const tokenFor = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || "flexfit_secret", { expiresIn: "7d" });

const userPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const safeRole = ["client", "trainer", "admin"].includes(role) ? role : "client";
    const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password: hashed, role: safeRole });

    if (safeRole === "trainer") await Trainer.create({ user: user._id });
    if (safeRole === "client") await Client.create({ user: user._id });

    return res.status(201).json({
      token: tokenFor(user._id),
      user: userPayload(user),
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid email or password" });

    return res.json({
      token: tokenFor(user._id),
      user: userPayload(user),
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res) => {
  res.json({ user: userPayload(req.user) });
};