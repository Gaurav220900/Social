const express = require("express");
const router = express.Router();
const Conversation = require("../models/Conversation");
const mongoose = require("mongoose");
const Message = require("../models/Message");
// routes/conversations.js
router.post("/", async (req, res) => {
  const { senderId, receiverId } = req.body;
  try {
    let convo = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (!convo) {
      convo = new Conversation({ members: [senderId, receiverId] });
      await convo.save();
    }

    res.json(convo);
  } catch (err) {
    console.error("Error creating/fetching conversation:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get user’s conversations
router.get("/:userId", async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(String(req.params.userId));

    const conversations = await Conversation.find({
      members: { $in: [userId] },
    })
      .populate("members", "username profilePicture")
      .sort({ updatedAt: -1 });

    // Attach last message
    const convoData = await Promise.all(
      conversations.map(async (c) => {
        const lastMessage = await Message.findOne({
          conversationId: c._id,
        })
          .sort({ createdAt: -1 })
          .select("content sender createdAt");

        return { ...c.toObject(), lastMessage };
      })
    );

    convoData.sort((a, b) => {
      const timeA = a.lastMessage
        ? new Date(a.lastMessage.createdAt).getTime()
        : 0;
      const timeB = b.lastMessage
        ? new Date(b.lastMessage.createdAt).getTime()
        : 0;
      return timeB - timeA; // newest first
    });

    res.json(convoData);
  } catch (err) {
    console.error("Error fetching conversations:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
