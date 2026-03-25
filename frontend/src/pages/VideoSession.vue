<template>
  <q-page class="bg-black q-pa-md flex flex-center relative-position overflow-hidden">
    <div class="absolute-top-right orb-bg shadow-cyan"></div>
    <div class="absolute-bottom-left orb-bg shadow-purple"></div>

    <div class="row justify-center full-width z-top">
      <div class="col-12 col-md-10 col-lg-9">

        <div class="row items-center justify-between q-mb-md animate-fade-in">
          <div class="row items-center">
            <q-btn flat round icon="arrow_back" color="cyan-4" @click="$router.back()" class="q-mr-sm" />
            <div>
              <div class="text-h6 font-orbitron text-white">NEURAL VIDEO LINK</div>
              <div class="text-caption text-cyan-4 uppercase letter-spacing-1">
                {{ isDoctor ? 'Provider Access Mode' : 'Patient Secure Bridge' }}
              </div>
            </div>
          </div>
          <q-badge :color="isConnected ? 'green-9' : 'orange-9'" class="q-pa-sm pulse-glow">
            {{ isConnected ? 'STABLE CONNECTION' : 'INITIALIZING NODE...' }}
          </q-badge>
        </div>

        <q-card flat class="nexus-video-card glass overflow-hidden shadow-24">
          <div v-if="loading" class="absolute-center text-center">
            <q-spinner-orbit color="cyan-4" size="5rem" />
            <div class="text-cyan-2 q-mt-md font-orbitron">SYNCING NEURAL INTERFACE...</div>
          </div>

          <iframe
            v-if="roomUrl"
            :src="roomUrl"
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            class="full-video-frame"
            @load="onFrameLoad"
          ></iframe>
        </q-card>

        <div class="row q-col-gutter-md q-mt-md">
          <div class="col-12 col-sm-6">
            <q-card flat class="nexus-card glass q-pa-md row items-center">
              <q-icon
                :name="isDoctor ? 'medical_services' : 'person'"
                color="cyan-4"
                size="md"
                class="q-mr-md"
              />
              <div>
                <div class="text-overline text-cyan-4">Active Session Node</div>
                <div class="text-subtitle1 text-white text-weight-bolder uppercase">
                  {{ isDoctor ? 'Medical Consultant' : 'Verified Patient' }}
                </div>
              </div>
            </q-card>
          </div>
          <div class="col-12 col-sm-6">
            <q-btn
              label="TERMINATE LINK"
              color="red-10"
              icon="power_settings_new"
              class="full-width full-height nexus-btn-terminate font-orbitron"
              @click="endSession"
            />
          </div>
        </div>

      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { api } from 'boot/axios'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const roomUrl = ref('')
const loading = ref(true)
const isConnected = ref(false)

// URL එකේ 'role=doctor' තියෙනවද කියලා බලනවා
const isDoctor = computed(() => route.query.role === 'doctor')

const onFrameLoad = () => {
  loading.value = false
  isConnected.value = true
}

const endSession = () => {
  // Session එක ඉවර වුණාම Dashboard එකට redirect කිරීම
  const redirectPath = isDoctor.value ? '/doctor-dashboard' : '/symptoms'
  router.push(redirectPath)
}

// රෝගියා සඳහා අලුත් Session එකක් Backend එකෙන් ලබා ගැනීම
const startNewSession = async () => {
  try {
    const response = await api.post('http://localhost:5005/api/video/initialize-link', {
      patientId: "PATIENT-001",
      doctorId: "DOC-NEURAL-X"
    })

    if (response.data.success) {
      const baseLink = response.data.data.roomUrl
      // Configs add කරනවා prejoin page එක අයින් කරන්න සහ toolbar එක පාලනය කරන්න
      roomUrl.value = `${baseLink}#config.prejoinPageEnabled=false&interfaceConfig.TOOLBAR_BUTTONS=['microphone','camera','fullscreen','hangup','chat','tileview']`
    }
  } catch (error) {
    console.error('API Connection Error:', error)
    loading.value = false
  }
}

onMounted(() => {
  const existingRoomId = route.query.room

  if (existingRoomId) {
    // ඩොක්ටර් කෙනෙක් හෝ වෙනත් කෙනෙක් ලින්ක් එකෙන් ආවොත් (e.g. ?room=nexus-link-abc)
    roomUrl.value = `https://meet.jit.si/${existingRoomId}#config.prejoinPageEnabled=false`
    console.log('Connecting to existing Neural Link:', existingRoomId)
  } else {
    // රෝගියා මුලින්ම එන අවස්ථාව
    startNewSession()
  }
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');

.font-orbitron { font-family: 'Orbitron', sans-serif; }
.z-top { z-index: 10; }

.nexus-video-card {
  height: 68vh;
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 24px;
  position: relative;
  box-shadow: 0 0 40px rgba(0, 255, 255, 0.15);
}

.full-video-frame {
  width: 100%;
  height: 100%;
  border: none;
}

.glass {
  background: rgba(255, 255, 255, 0.03) !important;
  backdrop-filter: blur(20px);
}

.nexus-btn-terminate {
  border-radius: 12px;
  transition: all 0.3s ease;
}

.nexus-btn-terminate:hover {
  background: #7a0000 !important;
  box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
}

.orb-bg {
  position: absolute;
  width: 500px; height: 500px;
  border-radius: 50%; filter: blur(100px); opacity: 0.12;
}
.shadow-cyan { background: #00ffff; top: -15%; right: -10%; }
.shadow-purple { background: #673ab7; bottom: -15%; left: -10%; }

.pulse-glow {
  animation: pulse-animation 2s infinite;
}

@keyframes pulse-animation {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(0.98); }
  100% { opacity: 1; transform: scale(1); }
}

.letter-spacing-1 { letter-spacing: 1px; }
</style>
