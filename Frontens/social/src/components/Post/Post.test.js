// src/components/Post/Post.test.js

// Mock api.js before anything else
jest.mock("../../config/api", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
}));

//  Import testing libs
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom"; // for toBeInTheDocument
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import Post from "./Post";
import { setupStore } from "../../testutils/setupStore";
import * as postsSlice from "../../redux/slices/postsSlice";

//  Helper to render the Post component with store & router
const renderPost = (post, userId = "u1") => {
  const store = setupStore({
    auth: { user: { _id: userId } },
    posts: { posts: [post] },
  });

  // Return both store and render result
  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter>
          <Post post={post} />
        </MemoryRouter>
      </Provider>
    ),
  };
};

describe("Post component", () => {
  const post = {
    _id: "p1",
    content: "Hello world",
    images: ["https://example.com/img1.jpg"],
    author: { _id: "u1", username: "Alice", profilePicture: "" },
    likes: ["u2"],
    comments: [{ _id: "c1", author: { username: "Bob" }, content: "Nice!" }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders author, content, likes and image", () => {
    renderPost(post);

    // Use getAllByText because author name appears twice
    const authorElements = screen.getAllByText("Alice");
    expect(authorElements.length).toBeGreaterThan(0);

    expect(screen.getByText("Hello world")).toBeInTheDocument();
    expect(screen.getByAltText("post")).toBeInTheDocument();
    expect(screen.getByText(/1 likes/)).toBeInTheDocument();
    expect(screen.getByText(/View all 1 comments/)).toBeInTheDocument();
  });

  test("shows edit and delete buttons only if logged-in user is the author", () => {
    const { rerender } = renderPost(post, "u2"); // not author
    expect(screen.queryByTitle("Edit")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Delete")).not.toBeInTheDocument();

    rerender(
      <Provider store={setupStore({ auth: { user: { _id: "u1" } } })}>
        <MemoryRouter>
          <Post post={post} />
        </MemoryRouter>
      </Provider>
    ); // author
    expect(screen.getByTitle("Edit")).toBeInTheDocument();
    expect(screen.getByTitle("Delete")).toBeInTheDocument();
  });

  test("dispatches toggleLike when like button clicked", () => {
    const toggleLikeSpy = jest.spyOn(postsSlice, "toggleLike");
    renderPost(post);

    const likeButton = screen
      .getAllByRole("button")
      .find(
        (btn) =>
          btn.querySelector("svg")?.classList.contains("likedIcon") ||
          btn.querySelector("svg")?.classList.contains("icon")
      );

    fireEvent.click(likeButton);
    expect(toggleLikeSpy).toHaveBeenCalledWith(post._id);
  });

  test("dispatches deletePost when delete button clicked", () => {
    const deletePostSpy = jest.spyOn(postsSlice, "deletePost");
    renderPost(post, "u1"); // author

    const deleteButton = screen.getByTitle("Delete");
    fireEvent.click(deleteButton);

    expect(deletePostSpy).toHaveBeenCalledWith(post._id);
  });
});
