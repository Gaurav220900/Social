// src/redux/store.js
import { configureStore } from "@reduxjs/toolkit";
import postsReducer from "./slices/postsSlice";
import authReducer from "./slices/authSlice";
import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore } from "redux-persist";
import notificationsReducer from "./slices/notificationSlice";
import messagesReducer from "./slices/messageSlice";

const persistConfig = {
  key: "auth",
  storage,
  whitelist: ["user", "token"], // only persist user + token
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);

export const store = configureStore({
  reducer: {
    posts: postsReducer,
    auth: persistedAuthReducer,
    notifications: notificationsReducer,
    messages: messagesReducer,
  },
});

export const persistor = persistStore(store);
