import api from "./apiClient"

export const getAppointments = () => {
  return api.get("/appointments")
}

export const createAppointment = (data) => {
  return api.post("/appointments", data)
}