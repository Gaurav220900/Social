// components/FollowButton.jsx
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import api from "../../config/api";
import { loginSuccess } from "../../redux/slices/authSlice";

function FollowButton({ targetUserId }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(false);

  if (!user?._id || !targetUserId) return null;
  if (user._id.toString() === targetUserId.toString()) return null;

  const isFollowing = user.following?.includes(targetUserId);

  const handleFollow = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const res = isFollowing
        ? await api.put(`/auth/${targetUserId}/unfollow`)
        : await api.put(`/auth/${targetUserId}/follow`);

      dispatch(loginSuccess(res.data));
    } catch (err) {
      console.error("Follow/Unfollow error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      style={{
        padding: "6px 12px",
        border: "none",
        borderRadius: "4px",
        cursor: loading ? "not-allowed" : "pointer",
        backgroundColor: isFollowing ? "#e74c3c" : "#3498db",
        color: "#fff",
      }}
    >
      {loading ? "Processing..." : isFollowing ? "Unfollow" : "Follow"}
    </button>
  );
}

FollowButton.propTypes = {
  targetUserId: PropTypes.string.isRequired,
};

export default FollowButton;
