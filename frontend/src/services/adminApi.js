// services/adminApi.js
// Admin dashboard API service — connects to all NexusCare microservices

import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const MS1 = API
const MS3 = API
const MS5 = API
const MS6 = API

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token') || localStorage.getItem('nexus_token') || ''}`
})

// ── MS1: User/Auth ───────────────────────────────────────────────────────────

export const adminApi = {
  // Platform stats (GET /api/admin/stats)
  getStats: () =>
    axios.get(`${MS1}/api/admin/stats`, { headers: getHeaders() }),

  // All users (GET /api/admin/users)
  getUsers: (params = {}) =>
    axios.get(`${MS1}/api/admin/users`, { headers: getHeaders(), params }),

  // Single user (GET /api/admin/users/:userId)
  getUser: (userId) =>
    axios.get(`${MS1}/api/admin/users/${userId}`, { headers: getHeaders() }),

  // Toggle user active status (PATCH /api/admin/users/:userId/status)
  toggleUserStatus: (userId, isActive) =>
    axios.patch(`${MS1}/api/admin/users/${userId}/status`, { isActive }, { headers: getHeaders() }),

  // Delete user (DELETE /api/admin/users/:userId)
  deleteUser: (userId) =>
    axios.delete(`${MS1}/api/admin/users/${userId}`, { headers: getHeaders() }),

  // Pending doctor verifications (GET /api/admin/doctors/pending)
  getPendingDoctors: () =>
    axios.get(`${MS1}/api/admin/doctors/pending`, { headers: getHeaders() }),

  // Verify/reject doctor (PATCH /api/admin/doctors/:doctorId/verify)
  verifyDoctor: (doctorId, action, rejectionReason = '') =>
    axios.patch(
      `${MS1}/api/admin/doctors/${doctorId}/verify`,
      { action, rejectionReason },
      { headers: getHeaders() }
    ),

  // All doctor fees (GET /api/admin/doctors/fees)
  getAllDoctorFees: () =>
    axios.get(`${MS1}/api/admin/doctors/fees`, { headers: getHeaders() }),

  // Update doctor consultation fee (PATCH /api/auth/doctors/:doctorId/fee)
  updateDoctorFee: (doctorId, consultationFee) =>
    axios.patch(
      `${MS1}/api/auth/doctors/${doctorId}/fee`,
      { consultationFee },
      { headers: getHeaders() }
    ),
}

// ── MS3: Appointments ────────────────────────────────────────────────────────

export const appointmentApi = {
  // Admin verify appointment
  adminVerify: (id) =>
    axios.put(`${MS3}/api/appointments/admin/verify/${id}`, {}, { headers: getHeaders() }),
}

// ── MS5: Payments ────────────────────────────────────────────────────────────

export const paymentApi = {
  // All payments (GET /api/payments/admin/all)
  getAll: (params = {}) =>
    axios.get(`${MS5}/api/payments/admin/all`, { headers: getHeaders(), params }),

  // Payment stats (GET /api/payments/admin/stats)
  getStats: () =>
    axios.get(`${MS5}/api/payments/admin/stats`, { headers: getHeaders() }),
}

// ── MS6: Fee Management ──────────────────────────────────────────────────────

export const feeApi = {
  // Global service fee (GET /api/service-fee)
  getServiceFee: () =>
    axios.get(`${MS6}/api/service-fee`),

  // Update service fee (PUT /api/service-fee)
  updateServiceFee: (amount, description) =>
    axios.put(`${MS6}/api/service-fee`, { amount, description }, { headers: getHeaders() }),

  // All hospitals (GET /api/hospitals)
  getHospitals: () =>
    axios.get(`${MS6}/api/hospitals`),

  // Create hospital (POST /api/hospitals)
  createHospital: (data) =>
    axios.post(`${MS6}/api/hospitals`, data, { headers: getHeaders() }),

  // Update hospital (PUT /api/hospitals/:hospitalId)
  updateHospital: (hospitalId, data) =>
    axios.put(`${MS6}/api/hospitals/${hospitalId}`, data, { headers: getHeaders() }),

  // Delete hospital (DELETE /api/hospitals/:hospitalId)
  deleteHospital: (hospitalId) =>
    axios.delete(`${MS6}/api/hospitals/${hospitalId}`, { headers: getHeaders() }),
}