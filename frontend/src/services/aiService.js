import { api } from 'boot/axios'

export const aiService = {
  async checkSymptoms(payload) {
    const response = await api.post(`${import.meta.env.VITE_API_URL}/api/ai/symptom-check`, payload)
    return response.data
  }
}
