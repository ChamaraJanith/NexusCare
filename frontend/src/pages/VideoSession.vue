<template>
  <q-page class="bg-black q-pa-md flex flex-center overflow-hidden">
    <div class="row justify-center full-width">
      <div class="col-12 col-md-10 col-lg-9">

        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6 font-orbitron text-white uppercase letter-spacing-1">
            <q-icon name="hub" color="cyan-4" class="q-mr-sm" />
            Neural Bridge: {{ isDoctor ? 'Consultant' : 'Patient' }}
          </div>
          <q-badge color="green-9" label="ENCRYPTED P2P" class="q-pa-xs" />
        </div>

        <div id="jitsi-container" class="nexus-video-window glass">
          <div v-if="loading" class="absolute-center text-center">
            <q-spinner-orbit color="cyan-4" size="4rem" />
            <div class="text-cyan-2 q-mt-md font-orbitron">SYNCING INTERFACE...</div>
          </div>
        </div>

        <div class="row q-mt-md justify-end">
          <q-btn
            label="TERMINATE NEURAL LINK"
            color="red-10"
            icon="power_settings_new"
            @click="endSession"
            class="font-orbitron nexus-btn"
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
      // --- Moderator/Waiting Screen එක අයින් කරන settings ---
      prejoinPageEnabled: false,
      disableInviteFunctions: true,
      enableUserRolesBasedOnToken: false, // Moderator කෙනෙක් නැතිව වුණත් session එක පටන් ගැනීමට
      enableWelcomePage: false,
      p2p: { enabled: true },             // Direct connection එකකට මාරු වීම

      // --- Audio/Video Settings ---
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

  // Jitsi API එක පණගන්වයි
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
  // Room ID එකේ spaces අයින් කරලා ගන්නවා URL එකේ ගැටළු නොවන්න
  const rawRoomId = route.query.room || `Nexus-Link-${Math.random().toString(36).substr(2, 9)}`
  const sanitizedRoomId = rawRoomId.replace(/\s+/g, '')

  // Script එක load වෙනකම් පොඩි වෙලාවක් ඉන්නවා
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
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');

.font-orbitron { font-family: 'Orbitron', sans-serif; }

.nexus-video-window {
  height: 70vh;
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  background: #000;
  box-shadow: 0 0 30px rgba(0, 255, 255, 0.1);
}

.glass {
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(10px);
}

.nexus-btn {
  border-radius: 12px;
  box-shadow: 0 0 15px rgba(255, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.nexus-btn:hover {
  box-shadow: 0 0 25px rgba(255, 0, 0, 0.4);
  transform: translateY(-2px);
}

.letter-spacing-1 {
  letter-spacing: 1px;
}
</style>
