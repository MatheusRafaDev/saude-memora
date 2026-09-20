import axios from "axios";
import Cookies from "js-cookie";

export const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("sm_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    // 401 = token expirado, 403 = sem permissão
    if (status === 401 || status === 403) {
      Cookies.remove("sm_token");
      localStorage.removeItem("sm_user");
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
