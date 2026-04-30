import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import connectDB from "./config/database.js";
import { User } from "./models/index.js";
import { saveMessage } from "./controllers/messageController.js";

import authRoutes        from "./routes/auth.js";
import trainerRoutes     from "./routes/trainers.js";
import clientRoutes      from "./routes/clients.js";
import coachingRoutes    from "./routes/coaching.js";
import workoutRoutes     from "./routes/workouts.js";
import paymentRoutes     from "./routes/payments.js";
import uploadRoutes      from "./routes/uploads.js";
import programRoutes     from "./routes/programs.js";
import sessionRoutes     from "./routes/sessions.js";
import messageRoutes     from "./routes/messages.js";
import dailyWorkoutRoutes from "./routes/dailyWorkouts.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

dotenv.config();
connectDB();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true },
});

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (_, res) => res.json({ ok: true, version: 3 }));

app.use("/api/auth",          authRoutes);
app.use("/api/trainers",      trainerRoutes);
app.use("/api/clients",       clientRoutes);
app.use("/api/coaching",      coachingRoutes);
app.use("/api/workouts",      workoutRoutes);
app.use("/api/payments",      paymentRoutes);
app.use("/api/uploads",       uploadRoutes);
app.use("/api/programs",      programRoutes);
app.use("/api/sessions",      sessionRoutes);
app.use("/api/messages",      messageRoutes);
app.use("/api/daily-workouts", dailyWorkoutRoutes);

app.use(notFound);
app.use(errorHandler);

// ── SOCKET.IO ──────────────────────────────────────────
const onlineUsers = new Map();

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token"));
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "flexfit_secret");
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return next(new Error("User not found"));
    socket.user = user;
    next();
  } catch { next(new Error("Auth failed")); }
});

io.on("connection", (socket) => {
  const userId = String(socket.user._id);
  onlineUsers.set(userId, socket.id);
  io.emit("online_users", Array.from(onlineUsers.keys()));
  socket.join(userId);

  socket.on("send_message", async ({ receiverId, text }) => {
    if (!receiverId || !text?.trim()) return;
    try {
      const msg = await saveMessage(socket.user._id, receiverId, text.trim());
      const payload = {
        _id: msg._id,
        sender:   { _id: socket.user._id, name: socket.user.name, role: socket.user.role },
        receiver: { _id: receiverId },
        message:  msg.message,
        createdAt: msg.createdAt,
      };
      io.to(receiverId).emit("receive_message", payload);
      socket.emit("message_sent", payload);
    } catch { socket.emit("error", { message: "Failed to send message" }); }
  });

  socket.on("typing", ({ receiverId, isTyping }) => {
    io.to(receiverId).emit("user_typing", { senderId: userId, isTyping });
  });

  socket.on("disconnect", () => {
    onlineUsers.delete(userId);
    io.emit("online_users", Array.from(onlineUsers.keys()));
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`✅ FlexFit v3 running on http://localhost:${PORT}`));
