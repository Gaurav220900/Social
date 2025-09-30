import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { loginSuccess } from "../../redux/slices/authSlice";
import api from "../../config/api";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Email/password login
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("prevent default hit", e);

    // Clear any previous errors
    setError("");
    setIsLoading(true);

    // Basic validation
    if (!formData.email || !formData.password) {
      setError("Email and password are required");
      setIsLoading(false);
      return; // Prevent further execution
    }

    try {
      const res = await api.post("/auth/login", formData);

      if (res?.data?.token) {
        localStorage.setItem("token", res.data.token);
        dispatch(loginSuccess(res.data.user));
        navigate("/");
      } else {
        setError("Login failed. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid credentials");
    }
  };

  const handleGoogleLogin = () => {
    const apiUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
    window.location.href = `${apiUrl}/api/auth/google`;
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <h2>Login</h2>

        {/* Display error message */}
        {error && (
          <div
            className="error-container"
            style={{
              backgroundColor: "#fee",
              border: "1px solid #fcc",
              padding: "10px",
              borderRadius: "4px",
              marginBottom: "15px",
              color: "#c66",
            }}
          >
            <p className="error" style={{ margin: 0 }}>
              {error}
            </p>
          </div>
        )}

        {/* Email/Password Login */}
        <form onSubmit={handleSubmit} noValidate>
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            disabled={isLoading}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            disabled={isLoading}
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            style={{
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* OR Divider */}
        <div style={{ textAlign: "center", margin: "20px 0" }}>
          <p>OR</p>
        </div>

        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#4285F4",
            color: "#fff",
            padding: "10px 20px",
            border: "none",
            borderRadius: "4px",
            cursor: isLoading ? "not-allowed" : "pointer",
            fontWeight: "bold",
            marginBottom: "20px",
            width: "100%",
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          <img
            src="data:image/jpeg;base64,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"
            alt="Google"
            style={{ width: "20px", marginRight: "10px" }}
          />
          <span>Login with Google</span>
        </button>

        {/* Register Link */}
        <p style={{ textAlign: "center", marginTop: "10px" }}>
          Don't have an account?{" "}
          <Link
            to="/register"
            style={{
              color: "#4285F4",
              fontWeight: "bold",
              textDecoration: "none",
            }}
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
