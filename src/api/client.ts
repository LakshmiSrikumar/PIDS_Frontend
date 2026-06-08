import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Bearer token to every request automatically
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — clear session and redirect to login.
// Skip when caller opts out via X-Skip-Auth-Redirect header
// (used by the unauthenticated admin-setup-wizard endpoint).
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const skip = error.config?.headers?.["X-Skip-Auth-Redirect"];
    if (error.response?.status === 401 && !skip) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
