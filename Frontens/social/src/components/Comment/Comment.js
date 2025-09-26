import React from "react";
import PropTypes from "prop-types";

function Comment({ comment }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
      <img
        src={
          comment.author?.profilePicture ||
          "https://www.citypng.com/public/uploads/preview/hd-profile-user-round-blue-icon-symbol-transparent-png-701751695033492ww0i0raud4.png"
        }
        alt={comment.author?.username}
        style={{ width: "30px", height: "30px", borderRadius: "50%" }}
      />
      <div>
        <strong>{comment.author?.username}</strong> {comment.content}
      </div>
    </div>
  );
}

Comment.propTypes = {
  comment: PropTypes.shape({
    _id: PropTypes.string,
    content: PropTypes.string,
    author: PropTypes.shape({
    username: PropTypes.string,
    profilePicture: PropTypes.string,
    }),
  }).isRequired,
};

export default Comment;
