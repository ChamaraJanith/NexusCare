<template>
  <q-page class="text-white font-jakarta page-shell overflow-hidden relative-position">
    <div class="page-bg-gradient"></div>

    <div v-if="!isInCall" class="max-width-1200 q-mx-auto q-px-md z-top relative-position">
      
      <div class="row items-center justify-between q-mb-xl mt-120">
        <div>
          <div class="trusted-badge q-py-xs q-px-sm row items-center inline no-wrap q-mb-sm">
            <q-icon name="admin_panel_settings" color="blue-4" size="14px" class="q-mr-sm" />
            <span class="text-caption text-weight-bolder tracking-wider text-blue-2 uppercase">CONSULTANT COMMAND CENTER</span>
          </div>
          <h1 class="page-title q-ma-none text-weight-bolder">
            Neural <span class="text-gradient-primary">Management</span> Node.
          </h1>
          <div class="text-grey-4 text-h6 q-mt-md tracking-wider">
            NODE ID: <span class="text-blue-3 text-weight-bolder uppercase">{{ currentDoctorId }}</span>
          </div>
        </div>
        <q-badge color="blue-6" class="q-px-md q-py-sm text-weight-bold letter-spacing-1 shadow-glow-badge rounded-borders">SYSTEM ONLINE</q-badge>
      </div>

      <div class="row q-col-gutter-xl">
        <div class="col-12 col-md-7">
          <div class="glass-card q-pa-xl h-full column shadow-glow">
            <div class="text-h6 text-white text-weight-bold q-mb-lg flex items-center">
              <q-icon name="wifi_tethering" color="blue-4" size="sm" class="q-mr-sm" />
              Inbound Neural Link Requests
            </div>

            <div v-if="filteredSessions.length > 0" class="flex-1">
              <div class="q-gutter-y-md">
                <div v-for="session in filteredSessions" :key="session._id" class="condition-item row items-center q-pa-md">
                  <q-avatar size="50px" color="blue-9" text-color="blue-2" icon="person" class="q-mr-md" />
                  <div class="col">
                    <div class="text-white text-weight-bold text-h6 q-mb-xs">Patient UID: {{ session.patientId }}</div>
                    <div class="text-grey-5 text-caption tracking-wider uppercase">Session: {{ session.roomId }}</div>
                  </div>
                  <div class="col-auto">
                    <q-btn
                      unelevated
                      label="JOIN CALL"
                      color="blue-6"
                      icon-right="bolt"
                      @click="joinCall(session.roomId)"
                      class="btn-primary-glow text-weight-bold q-px-md q-py-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="text-center text-grey-6 flex flex-center flex-1 column q-pa-xl">
              <q-spinner-rings color="blue-4" size="5rem" class="q-mb-md opacity-50" />
              <div class="letter-spacing-1 text-weight-bold uppercase">Scanning for Incoming Links...</div>
            </div>
          </div>
        </div>

        <div class="col-12 col-md-5">
          <div class="glass-card q-pa-xl h-full column">
            <div class="text-h6 text-white text-weight-bold q-mb-lg flex items-center">
              <q-icon name="history" color="blue-4" size="sm" class="q-mr-sm" />
              Consultation Logs
            </div>

            <div v-if="completedSessions.length > 0" class="scroll-area flex-1">
              <div class="q-gutter-y-sm">
                <div v-for="history in completedSessions" :key="history._id" class="history-item row items-center q-pa-md">
                  <div class="col">
                    <div class="text-white text-weight-bold text-body2 q-mb-xs">Patient ID: {{ history.patientId }}</div>
                    <div class="text-grey-5 text-caption" style="font-size: 11px;">
                      {{ new Date(history.updatedAt).toLocaleString() }}
                    </div>
                  </div>
                  <div class="col-auto">
                    <q-badge outline color="blue-3" label="DONE" class="text-weight-bold text-caption tracking-wider" />
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="text-center text-grey-6 flex flex-center flex-1 column">
              <q-icon name="cloud_off" size="3rem" class="q-mb-md opacity-50" />
              <div class="letter-spacing-1 text-weight-bold uppercase">No Logs Recorded</div>
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

          $q.notify({ color: 'blue-8', message: 'Consultation Session Logged.', icon: 'assignment_turned_in' })
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
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* GLOBAL */
.font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
.max-width-1200 { max-width: 1200px; }
.page-shell { padding-top: 100px; padding-bottom: 100px; }
.mt-120 { margin-top: 40px; }
.h-full { height: 100%; min-height: 400px; }
.flex-1 { flex: 1; }
.scroll-area { max-height: 400px; overflow-y: auto; }
.opacity-50 { opacity: 0.5; }

/* ATMOSPHERIC GRADIENTS */
.page-bg-gradient {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none;
  background: 
    radial-gradient(circle at 10% 20%, rgba(37, 99, 235, 0.08), transparent 60%),
    radial-gradient(circle at 90% 80%, rgba(56, 189, 248, 0.04), transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.05), transparent 50%);
  z-index: 0;
}

/* TYPOGRAPHY */
.page-title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  letter-spacing: -2px;
  line-height: 1.1;
  text-shadow: 0 10px 30px rgba(0,0,0,0.5);
}
.text-gradient-primary {
  background: linear-gradient(to right, #38bdf8, #818cf8, #e879f9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.tracking-wider { letter-spacing: 1.5px; }
.letter-spacing-1 { letter-spacing: 1px; }

/* BADGES & ICONS */
.trusted-badge {
  border: 1px solid rgba(125, 211, 252, 0.3);
  background: rgba(14, 165, 233, 0.1);
  backdrop-filter: blur(12px);
  border-radius: 50px;
  box-shadow: 0 0 20px rgba(14, 165, 233, 0.15);
}
.shadow-glow-badge { box-shadow: 0 0 15px rgba(59, 130, 246, 0.3); }

/* CARDS & CONTAINERS */
.glass-card {
  background: rgba(10, 15, 30, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px);
  border-radius: 24px;
}

.condition-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  transition: all 0.3s ease;
}
.condition-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.history-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  transition: all 0.3s ease;
}
.history-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

/* BUTTONS */
.btn-primary-glow {
  border-radius: 50px;
  text-transform: none;
  background: linear-gradient(135deg, #1d4ed8, #2563eb) !important;
  box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.5);
  transition: all 0.3s ease;
}
.btn-primary-glow:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 35px -5px rgba(37, 99, 235, 0.6);
}

#jitsi-container {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  z-index: 9999;
  background: black;
}

@media (max-width: 768px) {
  .page-shell { padding-top: 60px; padding-bottom: 60px; }
  .page-title { font-size: 2.8rem; }
  .glass-card { padding: 24px !important; }
}
</style>
