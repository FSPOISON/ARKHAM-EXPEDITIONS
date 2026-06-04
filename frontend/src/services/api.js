import axios from "axios";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json"
  }
});

apiClient.interceptors.request.use((config) => {
  const userData = sessionStorage.getItem("arkham_investigator");
  if (userData) {
    try {
      const user = JSON.parse(userData);
      if (user.id_usuario) {
        config.headers["x-arkham-user"] = String(user.id_usuario);
      }
      if (user.rol) {
        config.headers["x-arkham-role"] = user.rol;
      }
    } catch (err) {
      console.error("Error reading user data for auth headers", err);
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      console.warn("Access denied - insufficient permissions");
    }
    if (error.response?.status === 401) {
      sessionStorage.removeItem("arkham_investigator");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
