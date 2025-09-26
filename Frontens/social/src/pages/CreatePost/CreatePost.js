import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import api from "../../config/api";
import styles from "./CreatePost.module.css";

function CreatePost() {
  const user = useSelector((state) => state.auth.user); // logged-in user
  const navigate = useNavigate();

  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files); // Convert FileList → array
    setImages(files);
    const filePreviews = files.map((file) => URL.createObjectURL(file));
    setPreviews(filePreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!content.trim()) {
      setError("Post content cannot be empty");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("content", content);
      if (images && images.length > 0) {
        images.forEach((img) => {
          formData.append("images", img); //  key must match upload.array("images")
        });
      }
      formData.append("author", user._id); // backend expects author id

      await api.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess("Post created successfully!");
      setContent("");
      setImages([]);
      setPreviews([]);
      setTimeout(() => {
        navigate("/");
      }, 100);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create post");
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={styles.textarea}
        />

        {previews.length > 0 && (
          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            {previews.map((src, idx) => (
              <img
                key={src}
                src={src}
                alt={`preview-${idx}`}
                style={{ width: "100px", height: "100px", objectFit: "cover" }}
              />
            ))}
          </div>
        )}
        <div className={styles.actions}>
          <label className={styles.fileInput}>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
            />
            <span>📷 Add Image</span>
          </label>
          <button type="submit" className={styles.postButton}>
            Post
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}
      </form>
    </div>
  );
}

export default CreatePost;
