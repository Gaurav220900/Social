const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User"); // Assuming a User model is defined
const router = express.Router();
const Post = require("../models/Posts");
const authenticateToken = require("../middleware/auth");
const JWT_SECRET = process.env.JWT_SECRET;
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const Notification = require("../models/Notification");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

router.use(passport.initialize());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          // Create a new user
          user = await User.create({
            googleId: profile.id,
            username: profile.displayName,
            email: profile.emails[0].value,
          });
        }
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  (req, res) => {
    // Successful login, create JWT
    const token = jwt.sign({ _id: req.user._id }, JWT_SECRET, {
      expiresIn: "1d",
    });

    // Redirect back to frontend with token as query param
    res.redirect(`${process.env.FRONTEND_URL}/oauth/callback?token=${token}`);
  }
);

//searching for users
router.get("/search", async (req, res) => {
  const { q } = req.query;
  const searchTerm = q.toLowerCase();

  console.log("Searching User with query:", q);

  try {
    const users = await User.find({
      username: { $regex: searchTerm, $options: "i" },
    }).select("_id username profilePicture");

    res.json(users);
  } catch (err) {
    console.error("Error searching User:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Register (Create User)
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    // create JWT token
    const token = jwt.sign(
      { _id: newUser._id, email: newUser.email },
      JWT_SECRET,
      {
        expiresIn: "3h",
      }
    );

    res.status(201).json({
      message: "User created",
      token,
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login (Get JWT)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email" });
    }

    // compare hashed password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // create JWT token
    const token = jwt.sign({ _id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: "3h",
    });

    res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        following: user.following,
        followers: user.followers,
        blockedUsers: user.blockedUsers,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
//user profile
router.get("/:id/profile", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await User.findById(id).select(
      "username email profilePicture bio blockedUsers followers following"
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    const posts = await Post.find({ author: req.params.id })
      .populate("author", "username profilePicture")
      .sort({ createdAt: -1 });

    const formattedPosts = posts.map((p) => ({
      ...p.toObject(),
      images: p.images.map(
        (img) => `${req.protocol}://${req.get("host")}/${img}`
      ),
    }));

    res.json({
      user,
      posts: formattedPosts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all User (Read)
router.get("/", (req, res) => {
  res.json(User.map((u) => ({ id: u._id, username: u.username })));
});

router.get("/me", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate(
      "username",
      "username profilePicture bio"
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error("Error fetching current user:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get user by ID (Read)
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  const user = await User.findById(id).populate(
    "username",
    "username profilePicture bio"
  );

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json(user);
});

// Get current logged-in user

// Update user
router.put("/:id", upload.single("profilePicture"), async (req, res) => {
  const { username, email, bio } = req.body;
  const profilePicUrl = req.file
    ? `http://127.0.0.1:5000/uploads/${req.file.filename}`
    : undefined;

  // Update user in DB
  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    {
      username,
      email,
      bio,
      ...(profilePicUrl && { profilePicture: profilePicUrl }),
    },
    { new: true }
  );

  res.json(updatedUser);
});

// Delete user
router.delete("/:id", (req, res) => {
  const index = User.findIndex((u) => u.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ message: "User not found" });

  User.splice(index, 1);
  res.json({ message: "User deleted" });
});

// GET /User/:id/profile

router.put("/:id/follow", authenticateToken, async (req, res) => {
  try {
    if (req.user?._id.toString() === req.params.id.toString()) {
      return res.status(400).json({ error: "You cannot follow yourself" });
    }

    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    console.log(targetUser, currentUser);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log("Target User Followers:", targetUser.followers);
    console.log("Current User Following:", currentUser.following);

    if (!targetUser.followers.includes(req.user._id)) {
      targetUser.followers.push(req.user._id);
      currentUser.following.push(req.params.id);

      await targetUser.save();
      await currentUser.save();

      const notification = new Notification({
        recipient: targetUser._id,
        sender: currentUser._id,
        type: "follow",
      });
      await notification.save();

      const populatedNotification = await notification.populate([
        { path: "sender", select: "username profilePicture" },
      ]);

      req.io
        .to(targetUser._id.toString())
        .emit("new-notification", populatedNotification);

      return res.json(currentUser);
    } else {
      return res.status(400).json({ error: "Already following this user" });
    }
  } catch (err) {
    console.error("Follow error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id/unfollow", authenticateToken, async (req, res) => {
  try {
    if (req.user?._id.toString() === req.params.id.toString()) {
      return res.status(400).json({ error: "You cannot unfollow yourself" });
    }

    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (targetUser.followers.includes(req.user._id)) {
      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== req.user._id.toString()
      );
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== req.params.id.toString()
      );

      await targetUser.save();
      await currentUser.save();

      return res.json(currentUser);
    } else {
      return res.status(400).json({ error: "You are not following this user" });
    }
  } catch (err) {
    console.error("Unfollow error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id/block", authenticateToken, async (req, res) => {
  try {
    if (req.user._id === req.params.id) {
      return res.status(400).json({ error: "You cannot block yourself" });
    }

    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!currentUser.blockedUsers.includes(req.params.id)) {
      currentUser.blockedUsers.push(req.params.id);
      await currentUser.save();
    }

    return res.json({ message: "User blocked successfully" });
  } catch (err) {
    console.error("Block error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id/unblock", authenticateToken, async (req, res) => {
  try {
    if (req.user._id === req.params.id) {
      return res.status(400).json({ error: "You cannot block yourself" });
    }

    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (currentUser.blockedUsers.includes(req.params.id)) {
      currentUser.blockedUsers = currentUser.blockedUsers.filter(
        (id) => id.toString() !== req.params.id.toString()
      );
      await currentUser.save();
    }

    return res.json({ message: "User blocked successfully" });
  } catch (err) {
    console.error("Block error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
