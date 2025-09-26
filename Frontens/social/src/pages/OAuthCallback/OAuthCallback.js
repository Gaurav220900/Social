// OAuthCallback.jsx
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginSuccess } from "../../redux/slices/authSlice";
import api from "../../config/api";

const OAuthCallback = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (token) {
        // Save token
        localStorage.setItem("token", token);

        try {
          // Fetch current user with this token
          const res = await api.get("/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });

          dispatch(loginSuccess(res.data)); // store user in Redux
          navigate("/"); // go home after login
        } catch (err) {
          console.error("Failed to fetch user after OAuth:", err);
        }
      } else {
        console.error("No token found in URL");
      }
    };

    handleOAuth();
  }, [dispatch, navigate]);

  return <p>Signing you in...</p>;
};

export default OAuthCallback;
