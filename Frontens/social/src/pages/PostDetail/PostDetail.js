import React, { useEffect, useState, useRef } from "react";
import api from "../../config/api";
import { useSelector, useDispatch } from "react-redux";
import { useParams, Link, useNavigate } from "react-router-dom";
import Comment from "../../components/Comment/Comment";
import { FaHeart, FaComment, FaEdit, FaTrash } from "react-icons/fa";
import styles from "./PostDetail.module.css";
import {
  toggleLike,
  fetchPostById,
  deletePost,
} from "../../redux/slices/postsSlice";
import BackButton from "../../components/BackButton/BackButton";

function PostDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const commentInputRef = useRef(null);

  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const navigate = useNavigate();

  const post = useSelector((state) =>
    state.posts?.items?.find((p) => p._id === id)
  );

  const isAuthor = user?._id === post.author?._id;

  useEffect(() => {
    if (id) {
      dispatch(fetchPostById(id));
    }
  }, [id, dispatch]);

  useEffect(() => {
    if (post) {
      setComments(post.comments || []);
    }
  }, [post]);

  useEffect(() => {
    if (window.location.hash === "#comments" && commentInputRef.current) {
      commentInputRef.current.focus();
    }
  }, []);

  const handleDelete = (postId) => {
    if (!postId) return;
    dispatch(deletePost(postId));
  };

  const handleToggle = (postId) => {
    if (!user) return;
    dispatch(toggleLike(postId));
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const res = await api.post("/comments", {
        content: commentText,
        author: user._id,
        post: id,
      });

      setComments((prev) => [...prev, res.data]);
      setCommentText("");
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  if (!post) return <p>Loading...</p>;

  return (
    <div className={styles.container}>
      <BackButton />

      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.userInfo}>
            <img
              src={
                post.author?.profilePicture ||
                "https://www.citypng.com/public/uploads/preview/hd-profile-user-round-blue-icon-symbol-transparent-png-701751695033492ww0i0raud4.png"
              }
              alt={post?.author?.username}
              className={styles.avatar}
            />
            <Link
              to={`/profile/${post?.author?._id}`}
              className={styles.username}
            >
              {post?.author?.username}
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

        {/* Image(s) */}
        {post.images?.length > 0 && (
          <div className={styles.images}>
            {post.images.map((img) => (
              <img key={img} src={img} alt="post" className={styles.image} />
            ))}
          </div>
        )}

        {/* Content */}
        <p className={styles.content}>{post.content}</p>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            onClick={(e) => {
              e.preventDefault();
              if (post?._id) handleToggle(post._id);
            }}
            className={styles.actionBtn}
          >
            {Array.isArray(post.likes) && post.likes.includes(user._id) ? (
              <FaHeart className={styles.likedIcon} />
            ) : (
              <FaHeart className={styles.icon} />
            )}
            <span>{Array.isArray(post.likes) ? post.likes.length : 0}</span>
          </button>

          <Link
            to={`/posts/${post?._id}#comments`}
            className={styles.actionBtn}
            style={{ textDecoration: "none" }}
          >
            <FaComment className={styles.icon} />
            <span>{comments.length}</span>
          </Link>
        </div>
      </div>

      {/* Comments section */}
      <div className={styles.commentsSection}>
        <h4>Comments</h4>

        {comments?.length > 0 ? (
          comments.map((c) => <Comment key={c._id} comment={c} />)
        ) : (
          <p className={styles.noComments}>No comments yet.</p>
        )}

        {user && (
          <form onSubmit={handleAddComment} className={styles.commentForm}>
            <input
              type="text"
              value={commentText}
              ref={commentInputRef}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className={styles.commentInput}
            />
            <button type="submit" className={styles.postBtn}>
              Post
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default PostDetailPage;
