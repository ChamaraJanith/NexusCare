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
            <div class="text-cyan-2 q-mt-md">SYNCING INTERFACE...</div>
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
      prejoinPageEnabled: false, // prejoin page එක අයින් කරයි
      startWithAudioMuted: false,
      startWithVideoMuted: false,
    },
    interfaceConfigOverwrite: {
      TOOLBAR_BUTTONS: [
        'microphone', 'camera', 'fullscreen', 'fittowindow', 'hangup', 'chat'
      ],
      SHOW_JITSI_WATERMARK: false,
    },
    userInfo: {
      displayName: isDoctor ? 'Dr. Aris (Consultant)' : 'Patient Node'
    }
  }

  // Jitsi API එක පණගන්වයි
  jitsiApi = new window.JitsiMeetExternalAPI(domain, options)

  jitsiApi.addEventListeners({
    videoConferenceJoined: () => { loading.value = false },
    readyToClose: () => endSession()
  })
}

const endSession = () => {
  if (jitsiApi) jitsiApi.dispose()
  router.push('/')
}

onMounted(() => {
  const roomId = route.query.room || `Nexus-Link-${Math.random().toString(36).substr(2, 9)}`

  // Script එක load වෙනකම් පොඩි වෙලාවක් ඉන්නවා
  setTimeout(() => {
    initJitsi(roomId)
  }, 500)
})

onBeforeUnmount(() => {
  if (jitsiApi) jitsiApi.dispose()
})
</script>

<style scoped>
.nexus-video-window {
  height: 70vh;
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  background: #000;
}
.font-orbitron { font-family: 'Orbitron', sans-serif; }
.glass { background: rgba(255, 255, 255, 0.02); backdrop-filter: blur(10px); }
.nexus-btn { border-radius: 12px; box-shadow: 0 0 15px rgba(255, 0, 0, 0.2); }
</style>
