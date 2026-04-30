import api from "./api.js";

export const registerApi = async (payload) => (await api.post("/auth/register", payload)).data;
export const loginApi = async (payload) => (await api.post("/auth/login", payload)).data;
export const meApi = async (token) =>
  (await api.get("/auth/me", { headers: { Authorization: `Bearer ${token}` } })).data;