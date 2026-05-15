import axios from "axios";

const envApiBase = import.meta.env.VITE_API_BASE_URL;
const defaultApiBase = "/api/v1";
const fallbackApiBase = typeof window !== "undefined" && window.location.host.includes("vercel.app")
  ? "https://tracking-websites.onrender.com/api/v1"
  : defaultApiBase;

const baseURL = envApiBase?.trim() ? envApiBase : fallbackApiBase;

export const api = axios.create({
  baseURL,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const stored = JSON.parse(localStorage.getItem("pelec-auth") || "{}");
  const token = stored?.state?.access;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("pelec-auth");

      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  }
);
