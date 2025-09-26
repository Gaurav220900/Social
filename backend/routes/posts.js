const express = require("express");
const Post = require("../models/Posts");
const router = express.Router();
const multer = require("multer");
const authenticateToken = require("../middleware/auth");
const Notification = require("../models/Notification");
const mongoose = require("mongoose");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

//create a post
router.post("/", upload.array("images", 5), async (req, res) => {
  try {
    const { content, author } = req.body;

    console.log(req.files);

    // build image paths from uploaded files
    const imagePaths = req.files.map((file) => `uploads/${file.filename}`);

    const newPost = new Post({
      author,
      content,
      images: imagePaths,
    });

    await newPost.save();
    const populatedPost = await newPost.populate(
      "author",
      "username profilePicture"
    );

    req.io.emit("new-post", populatedPost);

    res.status(201).json({
      ...populatedPost.toObject(),
      images: imagePaths, // ensure images are sent back
    });
  } catch (err) {
    console.log(err);

    res.status(400).json({ error: "Failed to create post" });
  }
});

// GET all posts with author populated
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("author", "username email profilePicture")
      .populate({
        path: "comments",
        populate: { path: "author", select: "username profilePicture" },
      })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments();

    const updatedPosts = posts.map((post) => ({
      ...post.toObject(),
      images: post.images.map(
        (img) => `${req.protocol}://${req.get("host")}/${img}`
      ),
    }));

    res.json({
      posts: updatedPosts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Error fetching post by id:", err.message, err.stack);
    res.status(500).json({ error: "Server error" });
  }
});

// Like/Unlike a post
router.put("/:id/like", authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const userId = req.user._id;

    if (post.likes.includes(userId)) {
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      post.likes.push(userId);
    }

    await post.save();

    if (post.author.toString() !== userId.toString()) {
      const notification = new Notification({
        recipient: post.author, // not post.author._id
        sender: userId,
        type: "like",
        post: post._id,
      });
      await notification.save();

      const populatedNotification = await notification.populate([
        { path: "sender", select: "username profilePicture" },
        { path: "post", select: "content images" },
      ]);

      req.io
        .to(post.author.toString())
        .emit("new-notification", populatedNotification);
    }

    res.json({
      postId: post._id,
      liked: true,
      likes: post.likes,
    });
  } catch (err) {
    console.error("Error liking post:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET a single post by ID with author populated
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "username email")
      .populate({
        path: "comments",
        populate: { path: "author", select: "username profilePicture" },
      });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const updatedPost = {
      ...post.toObject(),
      comments: post.comments || [],
      images: post.images.map(
        (img) => `${req.protocol}://${req.get("host")}/${img}`
      ),
    };

    res.json(updatedPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET posts by a specific user
router.get("/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ author: userId })
      .sort({ createdAt: -1 })
      .populate("author", "username email")
      .populate({
        path: "comments",
        populate: { path: "author", select: "username profilePicture" },
      })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({ author: userId });

    const updatedPosts = posts.map((post) => ({
      ...post.toObject(),
      images: post.images.map(
        (img) => `${req.protocol}://${req.get("host")}/${img}`
      ),
    }));

    res.json({
      posts: updatedPosts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Error fetching posts for user:", err.message, err.stack);
    res.status(500).json({ error: "Server error" });
  }
});

// UPDATE a post by ID
router.put("/:id", async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    })
      .populate("author", "username profilePicture")
      .populate({
        path: "comments",
        populate: { path: "author", select: "username profilePicture" },
      });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const updatedPost = {
      ...post.toObject(),
      comments: post.comments || [],
      images: post.images.map(
        (img) => `${req.protocol}://${req.get("host")}/${img}`
      ),
    };

    res.json(updatedPost);
  } catch (err) {
    console.error("Error updating post by id:", err.message, err.stack);
    res.status(400).json({ error: "Failed to update post" });
  }
});

// DELETE a post by ID
router.delete("/:id", async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json({ message: "Post deleted" });
  } catch (err) {
    console.error("Error deleting post by id:", err.message, err.stack);
    res.status(400).json({ error: "Failed to delete post" });
  }
});

module.exports = router;
