<template>
  <q-card class="nexus-card glass q-pa-lg">
    <div class="text-h6 font-orbitron text-cyan-4 q-mb-md uppercase">Initialize Neural Link</div>

    <div class="column q-gutter-md">
      <q-input
        v-model="booking.patientId"
        label="Enter Patient ID (e.g. PT-9909)"
        dark
        filled
        color="cyan-4"
        class="font-orbitron"
      />

      <q-input
        v-model="booking.doctorId"
        label="Enter Doctor ID (e.g. DOC-7705)"
        dark
        filled
        color="cyan-4"
        class="font-orbitron"
      />

      <q-btn
        label="Launch Neural Node"
        color="cyan-10"
        icon="bolt"
        @click="processBooking"
        :loading="isBooking"
        class="font-orbitron nexus-btn-glow"
      />
    </div>
  </q-card>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const isBooking = ref(false)

const booking = ref({
  patientId: '',
  doctorId: ''
})

const processBooking = async () => {
  if (!booking.value.patientId || !booking.value.doctorId) {
    alert("Please enter both IDs")
    return
  }

  isBooking.value = true
  try {
    // 1. Backend API එකට data යවනවා
    const response = await axios.post('http://localhost:5005/api/video/initialize-link', {
      patientId: booking.value.patientId,
      doctorId: booking.value.doctorId
    })

    if (response.data.success) {
      // 2. ලැබෙන Room ID එකත් එක්ක වීඩියෝ පේජ් එකට රීඩිරෙක්ට් වෙනවා
      const roomId = response.data.data.roomId
      router.push(`/video?room=${roomId}`)
    }
  } catch (error) {
    console.error("Booking failed:", error)
  } finally {
    isBooking.value = false
  }
}
</script>

<style scoped>
.nexus-card { border: 1px solid rgba(0, 255, 255, 0.2); border-radius: 15px; }
.glass { background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(10px); }
.nexus-btn-glow { box-shadow: 0 0 15px rgba(0, 255, 255, 0.4); }
.font-orbitron { font-family: 'Orbitron', sans-serif; }
</style>
