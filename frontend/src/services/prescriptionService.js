import api from "./apiClient"

export const createPrescription = (data) => {
  return api.post("/prescriptions", data)
}

export const getPrescriptions = (patientId) => {
  return api.get(`/prescriptions/${patientId}`)
}