import React from "react";
import Posts from "../Posts/Posts";
import CreatePost from "../CreatePost/CreatePost";
const Home = () => {
  return (
    <div>
      <CreatePost />
      <Posts />
    </div>
  );
};

export default Home;
