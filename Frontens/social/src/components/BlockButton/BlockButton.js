import React from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../../config/api";
import { blockUser, unblockUser } from "../../redux/slices/authSlice";
import PropTypes from "prop-types";

BlockButton.propTypes = {
  targetUserId: PropTypes.string.isRequired,
};

function BlockButton({ targetUserId }) {
  const dispatch = useDispatch();
  const loggedInUser = useSelector((state) => state.auth.user);

  const isBlocked = loggedInUser?.blockedUsers?.includes(targetUserId);

  const handleToggleBlock = async () => {
    try {
      if (isBlocked) {
        await api.put(`/auth/${targetUserId}/unblock`);
        dispatch(unblockUser(targetUserId));
      } else {
        await api.put(`/auth/${targetUserId}/block`);
        dispatch(blockUser(targetUserId));
      }
    } catch (err) {
      console.error("Block/Unblock error:", err);
    }
  };

  // Don't show if user is blocking himself
  if (loggedInUser?._id === targetUserId) return null;

  return (
    <button
      onClick={handleToggleBlock}
      style={{
        padding: "6px 12px",
        border: isBlocked ? "1px solid gray" : "1px solid red",
        background: isBlocked ? "gray" : "white",
        color: isBlocked ? "white" : "red",
        borderRadius: "6px",
        cursor: "pointer",
      }}
    >
      {isBlocked ? "Unblock" : "Block"}
    </button>
  );
}

export default BlockButton;
