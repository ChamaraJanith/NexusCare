<template>
  <q-layout view="lHh Lpr lFf">
    <!-- ═══════════════════════════════════════════════════
         SIDEBAR
    ══════════════════════════════════════════════════════ -->
    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      :width="260"
      :breakpoint="700"
      class="nexus-sidebar"
    >
      <!-- Logo -->
      <div class="sidebar-logo">
        <q-icon name="shield" size="26px" color="green-5" />
        <span class="logo-text">NexusCare</span>
        <q-badge label="ADMIN" color="green-6" class="admin-badge" />
      </div>

      <!-- Navigation -->
      <q-list class="sidebar-nav">
        <template v-for="item in navItems" :key="item.route">
          <q-item
            clickable
            v-ripple
            :active="$route.path === item.route || $route.path.startsWith(item.route + '/')"
            active-class="nav-item-active"
            class="nav-item"
            :to="item.route"
          >
            <q-item-section avatar>
              <q-icon :name="item.icon" size="20px" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="nav-label">{{ item.label }}</q-item-label>
            </q-item-section>
            <q-item-section side v-if="item.badge">
              <q-badge :label="item.badge" color="red-5" rounded />
            </q-item-section>
          </q-item>
        </template>
      </q-list>

      <!-- Logout -->
      <div class="sidebar-footer">
        <q-item clickable v-ripple class="nav-item logout-btn" @click="logout">
          <q-item-section avatar>
            <q-icon name="logout" size="20px" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="nav-label">Logout</q-item-label>
          </q-item-section>
        </q-item>
      </div>
    </q-drawer>

    <!-- ═══════════════════════════════════════════════════
         HEADER
    ══════════════════════════════════════════════════════ -->
    <q-header class="nexus-header">
      <q-toolbar>
        <q-btn flat round dense icon="menu" @click="leftDrawerOpen = !leftDrawerOpen" class="lt-md text-white" />
        <q-toolbar-title class="header-title">{{ pageTitle }}</q-toolbar-title>

        <q-space />

        <!-- Notification Bell -->
        <q-btn flat round dense class="header-icon-btn" @click="$router.push('/admin/notifications')">
          <q-icon name="notifications" size="22px" />
          <q-badge color="red-5" floating rounded label="3" />
        </q-btn>

        <!-- Admin User -->
        <q-btn flat no-caps class="admin-user-btn">
          <q-avatar size="34px" class="admin-avatar">
            <q-icon name="admin_panel_settings" size="20px" color="white" />
          </q-avatar>
          <div class="admin-user-info">
            <span class="admin-name">{{ adminName }}</span>
            <span class="admin-status">
              <span class="status-dot"></span> Active
            </span>
          </div>
          <q-icon name="expand_more" size="16px" class="q-ml-xs" />

          <q-menu class="header-menu">
            <q-list style="min-width: 160px">
              <q-item clickable v-close-popup @click="$router.push('/admin/settings')">
                <q-item-section avatar><q-icon name="settings" /></q-item-section>
                <q-item-section>Settings</q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-close-popup @click="logout">
                <q-item-section avatar><q-icon name="logout" color="red" /></q-item-section>
                <q-item-section class="text-red">Logout</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!-- ═══════════════════════════════════════════════════
         PAGE CONTENT
    ══════════════════════════════════════════════════════ -->
    <q-page-container class="nexus-page-container">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const leftDrawerOpen = ref(false)

const adminName = computed(() => authStore.user?.name || 'Administrator')

const pageTitleMap = {
  '/admin/dashboard':          'Dashboard',
  '/admin/users':              'User Management',
  '/admin/doctors/pending':    'Doctor Verifications',
  '/admin/doctors':            'Doctors',
  '/admin/patients':           'Patients',
  '/admin/appointments':       'Appointments',
  '/admin/payments':           'Payments',
  '/admin/fees':               'Fee Management',
  '/admin/hospitals':          'Hospitals',
  '/admin/notifications':      'Notifications',
  '/admin/reports':            'Reports & Analytics',
  '/admin/settings':           'Settings',
}

const pageTitle = computed(() => {
  for (const [path, title] of Object.entries(pageTitleMap)) {
    if (route.path === path || route.path.startsWith(path + '/')) return title
  }
  return 'Admin Panel'
})

const navItems = ref([
  { label: 'Dashboard',           icon: 'dashboard',           route: '/admin/dashboard' },
  { label: 'User Management',     icon: 'manage_accounts',     route: '/admin/users' },
  { label: 'Doctor Verifications',icon: 'verified_user',       route: '/admin/doctors/pending', badge: null },
  { label: 'Doctors',             icon: 'medical_services',    route: '/admin/doctors' },
  { label: 'Patients',            icon: 'people',              route: '/admin/patients' },
  { label: 'Appointments',        icon: 'calendar_today',      route: '/admin/appointments' },
  { label: 'Payments',            icon: 'payments',            route: '/admin/payments' },
  { label: 'Fee Management',      icon: 'price_change',        route: '/admin/fees' },
  { label: 'Hospitals',           icon: 'local_hospital',      route: '/admin/hospitals' },
  { label: 'Reports & Analytics', icon: 'bar_chart',           route: '/admin/reports' },
  { label: 'Settings',            icon: 'settings',            route: '/admin/settings' },
])

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style lang="scss">
/* ── SIDEBAR ─────────────────────────────────────────────── */
.nexus-sidebar {
  background: #0d1b2a !important;
  border-right: none !important;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 20px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.07);

  .logo-text {
    font-family: 'Poppins', sans-serif;
    font-weight: 700;
    font-size: 18px;
    color: #ffffff;
    letter-spacing: 0.3px;
  }

  .admin-badge {
    font-size: 9px;
    letter-spacing: 0.5px;
    padding: 2px 6px;
  }
}

.sidebar-nav {
  padding: 12px 0;
}

.nav-item {
  margin: 2px 10px;
  border-radius: 8px;
  color: rgba(255,255,255,0.55) !important;
  transition: all 0.18s ease;
  min-height: 44px;

  &:hover {
    background: rgba(255,255,255,0.06) !important;
    color: rgba(255,255,255,0.85) !important;
  }

  .q-icon { color: inherit !important; }
  .nav-label { font-size: 14px; font-weight: 500; }
}

.nav-item-active {
  background: rgba(34,197,94,0.15) !important;
  color: #22c55e !important;

  .q-icon { color: #22c55e !important; }
}

.sidebar-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px 0 16px;
  border-top: 1px solid rgba(255,255,255,0.07);

  .logout-btn { color: rgba(255,255,255,0.45) !important; }
  .logout-btn:hover { color: #f87171 !important; background: rgba(248,113,113,0.08) !important; }
}

/* ── HEADER ──────────────────────────────────────────────── */
.nexus-header {
  background: #ffffff !important;
  border-bottom: 1px solid #e9ecef !important;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06) !important;

  .q-toolbar { min-height: 60px; padding: 0 24px; }
}

.header-title {
  font-family: 'Poppins', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #1a2332;
}

.header-icon-btn {
  color: #64748b !important;
  margin-right: 4px;

  &:hover { background: #f1f5f9 !important; color: #1a2332 !important; }
}

.admin-user-btn {
  color: #1a2332 !important;
  padding: 6px 10px;
  border-radius: 10px;

  &:hover { background: #f1f5f9 !important; }
}

.admin-avatar {
  background: linear-gradient(135deg, #0d1b2a, #1e3a5f) !important;
  border-radius: 10px;
  margin-right: 8px;
}

.admin-user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.2;

  .admin-name { font-size: 13px; font-weight: 600; color: #1a2332; }
  .admin-status {
    font-size: 11px;
    color: #22c55e;
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.status-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #22c55e;
  display: inline-block;
}

/* ── PAGE ─────────────────────────────────────────────────── */
.nexus-page-container {
  background: #f4f6f9 !important;
}

.header-menu {
  .q-item { font-size: 13px; }
}
</style>