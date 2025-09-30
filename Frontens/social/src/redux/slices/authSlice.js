import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../config/api";
const storedUser = JSON.parse(localStorage.getItem("user"));

// Async thunk to fetch current user from backend
export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/auth/me");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error fetching user");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: storedUser || null,
    loading: false,
    error: null,
  },
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload;
      localStorage.setItem("user", JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.user = null;
      localStorage.removeItem("user");
    },
    loginFailure: (state, action) => {
      state.user = null;
      state.token = null;
      state.error = action.payload;
    },
    followUser: (state, action) => {
      const id = action.payload.toString();
      if (!state.user) return;

      if (!Array.isArray(state.user.following)) {
        state.user.following = [];
      }

      if (!state.user.following.includes(id)) {
        state.user.following = [...state.user.following, id];
      }
    },

    unfollowUser: (state, action) => {
      const id = action.payload.toString();
      if (!state.user) return;

      if (!Array.isArray(state.user.following)) {
        state.user.following = [];
      }

      state.user.following = state.user.following.filter(
        (i) => i.toString() !== id
      );
    },
    blockUser: (state, action) => {
      const id = action.payload.toString();
      if (!state.user) return;

      if (!Array.isArray(state.user.blockedUsers)) {
        state.user.blockedUsers = [];
      }

      if (!state.user.blockedUsers.includes(id)) {
        state.user.blockedUsers = [...state.user.blockedUsers, id];
      }
    },
    unblockUser: (state, action) => {
      const id = action.payload.toString();

      if (!state.user) return;
      if (!Array.isArray(state.user.blockedUsers)) {
        state.user.blockedUsers = [];
      }
      state.user.blockedUsers = state.user.blockedUsers.filter(
        (uid) => uid !== id
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        localStorage.setItem("user", JSON.stringify(action.payload));
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  loginSuccess,
  logout,
  loginFailure,
  followUser,
  unfollowUser,
  blockUser,
  unblockUser,
} = authSlice.actions;
export default authSlice.reducer;
