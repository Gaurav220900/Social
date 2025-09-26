// src/components/Posts.jsx
import React, { useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useDispatch, useSelector } from "react-redux";
import { fetchPosts } from "../../redux/slices/postsSlice";
import Post from "../Post/Post";
import styles from "./Posts.module.css";

const Posts = () => {
  const dispatch = useDispatch();
  const {
    items: posts,
    page,
    hasMore,
    loading,
  } = useSelector((state) => state.posts);

  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (posts.length === 0) {
      dispatch(fetchPosts({ page: 1, limit: 5 }));
    }
  }, [dispatch, posts.length]);

  const fetchMorePosts = () => {
    if (hasMore) {
      dispatch(fetchPosts({ page, limit: 5 }));
    }
  };

  const visiblePosts = posts.filter(
    (post) => !user?.blockedUsers?.includes(post.author._id)
  );

  return (
    <div className={styles.feed}>
      {" "}
      <InfiniteScroll
        dataLength={posts.length}
        next={fetchMorePosts}
        hasMore={hasMore}
        loader={<h4>Loading more posts...</h4>}
        endMessage={<p style={{ textAlign: "center" }}>🎉 No more posts</p>}
      >
        {visiblePosts.map((post) => (
          <Post key={post._id} post={post} />
        ))}
      </InfiniteScroll>
      {loading && posts.length === 0 && <p>Loading posts...</p>}
    </div>
  );
};

export default Posts;
