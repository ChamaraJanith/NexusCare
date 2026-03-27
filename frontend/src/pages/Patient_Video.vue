<template>
  <q-page class="text-white font-jakarta page-shell overflow-hidden relative-position">
    <div class="page-bg-gradient"></div>

    <div v-if="!isInCall" class="max-width-1200 q-mx-auto q-px-md z-top relative-position">
      
      <div class="row items-center justify-between q-mb-xl mt-120">
        <div>
          <div class="trusted-badge q-py-xs q-px-sm row items-center inline no-wrap q-mb-sm">
            <q-icon name="network_check" color="blue-4" size="14px" class="q-mr-sm" />
            <span class="text-caption text-weight-bolder tracking-wider text-blue-2 uppercase">PATIENT TERMINAL</span>
          </div>
          <h1 class="page-title q-ma-none text-weight-bolder">
            Neural <span class="text-gradient-primary">Access</span> Node.
          </h1>
        </div>
      </div>

      <div class="row q-col-gutter-xl">
        <div class="col-12 col-md-5">
          <div class="glass-card q-pa-xl shadow-glow">
            <div class="text-caption text-blue-3 q-mb-md uppercase letter-spacing-1 text-weight-bold">
              Secure Biometric Link
            </div>

            <div class="identity-box q-mb-xl q-pa-md flex items-center shadow-glow-badge">
              <q-avatar size="50px" color="blue-9" text-color="blue-2" icon="person" class="q-mr-md" />
              <div>
                <div class="text-h6 text-white text-weight-bold">{{ patientName }}</div>
                <div class="text-caption text-grey-4 uppercase tracking-wider">UID: {{ patientId }}</div>
              </div>
            </div>

            <div class="column q-gutter-y-md">
              <div class="text-caption text-weight-bold text-grey-5 uppercase letter-spacing-1">Target Specialist ID</div>
              <q-input
                v-model="booking.doctorId"
                dark
                outlined
                color="blue-4"
                class="cinematic-input"
                placeholder="Enter Practitioner Node ID"
              />
              <q-btn
                :label="isBooking ? 'SYNCHRONIZING...' : 'Establish Neural Link'"
                color="blue-6"
                icon-right="bolt"
                @click="processBooking"
                :loading="isBooking"
                class="btn-primary-glow full-width text-weight-bold q-py-sm q-mt-md"
                unelevated
              />
            </div>
          </div>
        </div>

        <div class="col-12 col-md-7">
          <div class="glass-card q-pa-xl h-full column">
            <div class="text-h6 text-white text-weight-bold q-mb-lg">Consultation Archive</div>
            
            <div v-if="completedSessions.length > 0" class="scroll-area flex-1">
              <div class="q-gutter-y-md">
                <div v-for="session in completedSessions" :key="session._id" class="condition-item row items-center q-pa-md">
                  <div class="q-mr-md">
                    <q-icon name="history" color="blue-4" size="md" />
                  </div>
                  <div class="col">
                    <div class="text-white text-weight-bold text-body1 q-mb-xs">Dr. {{ session.doctorId }}</div>
                    <div class="text-grey-5 text-caption tracking-wider">
                      {{ new Date(session.updatedAt).toLocaleString() }}
                    </div>
                  </div>
                  <div class="col-auto">
                    <q-badge outline color="blue-3" label="COMPLETED" class="text-weight-bold q-pa-sm text-caption tracking-wider" />
                  </div>
                </div>
              </div>
            </div>
            
            <div v-else class="text-center text-grey-6 flex flex-center flex-1 column">
              <q-icon name="cloud_off" size="3rem" class="q-mb-md opacity-50" />
              <div class="letter-spacing-1 text-weight-bold uppercase">No recent sessions found</div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Teleported Jitsi container handled in CSS -->
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

const storedUserStr = localStorage.getItem('nexus_user')
const storedUser = storedUserStr ? JSON.parse(storedUserStr) : null

// --- State Management ---
const isBooking = ref(false)
const isInCall = ref(false)
const sessions = ref([])
let jitsiApi = null

// --- User Data (Route එකෙන් හෝ Default අගයන් ලබා ගැනීම) ---
const patientId = ref(route.query.patientId || (storedUser && storedUser.roleId) || 'UNKNOWN_ID')
const patientName = ref(route.query.patientName || (storedUser && storedUser.name) || 'GUEST_USER')
// 💡 ලොග් වෙලා ඉන්න යූසර්ගේ Email එක මෙතනට එනවා
const patientEmail = ref(route.query.patientEmail || (storedUser && storedUser.email) || '')
const doctorEmail = ref(route.query.doctorEmail || '')
const booking = ref({ patientId: patientId.value, doctorId: '', patientEmail: patientEmail.value, doctorEmail: doctorEmail.value })

// --- Computed: Filter History ---
const completedSessions = computed(() => {
  return sessions.value.filter(s =>
    s.status === 'COMPLETED' &&
    String(s.patientId).toLowerCase() === String(patientId.value).toLowerCase()
  ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
})

// --- Methods ---
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
          try {
            // කෝල් එක ඉවර වූ විට Backend (5005) එකට දැනුම් දීම
            await axios.post('http://localhost:5005/api/video/end-session', { roomId: roomName });

            await fetchSessions();

            $q.notify({
              color: 'positive',
              message: 'Session Ended. Summary sent to your email.',
              icon: 'verified_user',
              position: 'top'
            });
          } catch (err) {
            console.error("End Session Error:", err);
          } finally {
            if (jitsiApi) jitsiApi.dispose();
            isInCall.value = false;
          }
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
    // 💡 මෙතනදී තමයි නිවැරදි දත්ත Backend එකට යවන්නේ
    // If doctor email is not provided by buyer, try from query or empty
    const activeDoctorEmail = (booking.value.doctorEmail || doctorEmail.value).trim();

    const response = await axios.post('http://localhost:5005/api/video/initialize-link', {
      patientId: String(patientId.value).trim(),
      doctorId: String(booking.value.doctorId).trim(),
      patientEmail: patientEmail.value, // 👈 Dynamic Email from logged in user
      patientPhone: "+94767691846",      // 👈 ඔයාගේ Twilio Verified Phone Number එක
      doctorEmail: activeDoctorEmail || ''
    });

    if (response.data.success) {
      startJitsiCall(response.data.data.roomId);
    }
  } catch (error) {
    console.error("Booking Error:", error);
    $q.notify({
      color: 'negative',
      message: 'Connection Failed. Backend Offline.',
      icon: 'report_problem'
    });
  } finally {
    isBooking.value = false;
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
.identity-box {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
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

/* INPUTS */
.cinematic-input :deep(.q-field__control) {
  background: rgba(0, 0, 0, 0.2) !important;
  border-radius: 12px;
}
.cinematic-input :deep(.q-field__control:before) { border-color: rgba(255, 255, 255, 0.1); }
.cinematic-input :deep(.q-field__control:hover:before) { border-color: rgba(255, 255, 255, 0.2); }
.cinematic-input :deep(.q-field__control:focus-within) { box-shadow: 0 0 20px rgba(59, 130, 246, 0.1); }

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
