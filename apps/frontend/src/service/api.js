import axios from "axios";

// 1. Establish the base instance pointing to your Express backend
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Automatically attach your authorization token if it exists in localStorage
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Or wherever you store your auth token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem("token")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      window.location.assign("/auth/login");
    }
    return Promise.reject(error);
  }
);

export default API;
