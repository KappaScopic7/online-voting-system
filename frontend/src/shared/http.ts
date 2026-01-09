// api/http.ts
import axios from "axios";
import { getToken, clearToken } from "./tokenStorage";

export const http = axios.create({
  baseURL: "",
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) clearToken();
    return Promise.reject(err);
  },
);
