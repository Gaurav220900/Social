import styles from "./Posts.module.css";
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaHeart, FaComment, FaEdit, FaTrash } from "react-icons/fa";
import PropTypes from "prop-types";
import { useSelector, useDispatch } from "react-redux";
import { toggleLike, deletePost } from "../../redux/slices/postsSlice";

const Post = React.memo(({ post }) => {
  const user = useSelector((state) => state.auth.user);

  const isAuthor = user?._id === post.author?._id;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleToggleLike = async (postId, e) => {
    e.preventDefault();
    dispatch(toggleLike(postId));
  };

  const handleDelete = (postId) => {
    if (!postId) return;
    dispatch(deletePost(postId));
  };

  return (
    <div key={post._id} className={styles.card}>
      <Link
        to={`/posts/${post._id}`}
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <div className={styles.header}>
          <div className={styles.userInfo}>
            <img
              src={
                post.author?.profilePicture ||
                "https://www.citypng.com/public/uploads/preview/hd-profile-user-round-blue-icon-symbol-transparent-png-701751695033492ww0i0raud4.png"
              }
              alt={post.author?.username}
              className={styles.avatar}
            />
            <Link
              to={`/profile/${post.author?._id}`}
              className={styles.username}
            >
              {post.author?.username}
            </Link>
          </div>
          <div className={styles.more}>
            {isAuthor && (
              <>
                <FaEdit
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate(`/posts/${post._id}/edit`);
                  }}
                  className={styles.icons}
                  title="Edit"
                />
                <FaTrash
                  className={styles.icons}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete(post._id);
                  }}
                  title="Delete"
                />
              </>
            )}
          </div>
        </div>

        {/* If post has images */}
        {post.images?.length > 0 ? (
          <>
            {/* Images */}
            <div className={styles.imageWrapper}>
              {post.images.map((img) => (
                <img
                  key={img}
                  src={img}
                  alt="post"
                  className={styles.postImage}
                />
              ))}
            </div>

            {/* Actions */}
            <div className={styles.actions}>
              <button
                onClick={(e) => handleToggleLike(post._id, e)}
                className={styles.actionBtn}
              >
                {user &&
                Array.isArray(post.likes) &&
                post.likes.includes(user._id) ? (
                  <FaHeart className={styles.likedIcon} />
                ) : (
                  <FaHeart className={styles.icon} />
                )}
              </button>

              <Link
                to={`/posts/${post._id}#comments`}
                className={styles.actionBtn}
              >
                <FaComment className={styles.icon} />
              </Link>
            </div>

            {/* Likes */}
            <div className={styles.likes}>
              {Array.isArray(post.likes) ? post.likes.length : 0} likes
            </div>

            {/* Caption */}
            <div className={styles.caption}>
              <Link
                to={`/profile/${post.author._id}`}
                className={styles.username}
              >
                {post.author?.username}
              </Link>{" "}
              {post.content}
            </div>
          </>
        ) : (
          <>
            {/* Caption (if no images, show first) */}
            <div className={styles.caption}>{post.content}</div>

            {/* Actions */}
            <div className={styles.actions}>
              <button
                onClick={(e) => {
                  if (!user) return;
                  handleToggleLike(post._id, e);
                }}
                className={styles.actionBtn}
                disabled={!user}
              >
                {user &&
                Array.isArray(post?.likes) &&
                user._id &&
                post.likes.includes(user._id) ? (
                  <FaHeart className={styles.likedIcon} />
                ) : (
                  <FaHeart className={styles.icon} />
                )}
              </button>

              <Link
                to={`/posts/${post._id}#comments`}
                className={styles.actionBtn}
              >
                <FaComment className={styles.icon} />
              </Link>
            </div>

            {/* Likes */}
            <div className={styles.likes}>
              {Array.isArray(post.likes) ? post.likes.length : 0} likes
            </div>
          </>
        )}

        {/* Comments link (common in both cases) */}
        {post.comments?.length > 0 && (
          <Link
            to={`/posts/${post._id}#comments`}
            className={styles.viewComments}
          >
            View all {post.comments.length} comments
          </Link>
        )}
      </Link>
    </div>
  );
});

Post.propTypes = {
  post: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    images: PropTypes.arrayOf(PropTypes.string),
    author: PropTypes.shape({
      _id: PropTypes.string,
      username: PropTypes.string,
      profilePicture: PropTypes.string,
    }),
    likes: PropTypes.arrayOf(PropTypes.string),
    comments: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string,
        text: PropTypes.string,
        content: PropTypes.string,
        author: PropTypes.shape({
          username: PropTypes.string,
          profilePicture: PropTypes.string,
        }),
      })
    ),
  }).isRequired,
};

export default Post;
