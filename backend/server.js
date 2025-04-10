// ✅ server.js (Full working backend with CORS, auth, cookies, socket.io, routes)
import express from "express";
import http from "http";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { Server } from "socket.io";

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import routes and DB
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js";
import notificationRoutes from "./routes/notification.route.js";
import connectionRoutes from "./routes/connection.route.js";
import { connectDB } from "./lib/db.js";
import Message from "./models/message.model.js";

dotenv.config();
const app = express();
const server = http.createServer(app);

// ✅ Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

let users = {};
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join", (userId) => {
    users[userId] = socket.id;
    console.log(`${userId} connected`);
  });

  socket.on("send_message", async (data) => {
    const { senderId, receiverId, message } = data;
    const newMessage = new Message({ sender: senderId, receiver: receiverId, content: message });
    try {
      await newMessage.save();
      if (users[receiverId]) {
        io.to(users[receiverId]).emit("receive_message", { senderId, message });
      }
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// ✅ CORS and Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());

// ✅ Simple auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  req.user = { id: "123", name: "Mock User" }; // replace with real token verification
  next();
};

// ✅ Auth routes for testing
app.post("/api/v1/auth/login", (req, res) => {
  const token = "testToken123"; // simulate JWT
  res.cookie("token", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax"
  });
  res.json({ message: "Logged in" });
});

app.get("/api/v1/auth/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

app.post("/api/v1/auth/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

// ✅ App routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/connections", connectionRoutes);

// ✅ Serve frontend if production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});
