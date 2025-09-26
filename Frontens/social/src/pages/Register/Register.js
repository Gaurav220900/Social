import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { loginSuccess } from "../../redux/slices/authSlice";
import api from "../../config/api"; // Uncomment when backend ready

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/auth/register", formData);
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }
      dispatch(loginSuccess(res.data.user));
      navigate("/"); // go to home
    } catch (err) {
      console.error("Registration error:", err);
      setError("Registration failed");
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <h2>Register</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />
          <button type="submit">Register</button>
        </form>

        {/* login Link */}
        <p style={{ textAlign: "center", marginTop: "10px" }}>
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              color: "#4285F4",
              fontWeight: "bold",
              textDecoration: "none",
            }}
          >
            login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
