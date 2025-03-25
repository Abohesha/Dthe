import express from "express";
import http from "http";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { Server } from "socket.io"; // Use 'Server' import for socket.io

// Importing Routes
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js";
import notificationRoutes from "./routes/notification.route.js";
import connectionRoutes from "./routes/connection.route.js";

// Importing the Database Connection Function
import { connectDB } from "./lib/db.js";

// Importing the Message Model to save messages to DB
import Message from "./models/message.model.js";

// Initialize dotenv for environment variables
dotenv.config();

// Create an instance of the Express app
const app = express();

// Set up the HTTP server for WebSockets
const server = http.createServer(app);

// Initialize Socket.io with the HTTP server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Frontend URL
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// WebSocket Connection Logic (Real-Time Chatting)
let users = {}; // A simple object to track connected users

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Listen for when a user joins the chat (after logging in)
  socket.on("join", (userId) => {
    users[userId] = socket.id;
    console.log(`${userId} connected`);
  });

  // Listen for sending messages from a user
  socket.on("send_message", async (data) => {
    const { senderId, receiverId, message } = data;

    // Save the message to the database
    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      content: message,
    });

    try {
      await newMessage.save();
      console.log("Message saved:", newMessage);

      // Broadcast the message to the receiver
      if (users[receiverId]) {
        io.to(users[receiverId]).emit("receive_message", { senderId, message });
      }
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  // Listen for when a user disconnects
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    // Optionally clean up the user from the `users` object
  });
});

// Set up CORS for development environment
if (process.env.NODE_ENV !== "production") {
  app.use(
    cors({
      origin: "http://localhost:5173", // Frontend URL
      credentials: true,
    })
  );
}

// Middleware setup
app.use(express.json({ limit: "5mb" })); // Parse JSON request bodies
app.use(cookieParser()); // Parse cookies

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/connections", connectionRoutes);

// Production Setup for Serving Static Files (React App)
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));
  
  // Catch-all route to serve the single page app in production
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB(); // Connect to MongoDB database
});
