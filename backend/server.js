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
import { saveGroupMessage } from "./controllers/groupChatController.js";
import { sendPushToUser, savePushSubscription, getVapidPublicKey } from "./services/pushNotification.js";

import authRoutes         from "./routes/auth.js";
import trainerRoutes      from "./routes/trainers.js";
import clientRoutes       from "./routes/clients.js";
import coachingRoutes     from "./routes/coaching.js";
import workoutRoutes      from "./routes/workouts.js";
import paymentRoutes      from "./routes/payments.js";
import uploadRoutes       from "./routes/uploads.js";
import programRoutes      from "./routes/programs.js";
import sessionRoutes      from "./routes/sessions.js";
import messageRoutes      from "./routes/messages.js";
import dailyWorkoutRoutes from "./routes/dailyWorkouts.js";
import marketplaceRoutes  from "./routes/marketplace.js";
import orderRoutes        from "./routes/orders.js";
import vendorRoutes       from "./routes/vendors.js";
import groupChatRoutes    from "./routes/groupChat.js";
import proofOfWorkRoutes  from "./routes/proofOfWork.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

dotenv.config();
connectDB();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);

// --- RECTIFIED CORS CONFIGURATION ---
// This ensures both local Vite and your production Vercel site can connect.
const allowedOrigins = [
  process.env.CLIENT_URL, // e.g., https://flex-fit-plum.vercel.app
  "http://localhost:5173", 
  "http://localhost:3000"
].filter(Boolean);

const io = new Server(httpServer, {
  cors: { 
    origin: allowedOrigins, 
    credentials: true 
  },
});

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

app.use(cors({ 
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }, 
  credentials: true 
}));
// ------------------------------------

app.use(morgan("dev"));
// Raw body for Razorpay webhook
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (_, res) => res.json({ ok: true, version: 4 }));
app.get("/api/vapid-public-key", (_, res) => res.json({ key: getVapidPublicKey() }));

// Push subscription save
app.post("/api/push/subscribe", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "flexfit_secret");
    await savePushSubscription(decoded.id, req.body);
    res.json({ ok: true });
  } catch { res.status(400).json({ ok: false }); }
});

app.use("/api/auth",           authRoutes);
app.use("/api/trainers",       trainerRoutes);
app.use("/api/clients",        clientRoutes);
app.use("/api/coaching",       coachingRoutes);
app.use("/api/workouts",       workoutRoutes);
app.use("/api/payments",       paymentRoutes);
app.use("/api/uploads",        uploadRoutes);
app.use("/api/programs",       programRoutes);
app.use("/api/sessions",       sessionRoutes);
app.use("/api/messages",       messageRoutes);
app.use("/api/daily-workouts", dailyWorkoutRoutes);
app.use("/api/marketplace",    marketplaceRoutes);
app.use("/api/orders",         orderRoutes);
app.use("/api/vendors",        vendorRoutes);
app.use("/api/group-chat",     groupChatRoutes);
app.use("/api/proof",          proofOfWorkRoutes);
app.use(notFound);
app.use(errorHandler);

// ── SOCKET.IO ──────────────────────────────────────────────────────────────────
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

  // ── Direct message ──
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
      // Push notification to receiver
      await sendPushToUser(receiverId, `New message from ${socket.user.name}`, text.trim().slice(0, 80), { type: "message" });
    } catch { socket.emit("error", { message: "Failed to send message" }); }
  });

  // ── Group chat ──
  socket.on("join_group", (programId) => { socket.join(`group_${programId}`); });
  socket.on("leave_group", (programId) => { socket.leave(`group_${programId}`); });

  socket.on("send_group_message", async ({ programId, text, type }) => {
    if (!programId || !text?.trim()) return;
    try {
      const msg = await saveGroupMessage(programId, socket.user._id, text.trim(), type || "text");
      const payload = {
        _id:      msg._id,
        sender:   { _id: socket.user._id, name: socket.user.name, role: socket.user.role },
        message:  msg.message,
        type:     msg.type,
        createdAt: msg.createdAt,
      };
      // Broadcast to everyone in the group room
      io.to(`group_${programId}`).emit("group_message", payload);
    } catch { socket.emit("error", { message: "Failed to send group message" }); }
  });

  // ── Typing ──
  socket.on("typing", ({ receiverId, isTyping }) => {
    io.to(receiverId).emit("user_typing", { senderId: userId, isTyping });
  });

  socket.on("group_typing", ({ programId, isTyping }) => {
    socket.to(`group_${programId}`).emit("group_typing", { senderId: userId, name: socket.user.name, isTyping });
  });

  socket.on("disconnect", () => {
    onlineUsers.delete(userId);
    io.emit("online_users", Array.from(onlineUsers.keys()));
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`✅ FlexFit v4 running on http://localhost:${PORT}`));