import api from "./apiClient"

export const getDoctors = () => {
  return api.get("/doctors")
}

export const getDoctorById = (id) => {
  return api.get(`/doctors/${id}`)
}

export const updateDoctor = (id, data) => {
  return api.put(`/doctors/${id}`, data)
}