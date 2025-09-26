import React, { useState, useRef, useEffect } from "react";
import styles from "./Nav.module.css";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../redux/slices/authSlice";
import { FaBell, FaEnvelope, FaUser, FaSearch } from "react-icons/fa";
import api from "../../config/api";
function Nav() {
  const user = useSelector((state) => state.auth.user);

  const dispatch = useDispatch();
  const notifications = useSelector((state) => state.notifications.items);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const unreadMessages = useSelector((state) => state.messages.unreadCount);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef();

  useEffect(() => {
    if (!query) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const delayDebounce = setTimeout(async (e) => {
      setLoading(true);
      try {
        const res = await api.get(`/auth/search?q=${query}`);
        setResults(res.data);
        setShowDropdown(true);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <Link to="/">Social</Link>
      </div>

      <ul className={styles.navLinks}>
        {user ? (
          <>
            <li style={{ position: "relative" }} ref={searchRef}>
              <input
                type="text"
                placeholder="Search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query && setShowDropdown(true)}
                style={{
                  padding: "6px 30px 6px 10px",
                  borderRadius: "3px",
                  border: "1px solid #ccc",
                  width: "150px",
                }}
              />
              <FaSearch
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#888",
                }}
              />

              {/* Dropdown */}
              {showDropdown && results.length > 0 && (
                <ul
                  style={{
                    position: "absolute",
                    top: "calc(100% + 5px)",
                    left: 0,
                    width: "100%",
                    background: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    maxHeight: "250px",
                    overflowY: "auto",
                    zIndex: 1000,
                  }}
                >
                  {results.map((user) => (
                    <li
                      key={user._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "6px 10px",
                        cursor: "pointer",
                      }}
                    >
                      <Link
                        to={`/profile/${user._id}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          textDecoration: "none",
                          color: "#333",
                          width: "100%",
                        }}
                        onClick={() => {
                          setShowDropdown(false);
                          setQuery("");
                        }}
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
              )}

              {showDropdown && !loading && results.length === 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 5px)",
                    left: 0,
                    width: "100%",
                    background: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    padding: "6px 10px",
                  }}
                >
                  No users found
                </div>
              )}
            </li>
            <li>
              <Link to="/messages" style={{ position: "relative" }}>
                <FaEnvelope size={18} />
                {unreadMessages > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-5px",
                      right: "-10px",
                      background: "red",
                      color: "white",
                      borderRadius: "50%",
                      padding: "2px 6px",
                      fontSize: "12px",
                    }}
                  >
                    {unreadMessages}
                  </span>
                )}
              </Link>
            </li>
            <Link to="/notifications" style={{ position: "relative" }}>
              <FaBell />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-5px",
                    right: "-5px",
                    background: "red",
                    color: "white",
                    borderRadius: "50%",
                    padding: "2px 6px",
                    fontSize: "12px",
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </Link>
            <li>
              <Link to={`/profile/${user._id}`}>
                <FaUser size={18} />
              </Link>
            </li>
            <li>
              <button
                onClick={() => dispatch(logout())}
                className={styles.logoutBtn}
              >
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link to="/login">Sign In</Link>
            </li>
            <li>
              <Link to="/register">Register</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Nav;
