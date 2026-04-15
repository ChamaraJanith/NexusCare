<template>
  <q-layout view="lHh Lpr lFf">

    <!-- ═══════════════════════════════════════════════════
         SIDEBAR
    ══════════════════════════════════════════════════════ -->
    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      :width="260"
      :breakpoint="768"
      class="nexus-sidebar"
    >
      <!-- Logo -->
      <div class="sidebar-logo">
        <div class="logo-icon-wrap">
          <q-icon name="local_hospital" size="22px" color="white" />
        </div>
        <div class="logo-text-wrap">
          <span class="logo-text">NexusCare</span>
          <span class="logo-sub">Admin Console</span>
        </div>
      </div>

      <!-- Admin Profile Mini -->
      <div class="sidebar-profile">
        <div class="profile-avatar">
          <q-icon name="admin_panel_settings" size="20px" color="white" />
        </div>
        <div class="profile-info">
          <span class="profile-name">{{ adminName }}</span>
          <span class="profile-role">
            <span class="online-dot"></span>
            Super Admin
          </span>
        </div>
      </div>

      <!-- Navigation -->
      <div class="nav-section-label">MAIN MENU</div>
      <q-list class="sidebar-nav">
        <q-item
          v-for="item in mainNavItems"
          :key="item.route"
          clickable v-ripple
          :active="isActive(item.route)"
          active-class="nav-item-active"
          class="nav-item"
          :to="item.route"
        >
          <q-item-section avatar>
            <div class="nav-icon-wrap" :class="isActive(item.route) ? 'nav-icon-active' : ''">
              <q-icon :name="item.icon" size="18px" />
            </div>
          </q-item-section>
          <q-item-section>
            <q-item-label class="nav-label">{{ item.label }}</q-item-label>
          </q-item-section>
          <q-item-section side v-if="item.badgeKey && pendingCount > 0">
            <div class="nav-badge">{{ pendingCount }}</div>
          </q-item-section>
        </q-item>
      </q-list>

      <div class="nav-section-label q-mt-sm">MANAGEMENT</div>
      <q-list class="sidebar-nav">
        <q-item
          v-for="item in mgmtNavItems"
          :key="item.route"
          clickable v-ripple
          :active="isActive(item.route)"
          active-class="nav-item-active"
          class="nav-item"
          :to="item.route"
        >
          <q-item-section avatar>
            <div class="nav-icon-wrap" :class="isActive(item.route) ? 'nav-icon-active' : ''">
              <q-icon :name="item.icon" size="18px" />
            </div>
          </q-item-section>
          <q-item-section>
            <q-item-label class="nav-label">{{ item.label }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>

      <!-- Logout -->
      <div class="sidebar-footer">
        <q-item clickable v-ripple class="nav-item logout-item" @click="logout">
          <q-item-section avatar>
            <div class="nav-icon-wrap">
              <q-icon name="logout" size="18px" />
            </div>
          </q-item-section>
          <q-item-section>
            <q-item-label class="nav-label">Sign Out</q-item-label>
          </q-item-section>
        </q-item>
      </div>
    </q-drawer>

    <!-- ═══════════════════════════════════════════════════
         HEADER
    ══════════════════════════════════════════════════════ -->
    <q-header class="nexus-header">
      <q-toolbar>
        <q-btn flat round dense icon="menu" @click="leftDrawerOpen = !leftDrawerOpen" class="lt-md menu-btn" />

        <!-- Breadcrumb Title -->
        <div class="header-title-wrap">
          <span class="header-title">{{ pageTitle }}</span>
          <span class="header-breadcrumb">Admin / {{ pageTitle }}</span>
        </div>

        <q-space />

        <!-- Search -->
        <div class="header-search gt-sm">
          <q-icon name="search" size="16px" color="grey-5" class="q-mr-xs" />
          <input placeholder="Quick search..." class="search-field" />
        </div>

        <!-- Notification Bell -->
        <q-btn flat round dense class="header-icon-btn q-ml-sm" @click="$router.push('/admin/doctors/pending')">
          <q-icon name="notifications_none" size="20px" />
          <q-badge v-if="pendingCount > 0" color="red-5" floating rounded :label="pendingCount" />
        </q-btn>

        <!-- Admin User -->
        <div class="header-admin-chip">
          <div class="chip-avatar">
            <q-icon name="person" size="16px" color="white" />
          </div>
          <span class="chip-name">{{ adminName }}</span>
          <q-icon name="keyboard_arrow_down" size="16px" color="grey-5" />

          <q-menu class="header-menu" anchor="bottom right" self="top right">
            <q-list style="min-width: 180px">
              <q-item class="menu-profile-item">
                <q-item-section>
                  <q-item-label class="menu-profile-name">{{ adminName }}</q-item-label>
                  <q-item-label caption>Super Administrator</q-item-label>
                </q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-close-popup @click="logout">
                <q-item-section avatar><q-icon name="logout" color="red-5" size="18px" /></q-item-section>
                <q-item-section class="text-red-5" style="font-size:13px">Sign Out</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </div>
      </q-toolbar>
    </q-header>

    <!-- ═══════════════════════════════════════════════════
         PAGE CONTENT
    ══════════════════════════════════════════════════════ -->
    <q-page-container class="nexus-page-container">
      <transition name="page-fade" mode="out-in">
        <router-view :key="$route.path" />
      </transition>
    </q-page-container>

  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { adminApi } from '../services/adminApi'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const leftDrawerOpen = ref(false)
const pendingCount = ref(0)

const adminName = computed(() => authStore.user?.name || 'Administrator')

const pageTitleMap = {
  '/admin/dashboard':       'Dashboard',
  '/admin/users':           'User Management',
  '/admin/doctors/pending': 'Doctor Verifications',
  '/admin/doctors':         'Doctor Management',
  '/admin/patients':        'Patient Management',
  '/admin/appointments':    'Appointments',
  '/admin/payments':        'Payments',
  '/admin/fees':            'Fee Management',
  '/admin/hospitals':       'Hospitals',
  '/admin/reports':         'Reports & Analytics',
  '/admin/settings':        'Settings',
}

const pageTitle = computed(() => {
  for (const [path, title] of Object.entries(pageTitleMap)) {
    if (route.path === path || route.path.startsWith(path + '/')) return title
  }
  return 'Admin Panel'
})

const isActive = (routePath) => {
  return route.path === routePath || route.path.startsWith(routePath + '/')
}

const mainNavItems = [
  { label: 'Dashboard',           icon: 'dashboard',        route: '/admin/dashboard' },
  { label: 'Doctor Verifications',icon: 'verified_user',    route: '/admin/doctors/pending', badgeKey: 'pending' },
  { label: 'Appointments',        icon: 'event_note',       route: '/admin/appointments' },
  { label: 'Payments',            icon: 'account_balance',  route: '/admin/payments' },
  { label: 'Reports & Analytics', icon: 'bar_chart',        route: '/admin/reports' },
]

const mgmtNavItems = [
  { label: 'User Management',  icon: 'manage_accounts',  route: '/admin/users' },
  { label: 'Doctors',          icon: 'medical_services', route: '/admin/doctors' },
  { label: 'Patients',         icon: 'people',           route: '/admin/patients' },
  { label: 'Fee Management',   icon: 'price_change',     route: '/admin/fees' },
  { label: 'Hospitals',        icon: 'local_hospital',   route: '/admin/hospitals' },
]

async function loadPendingCount() {
  try {
    const { data } = await adminApi.getPendingDoctors()
    pendingCount.value = (data.data || []).length
  } catch { /* silent */ }
}

function logout() {
  authStore.logout()
  router.push('/login')
}

onMounted(loadPendingCount)
</script>

<style lang="scss">
/* ── SIDEBAR ─────────────────────────────────────────────── */
.nexus-sidebar {
  background: #0a1628 !important;
  border-right: none !important;
  box-shadow: 4px 0 24px rgba(0,0,0,0.3) !important;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 22px 20px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.06);

  .logo-icon-wrap {
    width: 38px; height: 38px;
    background: linear-gradient(135deg, #10b981, #059669);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(16,185,129,0.3);
  }

  .logo-text-wrap {
    display: flex; flex-direction: column;
    .logo-text { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 17px; color: #ffffff; letter-spacing: 0.3px; }
    .logo-sub  { font-size: 10px; color: rgba(255,255,255,0.35); letter-spacing: 1px; text-transform: uppercase; margin-top: 1px; }
  }
}

.sidebar-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  margin: 10px 12px;
  background: rgba(255,255,255,0.04);
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.06);

  .profile-avatar {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, #1e3a5f, #2d5a8e);
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  .profile-info {
    display: flex; flex-direction: column;
    .profile-name { font-size: 13px; font-weight: 600; color: #ffffff; }
    .profile-role {
      font-size: 11px; color: rgba(255,255,255,0.4);
      display: flex; align-items: center; gap: 5px; margin-top: 1px;
    }
  }
}

.online-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #10b981;
  display: inline-block;
  box-shadow: 0 0 6px rgba(16,185,129,0.6);
}

.nav-section-label {
  font-size: 10px;
  font-weight: 700;
  color: rgba(255,255,255,0.2);
  letter-spacing: 1.2px;
  padding: 12px 20px 4px;
}

.sidebar-nav { padding: 2px 0; }

.nav-item {
  margin: 1px 10px;
  border-radius: 8px;
  color: rgba(255,255,255,0.45) !important;
  transition: all 0.18s ease;
  min-height: 42px;
  padding: 0 10px !important;

  &:hover {
    background: rgba(255,255,255,0.05) !important;
    color: rgba(255,255,255,0.8) !important;
    .nav-icon-wrap { background: rgba(255,255,255,0.08); }
  }

  .nav-label { font-size: 13px; font-weight: 500; }
}

.nav-item-active {
  background: rgba(16,185,129,0.12) !important;
  color: #10b981 !important;

  .nav-icon-wrap { background: rgba(16,185,129,0.15) !important; }
  .nav-label { font-weight: 600 !important; }
}

.nav-icon-wrap {
  width: 32px; height: 32px;
  border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.18s;
  color: inherit;
  .q-icon { color: inherit !important; }
}

.nav-icon-active {
  background: rgba(16,185,129,0.15);
  color: #10b981 !important;
}

.nav-badge {
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  padding: 0 5px;
}

.sidebar-footer {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  padding: 8px 0 12px;
  border-top: 1px solid rgba(255,255,255,0.06);

  .logout-item {
    color: rgba(255,255,255,0.35) !important;
    &:hover { color: #f87171 !important; background: rgba(248,113,113,0.08) !important; }
  }
}

/* ── HEADER ──────────────────────────────────────────────── */
.nexus-header {
  background: #ffffff !important;
  border-bottom: 1px solid #eef0f4 !important;
  box-shadow: 0 1px 8px rgba(0,0,0,0.06) !important;

  .q-toolbar { min-height: 62px; padding: 0 24px; }
}

.menu-btn { color: #64748b !important; }

.header-title-wrap {
  display: flex; flex-direction: column;
  .header-title { font-family: 'Poppins', sans-serif; font-size: 17px; font-weight: 600; color: #0f172a; line-height: 1.2; }
  .header-breadcrumb { font-size: 11px; color: #94a3b8; }
}

.header-search {
  display: flex;
  align-items: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 7px 14px;
  gap: 6px;
  transition: border-color 0.15s;

  &:focus-within { border-color: #10b981; }

  .search-field {
    border: none; outline: none; background: transparent;
    font-size: 13px; color: #475569; width: 180px;
    &::placeholder { color: #94a3b8; }
  }
}

.header-icon-btn {
  color: #64748b !important;
  width: 38px; height: 38px;
  border-radius: 8px;

  &:hover { background: #f1f5f9 !important; color: #0f172a !important; }
}

.header-admin-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 6px 12px;
  cursor: pointer;
  margin-left: 8px;
  transition: all 0.15s;

  &:hover { background: #f1f5f9; border-color: #cbd5e1; }

  .chip-avatar {
    width: 28px; height: 28px;
    background: linear-gradient(135deg, #0a1628, #1e3a5f);
    border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
  }

  .chip-name { font-size: 13px; font-weight: 600; color: #0f172a; }
}

.header-menu {
  border-radius: 10px !important;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important;
  border: 1px solid #e2e8f0 !important;

  .menu-profile-item { padding: 12px 16px; }
  .menu-profile-name { font-size: 14px; font-weight: 600; color: #0f172a; }
}

/* ── PAGE CONTAINER ──────────────────────────────────────── */
.nexus-page-container {
  background: #f0f4f8 !important;
}

/* ── PAGE TRANSITION ─────────────────────────────────────── */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
