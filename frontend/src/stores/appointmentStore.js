import { defineStore } from "pinia"
import * as appointmentApi from "src/services/appointmentService"

export const useAppointmentStore = defineStore("appointment", {
  state: () => ({
    appointments: [],
    loading: false,
    error: null
  }),

  actions: {
    async fetchAppointments() {
      this.loading = true
      this.error = null

      try {
        const res = await appointmentApi.getAppointments()
        this.appointments = res.data.data || res.data
      } catch (err) {
        this.error = err.message
      } finally {
        this.loading = false
      }
    }
  }
})