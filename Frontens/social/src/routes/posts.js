// src/routes/posts.js
import api from "../config/api";

// Get all posts
export const getAllPosts = async () => {
  try {
    const res = await api.get("/posts");

    return res.data;
  } catch (err) {
    console.error("Error fetching posts:", err);
  }
};

export const getPostById = async (id) => {
  try {
    const res = await api.get(`/posts/${id}`);

    return res.data;
  } catch (err) {
    console.error("Error fetching post:", err);
  }
};
