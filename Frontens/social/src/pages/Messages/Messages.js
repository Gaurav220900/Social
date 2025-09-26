import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../config/api";
import { useSelector } from "react-redux";
import ConvoList from "../../components/ConvoList/ConvoList";

function MessagesPage() {
  const user = useSelector((state) => state.auth.user);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [convos, setConvos] = useState([]);

  // Fetch conversations
  useEffect(() => {
    const fetchConvos = async () => {
      try {
        const res = await api.get(`/conversations/${user._id}`);
        setConvos(res.data);
      } catch (err) {
        console.error("Error fetching conversations:", err);
      }
    };
    if (user?._id) fetchConvos();
  }, [user]);

  // Search users
  const handleSearch = async (e) => {
    setSearch(e.target.value);
    if (e.target.value.trim() === "") {
      setUsers([]);
      return;
    }
    const res = await api.get(`/auth/search?q=${e.target.value}`);
    setUsers(res.data);
  };

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto" }}>
      <h2>Messages</h2>

      {/* Search */}
      <input
        type="text"
        placeholder="Search users..."
        value={search}
        onChange={handleSearch}
        style={{ width: "100%", padding: "8px", marginBottom: "1rem" }}
      />

      {/* Search Results */}
      {users.length > 0 && (
        <div>
          {users.map((u) => (
            <Link
              key={u._id}
              to={`/chat/${u._id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <img
                src={u.profilePicture || "https://via.placeholder.com/40"}
                alt={u.username}
                style={{ width: "40px", borderRadius: "50%" }}
              />
              <span>{u.username}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Conversations */}
      <div>
        <h3 style={{ marginTop: "2rem" }}>Your Chats</h3>
        {convos.length > 0 ? (
          <ConvoList convos={convos} />
        ) : (
          <p>No conversations yet</p>
        )}
      </div>
    </div>
  );
}

export default MessagesPage;
