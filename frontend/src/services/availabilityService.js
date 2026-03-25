import api from "./apiClient"

export const getSlots = (doctorId) => {
  return api.get(`/availability/${doctorId}`)
}

export const createSlot = (data) => {
  return api.post("/availability", data)
}