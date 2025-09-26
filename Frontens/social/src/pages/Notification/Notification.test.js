// src/components/NotificationsPage/NotificationsPage.test.js
jest.mock("../../config/api", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
}));

// __tests__/notifications.test.js
import reducer, {
  addNotification,
  fetchNotifications,
  markNotificationRead,
} from "../../redux/slices/notificationSlice";
import { setupStore } from "../../testutils/setupStore";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NotificationsPage from "./Notification";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import api from "../../config/api";
import "@testing-library/jest-dom";

// ✅ Mock API
jest.mock("../../config/api");

const notificationsReducer = reducer;

describe("notificationsSlice", () => {
  it("should return the initial state", () => {
    const initialState = notificationsReducer(undefined, { type: "" });
    expect(initialState).toEqual({ items: [], status: "idle" });
  });

  it("should handle addNotification", () => {
    const newNotif = { _id: "1", type: "like", read: false };
    const state = notificationsReducer(
      { items: [], status: "idle" },
      addNotification(newNotif)
    );
    expect(state.items[0]).toEqual(newNotif);
  });

  it("should handle fetchNotifications.fulfilled", () => {
    const mockData = [{ _id: "1", type: "like" }];
    const state = notificationsReducer(
      { items: [], status: "loading" },
      { type: fetchNotifications.fulfilled.type, payload: mockData }
    );
    expect(state.status).toBe("succeeded");
    expect(state.items).toEqual(mockData);
  });

  it("should handle markNotificationRead.fulfilled", () => {
    const state = notificationsReducer(
      {
        items: [{ _id: "1", type: "like", read: false }],
        status: "idle",
      },
      { type: markNotificationRead.fulfilled.type, payload: { _id: "1" } }
    );
    expect(state.items[0].read).toBe(true);
  });
});

describe("setupStore", () => {
  it("should configure store with notifications slice", () => {
    const store = setupStore();
    expect(store.getState()).toHaveProperty("notifications");
  });
});

describe("NotificationsPage component", () => {
  const renderWithProviders = (store) =>
    render(
      <Provider store={store}>
        <MemoryRouter>
          <NotificationsPage />
        </MemoryRouter>
      </Provider>
    );

  it("renders empty state when no notifications", async () => {
    api.get.mockResolvedValueOnce({ data: [] });

    const store = setupStore();
    renderWithProviders(store);

    expect(
      await screen.findByText("No notifications yet.")
    ).toBeInTheDocument();
  });

  it("renders fetched notifications", async () => {
    api.get.mockResolvedValueOnce({
      data: [
        {
          _id: "1",
          type: "like",
          read: false,
          sender: { _id: "u1", username: "Alice" },
          post: { _id: "p1" },
        },
      ],
    });

    const store = setupStore();
    renderWithProviders(store);

    expect(await screen.findByText("Alice")).toBeInTheDocument();
    expect(
      screen.getByText(
        (content, element) =>
          content.includes("liked your") && element.textContent.includes("post")
      )
    ).toBeInTheDocument();
  });

  it("marks notification as read when clicked", async () => {
    api.get.mockResolvedValueOnce({
      data: [
        {
          _id: "1",
          type: "follow",
          read: false,
          sender: { _id: "u1", username: "Bob" },
        },
      ],
    });
    api.put.mockResolvedValueOnce({ data: { _id: "1" } });

    const store = setupStore();
    renderWithProviders(store);

    const notifButton = await screen.findByText(/Bob/);
    fireEvent.click(notifButton);

    await waitFor(() => {
      const state = store.getState().notifications.items[0];
      expect(state.read).toBe(true);
    });
  });
});
