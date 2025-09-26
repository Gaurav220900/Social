import React from "react";
import Posts from "../../components/Posts/Posts";
import CreatePost from "../../components/CreatePost/CreatePost";
const Home = () => {
  return (
    <div>
      <CreatePost />
      <Posts />
    </div>
  );
};

export default Home;
