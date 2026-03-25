<template>
  <q-card class="nexus-card glass q-pa-lg">
    <div class="text-h6 font-orbitron text-cyan-4 q-mb-md uppercase">Initialize Neural Link</div>

    <div class="column q-gutter-md">
      <q-input
        v-model="booking.patientId"
        label="Enter Patient ID (e.g. PT-9909)"
        dark filled color="cyan-4"
        class="font-orbitron"
      />

      <q-input
        v-model="booking.doctorId"
        label="Enter Doctor ID (e.g. DOC-7705)"
        dark filled color="cyan-4"
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
    const response = await axios.post('http://localhost:5005/api/video/initialize-link', booking.value)

    if (response.data.success) {
      const roomId = response.data.data.roomId
      // රෝගියාව වීඩියෝ පිටුවට යවයි
      router.push({ path: '/video', query: { room: roomId } })
    }
  } catch (error) {
    console.error("Booking failed:", error)
    alert("System Error: Could not initialize link")
  } finally {
    isBooking.value = false
  }
}
</script>
