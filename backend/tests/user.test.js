const request = require("supertest");
const mongoose = require("mongoose");
const express = require("express");
const { MongoMemoryServer } = require("mongodb-memory-server");

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Post = require("../models/Posts");
const Notification = require("../models/Notification");
process.env.JWT_SECRET = process.env.JWT_SECRET || "testsecret";
const JWT_SECRET = process.env.JWT_SECRET || "testsecret";

jest.mock("passport-google-oauth20", () => {
  return {
    Strategy: jest.fn(), // mock the constructor
  };
});

// Mock auth middleware to inject user and io
jest.mock("../middleware/auth", () => {
  const jwt = require("jsonwebtoken");
  const JWT_SECRET = process.env.JWT_SECRET || "testsecret";

  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = { _id: decoded._id };
    } else {
      req.user = { _id: "507f1f77bcf86cd799439011" };
    }
    req.io = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
    next();
  };
});

jest.mock("passport", () => {
  const originalPassport = jest.requireActual("passport");
  return {
    ...originalPassport,
    use: jest.fn(), // mock passport.use
    initialize: jest.fn(() => (req, res, next) => next()),
    authenticate: jest.fn(() => (req, res, next) => next()),
  };
});

const user = require("../routes/users");

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  app = express();
  app.use(express.json());
  app.use("/users", user);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany();
  await Post.deleteMany();
  await Notification.deleteMany();
});

describe("User Routes", () => {
  it("POST /register → registers a new user", async () => {
    const hashedPassword = await require("bcrypt").hash("password123", 10);

    const res = await request(app).post("/users/register").send({
      username: "testuser",
      email: "test@example.com",
      password: hashedPassword,
    });

    expect(res.status).toBe(201);
    expect(res.body.user.username).toBe("testuser");
    expect(res.body.token).toBeDefined();

    const userInDb = await User.findOne({ email: "test@example.com" });
    expect(userInDb).not.toBeNull();
  });

  it("POST /login → logs in a user", async () => {
    const hashedPassword = await require("bcrypt").hash("password123", 10);

    const user = await User.create({
      username: "loginuser",
      email: "login@example.com",
      password: hashedPassword,
    });

    const res = await request(app).post("/users/login").send({
      email: "login@example.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("login@example.com");
    expect(res.body.token).toBeDefined();
  });

  it("GET /users/:id/profile → gets user profile with posts", async () => {
    const user = await User.create({
      username: "profileuser",
      email: "p@p.com",
      password: "password",
    });
    const post = await Post.create({ content: "Hello", author: user._id });

    const res = await request(app).get(`/users/${user._id}/profile`);
    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe("profileuser");
    expect(res.body.posts.length).toBe(1);
  });

  it("PUT /users/:id/follow → follow another user and create notification", async () => {
    const currentUser = await User.create({
      username: "current",
      email: "c@c.com",
      password: "password",
    });
    const targetUser = await User.create({
      username: "target",
      email: "t@t.com",
      password: "password",
    });

    // mock req.user
    const token = jwt.sign({ _id: currentUser._id }, JWT_SECRET);
    const res = await request(app)
      .put(`/users/${targetUser._id}/follow`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const updatedCurrent = await User.findById(currentUser._id);
    expect(updatedCurrent.following.map(String)).toContain(
      targetUser._id.toString()
    );

    const notifications = await Notification.find();
    expect(notifications.length).toBe(1);
    expect(notifications[0].type).toBe("follow");
  });

  it("PUT /users/:id/unfollow → unfollow a user", async () => {
    const currentUser = await User.create({
      username: "current",
      email: "c@c.com",
      password: "password",
      following: [],
    });
    const targetUser = await User.create({
      username: "target",
      email: "t@t.com",
      password: "password",
      followers: [currentUser._id],
    });
    currentUser.following.push(targetUser._id);
    await currentUser.save();

    const token = jwt.sign({ _id: currentUser._id }, JWT_SECRET);
    const res = await request(app)
      .put(`/users/${targetUser._id}/unfollow`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const updatedCurrent = await User.findById(currentUser._id);
    expect(updatedCurrent.following.map(String)).not.toContain(
      targetUser._id.toString()
    );
  });

  it("PUT /users/:id/block → block a user", async () => {
    const currentUser = await User.create({
      username: "current",
      email: "c@c.com",
      password: "password",
      blockedUsers: [],
    });
    const targetUser = await User.create({
      username: "target",
      email: "t@t.com",
      password: "password",
    });

    const token = jwt.sign({ _id: currentUser._id }, JWT_SECRET);
    const res = await request(app)
      .put(`/users/${targetUser._id}/block`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const updatedCurrent = await User.findById(currentUser._id);
    expect(updatedCurrent.blockedUsers.map(String)).toContain(
      targetUser._id.toString()
    );
  });

  it("PUT /users/:id/unblock → unblock a user", async () => {
    const currentUser = await User.create({
      username: "current",
      email: "c@c.com",
      password: "password",
      blockedUsers: [],
    });
    const targetUser = await User.create({
      username: "target",
      email: "t@t.com",
      password: "password",
    });
    currentUser.blockedUsers.push(targetUser._id);
    await currentUser.save();

    const token = jwt.sign({ _id: currentUser._id }, JWT_SECRET);
    const res = await request(app)
      .put(`/users/${targetUser._id}/unblock`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const updatedCurrent = await User.findById(currentUser._id);
    expect(updatedCurrent.blockedUsers.map(String)).not.toContain(
      targetUser._id.toString()
    );
  });
});
