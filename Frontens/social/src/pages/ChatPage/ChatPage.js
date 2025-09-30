import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import socket from "../../config/socket";
import { useParams, Link } from "react-router-dom";
import api from "../../config/api";
import styles from "./ChatPage.module.css";
import BackButton from "../../components/BackButton/BackButton";
import {
  fetchUnreadCount,
  setCurrentChatUser,
} from "../../redux/slices/messageSlice";

function ChatPage() {
  const user = useSelector((state) => state.auth.user);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const { receiverId } = useParams();
  const [receiverDetails, setReceiverDetails] = useState(null);
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const dispatch = useDispatch();

  const scrollToBottom = () => {
    const container = containerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Join socket room
  useEffect(() => {
    if (user?._id) {
      socket.emit("joinRoom", user._id);
    }
  }, [user]);

  //fetch user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const res = await api.get(`/auth/${receiverId}`);

        setReceiverDetails(res.data);
      } catch (err) {
        console.error("Error fetching user details:", err);
      }
    };

    if (receiverId) {
      fetchUserDetails();
    }
  }, [receiverId]);

  //mark msg seen
  useEffect(() => {
    const markSeen = async () => {
      if (receiverId) {
        dispatch(setCurrentChatUser(receiverId));

        await api.post("/messages/mark-seen", { senderId: receiverId });
        dispatch(fetchUnreadCount());
      }
    };

    markSeen();
  }, [receiverId, dispatch]);

  // Fetch chat history
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/${user._id}/${receiverId}`);
        setMessages(res.data);
        setTimeout(scrollToBottom, 0);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    if (user?._id && receiverId) {
      fetchMessages();
    }
  }, [user, receiverId]);

  // Listen for incoming messages
  useEffect(() => {
    socket.on("receiveMessage", (data) => {
      if (
        (data.sender === user._id && data.receiver === receiverId) ||
        (data.sender === receiverId && data.receiver === user._id)
      ) {
        setMessages((prev) => [...prev, data]);
      }
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [user, receiverId]);

  // Send message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const message = {
      senderId: user._id,
      receiverId,
      content: input,
    };

    try {
      // Save to DB
      await api.post("/messages", message);
      setInput("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto" }}>
      <BackButton />
      <h2>Chat</h2>
      <div
        ref={containerRef}
        style={{
          border: "1px solid #ccc",
          borderRadius: "8px",
          height: "400px",
          overflowY: "auto",
          padding: "0 10px 10px",
          marginBottom: "1rem",
        }}
      >
        <div className={styles.header}>
          <div className={styles.userInfo}>
            <img
              src={
                receiverDetails?.profilePicture ||
                "https://www.citypng.com/public/uploads/preview/hd-profile-user-round-blue-icon-symbol-transparent-png-701751695033492ww0i0raud4.png"
              }
              alt={receiverDetails?.username}
              className={styles.avatar}
            />
            <Link
              to={`/profile/${receiverDetails?._id}`}
              className={styles.username}
            >
              {receiverDetails?.username}
            </Link>
          </div>
        </div>
        {messages.map((msg) => (
          <div
            key={msg._id}
            style={{
              textAlign: msg.sender === user?._id ? "right" : "left",
              margin: "5px 0",
            }}
          >
            <span
              style={{
                background: msg.sender === user._id ? "#4cafef" : "#f1f1f1",
                color: msg.sender === user._id ? "white" : "black",
                padding: "6px 12px",
                borderRadius: "12px",
                display: "inline-block",
              }}
            >
              {msg.content}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: "10px",
            borderStyle: "solid",
          }}
        />
        <button
          type="submit"
          style={{
            borderRadius: "10px",
            borderStyle: "solid",
            borderColor: "white",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatPage;
