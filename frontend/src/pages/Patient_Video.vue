<template>
  <q-page class="bg-black overflow-hidden">
    <div v-if="!isInCall" class="q-pa-lg">
      <div class="flex flex-center q-mb-xl">
        <q-card class="nexus-card glass q-pa-xl" style="width: 500px; border: 1px solid rgba(0, 229, 255, 0.3); border-radius: 20px;">
          <div class="text-center q-mb-xl">
            <div class="text-h5 font-orbitron text-cyan-4 q-mb-xs tracking-widest">NEURAL ACCESS NODE</div>
            <div class="text-caption text-cyan-9 font-orbitron uppercase">Secure Biometric Link</div>
          </div>

          <div class="identity-box q-mb-lg q-pa-lg">
            <div class="row items-center q-gutter-md">
              <q-avatar size="60px" color="cyan-10" text-color="cyan-4" icon="person" class="avatar-glow" />
              <div>
                <div class="text-h6 text-white font-orbitron">{{ patientName }}</div>
                <div class="text-caption text-grey-5 uppercase">UID: {{ patientId }}</div>
              </div>
            </div>
          </div>

          <div class="column q-gutter-y-lg">
            <q-input v-model="booking.doctorId" label="TARGET DOCTOR ID" dark filled color="cyan-4" class="font-orbitron" />
            <q-btn
              :label="isBooking ? 'SYNCHRONIZING...' : 'ESTABLISH NEURAL LINK'"
              color="cyan-10" icon="bolt" @click="processBooking"
              :loading="isBooking"
              class="font-orbitron nexus-btn-glow full-width q-py-md"
            />
          </div>
        </q-card>
      </div>

      <div class="max-width-container q-mx-auto" style="max-width: 800px;">
        <div class="text-subtitle1 text-cyan-4 font-orbitron q-mb-md">CONSULTATION LOGS (HISTORY)</div>
        <div v-if="completedSessions.length > 0" class="glass rounded-borders overflow-hidden shadow-24">
          <q-list separator>
            <q-item v-for="session in completedSessions" :key="session._id" class="q-py-md nexus-item">
              <q-item-section avatar>
                <q-icon name="history" color="cyan-4" size="md" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-white font-orbitron uppercase">DOCTOR: {{ session.doctorId }}</q-item-label>
                <q-item-label caption class="text-grey-5">
                  DATE: {{ new Date(session.updatedAt).toLocaleString() }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-chip dense color="cyan-10" text-color="white" label="COMPLETED" size="sm" />
              </q-item-section>
            </q-item>
          </q-list>
        </div>
        <div v-else class="text-center q-pa-xl glass rounded-borders text-grey-7 font-orbitron">
          NO RECENT CONSULTATIONS FOUND
        </div>
      </div>
    </div>

    <div v-show="isInCall" id="jitsi-container"></div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router' // useRouter අයින් කළා (ESLint fix)
import axios from 'axios'
import { useQuasar } from 'quasar'

const route = useRoute()
const $q = useQuasar()

// State
const isBooking = ref(false)
const isInCall = ref(false)
const sessions = ref([])
let jitsiApi = null

// Data from Route
const patientId = ref(route.query.patientId || 'UNKNOWN_ID')
const patientName = ref(route.query.patientName || 'GUEST_USER')
const booking = ref({ patientId: patientId.value, doctorId: '' })

// Filter History (COMPLETED ඒවා පමණක් පෙරා ගැනීම)
const completedSessions = computed(() => {
  return sessions.value.filter(s =>
    s.status === 'COMPLETED' &&
    String(s.patientId).toLowerCase() === String(patientId.value).toLowerCase()
  ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
})

// Database එකෙන් සෙෂන් දත්ත ලබා ගැනීම
const fetchSessions = async () => {
  try {
    const res = await axios.get('http://localhost:5005/api/video/sessions')
    if (res.data.success) {
      sessions.value = res.data.data
    }
  } catch (err) {
    console.error("Fetch Sessions Error:", err)
  }
}

const startJitsiCall = (roomName) => {
  isInCall.value = true
  const domain = "meet.jit.si"
  const options = {
    roomName: roomName,
    width: "100%",
    height: "100vh",
    parentNode: document.querySelector("#jitsi-container"),
    userInfo: { displayName: patientName.value },
    configOverwrite: { prejoinPageEnabled: false },
    interfaceConfigOverwrite: { SHOW_PROMOTIONAL_CLOSE_PAGE: false }
  }

  setTimeout(() => {
    if (window.JitsiMeetExternalAPI) {
      jitsiApi = new window.JitsiMeetExternalAPI(domain, options)

jitsiApi.addEventListeners({
  videoConferenceLeft: async () => {
    // roomName කියන variable එක පාවිච්චි කරන්න (එය function එකේ parameter එකක් ලෙස ලැබෙනවා)
    try {
      await axios.post('http://localhost:5005/api/video/end-session', { roomId: roomName });
      await fetchSessions();
    } catch (err) {
      console.error("Backend Error:", err);
    }
    jitsiApi.dispose();
    isInCall.value = false;

          jitsiApi.dispose()
          isInCall.value = false
          $q.notify({
            color: 'positive',
            message: 'Session Ended & Saved to History.',
            icon: 'check_circle',
            position: 'top'
          })
        }
      })
    }
  }, 200)
}

const processBooking = async () => {
  if (!booking.value.doctorId) {
    $q.notify({ color: 'warning', message: 'Target Doctor ID is required.' })
    return
  }

  isBooking.value = true
  try {
    const response = await axios.post('http://localhost:5005/api/video/initialize-link', {
      patientId: String(patientId.value).trim(),
      doctorId: String(booking.value.doctorId).trim()
    })

    if (response.data.success) {
      startJitsiCall(response.data.data.roomId)
    }
  } catch (error) {
    console.error("Booking Error:", error)
    $q.notify({ color: 'negative', message: 'Connection Error. Backend Offline.', icon: 'bolt' })
  } finally {
    isBooking.value = false
  }
}

onMounted(() => {
  fetchSessions()
})

onBeforeUnmount(() => {
  if (jitsiApi) jitsiApi.dispose()
})
</script>

<style scoped>
.font-orbitron { font-family: 'Orbitron', sans-serif; }
.glass { background: rgba(10, 10, 15, 0.9); backdrop-filter: blur(15px); }
.identity-box { background: rgba(0, 229, 255, 0.05); border: 1px solid rgba(0, 229, 255, 0.2); border-radius: 12px; }
.nexus-item { border-left: 3px solid #00e5ff; background: rgba(255, 255, 255, 0.02); transition: 0.3s; }
.nexus-item:hover { background: rgba(0, 229, 255, 0.05); }
.avatar-glow { box-shadow: 0 0 15px rgba(0, 229, 255, 0.3); }

#jitsi-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: black;
}
</style>
