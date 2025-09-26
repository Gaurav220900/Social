// messagesSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../config/api";

export const fetchUnreadCount = createAsyncThunk(
  "messages/fetchUnreadCount",
  async () => {
    const res = await api.get("/messages/unread-count");
    return res.data.unreadCount;
  }
);

const messageSlice = createSlice({
  name: "messages",
  initialState: {
    unreadCount: 0,
  },
  reducers: {
    incrementUnread: (state) => {
      state.unreadCount += 1;
    },
    clearUnread: (state) => {
      state.unreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchUnreadCount.fulfilled, (state, action) => {
      state.unreadCount = action.payload;
    });
  },
});

export const { incrementUnread, clearUnread } = messageSlice.actions;
export default messageSlice.reducer;
