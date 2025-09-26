// test-utils/setupStore.js
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../redux/slices/authSlice";
import postsReducer from "../redux/slices/postsSlice";
import notificationReducer from "../redux/slices/notificationSlice";

export const setupStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      posts: postsReducer,
      notifications: notificationReducer,
    },
    preloadedState,
  });
};
