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
          <q-avatar size="32px" class="q-mr-sm">
             <img src="https://cdn.quasar.dev/logo-v2/svg/logo-mono-white.svg" alt="Nexus Care Logo">
          </q-avatar>
          Nexus Care
        </q-toolbar-title>

        <q-space />

        <div class="gt-sm row items-center q-gutter-x-xl text-weight-medium text-body2 font-plus-jakarta">
          <span class="cursor-pointer nav-link hover-text-primary" @click="$router.push('/appointment')">Book Appointment</span>
          <span class="cursor-pointer nav-link hover-text-primary" @click="$router.push('/telemedicine')">Telemedicine</span>
          <span class="cursor-pointer nav-link hover-text-primary" @click="$router.push('/symptoms')">AI Symptom Checker</span>
        </div>

        <q-space class="gt-sm" />

        <div class="row items-center q-gutter-sm font-plus-jakarta">
          <template v-if="!isLoggedIn">
            <q-btn
              flat
              label="Login"
              class="text-capitalize text-weight-bold"
              to="/login"
            />
            <q-btn
              unelevated
              color="white"
              text-color="black"
              label="Register"
              class="text-capitalize text-weight-bold rounded-borders q-px-md"
              to="/register"
            />
          </template>

          <template v-else>
            <q-btn flat round dense icon="notifications" class="q-mr-sm" />
            <q-avatar
              size="36px"
              class="cursor-pointer"
              @click="goProfile"
            >
              <img :src="profileImageUrl" alt="profile">
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
            </q-avatar>
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
            <q-avatar size="24px" class="q-mr-sm">
              <img src="https://cdn.quasar.dev/logo-v2/svg/logo-mono-white.svg">
            </q-avatar>
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
/* Importing a cleaner, modern font similar to the mockups */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

.font-plus-jakarta {
  font-family: 'Plus Jakarta Sans', sans-serif;
}

/* Base Layout Styling */
.nexus-layout {
  /* This dark color mimics the dark theme in your mockup */
  background-color: #0b0f19;
}

.nexus-header {
  background: rgba(11, 15, 25, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.nav-link {
  transition: color 0.3s ease;
  color: #a0aec0; /* Soft grey for inactive links */
}

.hover-text-primary:hover {
  color: #ffffff; /* Brighter color on hover */
}

/* Styling the Auth Buttons */
.rounded-borders {
  border-radius: 50px; /* Gives the pill shape seen in the mockups */
}
</style>
