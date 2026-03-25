<template>
  <q-page class="bg-black q-pa-lg">
    <div class="row items-center q-mb-xl">
      <div class="col">
        <h1 class="text-h4 font-orbitron text-cyan-4 q-ma-none uppercase tracking-tighter">
          Consultant Command Center
        </h1>
        <div class="text-grey-5 font-orbitron q-mt-xs">NODE ID: DOC-ARIS-091</div>
      </div>
      <q-badge color="cyan-10" class="q-pa-sm glow-box">
        <q-icon name="wifi" class="q-mr-xs" /> SYSTEM ONLINE
      </q-badge>
    </div>

    <div class="row q-col-gutter-lg">
      <div class="col-12 col-md-8">
        <div class="nexus-panel glass q-pa-md">
          <div class="text-subtitle1 text-white font-orbitron q-mb-md">
            <q-icon name="sensors" color="red-5" class="q-mr-sm" />
            INBOUND NEURAL LINK REQUESTS
          </div>

          <q-list separator v-if="sessions.length > 0">
            <q-item v-for="session in sessions" :key="session.roomId" class="q-py-md nexus-item">
              <q-item-section avatar>
                <q-avatar rounded size="50px" class="avatar-glow">
                  <q-icon name="person" color="cyan-4" />
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-h6 text-cyan-1 font-orbitron">{{ session.patientId }}</q-item-label>
                <q-item-label caption class="text-grey-4">
                  SESSION ID: {{ session.roomId }}
                </q-item-label>
                <q-item-label class="text-cyan-8 text-caption uppercase">
                  STATUS: {{ session.status }} | {{ formatTime(session.timestamp) }}
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-btn
                  label="ESTABLISH LINK"
                  color="cyan-10"
                  icon-right="bolt"
                  class="font-orbitron nexus-btn"
                  @click="joinSession(session.roomId)"
                />
              </q-item-section>
            </q-item>
          </q-list>

          <div v-else class="text-center q-pa-xl text-grey-7 font-orbitron">
            <q-spinner-rings color="cyan-4" size="3em" />
            <div class="q-mt-md">SCANNING FOR ACTIVE PATIENT NODES...</div>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-4">
        <div class="nexus-panel glass q-pa-md full-height">
          <div class="text-subtitle1 text-white font-orbitron q-mb-lg">BIO-DATA OVERVIEW</div>
          <div class="column q-gutter-md">
            <div class="stat-box glass">
              <div class="text-grey-5">DAILY CONSULTATIONS</div>
              <div class="text-h4 text-white font-orbitron">24</div>
            </div>
            <div class="stat-box glass border-red">
              <div class="text-red-4">CRITICAL ALERTS</div>
              <div class="text-h4 text-white font-orbitron">02</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const sessions = ref([])

// Backend එකෙන් Active Sessions ලබා ගැනීම (Port 5005)
const fetchSessions = async () => {
  try {
    // සටහන: මෙතන ඔයාගේ API endpoint එක හරියටම දෙන්න (image_895d5c.png එකේ පේන විදියට)
    const response = await axios.get('http://localhost:5005/api/video/sessions')
    if (response.data.success) {
      sessions.value = response.data.data.filter(s => s.status === 'ACTIVE')
    }
  } catch (error) {
    console.error('Failed to fetch sessions:', error)
  }
}

const joinSession = (roomId) => {
  // ඩොක්ටර්ව වීඩියෝ පේජ් එකට යවනවා
  router.push({
    path: '/video',
    query: { room: roomId, role: 'doctor' }
  })
}

const formatTime = (ts) => {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  fetchSessions()
  // සෑම තත්පර 10කට වරක්ම update කිරීම
  setInterval(fetchSessions, 10000)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');

.font-orbitron { font-family: 'Orbitron', sans-serif; }

.nexus-panel {
  border: 1px solid rgba(0, 255, 255, 0.15);
  border-radius: 15px;
  min-height: 400px;
}

.glass {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(15px);
}

.nexus-item {
  border-radius: 10px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.nexus-item:hover {
  background: rgba(0, 255, 255, 0.05);
  border-left: 3px solid #00e5ff;
}

.stat-box {
  padding: 20px;
  border-radius: 12px;
  border-bottom: 2px solid rgba(0, 255, 255, 0.3);
}

.border-red { border-bottom: 2px solid rgba(255, 0, 0, 0.3); }

.glow-box { box-shadow: 0 0 15px rgba(0, 255, 255, 0.2); }

.avatar-glow { box-shadow: 0 0 10px rgba(0, 255, 255, 0.3); background: rgba(0, 255, 255, 0.1); }

.nexus-btn {
  border-radius: 8px;
  text-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
}
</style>
