<template>
  <q-page class="bg-black overflow-hidden">
    <div v-if="!isInCall" class="q-pa-lg">
      <div class="row items-center q-mb-xl justify-between">
        <div class="col">
          <h1 class="text-h4 font-orbitron text-cyan-4 q-ma-none uppercase tracking-tighter">Consultant Command Center</h1>
          <div class="text-grey-5 font-orbitron q-mt-xs tracking-widest">
            NODE ID: <span class="text-cyan-6 uppercase">{{ currentDoctorId }}</span>
          </div>
        </div>
        <q-badge color="cyan-10" class="q-pa-sm font-orbitron">SYSTEM ONLINE</q-badge>
      </div>

      <div class="row q-col-gutter-lg">
        <div class="col-12 col-md-7">
          <div class="nexus-panel glass q-pa-md shadow-24">
            <div class="text-subtitle1 text-white font-orbitron q-mb-md">INBOUND NEURAL LINK REQUESTS</div>

            <q-list separator v-if="filteredSessions.length > 0">
              <q-item v-for="session in filteredSessions" :key="session._id" class="q-py-md nexus-item q-mb-sm">
                <q-item-section avatar>
                  <q-avatar rounded size="50px" color="cyan-10" text-color="cyan-4" icon="person" class="avatar-glow" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-h6 text-cyan-1 font-orbitron">PATIENT: {{ session.patientId }}</q-item-label>
                  <q-item-label caption class="text-grey-4 uppercase">Session: {{ session.roomId }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn label="JOIN CALL" color="cyan-10" icon="bolt" class="font-orbitron nexus-btn-glow" @click="joinCall(session.roomId)" />
                </q-item-section>
              </q-item>
            </q-list>

            <div v-else class="text-center q-pa-xl text-grey-7 font-orbitron border-dashed">
              <q-spinner-rings color="cyan-4" size="4em" />
              <div class="q-mt-md uppercase tracking-widest">Scanning for Incoming Links...</div>
            </div>
          </div>
        </div>

        <div class="col-12 col-md-5">
          <div class="nexus-panel glass q-pa-md shadow-24">
            <div class="text-subtitle1 text-cyan-4 font-orbitron q-mb-md">CONSULTATION LOGS</div>

            <q-list separator v-if="completedSessions.length > 0">
              <q-item v-for="history in completedSessions" :key="history._id" class="q-py-sm history-item">
                <q-item-section avatar>
                  <q-icon name="history" color="grey-5" size="sm" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-white font-orbitron text-caption">PATIENT ID: {{ history.patientId }}</q-item-label>
                  <q-item-label caption class="text-grey-6" style="font-size: 10px;">
                    {{ new Date(history.updatedAt).toLocaleString() }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge outline color="cyan-9" label="DONE" size="xs" />
                </q-item-section>
              </q-item>
            </q-list>

            <div v-else class="text-center q-pa-xl text-grey-8 font-orbitron">
              NO LOGS RECORDED
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-show="isInCall" id="jitsi-container"></div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { useQuasar } from 'quasar'

const route = useRoute()
const $q = useQuasar()

// State
const sessions = ref([])
const isInCall = ref(false)
let jitsiApi = null
let pollInterval = null

const currentDoctorId = ref(route.query.doctorId || 'UNKNOWN_DOC')

// දැනට පවතින Active කෝල් පමණක් පෙරීම
const filteredSessions = computed(() => {
  return sessions.value.filter(s =>
    s.status === 'ACTIVE' &&
    String(s.doctorId).toLowerCase() === String(currentDoctorId.value).toLowerCase()
  )
})

// අවසන් කරන ලද (Completed) කෝල් පමණක් පෙරීම
const completedSessions = computed(() => {
  return sessions.value.filter(s =>
    s.status === 'COMPLETED' &&
    String(s.doctorId).toLowerCase() === String(currentDoctorId.value).toLowerCase()
  ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
})

// Database එකෙන් සෙෂන් දත්ත ලබා ගැනීම
const fetchSessions = async () => {
  try {
    const response = await axios.get('http://localhost:5005/api/video/sessions')
    if (response.data.success) {
      sessions.value = response.data.data
    }
  } catch (err) {
    console.error('Sync Error:', err)
  }
}

const joinCall = (roomId) => {
  isInCall.value = true
  clearInterval(pollInterval) // කෝල් එක ඇතුළතදී Polling නවත්වන්න

  const domain = "meet.jit.si"
  const options = {
    roomName: roomId,
    width: "100%",
    height: "100vh",
    parentNode: document.querySelector("#jitsi-container"),
    userInfo: { displayName: `Dr. ${currentDoctorId.value}` },
    configOverwrite: { prejoinPageEnabled: false },
    interfaceConfigOverwrite: { SHOW_PROMOTIONAL_CLOSE_PAGE: false }
  }

  setTimeout(() => {
    if (window.JitsiMeetExternalAPI) {
      jitsiApi = new window.JitsiMeetExternalAPI(domain, options)

      jitsiApi.addEventListeners({
        videoConferenceLeft: async () => {
          try {
            // Backend එක update කිරීම
            await axios.post('http://localhost:5005/api/video/end-session', { roomId: roomId })
            // UI එකට අලුත් දත්ත ලබා ගැනීම
            await fetchSessions()
          } catch (err) {
            console.error("End session error:", err)
          }

          jitsiApi.dispose()
          isInCall.value = false

          // නැවත Polling පටන් ගැනීම
          pollInterval = setInterval(fetchSessions, 5000)

          $q.notify({ color: 'cyan-10', message: 'Consultation Session Logged.', icon: 'assignment_turned_in' })
        }
      })
    }
  }, 200)
}

onMounted(() => {
  fetchSessions()
  pollInterval = setInterval(fetchSessions, 5000) // තත්පර 5කට වරක් නව කෝල් පරීක්ෂා කිරීම
})

onBeforeUnmount(() => {
  if (jitsiApi) jitsiApi.dispose()
  if (pollInterval) clearInterval(pollInterval)
})
</script>

<style scoped>
.font-orbitron { font-family: 'Orbitron', sans-serif; }
.glass { background: rgba(15, 15, 20, 0.9); border: 1px solid rgba(0, 255, 255, 0.1); border-radius: 15px; }
.nexus-panel { min-height: 500px; }
.nexus-item { background: rgba(0, 255, 255, 0.03); border-radius: 10px; border-left: 4px solid #00e5ff; transition: 0.3s; }
.nexus-item:hover { background: rgba(0, 255, 255, 0.08); }
.history-item { background: rgba(255, 255, 255, 0.02); margin-bottom: 5px; border-radius: 5px; }
.avatar-glow { box-shadow: 0 0 15px rgba(0, 229, 255, 0.2); }
.nexus-btn-glow { box-shadow: 0 0 15px rgba(0, 229, 255, 0.4); }

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
