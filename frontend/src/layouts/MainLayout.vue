<template>
  <q-layout view="lHh Lpr lFf" class="bg-black text-white">

    <!-- HEADER -->
    <q-header elevated class="nexus-header">
      <q-toolbar class="q-py-md">

        <q-btn flat dense round icon="menu" @click="toggleLeftDrawer" class="text-cyan-4" />

        <q-toolbar-title class="font-orbitron text-cyan-4 text-weight-bolder letter-spacing-3">
          <q-icon name="hub" size="md" class="q-mr-sm glow-icon" />
          NEXUS CARE
        </q-toolbar-title>

        <q-space />

        <div class="row items-center q-gutter-md no-wrap">

          <!-- SYSTEM STATUS -->
          <div class="status-pill row items-center q-px-md q-py-xs hide-xs">
            <q-badge rounded color="green" class="pulse-green q-mr-sm" />
            <span class="text-overline text-cyan-2">SYSTEM: ONLINE</span>
          </div>

          <!-- LOGIN BUTTON (WHEN NOT LOGGED IN) -->
          <q-btn
            v-if="!isLoggedIn"
            flat
            dense
            icon="login"
            label="LOGIN"
            class="text-cyan-4 font-orbitron"
            to="/login"
          />

          <!-- AVATAR (WHEN LOGGED IN) -->
          <q-avatar
            v-if="isLoggedIn"
            size="42px"
            class="border-cyan glow-avatar cursor-pointer"
            @click="goProfile"
          >
            <img src="https://cdn.quasar.dev/img/avatar.png">
          </q-avatar>

          <!-- LOGOUT -->
          <q-btn
            v-if="isLoggedIn"
            flat
            dense
            icon="logout"
            class="text-red-4"
            @click="logout"
          />

        </div>

      </q-toolbar>
    </q-header>

    <!-- SIDEBAR -->
    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :width="280"
      class="nexus-drawer"
    >
      <div class="sidebar-content full-height bg-black-nexus">
        <q-scroll-area class="fit">
          <div class="q-pa-md">

            <div class="text-cyan-4 text-weight-bold uppercase q-mb-xl">
              Navigation Nodes
            </div>

            <q-list>

              <q-item clickable v-ripple to="/" exact class="nexus-nav-item">
                <q-item-section avatar>
                  <q-icon name="dashboard" color="cyan-4" />
                </q-item-section>
                <q-item-section>Command Center</q-item-section>
              </q-item>

              <q-item clickable v-ripple to="/symptoms" class="nexus-nav-item active-node">
                <q-item-section avatar>
                  <q-icon name="auto_awesome" color="cyan-2" />
                </q-item-section>
                <q-item-section>Interaction Hub</q-item-section>
              </q-item>

              <q-separator dark class="q-my-lg" />

              <q-item disable>
                <q-item-section avatar><q-icon name="person" /></q-item-section>
                <q-item-section>Patient MS1</q-item-section>
              </q-item>

              <q-item disable>
                <q-item-section avatar><q-icon name="medical_services" /></q-item-section>
                <q-item-section>Doctor MS2</q-item-section>
              </q-item>

              <q-item disable>
                <q-item-section avatar><q-icon name="event" /></q-item-section>
                <q-item-section>Schedule MS3</q-item-section>
              </q-item>

            </q-list>

          </div>
        </q-scroll-area>

        <div class="absolute-bottom q-pa-md">
          <q-btn flat dense class="full-width text-cyan-10" icon="terminal" label="VIEW LOGS" />
        </div>
      </div>
    </q-drawer>

    <!-- PAGE -->
    <q-page-container>
      <router-view />
    </q-page-container>

  </q-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const leftDrawerOpen = ref(false)

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

/* =========================
   AUTH STATE
========================= */

const isLoggedIn = computed(() => {
  return !!localStorage.getItem('nexus_token')
})

const logout = () => {
  localStorage.removeItem('nexus_token')
  localStorage.removeItem('nexus_user')
  router.push('/login')
}

const goProfile = () => {
  const user = JSON.parse(localStorage.getItem('nexus_user') || '{}')

  if (user.role === 'patient') router.push('/patient/dashboard')
  else if (user.role === 'doctor') router.push('/doctor/dashboard')
  else if (user.role === 'admin') router.push('/admin/dashboard')
  else router.push('/')
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');

.font-orbitron { font-family: 'Orbitron', sans-serif; }

:deep(.q-drawer) {
  background: #00080a !important;
}

.nexus-header {
  background: rgba(0, 8, 10, 0.9);
  backdrop-filter: blur(15px);
  border-bottom: 1px solid rgba(0, 255, 255, 0.1);
}

.status-pill {
  background: rgba(0, 255, 255, 0.05);
  border: 1px solid rgba(0, 255, 255, 0.1);
}

.pulse-green {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(0,255,0,0.4); }
  70% { box-shadow: 0 0 0 6px rgba(0,255,0,0); }
  100% { box-shadow: 0 0 0 0 rgba(0,255,0,0); }
}

.active-node {
  background: rgba(0,255,255,0.1);
}
</style>