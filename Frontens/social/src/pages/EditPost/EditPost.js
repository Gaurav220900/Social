import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { updatePost } from "../../redux/slices/postsSlice";

function EditPostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const post = useSelector((state) =>
    state.posts.items.find((p) => p._id === id)
  );

  const [content, setContent] = useState("");

  useEffect(() => {
    if (post) setContent(post.content);
  }, [post]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updatePost({ postId: id, content })).unwrap();
      navigate(`/posts/${id}`); // redirect back to detail after saving
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  if (!post) return <p>Loading...</p>;

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto" }}>
      <h2>Edit Post</h2>

      {/* Show associated images (read-only) */}
      {post.images && post.images.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <h4>Images</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {post.images.map((img, idx) => (
              <img
                key={img}
                src={img}
                alt={`post-img-${idx}`}
                style={{
                  width: "120px",
                  height: "120px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                }}
              />
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows="4"
          style={{ width: "100%", marginBottom: "1rem" }}
        />
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{ marginRight: "1rem" }}
          >
            Cancel
          </button>
          <button type="submit">Save</button>
        </div>
      </form>
    </div>
  );
}

export default EditPostPage;
