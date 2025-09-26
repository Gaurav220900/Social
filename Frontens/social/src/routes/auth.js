// src/routes/auth.js
import api from "../config/api";

export const registerUser = async (userData) => {
  const res = await api.post("/users/register", userData);
  return res.data;
};

export const loginUser = async (userData) => {
  const res = await api.post("/users/login", userData);
  return res.data;
};
