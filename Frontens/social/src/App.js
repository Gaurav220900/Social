import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useParams,
} from "react-router-dom";
import React, { Suspense, lazy, useEffect } from "react";
import Layout from "./components/Layout/Layout";
import Home from "./pages/Home/Home";
import socket from "./config/socket";
import Notification from "./pages/Notification/Notification";
import { useDispatch, useSelector } from "react-redux";
import { addPost, toggleLike } from "./redux/slices/postsSlice";
import { addNotification } from "./redux/slices/notificationSlice";
import { fetchCurrentUser } from "./redux/slices/authSlice";
import OAuthCallback from "./pages/OAuthCallback/OAuthCallback";
import { incrementUnread, fetchUnreadCount } from "./redux/slices/messageSlice";
import LoadingSpinner from "./components/LoadingSpinner/LoadingSpinner";
import ChatPage from "./pages/ChatPage/ChatPage";
import store from "./redux/store";

const storedUser = JSON.parse(localStorage.getItem("user"));
const Register = lazy(() => import("./pages/Register/Register"));
const Login = lazy(() => import("./pages/Login/Login"));
const CreatePost = lazy(() => import("./pages/CreatePost/CreatePost"));
const PostDetailPage = lazy(() => import("./pages/PostDetail/PostDetail"));
const UserProfile = lazy(() => import("./pages/UserProfile/UserProfile"));
const MessagesPage = lazy(() => import("./pages/Messages/Messages"));
const EditPostPage = lazy(() => import("./pages/EditPost/EditPost"));

function ChatWrapper() {
  const { receiverId } = useParams();
  return <ChatPage receiverId={receiverId} />;
}

function App() {
  const user = useSelector((state) => state.auth.user);
  const currentChatUserId = useSelector(
    (state) => state.messages.currentChatUserId
  );
  const loading = useSelector((state) => state.auth.loading);
  const dispatch = useDispatch();

  useEffect(() => {
    if (storedUser && !user) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  useEffect(() => {
    if (!user?._id) return;

    if (user?._id) {
      socket.emit("joinRoom", user._id);
      console.log("📡 Joined room for user:", user._id);
    }

    socket.on("new-post", (post) => {
      dispatch(addPost(post));
    });

    socket.on("like-updated", ({ postId, likes }) => {
      dispatch(toggleLike({ postId, likes }));
    });

    socket.on("new-notification", (notification) => {
      dispatch(addNotification(notification));
    });

    socket.on("receiveMessage", (message) => {
      console.log("In msg box", message.sender, currentChatUserId);

      if (message.receiver === user._id) {
        if (currentChatUserId.toString() !== message.sender.toString()) {
          dispatch(incrementUnread());
        }
      }
    });

    socket.on("new-message", (message) => {});

    socket.on("unreadCount", ({ count }) => {
      dispatch(incrementUnread(count));
    });

    return () => {
      socket.off("new-post");
      socket.off("new-notification");
      socket.off("like-updated");
      socket.off("receiveMessage");
      socket.off("unreadCount");
    };
  }, [user, dispatch]);

  if (loading) return <p>Loading...</p>;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />

          <Route
            path="newpost"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <CreatePost />
              </Suspense>
            }
          />
          <Route
            path="posts/:id"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <PostDetailPage />
              </Suspense>
            }
          />
          <Route
            path="profile/:id"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <UserProfile />
              </Suspense>
            }
          />
          <Route path="chat/:receiverId" element={<ChatPage />} />
          <Route
            path="messages"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <MessagesPage />
              </Suspense>
            }
          />
          <Route
            path="notifications"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <Notification />
              </Suspense>
            }
          />
          <Route
            path="/posts/:id/edit"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <EditPostPage />
              </Suspense>
            }
          />
          <Route
            path="/oauth/callback"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <OAuthCallback />
              </Suspense>
            }
          />
        </Route>

        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
