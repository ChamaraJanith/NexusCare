import axios from "axios"

const apiClient = axios.create({
  baseURL: "http://localhost:5002/api",
  withCredentials: true
})

// attach token
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default apiClient