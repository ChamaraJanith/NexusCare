import { defineStore } from "pinia"
import * as doctorApi from "src/services/doctorService"

export const useDoctorStore = defineStore("doctor", {
  state: () => ({
    doctor: null,
    doctors: [],
    loading: false,
    error: null
  }),

  actions: {
    // 🔹 GET ALL DOCTORS
    async fetchDoctors(params = {}) {
      this.loading = true
      this.error = null

      try {
        const res = await doctorApi.getDoctors(params)
        this.doctors = res.data.data || res.data
      } catch (err) {
        this.error = err.response?.data?.message || err.message
      } finally {
        this.loading = false
      }
    },

    // 🔹 GET SINGLE DOCTOR
    async fetchDoctorById(id) {
      this.loading = true
      try {
        const res = await doctorApi.getDoctorById(id)
        this.doctor = res.data.data
      } catch (err) {
        this.error = err.message
      } finally {
        this.loading = false
      }
    },

    // 🔹 UPDATE PROFILE
    async updateDoctor(id, payload) {
      this.loading = true
      try {
        const res = await doctorApi.updateDoctor(id, payload)
        this.doctor = res.data.data
      } catch (err) {
        this.error = err.message
      } finally {
        this.loading = false
      }
    }
  }
})