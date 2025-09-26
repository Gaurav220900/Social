// src/redux/slices/postsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../config/api";

// Async thunk to fetch posts
export const fetchPosts = createAsyncThunk(
  "posts/fetchPosts",
  async ({ page = 1, limit = 5 }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/posts?page=${page}&limit=${limit}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error fetching posts");
    }
  }
);

export const fetchPostsByUser = createAsyncThunk(
  "posts/fetchByUser",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/posts/user/${userId}`);
      return { userId, posts: res.data }; // assuming backend returns an array of posts
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error fetching user posts");
    }
  }
);

export const toggleLike = createAsyncThunk(
  "posts/toggleLike",
  async (postId, { rejectWithValue }) => {
    try {
      const res = await api.put(`/posts/${postId}/like`);
      return { postId, ...res.data }; // backend should return { liked: true/false, likes: [..] }
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error toggling like");
    }
  }
);

export const deletePost = createAsyncThunk(
  "posts/deletePost",
  async (postId, { rejectWithValue }) => {
    try {
      await api.delete(`/posts/${postId}`);
      return postId;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error deleting post");
    }
  }
);

export const updatePost = createAsyncThunk(
  "posts/updatePost",
  async ({ postId, content }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/posts/${postId}`, { content });
      return res.data; // return the actual post object
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error updating post");
    }
  }
);

export const fetchPostById = createAsyncThunk(
  "posts/fetchById",
  async (postId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/posts/${postId}`);
      return res.data; // unwrap actual post object
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error fetching post");
    }
  }
);

const postsSlice = createSlice({
  name: "posts",
  initialState: {
    items: [],
    page: 1,
    hasMore: true,
    loading: false,
    status: "idle",
    error: null,
  },
  reducers: {
    resetPosts: (state) => {
      state.items = [];
      state.page = 1;
      state.hasMore = true;
    },
    addPost: (state, action) => {
      state.items = [action.payload, ...state.items];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        const { posts, currentPage, totalPages } = action.payload;
        state.items = [...state.items, ...posts];
        state.page = currentPage + 1;
        state.hasMore = currentPage < totalPages;
        state.status = "succeeded";
        state.loading = false;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.status = "failed";
        state.error = action.payload;
      })
      // Add the missing fetchPostsByUser cases
      .addCase(fetchPostsByUser.pending, (state) => {
        state.loading = true;
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPostsByUser.fulfilled, (state, action) => {
        const { posts } = action.payload;

        if (posts && Array.isArray(posts)) {
          // Add posts that don't already exist in the store
          posts.forEach((newPost) => {
            const exists = state.items.find(
              (existingPost) => existingPost._id === newPost._id
            );
            if (!exists) {
              state.items.push(newPost);
            }
          });
        }

        state.status = "succeeded";
        state.loading = false;
      })
      .addCase(fetchPostsByUser.rejected, (state, action) => {
        state.loading = false;
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        const { postId, likes } = action.payload;
        state.items = state.items.map((post) =>
          post._id === postId
            ? { ...post, likes } // assuming backend sends updated likes array
            : post
        );
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.items = state.items.filter((post) => post._id !== action.payload);
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        state.items = state.items.map((post) =>
          post._id === action.payload._id ? action.payload : post
        );
      })
      .addCase(fetchPostById.fulfilled, (state, action) => {
        const post = action.payload;
        if (!post?._id) return;
        const exists = state.items.find((p) => p._id === post._id);
        if (exists) {
          state.items = state.items.map((p) => (p._id === post._id ? post : p));
        } else {
          state.items.push(post);
        }
      });
  },
});

export const { resetPosts, addPost } = postsSlice.actions;
export default postsSlice.reducer;
