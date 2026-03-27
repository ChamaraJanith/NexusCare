<template>
  <q-page class="text-white font-jakarta flex flex-center page-shell overflow-hidden">
    <!-- Atmospheric Background -->
    <div class="page-bg-gradient"></div>

    <div class="row justify-center full-width z-top max-width-1200 q-px-md">
      <div class="col-12 col-md-10 col-lg-9">

        <div class="row items-center justify-between q-mb-lg mt-120">
          <div>
            <div class="trusted-badge q-py-xs q-px-sm row items-center inline no-wrap q-mb-sm">
              <q-icon name="shield" color="blue-4" size="14px" class="q-mr-sm" />
              <span class="text-caption text-weight-bolder tracking-wider text-blue-2 uppercase">POST-QUANTUM SECURED LINK</span>
            </div>
            <h1 class="page-title q-ma-none text-weight-bolder">
              Neural <span class="text-gradient-primary">{{ isDoctor ? 'Consultant' : 'Patient' }}</span> Bridge.
            </h1>
          </div>
        </div>

        <div id="jitsi-container" class="glass-card shadow-glow nexus-video-window relative-position">
          <div v-if="loading" class="absolute-center text-center z-top">
            <q-spinner-dots color="blue-4" size="4rem" />
            <div class="text-blue-2 q-mt-md text-weight-bold tracking-wider letter-spacing-1 uppercase">ESTABLISHING NEURAL LINK...</div>
          </div>
        </div>

        <div class="row q-mt-xl justify-end">
          <q-btn
            unelevated
            label="Terminate Neural Link"
            color="red-6"
            icon="power_settings_new"
            @click="endSession"
            class="btn-danger-glow q-px-xl q-py-md text-weight-bold"
          />
        </div>

      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const isDoctor = route.query.role === 'doctor'
let jitsiApi = null

const initJitsi = (roomId) => {
  const domain = 'meet.jit.si'
  const options = {
    roomName: roomId,
    width: '100%',
    height: '100%',
    parentNode: document.querySelector('#jitsi-container'),
    configOverwrite: {
      prejoinPageEnabled: false,
      disableInviteFunctions: true,
      enableUserRolesBasedOnToken: false,
      enableWelcomePage: false,
      p2p: { enabled: true },
      startWithAudioMuted: false,
      startWithVideoMuted: false,
      requireDisplayName: false,
    },
    interfaceConfigOverwrite: {
      TOOLBAR_BUTTONS: [
        'microphone', 'camera', 'fullscreen', 'fittowindow', 'hangup', 'chat', 'tileview'
      ],
      SHOW_JITSI_WATERMARK: false,
      JITSI_WATERMARK_LINK: '',
      RECENT_LIST_ENABLED: false,
    },
    userInfo: {
      displayName: isDoctor ? 'Dr. Aris (Consultant)' : 'Patient Node'
    }
  }

  try {
    jitsiApi = new window.JitsiMeetExternalAPI(domain, options)

    jitsiApi.addEventListeners({
      videoConferenceJoined: () => {
        loading.value = false
        console.log('Neural Bridge Active')
      },
      readyToClose: () => endSession()
    })
  } catch (error) {
    console.error('Jitsi API Error:', error)
  }
}

const endSession = () => {
  if (jitsiApi) jitsiApi.dispose()
  router.push('/')
}

onMounted(() => {
  const rawRoomId = route.query.room || `Nexus-Link-${Math.random().toString(36).substr(2, 9)}`
  const sanitizedRoomId = rawRoomId.replace(/\s+/g, '')

  setTimeout(() => {
    if (window.JitsiMeetExternalAPI) {
      initJitsi(sanitizedRoomId)
    } else {
      console.error('Jitsi External API script not found. Please add it to index.html')
    }
  }, 500)
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

/* ATMOSPHERIC GRADIENTS */
.page-bg-gradient {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none;
  background: 
    radial-gradient(circle at 50% 30%, rgba(37, 99, 235, 0.08), transparent 60%),
    radial-gradient(circle at 10% 80%, rgba(56, 189, 248, 0.04), transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.05), transparent 50%);
  z-index: 0;
}

/* TYPOGRAPHY */
.page-title {
  font-size: clamp(2rem, 4vw, 3.2rem);
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

/* CARDS & CONTAINERS */
.glass-card {
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 40px 100px rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 24px;
}

.nexus-video-window {
  height: clamp(500px, 60vh, 800px);
  overflow: hidden;
}

/* BUTTONS */
.btn-danger-glow {
  border-radius: 50px;
  text-transform: none;
  background: linear-gradient(135deg, #b91c1c, #dc2626) !important;
  box-shadow: 0 10px 25px -5px rgba(220, 38, 38, 0.5);
  transition: all 0.3s ease;
}
.btn-danger-glow:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 35px -5px rgba(220, 38, 38, 0.6);
}

@media (max-width: 768px) {
  .page-shell { padding-top: 60px; padding-bottom: 60px; }
  .page-title { font-size: 2.2rem; }
  .nexus-video-window { height: 60vh; border-radius: 16px; }
}
</style>
