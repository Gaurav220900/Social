import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../config/api";
import Post from "../../components/Post/Post";
import { useSelector, useDispatch } from "react-redux";
import { fetchPostsByUser } from "../../redux/slices/postsSlice";
import FollowButton from "../../components/FollowButton/FollowButton";
import BlockButton from "../../components/BlockButton/BlockButton";
import BackButton from "../../components/BackButton/BackButton";

function ProfilePage() {
  const { id } = useParams(); // userId from URL
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true); // Separate loading state for posts
  const loggedInUser = useSelector((state) => state.auth.user);
  const [editing, setEditing] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [profileFile, setProfileFile] = useState(null);

  const dispatch = useDispatch();

  // Get all posts and filter by user
  const allPosts = useSelector((state) => state?.posts?.items || []);
  const posts = allPosts.filter((p) => p?.author._id?.toString() === id);

  const visiblePosts = posts.filter(
    (post) => !loggedInUser?.blockedUsers?.includes(post.author._id)
  );

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/auth/${id}/profile`);
        setUserData(res.data);
        setUsername(res.data.user.username);
        setEmail(res.data.user.email);
        setBio(res.data.user.bio || "");
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  // Separate useEffect for posts
  useEffect(() => {
    const loadPosts = async () => {
      setPostsLoading(true);
      try {
        await dispatch(fetchPostsByUser(id)).unwrap();
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setPostsLoading(false);
      }
    };

    loadPosts();
  }, [id, dispatch]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("email", email);
      formData.append("bio", bio);
      if (profileFile) {
        formData.append("profilePicture", profileFile);
      }

      const res = await api.put(`/auth/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUserData((prev) => ({ ...prev, user: res.data }));

      setEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Update failed");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!userData) return <p>User not found.</p>;

  const { user } = userData;

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto" }}>
      <BackButton />
      {/* User Info */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "15px",
          marginBottom: "2rem",
        }}
      >
        <img
          src={
            user.profilePicture ||
            "https://www.citypng.com/public/uploads/preview/hd-profile-user-round-blue-icon-symbol-transparent-png-701751695033492ww0i0raud4.png"
          }
          alt={user.username}
          style={{ width: "80px", height: "80px", borderRadius: "50%" }}
        />
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "1rem",
            }}
          >
            <h2 style={{ margin: 0 }}>{user.username}</h2>

            {loggedInUser?._id !== user._id && (
              <>
                <FollowButton targetUserId={user._id} />
                <BlockButton targetUserId={user._id} />
              </>
            )}
          </div>

          <p>{user.email}</p>
          {user.bio && <p>{user.bio}</p>}

          <div style={{ display: "flex", gap: "20px", marginTop: "0.5rem" }}>
            <div>
              <strong>{user.followers?.length || 0}</strong> Followers
            </div>
            <div>
              <strong>{user.following?.length || 0}</strong> Following
            </div>
          </div>

          {loggedInUser?._id === user._id && (
            <button
              onClick={() => setEditing((prev) => !prev)}
              style={{
                marginTop: "0.5rem",
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid #ddd",
                cursor: "pointer",
              }}
            >
              {editing ? "Cancel" : "Edit Profile"}
            </button>
          )}
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <form
          onSubmit={handleSave}
          style={{
            marginTop: "1rem",
            padding: "1rem",
            border: "1px solid #ddd",
            borderRadius: "8px",
          }}
        >
          <div style={{ marginBottom: "0.5rem" }}>
            <label htmlFor="usernameInput">Username</label>
            <input
              id="usernameInput"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: "100%", padding: "8px" }}
            />
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <label htmlFor="emailInput">Email</label>
            <input
              id="emailInput"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: "8px" }}
            />
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <label htmlFor="bioInput">Bio</label>
            <textarea
              id="bioInput"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              style={{ width: "100%", padding: "8px" }}
            />
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <label htmlFor="profilePictureInput">Profile Picture</label>
            <input
              id="profilePictureInput"
              type="file"
              accept="image/*"
              onChange={(e) => setProfileFile(e.target.files[0])}
            />
          </div>
          <button type="submit" style={{ padding: "8px 16px" }}>
            Save Changes
          </button>
        </form>
      )}

      {/* User Posts */}
      <div>
        <h3 style={{ marginBottom: "1rem" }}>{user.username}'s Posts</h3>

        {postsLoading && <p>Loading posts...</p>}

        {!postsLoading && visiblePosts.length === 0 && <p>No posts yet</p>}

        {!postsLoading &&
          visiblePosts.map((post) => <Post key={post._id} post={post} />)}
      </div>
    </div>
  );
}

export default ProfilePage;
