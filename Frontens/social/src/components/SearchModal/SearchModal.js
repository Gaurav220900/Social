import { useState, useEffect } from "react";
import api from "../../config/api"; // axios instance or your API helper
import { FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";

function SearchModal({ onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/users/search?query=${query}`);
        setResults(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300); // debounce typing by 300ms

    return () => clearTimeout(delayDebounce);
  }, [query]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999,
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "1rem",
          borderRadius: "8px",
          width: "400px",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <input
            type="text"
            placeholder="Search users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
          />
          <FaTimes
            style={{ cursor: "pointer", marginLeft: "0.5rem" }}
            onClick={onClose}
          />
        </div>

        {loading && <p>Loading...</p>}
        {!loading && results.length === 0 && query && <p>No users found</p>}

        <ul style={{ listStyle: "none", padding: 0 }}>
          {results.map((user) => (
            <li key={user._id} style={{ marginBottom: "0.5rem" }}>
              <Link
                to={`/profile/${user._id}`}
                onClick={onClose}
                style={{ textDecoration: "none", color: "#333" }}
              >
                <img
                  src={
                    user.profilePicture ||
                    "https://www.citypng.com/public/uploads/preview/hd-profile-user-round-blue-icon-symbol-transparent-png-701751695033492ww0i0raud4.png"
                  }
                  alt={user.username}
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    marginRight: "10px",
                  }}
                />
                {user.username}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

SearchModal.propTypes = {
  onClose: function (props, propName, componentName) {
    if (!props[propName] || typeof props[propName] !== "function") {
      return new Error(
        `Invalid prop \`${propName}\` supplied to \`${componentName}\`. Expected a function.`
      );
    }
  },
};

export default SearchModal;
