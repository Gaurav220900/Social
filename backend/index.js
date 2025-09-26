const express = require("express");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const path = require("path");
const cors = require("cors");
const Message = require("./models/Message");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "https://my-social-frontend.vercel.app",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
    methods: ["GET", "POST"],
  },
});

// --- Middleware ---
app.use(
  cors({
    origin: [
      "https://my-social-frontend.vercel.app",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
    credentials: false,
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use((req, res, next) => {
  req.io = io;
  next();
});

// --- Routes ---
app.use("/api/posts", require("./routes/posts"));
app.use("/api/auth", require("./routes/users"));
app.use("/api/comments", require("./routes/comments"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/conversations", require("./routes/conversations"));
app.use("/api/notifications", require("./routes/notifications"));

app.get("/", (req, res) => {
  res.send("Hello, world!");
});

// --- Socket.IO ---
const onlineUsers = new Map(); // userId -> socket.id

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  socket.on("joinRoom", (userId) => {
    socket.join(userId); // join their private room
    onlineUsers.set(userId, socket.id); // store mapping
    console.log(`📥 User ${userId} joined. Online users:`, [
      ...onlineUsers.keys(),
    ]);
  });

  socket.on("sendMessage", async (data) => {
    console.log("✉️ Message received:", data);

    // send to receiver if online
    io.to(data.receiver).emit("receiveMessage", data);

    // ✅ also send to sender’s room (for confirmation/update UI)
    io.to(data.sender).emit("receiveMessage", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);

    // remove user from online list
    for (const [userId, sId] of onlineUsers.entries()) {
      if (sId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    console.log("👥 Remaining online users:", [...onlineUsers.keys()]);
  });
});

const sendNotification = (userId, notification) => {
  const socketId = onlineUsers.get(userId);
  if (socketId) {
    io.to(socketId).emit("notification", notification);
  }
};

// --- Start Server ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
