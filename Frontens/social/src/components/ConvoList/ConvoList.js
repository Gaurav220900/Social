import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";

const ConvoList = React.memo(({ convos }) => {
  const user = useSelector((state) => state.auth.user);

  return (
    <div>
      {convos.length > 0 &&
        convos.map((c) => {
          const otherUser = c.members.find((m) => m._id !== user._id);
          return (
            <Link
              key={c._id}
              to={`/chat/${otherUser._id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px",
                borderBottom: "1px solid #ddd",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <img
                src={
                  otherUser.profilePicture ||
                  "https://www.citypng.com/public/uploads/preview/hd-profile-user-round-blue-icon-symbol-transparent-png-701751695033492ww0i0raud4.png"
                }
                alt={otherUser.username}
                style={{ width: "40px", borderRadius: "50%" }}
              />
              <div>
                <strong>{otherUser.username}</strong>
                <p style={{ fontSize: "12px", color: "black" }}>
                  {c.lastMessage ? c.lastMessage.content : "No messages yet"}
                </p>
              </div>
            </Link>
          );
        })}
    </div>
  );
});

ConvoList.propTypes = {
  convos: PropTypes.array.isRequired,
};

export default ConvoList;
