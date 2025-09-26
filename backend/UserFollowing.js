const mongoose = require("mongoose");
const User = require("./models/User");

const MONGO_URI = "mongodb://localhost:27017/social";

const EmptyFollowandFollowing = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const users = await User.find({});

    for (let user of users) {
      user.followers = [];
      user.following = [];
      await user.save();
    }

    console.log("Followers and Following fields initialized for all users.");
  } catch (err) {
    console.error("Error initializing followers and following fields:", err);
  } finally {
    mongoose.connection.close();
  }
};

EmptyFollowandFollowing();
