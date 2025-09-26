const express = require("express");
const Notification = require("../models/Notification.js");
const requireAuth = require("../middleware/auth.js");

const router = express.Router();

// Get all notifications for logged-in user
router.get("/", requireAuth, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user?._id })
      .populate("sender", "username profilePicture")
      .populate("post", "content images")
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Mark single notification as read
router.put("/:id/read", requireAuth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json(notification);
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ error: "Server error" });
  }
});

//  Mark all notifications as read
router.put("/read-all", requireAuth, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("Error marking all notifications as read:", err);
    res.status(500).json({ error: "Server error" });
  }
});

//  Delete notification
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ message: "Notification deleted" });
  } catch (err) {
    console.error("Error deleting notification:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
