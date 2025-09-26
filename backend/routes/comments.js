const express = require("express");
const Comment = require("../models/Comment");
const router = express.Router();
const Post = require("../models/Posts");
const authenticateToken = require("../middleware/auth");
const Notification = require("../models/Notification");

// CREATE a new comment
router.post("/", authenticateToken, async (req, res) => {
  const { content, author, post } = req.body;

  try {
    const comment = new Comment({ content, author, post });
    await comment.save();
    const userId = req.user._id;
    const commentedPost = await Post.findById(post);
    await Post.findByIdAndUpdate(post, {
      $push: { comments: comment._id },
    });

    if (commentedPost.author.toString() !== userId.toString()) {
      const notification = new Notification({
        recipient: commentedPost.author, // not post.author._id
        sender: userId,
        type: "comment",
        post: commentedPost._id,
      });
      await notification.save();

      req.io
        .to(commentedPost.author.toString())
        .emit("new-notification", notification);
    }
    const populatedComment = await comment.populate(
      "author",
      "username profilePicture"
    );

    res.status(201).json(populatedComment);
  } catch (err) {
    console.error("Error creating comment:", err);
    res.status(500).json({ error: "Failed to create comment." });
  }
});

// READ all comments
router.get("/", async (req, res) => {
  try {
    const comments = await Comment.find();
    res.json(comments);
  } catch (err) {
    console.error("Error fetching all comments:", err.message, err.stack);
    res.status(500).json({ error: "Failed to fetch comments." });
  }
});

// READ a single comment by ID
router.get("/:id", async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id).populate(
      "author",
      "username email"
    );
    if (!comment) {
      return res.status(404).json({ error: "Comment not found." });
    }
    res.json(comment);
  } catch (err) {
    console.error("Error fetching comments by id:", err.message, err.stack);
    res.status(500).json({ error: "Failed to fetch comment." });
  }
});

// UPDATE a comment by ID
router.put("/:id", async (req, res) => {
  const { content, author } = req.body;
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found." });
    }
    if (content) comment.content = content;
    if (author) comment.author = author;
    await comment.save();
    res.json(comment);
  } catch (err) {
    console.error("Error updating comment by id:", err.message, err.stack);
    res.status(500).json({ error: "Failed to update comment." });
  }
});

// DELETE a comment by ID
router.delete("/:id", async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found." });
    }
    res.json(comment);
  } catch (err) {
    console.error("Error deleting comment by id:", err.message, err.stack);
    res.status(500).json({ error: "Failed to delete comment." });
  }
});

module.exports = router;
