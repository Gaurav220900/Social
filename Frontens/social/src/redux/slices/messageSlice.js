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
    currentChatUserId: null,
  },
  reducers: {
    incrementUnread: (state) => {
      state.unreadCount += 1;
    },
    clearUnread: (state) => {
      state.unreadCount = 0;
    },
    setCurrentChatUser: (state, action) => {
      state.currentChatUserId = action.payload; // save open chat
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchUnreadCount.fulfilled, (state, action) => {
      state.unreadCount = action.payload;
    });
  },
});

export const { incrementUnread, clearUnread, setCurrentChatUser } =
  messageSlice.actions;
export default messageSlice.reducer;
