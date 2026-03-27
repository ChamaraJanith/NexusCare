<template>
  <q-layout view="hHh lpR fFf" class="nexus-layout text-white font-jakarta">

    <q-header class="nexus-header" :class="{ 'header-scrolled': isScrolled }">
      <q-toolbar class="q-py-md q-px-xl max-width-1400 q-mx-auto">

        <!-- Mobile Menu -->
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          class="lt-md q-mr-sm"
          @click="toggleLeftDrawer"
        />

        <!-- Logo -->
        <q-toolbar-title
          class="row items-center no-wrap text-weight-bold cursor-pointer font-jakarta"
          @click="$router.push('/')"
          shrink
        >
          <div class="logo-circle q-mr-sm">
            <span class="logo-letter">N</span>
          </div>
          <span class="logo-text text-h6 text-weight-bold tracking-tight">Nexus Care</span>
        </q-toolbar-title>

        <q-space />

        <!-- Desktop Nav -->
        <div class="gt-sm row items-center justify-center nav-links-container q-gutter-x-xl text-caption text-weight-bold text-uppercase tracking-wider text-grey-4">
          <span class="cursor-pointer nav-link" @click="$router.push('/appointment')">Book Appointment</span>
          <span class="cursor-pointer nav-link" @click="goTelemedicine">Telemedicine</span>
          <span class="cursor-pointer nav-link" @click="$router.push('/symptoms')">AI Symptom Checker</span>
        </div>

        <q-space class="gt-sm" />

        <!-- Auth -->
        <div class="row items-center q-gutter-sm">
          <template v-if="!isLoggedIn">
            <q-btn
              flat
              label="Login"
              class="text-capitalize text-weight-bold font-jakarta text-body2 login-btn q-mr-xs"
              to="/login"
            />
            <q-btn
              unelevated
              color="white"
              text-color="black"
              label="Register"
              class="text-capitalize text-weight-bold rounded-pill q-px-lg q-py-xs font-jakarta text-body2 register-btn"
              to="/register"
            />
          </template>

          <template v-else>
            <q-btn flat round dense icon="notifications" class="q-mr-sm text-grey-4 hover-white" />
            <div class="avatar-ring cursor-pointer" @click="goProfile">
              <img :src="profileImageUrl" alt="profile" class="avatar-img" />
              <q-menu anchor="bottom right" self="top right" class="bg-dark text-white border-dark">
                <q-list style="min-width: 180px">
                  <q-item clickable v-close-popup @click="goProfile" class="hover-bg-light">
                    <q-item-section avatar><q-icon name="dashboard" size="sm" color="blue-4" /></q-item-section>
                    <q-item-section class="text-weight-bold">Dashboard</q-item-section>
                  </q-item>
                  <q-separator color="grey-9" />
                  <q-item clickable v-close-popup @click="logout" class="hover-bg-light text-red-4">
                    <q-item-section avatar><q-icon name="logout" size="sm" /></q-item-section>
                    <q-item-section class="text-weight-bold">Logout</q-item-section>
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
      class="mobile-drawer text-white"
    >
      <div class="column full-height">
        <div class="q-pa-lg row items-center justify-between">
          <div class="row items-center">
            <div class="logo-circle q-mr-sm" style="width: 28px; height: 28px;">
              <span class="logo-letter" style="font-size: 14px;">N</span>
            </div>
            <span class="text-h6 text-weight-bold tracking-tight">Nexus Care</span>
          </div>
          <q-btn flat round dense icon="close" @click="toggleLeftDrawer" />
        </div>

        <q-scroll-area class="col q-px-md">
          <q-list padding class="font-jakarta text-weight-bold text-uppercase tracking-wider">
            <q-item clickable v-ripple to="/" class="drawer-item q-mb-sm">
              <q-item-section avatar><q-icon name="home" color="blue-4" /></q-item-section>
              <q-item-section>Home</q-item-section>
            </q-item>
            <q-item clickable v-ripple to="/appointment" class="drawer-item q-mb-sm">
              <q-item-section avatar><q-icon name="event" color="blue-4" /></q-item-section>
              <q-item-section>Book Appointment</q-item-section>
            </q-item>
            <q-item clickable v-ripple class="drawer-item q-mb-sm" @click="goTelemedicine">
              <q-item-section avatar><q-icon name="videocam" color="blue-4" /></q-item-section>
              <q-item-section>Telemedicine</q-item-section>
            </q-item>
            <q-item clickable v-ripple to="/symptoms" class="drawer-item q-mb-sm">
              <q-item-section avatar><q-icon name="health_and_safety" color="blue-4" /></q-item-section>
              <q-item-section>AI Symptom Checker</q-item-section>
            </q-item>
          </q-list>
        </q-scroll-area>

        <div class="q-pa-lg">
          <div class="text-caption text-grey-6 text-center">© 2026 Nexus Care</div>
        </div>
      </div>
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
const isScrolled = ref(false)

const handleScroll = () => {
  isScrolled.value = window.scrollY > 20
}

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

const goTelemedicine = () => {
  syncAuthState()

  if (leftDrawerOpen.value) {
    leftDrawerOpen.value = false
  }

  if (isLoggedIn.value) {
    router.push('/patientVideo')
  } else {
    router.push('/login')
  }
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
  window.addEventListener('scroll', handleScroll)
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', onStorageChange)
  window.removeEventListener('focus', syncAuthState)
  window.removeEventListener('scroll', handleScroll)
})

watch(() => route.fullPath, () => {
  syncAuthState()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }

.nexus-layout {
  background-color: transparent;
}

.max-width-1400 {
  max-width: 1400px;
  width: 100%;
}

.tracking-tight { letter-spacing: -0.5px; }
.tracking-wider { letter-spacing: 1px; }

.nexus-header {
  background: transparent;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  padding-top: 10px;
  padding-bottom: 10px;
}

.header-scrolled {
  background: rgba(4, 7, 16, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 0;
  padding-bottom: 0;
  box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5);
}

.logo-circle {
  width: 38px;
  height: 38px;
  background: linear-gradient(135deg, #3b82f6, #0ea5e9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.logo-letter {
  color: white;
  font-weight: 800;
  font-size: 20px;
}

.nav-links-container {
  gap: 32px;
}

.nav-link {
  transition: all 0.3s ease;
  position: relative;
  font-size: 0.72rem;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 0;
  width: 0%;
  height: 2px;
  background: #3b82f6;
  transition: width 0.3s ease;
  border-radius: 2px;
}

.nav-link:hover {
  color: #ffffff !important;
}

.nav-link:hover::after {
  width: 100%;
}

.login-btn {
  border-radius: 50px;
  transition: all 0.3s ease;
  color: #e2e8f0 !important;
}

.login-btn:hover {
  background: rgba(255,255,255,0.05);
  color: #ffffff !important;
}

.register-btn {
  border-radius: 50px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 14px rgba(255,255,255,0.15);
}

.register-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255,255,255,0.25);
  background: #f8fafc !important;
}

.avatar-ring {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  padding: 2px;
  background: linear-gradient(135deg, #3b82f6, #14b8a6);
  transition: transform 0.3s ease;
}

.avatar-ring:hover {
  transform: scale(1.05);
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #040710;
}

.mobile-drawer {
  background: rgba(4, 7, 16, 0.95);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255,255,255,0.05);
}

.drawer-item {
  border-radius: 12px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.drawer-item:hover {
  background: rgba(255,255,255,0.05);
}

.border-dark {
  border: 1px solid rgba(255,255,255,0.08);
}

.hover-bg-light:hover {
  background: rgba(255,255,255,0.05);
}
</style>
