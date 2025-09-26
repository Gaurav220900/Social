// __tests__/commentRoutes.test.js
const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const express = require("express");

const commentRoutes = require("../routes/comments");
const Comment = require("../models/Comment");
const Post = require("../models/Posts");
const User = require("../models/User");
const Notification = require("../models/Notification");

// Mock auth middleware
jest.mock("../middleware/auth", () => {
  return (req, res, next) => {
    req.user = { _id: "507f1f77bcf86cd799439011" }; // fixed fake ObjectId
    req.io = { to: jest.fn().mockReturnThis(), emit: jest.fn() }; // fake socket.io
    next();
  };
});

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
  app.use("/comments", commentRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Comment.deleteMany({});
  await Post.deleteMany({});
  await Notification.deleteMany({});
});

describe("Comment Routes", () => {
  it("POST /comments → creates a comment and notification", async () => {
    const user = await User.create({
      username: "commenter",
      email: "c@test.com",
      password: "password",
    });
    const postAuthor = await User.create({
      username: "author",
      email: "a@test.com",
      password: "password",
    });

    const authorId = user._id;
    const postAuthorId = postAuthor._id;

    const post = await Post.create({
      content: "Hello",
      author: postAuthor._id,
    });

    const res = await request(app).post("/comments").send({
      content: "Nice post!",
      author: authorId,
      post: post._id,
    });

    expect(res.status).toBe(201);
    expect(res.body.content).toBe("Nice post!");

    // Check notification was created
    const notifications = await Notification.find();
    expect(notifications.length).toBe(1);
    expect(notifications[0].type).toBe("comment");
    expect(notifications[0].recipient.toString()).toBe(postAuthorId.toString());
  });

  it("GET /comments → returns all comments", async () => {
    const postId = new mongoose.Types.ObjectId();
    await Post.create({
      title: "Post1",
      content: "Body",
      author: new mongoose.Types.ObjectId(),
    });

    await Comment.create({
      content: "Test comment",
      author: new mongoose.Types.ObjectId(),
      post: postId,
    });

    const res = await request(app).get("/comments");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].content).toBe("Test comment");
  });

  it("GET /comments/:id → returns single comment", async () => {
    const post = await Post.create({
      title: "Post2",
      content: "Body",
      author: new mongoose.Types.ObjectId(),
    });
    const comment = await Comment.create({
      content: "Single comment",
      author: new mongoose.Types.ObjectId(),
      post: post._id,
    });

    const res = await request(app).get(`/comments/${comment._id}`);
    expect(res.status).toBe(200);
    expect(res.body.content).toBe("Single comment");
  });

  it("PUT /comments/:id → updates a comment", async () => {
    const post = await Post.create({
      title: "Post3",
      content: "Body",
      author: new mongoose.Types.ObjectId(),
    });
    const comment = await Comment.create({
      content: "Old text",
      author: new mongoose.Types.ObjectId(),
      post: post._id,
    });

    const res = await request(app)
      .put(`/comments/${comment._id}`)
      .send({ content: "Updated text" });

    expect(res.status).toBe(200);
    expect(res.body.content).toBe("Updated text");
  });

  it("DELETE /comments/:id → deletes a comment", async () => {
    const post = await Post.create({
      title: "Post4",
      content: "Body",
      author: new mongoose.Types.ObjectId(),
    });
    const comment = await Comment.create({
      content: "Delete me",
      author: new mongoose.Types.ObjectId(),
      post: post._id,
    });

    const res = await request(app).delete(`/comments/${comment._id}`);
    expect(res.status).toBe(200);

    const deleted = await Comment.findById(comment._id);
    expect(deleted).toBeNull();
  });
});
