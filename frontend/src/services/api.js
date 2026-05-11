/**
 * api.js
 * Axios instance pre-configured with the backend base URL.
 * Interceptors handle 401 responses globally.
 */

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 60_000, // 60s — handles Render free tier cold start (~30-50s wake time)
});

// Response interceptor – handle expired tokens and slow cold starts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    // Timeout — likely Render cold start
    if (error.code === "ECONNABORTED") {
      error.message = "Server is waking up, please try again in a few seconds.";
    }
    return Promise.reject(error);
  }
);

export default api;
