import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 8000
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
    } catch (e) {
      // Ignore parse errors
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem("arkham_investigator");
    }
    return Promise.reject(error);
  }
);

export default apiClient;

