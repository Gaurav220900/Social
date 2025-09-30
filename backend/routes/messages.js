const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const authenticateToken = require("../middleware/auth");
const Conversation = require("../models/Conversation");

// GET chat history between 2 users
router.get("/:userId/:receiverId", async (req, res) => {
  try {
    const { userId, receiverId } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: receiverId },
        { sender: receiverId, receiver: userId },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST new message
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;
    console.log(req.body);

    if (!receiverId || !content) {
      return res
        .status(400)
        .json({ error: "receiverId and content are required" });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = new Conversation({
        members: [senderId, receiverId],
      });
      await conversation.save();
    }

    // Save message
    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      conversationId: conversation._id,
      read: false,
      content,
    });

    await newMessage.save();

    req.io.to(receiverId).emit("receiveMessage", newMessage);
    req.io.to(senderId).emit("receiveMessage", newMessage);

    const unreadCount = await Message.countDocuments({
      receiver: receiverId,
      read: false,
    });

    req.io.to(receiverId).emit("unreadCount", { count: unreadCount });

    res.json(newMessage);
  } catch (err) {
    console.error("Error creating message:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/unread-count", authenticateToken, async (req, res) => {
  try {
    const unreadMessages = await Message.find({
      receiver: req.user._id,
      read: false,
    });

    const uniqueSenders = [
      ...new Set(unreadMessages.map((msg) => msg.sender.toString())),
    ];

    res.json({ unreadCount: uniqueSenders.length });
  } catch (err) {
    console.error("Error fetching unread message count:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/mark-seen", authenticateToken, async (req, res) => {
  try {
    const { senderId } = req.body;

    // Mark all messages from this sender to current user as read
    await Message.updateMany(
      { sender: senderId, receiver: req.user._id, read: false },
      { $set: { read: true } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Error marking messages as seen:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
