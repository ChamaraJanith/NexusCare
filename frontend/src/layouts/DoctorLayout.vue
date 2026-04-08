<template>
  <q-layout view="lHh Lpr lFf">

    <!-- SIDEBAR -->
    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :width="260"
      :breakpoint="1024"
      style="background: linear-gradient(180deg, #1a2a3a 0%, #0f1f2e 100%);"
      class="text-white"
    >
      <div style="padding: 28px 20px 20px 20px;" class="flex items-center">
        <q-icon name="health_and_safety" size="28px" color="teal-3" class="q-mr-sm" />
        <span class="text-h6 text-weight-bold text-white" style="letter-spacing: 0.5px;">NexusCare</span>
      </div>

      <q-list padding style="padding: 0 12px;">
        <q-item
          v-for="item in sidebarItems"
          :key="item.path"
          clickable
          v-ripple
          :to="item.to || item.path"
          active-class="sidebar-active-item"
          class="sidebar-nav-item q-mb-xs text-grey-4"
          style="border-radius: 8px; min-height: 44px;"
        >
          <q-item-section avatar style="min-width: 36px;">
            <q-icon :name="item.icon" size="20px" />
          </q-item-section>
          <q-item-section class="text-weight-medium" style="font-size: 14px;">
            {{ item.label }}
          </q-item-section>
        </q-item>
      </q-list>

      <!-- Logout at bottom -->
      <div style="position: absolute; bottom: 20px; left: 12px; right: 12px;">
        <q-item clickable v-ripple @click="logout" class="text-grey-5" style="border-radius: 8px;">
          <q-item-section avatar style="min-width: 36px;">
            <q-icon name="logout" size="20px" />
          </q-item-section>
          <q-item-section class="text-weight-medium" style="font-size: 14px;">Logout</q-item-section>
        </q-item>
      </div>
    </q-drawer>

    <!-- HEADER -->
    <q-header elevated style="background: #ffffff; border-bottom: 1px solid #eee;">
      <q-toolbar class="text-dark" style="min-height: 56px;">
        <q-btn flat dense round icon="menu" color="dark" class="lt-lg q-mr-sm" @click="toggleLeftDrawer" />
        <q-toolbar-title class="text-weight-medium text-dark" style="font-size: 16px;">
          {{ currentPageTitle }}
        </q-toolbar-title>
        <q-space />
        <q-btn flat round dense icon="notifications_none" color="grey-7" class="q-mr-md" />
        <div class="row items-center no-wrap cursor-pointer" @click="$router.push('/doctor/profile')">
          <q-avatar size="36px" class="q-mr-sm" style="background: #e8e8e8; color: #555;">
            <img v-if="getAvatarUrl" :src="getAvatarUrl" />
            <div v-else class="text-weight-bold" style="font-size: 16px;">
              {{ doctor.name ? doctor.name.charAt(0).toUpperCase() : 'DR' }}
            </div>
          </q-avatar>
          <div class="column gt-xs">
            <div class="text-weight-bold text-dark" style="font-size: 13px; line-height: 1.2;">
              Dr. {{ doctor.name || 'Loading...' }}
              <q-icon name="keyboard_arrow_down" size="14px" color="grey-6" />
            </div>
            <div class="row items-center" style="font-size: 11px; color: #4caf50; line-height: 1;">
              <div style="width: 7px; height: 7px; border-radius: 50%; background: #4caf50; margin-right: 4px;"></div>
              Active
            </div>
          </div>
        </div>
      </q-toolbar>
    </q-header>

    <!-- CONTENT — child pages render here -->
    <q-page-container>
      <router-view :doctor="doctor" :loading="loading" />
    </q-page-container>

  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted, provide } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { fetchDoctorProfile } from 'src/services/doctorApi';

const router = useRouter();
const route = useRoute();

const leftDrawerOpen = ref(true);
const toggleLeftDrawer = () => { leftDrawerOpen.value = !leftDrawerOpen.value; };

const loading = ref(true);
const doctor = ref({});

const DOCTOR_SERVICE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8080';

const getAvatarUrl = computed(() => {
  if (!doctor.value?.profileImage) return null;
  const url = typeof doctor.value.profileImage === 'string'
    ? doctor.value.profileImage
    : doctor.value.profileImage.url || null;
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${DOCTOR_SERVICE_URL}${url}`;
});

const parseJwt = (t) => {
  try { return JSON.parse(atob(t.split('.')[1])); }
  catch { return null; }
};

const getDoctorId = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('nexus_token');
  return parseJwt(token)?.roleId || null;
};

const sidebarItems = computed(() => {
  const docId = getDoctorId();
  return [
    { label: 'Dashboard',       icon: 'dashboard',        path: '/doctor/dashboard' },
    { label: 'My Schedule',     icon: 'calendar_today',   path: '/doctor/schedule' },
    { label: 'Patient Records', icon: 'group',            path: '/doctor/patients' },
    { label: 'Consultations',   icon: 'chat',             path: '/doctor/consultations' },
    { label: 'Availability',    icon: 'event_available',  path: '/doctor/availability' },
    { label: 'Video Conference',icon: 'videocam',         path: '/doctorVideo', to: { path: '/doctorVideo', query: { doctorId: docId } } },
    { label: 'Reports',         icon: 'description',      path: '/doctor/reports' },
  ];
});

const currentPageTitle = computed(() => {
  const item = sidebarItems.value.find(i => route.path === i.path);
  return item ? item.label : 'Doctor Portal';
});

// Provide doctor data to all child pages
provide('doctor', doctor);
provide('doctorLoading', loading);

const decodeJwtPayload = (token) => {
  try {
    const base64Url = token.split('.')[1] || '';
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padLength = 4 - (base64.length % 4);
    if (padLength > 0 && padLength < 4) {
      base64 += '='.repeat(padLength);
    }
    return JSON.parse(atob(base64));
  } catch (e) {
    console.warn('[DoctorLayout] JWT decode failed:', e.message);
    return null;
  }
};

const loadDoctorProfile = async () => {
  loading.value = true;

  // Set name immediately from JWT — no API call needed
  const token = localStorage.getItem('token') || localStorage.getItem('nexus_token');
  if (token) {
    const decoded = decodeJwtPayload(token);
    if (decoded?.name) doctor.value = { ...doctor.value, name: decoded.name };
  }

  try {
    const data = await fetchDoctorProfile();
    const storedUser = JSON.parse(localStorage.getItem('nexus_user') || '{}');
    // Merge but keep name from JWT if doctor model has empty name
    doctor.value = {
      ...data,
      name: doctor.value.name || data.name || storedUser?.name || '',
      email: data.email || doctor.value.email || storedUser?.email || ''
    };
    console.log('[DoctorLayout] Doctor profile loaded:', doctor.value);
  } catch (err) {
    console.error('[DoctorLayout] Failed to load profile:', err);
  } finally {
    loading.value = false;
  }
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('nexus_token');
  localStorage.removeItem('nexus_user');
  router.push('/login');
};

onMounted(() => {
  const token = localStorage.getItem('token') || localStorage.getItem('nexus_token');
  if (!token) {
    router.push('/login');
    return;
  }
  loadDoctorProfile();
});
</script>

<style>
.sidebar-nav-item {
  transition: background 0.2s ease, color 0.2s ease;
}
.sidebar-active-item {
  background: rgba(255, 255, 255, 0.12) !important;
  color: #ffffff !important;
}
.sidebar-active-item .q-icon {
  color: #ffffff !important;
}
</style>
