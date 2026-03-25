import { api } from 'boot/axios'

export const aiService = {
  async checkSymptoms(payload) {
    // ඔයාගේ MS4 backend එක run වෙන්නේ 5004 port එකේ [පෙර backend code එක අනුව]
    const response = await api.post('http://localhost:5004/api/ai/symptom-check', payload)
    return response.data
  }
}
