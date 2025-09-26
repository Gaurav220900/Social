// redux/slices/notificationsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../config/api";

// Fetch notifications
export const fetchNotifications = createAsyncThunk(
  "notifications/fetch",
  async () => {
    const res = await api.get("/notifications"); // backend should return list
    return res.data;
  }
);

// Mark as read
export const markNotificationRead = createAsyncThunk(
  "notifications/markRead",
  async (id) => {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data;
  }
);

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {
    items: [],
    status: "idle",
  },
  reducers: {
    addNotification: (state, action) => {
      // For real-time (socket.io / Pusher)
      state.items.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const notif = state.items.find((n) => n._id === action.payload?._id);
        if (notif) notif.read = true;
      });
  },
});

export const { addNotification } = notificationsSlice.actions;
export default notificationsSlice.reducer;
