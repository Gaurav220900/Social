import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchNotifications,
  markNotificationRead,
} from "../../redux/slices/notificationSlice";
import { Link } from "react-router-dom";

function NotificationsPage() {
  const dispatch = useDispatch();
  const notifications = useSelector((state) => state?.notifications?.items);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleMarkRead = (id) => {
    dispatch(markNotificationRead(id));
  };

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto" }}>
      <h2>Notifications</h2>
      {notifications?.length === 0 ? (
        <p>No notifications yet.</p>
      ) : (
        <ul>
          {notifications?.map((n) => (
            <li
              key={n._id}
              style={{
                listStyle: "none",
                marginBottom: "8px",
              }}
            >
              <button
                onClick={() => handleMarkRead(n._id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px",
                  background: n.read ? "#f9f9f9" : "#e6f7ff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                {n.type === "like" && (
                  <>
                    <Link
                      to={`/profile/${n.sender?._id}`}
                      style={{ textDecoration: "none" }}
                    >
                      {n.sender?.username}
                    </Link>{" "}
                    liked your{" "}
                    <Link
                      to={`/posts/${n.post?._id}`}
                      style={{ textDecoration: "none" }}
                    >
                      post
                    </Link>
                    .
                  </>
                )}

                {n.type === "comment" && (
                  <>
                    <Link
                      to={`/profile/${n.sender?._id}`}
                      style={{ textDecoration: "none" }}
                    >
                      {n.sender?.username}
                    </Link>{" "}
                    commented on your{" "}
                    <Link
                      to={`/posts/${n.post?._id}`}
                      style={{ textDecoration: "none" }}
                    >
                      post
                    </Link>
                    .
                  </>
                )}
                {n.type === "follow" && (
                  <>
                    <Link
                      to={`/profile/${n.sender?._id}`}
                      style={{ textDecoration: "none" }}
                    >
                      {n.sender?.username}
                    </Link>{" "}
                    started following you.
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default NotificationsPage;
