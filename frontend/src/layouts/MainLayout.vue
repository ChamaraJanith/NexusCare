<template>
  <q-layout view="hHh lpR fFf" class="nexus-layout bg-dark text-white">

    <q-header class="nexus-header" bordered>
      <q-toolbar class="q-py-sm q-px-lg">

        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          class="lt-md q-mr-sm"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title
          class="row items-center no-wrap text-weight-bold cursor-pointer font-plus-jakarta"
          @click="$router.push('/')"
        >
          <div class="nexus-logo-sm q-mr-sm">
            <div class="logo-icon">N</div>
          </div>
          <span class="logo-text">Nexus Care</span>
        </q-toolbar-title>

        <q-space />

        <div class="gt-sm row items-center text-weight-medium text-caption font-plus-jakarta nav-strip">
          <span class="cursor-pointer nav-link" @click="$router.push('/appointment')">Book Appointment</span>
          <span class="cursor-pointer nav-link" @click="$router.push('/telemedicine')">Telemedicine</span>
          <span class="cursor-pointer nav-link" @click="$router.push('/symptoms')">AI Symptom Checker</span>
        </div>

        <q-space class="gt-sm" />

        <div class="row items-center q-gutter-sm font-plus-jakarta">
          <template v-if="!isLoggedIn">
            <q-btn
              flat
              label="Login"
              class="text-capitalize text-weight-bold text-caption q-mr-sm"
              to="/login"
            />
            <q-btn
              unelevated
              color="white"
              text-color="black"
              label="Register"
              class="text-capitalize text-weight-bold rounded-borders q-px-md text-caption"
              to="/register"
            />
          </template>

          <template v-else>
            <q-btn flat round dense icon="notifications" class="q-mr-sm" />
            <div class="nexus-avatar cursor-pointer" @click="goProfile">
              <img :src="profileImageUrl" alt="profile" />
              <q-menu anchor="bottom right" self="top right">
                <q-list style="min-width: 150px">
                  <q-item clickable v-close-popup @click="goProfile">
                    <q-item-section>Dashboard</q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item clickable v-close-popup @click="logout" class="text-red">
                    <q-item-section>Logout</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </div>
          </template>
        </div>

      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      side="left"
      overlay
      behavior="mobile"
      class="bg-dark text-white"
    >
      <q-scroll-area class="fit">
        <div class="q-pa-md">
          <div class="text-h6 text-weight-bold q-mb-lg row items-center font-plus-jakarta">
            <div class="nexus-logo-xs q-mr-sm">
              <img src="https://cdn.quasar.dev/logo-v2/svg/logo-mono-white.svg" alt="logo" />
            </div>
            Nexus Care
          </div>

          <q-list padding class="font-plus-jakarta">
            <q-item clickable v-ripple to="/">
              <q-item-section avatar><q-icon name="home" /></q-item-section>
              <q-item-section>Home</q-item-section>
            </q-item>
            <q-item clickable v-ripple to="/appointment">
              <q-item-section avatar><q-icon name="event" /></q-item-section>
              <q-item-section>Book Appointment</q-item-section>
            </q-item>
            <q-item clickable v-ripple to="/telemedicine">
              <q-item-section avatar><q-icon name="videocam" /></q-item-section>
              <q-item-section>Telemedicine</q-item-section>
            </q-item>
            <q-item clickable v-ripple to="/symptoms">
              <q-item-section avatar><q-icon name="health_and_safety" /></q-item-section>
              <q-item-section>AI Symptom Checker</q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

  </q-layout>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const leftDrawerOpen = ref(false)
const isLoggedIn = ref(false)
const currentUser = ref({})

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

const syncAuthState = () => {
  isLoggedIn.value = !!localStorage.getItem('nexus_token')

  try {
    currentUser.value = JSON.parse(localStorage.getItem('nexus_user') || '{}')
  } catch {
    currentUser.value = {}
  }
}

const profileImageUrl = computed(() => {
  return currentUser.value.profileImage
    || currentUser.value.avatar
    || currentUser.value.avatarUrl
    || currentUser.value.photoUrl
    || 'https://cdn.quasar.dev/img/avatar.png'
})

const logout = () => {
  localStorage.removeItem('nexus_token')
  localStorage.removeItem('nexus_user')
  syncAuthState()
  router.push('/login')
}

const goProfile = () => {
  const user = currentUser.value || {}

  if (user.role === 'patient') router.push('/patient/dashboard')
  else if (user.role === 'doctor') router.push('/doctor/dashboard')
  else if (user.role === 'admin') router.push('/admin/dashboard')
  else router.push('/')
}

const onStorageChange = (event) => {
  if (event.key === 'nexus_token' || event.key === 'nexus_user' || event.key === null) {
    syncAuthState()
  }
}

onMounted(() => {
  syncAuthState()
  window.addEventListener('storage', onStorageChange)
  window.addEventListener('focus', syncAuthState)
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', onStorageChange)
  window.removeEventListener('focus', syncAuthState)
})

watch(() => route.fullPath, () => {
  syncAuthState()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

.font-plus-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }

.nexus-layout { background-color: #0b0f19; }

.nexus-header {
  background: rgba(5, 9, 20, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: #2563eb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 900;
  font-size: 18px;
}

.logo-text {
  font-size: 1.2rem;
  letter-spacing: -0.5px;
}

.nav-link {
  transition: all 0.3s ease;
  color: #94a3b8;
  white-space: nowrap;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}
.nav-link:hover { color: #ffffff; }
.rounded-borders { border-radius: 50px; }

.nav-strip {
  gap: 24px;
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: thin;
}

.nav-strip::-webkit-scrollbar {
  height: 4px;
}

.nav-strip::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.25);
  border-radius: 999px;
}

/* Logo icon - toolbar (32px) */
.nexus-logo-sm {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.nexus-logo-sm img { width: 100%; height: 100%; object-fit: contain; }

/* Logo icon - drawer (24px) */
.nexus-logo-xs {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.nexus-logo-xs img { width: 100%; height: 100%; object-fit: contain; }

/* User profile avatar (36px) */
.nexus-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.nexus-avatar img { width: 100%; height: 100%; object-fit: cover; }

@media (max-width: 1200px) {
  .nav-strip {
    gap: 16px;
    max-width: 360px;
  }
}

@media (max-width: 768px) {
  .nexus-header .q-toolbar {
    padding-left: 10px;
    padding-right: 10px;
  }

  .nexus-header .q-toolbar-title {
    font-size: 1rem;
  }
}
</style>
