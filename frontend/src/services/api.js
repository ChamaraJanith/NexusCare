import axios from "axios";

const api = axios.create();

// Auth Interceptor
api.interceptors.request.use(config => {
  const token = localStorage.getItem("nexus_token") || localStorage.getItem("token"); // Supporting potential generic 'token' fallback as user specified "token"
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
