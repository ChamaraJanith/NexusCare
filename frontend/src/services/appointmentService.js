import axios from 'axios'

const API = `${import.meta.env.VITE_API_URL}/api/appointments`
const DOCTOR_API = `${import.meta.env.VITE_API_URL}/api/doctors`
const AVAILABILITY_API = `${import.meta.env.VITE_API_URL}/api/availability`

// ── Token helper ──────────────────────────────────────────────────
const getToken = () => localStorage.getItem('nexus_token') || localStorage.getItem('token')

export const getDoctorDetails = async (doctorId) => {
  try {
    const res = await axios.get(`${DOCTOR_API}/public/${doctorId}`)
    return res.data?.data || res.data || null
  } catch (error) {
    console.warn('⚠️ Failed to fetch doctor details:', error.message)
    return null
  }
}

// ── Search doctors via doctor-service directly ───────────────────────
export const searchDoctors = async (filters) => {
  console.log('FILTERS:', filters)
  try {
    const res = await axios.get(`${DOCTOR_API}/search`, { params: filters })
    const payload = res.data

    if (Array.isArray(payload)) {
      return { doctors: payload, stale: false }
    }

    return {
      doctors: Array.isArray(payload?.data) ? payload.data : [],
      stale: Boolean(payload?.stale),
      message: payload?.message || '',
    }
  } catch (error) {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Doctor search failed'
    throw new Error(message)
  }
}

// ── Get doctor slots by date ───────────────────────────────────────
export const getDoctorSlots = async (doctorId, date) => {
  try {
    const res = await axios.get(`${AVAILABILITY_API}/${doctorId}/by-date`, {
      params: { date },
    })

    const payload = res.data

    // Handle new response format with stale flag
    if (payload.stale !== undefined) {
      return {
        data: {
          physical: filterExpiredSlots(payload.data?.physical || []),
          online: filterExpiredSlots(payload.data?.online || []),
        },
        stale: payload.stale,
        message: payload.message,
      }
    }

    // Legacy format (direct data)
    return {
      data: {
        physical: filterExpiredSlots(payload?.physical || []),
        online: filterExpiredSlots(payload?.online || []),
      },
      stale: false,
      message: '',
    }
  } catch (error) {
    console.error('❌ ERROR fetching doctor availability:', error.message)
    // Return empty slots with error indicator
    return {
      data: { physical: [], online: [] },
      stale: true,
      message: `Failed to fetch availability: ${error.message}`,
    }
  }
}

// ── Get next queue number ─────────────────────────────────────────
export const getNextQueueNumber = async (doctorId, date) => {
  const res = await axios.get(`${API}/queue/next`, {
    params: { doctorId, date },
  })
  return res.data
}

// ── Book appointment (token required) ────────────────────────────
export const bookAppointment = async (data) => {
  const res = await axios.post(API, data, {
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  return res.data
}

// ── Get patient appointments (token required) ─────────────────────
export const getMyAppointments = async (patientId) => {
  const res = await axios.get(`${API}/patient/${patientId}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  return Array.isArray(res.data) ? res.data : res.data.appointments || []
}

// ── Cancel appointment (token required) ───────────────────────────
export const cancelAppointment = async (id) => {
  const res = await axios.delete(`${API}/${id}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  return res.data
}

// ── Calculate fees for a slot (doctor + hospital + service) ──────
export const calculateSlotFee = async (
  doctorId,
  hospitalId,
  appointmentType,
  hospitalName = '',
) => {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000) // 4s timeout
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/service-fee/calculate/public`,
      { doctorId, hospitalId: hospitalId || '', hospitalName, appointmentType },
      { signal: controller.signal },
    )
    clearTimeout(timeout)
    return res.data?.data || null
  } catch (error) {
    if (error.name === 'CanceledError') {
      console.warn('⚠️ Fee service timeout — showing doctor fee only')
    } else {
      console.warn('⚠️ Fee calculation failed:', error.message)
    }
    return null
  }
}
export const getDoctorSlotsNext30Days = async (doctorId) => {
  try {
    const res = await axios.get(`${AVAILABILITY_API}/${doctorId}/next`)
    const payload = res.data

    // Handle new response format with stale flag
    if (payload.stale !== undefined) {
      const data = payload.data
      return {
        physical: filterExpiredSlots(Array.isArray(data.physical) ? data.physical : []),
        online: filterExpiredSlots(Array.isArray(data.online) ? data.online : []),
        stale: payload.stale,
        message: payload.message,
      }
    }

    // Legacy format (direct data)
    const data = payload?.data ?? payload
    return {
      physical: filterExpiredSlots(Array.isArray(data.physical) ? data.physical : []),
      online: filterExpiredSlots(Array.isArray(data.online) ? data.online : []),
      stale: false,
      message: '',
    }
  } catch (error) {
    console.error('❌ ERROR fetching doctor availability:', error.message)
    // Return empty slots with error indicator
    return {
      physical: [],
      online: [],
      stale: true,
      message: `Failed to fetch availability: ${error.message}`,
    }
  }
}

/**
 * UI-level filter to hide expired slots based on local browser time.
 * Rules:
 * 1. If slot date < today -> hide it
 * 2. If slot date is today AND slot time is earlier than current time -> hide it
 */
const filterExpiredSlots = (slots) => {
  if (!Array.isArray(slots)) return []

  const now = new Date()

  return slots.filter((slot) => {
    if (!slot.date || !slot.startTime) return true // Keep if data is missing

    // Combine slot.date and slot.startTime into a full DateTime object
    // Handle both YYYY-MM-DD and YYYY/MM/DD formats
    const datePart = slot.date.split('T')[0].split(' ')[0].replace(/\//g, '-')
    
    // Using local ISO format: YYYY-MM-DDTHH:mm:ss
    const slotDateTime = new Date(`${datePart}T${slot.startTime}:00`)
    
    if (isNaN(slotDateTime.getTime())) return true // Fallback if invalid data

    // Rule: If slotDateTime <= currentTime -> DO NOT SHOW
    return slotDateTime > now
  })
}
