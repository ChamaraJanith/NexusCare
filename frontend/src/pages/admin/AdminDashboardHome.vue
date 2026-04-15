<template>
  <q-page class="admin-page">

    <!-- ── Welcome Banner ─────────────────────────────────── -->
    <div class="welcome-banner">
      <div class="welcome-content">
        <div class="welcome-text">
          <p class="welcome-greeting">Good {{ timeOfDay }},</p>
          <h1 class="welcome-name">{{ adminName }}</h1>
          <p class="welcome-sub">Here's what's happening on NexusCare today.</p>
        </div>
        <div class="welcome-date-card">
          <q-icon name="calendar_today" size="18px" color="green-5" class="q-mb-xs" />
          <span class="date-text">{{ todayDate }}</span>
          <span class="time-text">{{ currentTime }}</span>
        </div>
      </div>
    </div>

    <!-- ── KPI Stats Grid ──────────────────────────────────── -->
    <div class="kpi-grid">
      <div
        v-for="(stat, i) in statsCards"
        :key="stat.key"
        class="kpi-card"
        :class="`kpi-card--${stat.color}`"
        :style="{ animationDelay: `${i * 60}ms` }"
      >
        <div class="kpi-top">
          <div class="kpi-icon-wrap">
            <q-icon :name="stat.icon" size="22px" />
          </div>
          <div class="kpi-trend" v-if="stat.trend">
            <q-icon :name="stat.trend > 0 ? 'trending_up' : 'trending_down'" size="14px" />
            <span>{{ Math.abs(stat.trend) }}%</span>
          </div>
        </div>
        <div class="kpi-value">
          <span v-if="loading" class="kpi-skeleton"></span>
          <span v-else class="kpi-num">{{ stats[stat.key] ?? 0 }}</span>
        </div>
        <div class="kpi-label">{{ stat.label }}</div>
        <div class="kpi-bar">
          <div class="kpi-bar-fill" :style="{ width: loading ? '0%' : getBarWidth(stat.key) + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- ── Revenue + Pending Row ───────────────────────────── -->
    <div class="main-row">

      <!-- Revenue Card -->
      <q-card class="revenue-card dash-card">
        <div class="card-header">
          <div class="card-title-wrap">
            <div class="card-icon-dot card-icon-dot--green"></div>
            <span class="card-title">Revenue Overview</span>
          </div>
          <router-link to="/admin/payments" class="card-link">View all →</router-link>
        </div>

        <q-inner-loading :showing="paymentLoading" color="green-5" size="28px" />

        <div class="revenue-hero">
          <div class="revenue-main-block">
            <span class="revenue-label">Total Revenue</span>
            <span class="revenue-amount">LKR {{ formatCurrency(paymentStats.totalRevenue) }}</span>
          </div>
          <div class="revenue-sub-stats">
            <div class="rev-sub-item">
              <span class="rev-sub-val text-green-6">{{ paymentStats.totalTransactions || 0 }}</span>
              <span class="rev-sub-key">Transactions</span>
            </div>
            <div class="rev-sub-divider"></div>
            <div class="rev-sub-item">
              <span class="rev-sub-val text-blue-6">LKR {{ formatCurrency(paymentStats.avgAmount) }}</span>
              <span class="rev-sub-key">Avg. Payment</span>
            </div>
          </div>
        </div>

        <div class="payment-status-row">
          <div
            v-for="(item, status) in paymentByStatus"
            :key="status"
            class="pay-status-chip"
            :class="`pay-status-chip--${status}`"
          >
            <span class="pay-dot"></span>
            <span class="pay-status-name">{{ capitalize(status) }}</span>
            <span class="pay-count">{{ item.count }}</span>
          </div>
        </div>
      </q-card>

      <!-- Pending Verifications -->
      <q-card class="pending-card dash-card">
        <div class="card-header">
          <div class="card-title-wrap">
            <div class="card-icon-dot card-icon-dot--orange"></div>
            <span class="card-title">Pending Verifications</span>
          </div>
          <q-badge
            v-if="pendingDoctors.length > 0"
            :label="pendingDoctors.length"
            color="orange-6"
            rounded
            class="pending-badge-count"
          />
        </div>

        <q-inner-loading :showing="pendingLoading" color="green-5" size="28px" />

        <div v-if="!pendingLoading && pendingDoctors.length === 0" class="empty-state">
          <div class="empty-icon-wrap">
            <q-icon name="check_circle" size="32px" color="green-5" />
          </div>
          <p class="empty-title">All Clear!</p>
          <p class="empty-sub">No pending doctor verifications</p>
        </div>

        <div v-else class="pending-list">
          <div
            v-for="doc in pendingDoctors.slice(0, 4)"
            :key="doc.doctorId"
            class="pending-item"
          >
            <div class="pending-avatar">{{ getInitials(doc.name) }}</div>
            <div class="pending-info">
              <span class="pending-name">{{ doc.name }}</span>
              <span class="pending-meta">{{ doc.specialty }} · {{ doc.registrationNumber }}</span>
            </div>
            <div class="pending-actions">
              <q-btn
                unelevated dense size="xs" no-caps
                label="Approve"
                color="green-6"
                class="pend-btn"
                :loading="processingId === doc.doctorId"
                @click="approveDoctor(doc.doctorId)"
              />
              <q-btn
                flat dense size="xs" no-caps
                label="Reject"
                color="red-5"
                class="pend-btn q-ml-xs"
                @click="openRejectDialog(doc)"
              />
            </div>
          </div>
        </div>

        <div v-if="pendingDoctors.length > 4" class="card-footer-link">
          <router-link to="/admin/doctors/pending">
            View all {{ pendingDoctors.length }} pending →
          </router-link>
        </div>
      </q-card>

    </div>

    <!-- ── Recent Users + Quick Actions Row ───────────────── -->
    <div class="secondary-row">

      <!-- Recent Registrations -->
      <q-card class="recent-users-card dash-card">
        <div class="card-header">
          <div class="card-title-wrap">
            <div class="card-icon-dot card-icon-dot--blue"></div>
            <span class="card-title">Recent Registrations</span>
          </div>
          <router-link to="/admin/users" class="card-link">View all →</router-link>
        </div>

        <q-inner-loading :showing="usersLoading" color="green-5" size="28px" />

        <div class="users-list">
          <div
            v-for="user in recentUsers"
            :key="user.userId"
            class="user-row"
          >
            <div class="user-row-avatar" :style="{ background: getRoleGradient(user.role) }">
              {{ getInitials(user.name) }}
            </div>
            <div class="user-row-info">
              <span class="user-row-name">{{ user.name }}</span>
              <span class="user-row-email">{{ user.email }}</span>
            </div>
            <div class="user-row-right">
              <span class="role-pill" :class="`role-pill--${user.role}`">{{ user.role }}</span>
              <span class="user-row-date">{{ formatDateShort(user.createdAt) }}</span>
            </div>
          </div>
        </div>
      </q-card>

      <!-- Quick Actions -->
      <q-card class="quick-actions-card dash-card">
        <div class="card-header">
          <div class="card-title-wrap">
            <div class="card-icon-dot card-icon-dot--purple"></div>
            <span class="card-title">Quick Actions</span>
          </div>
        </div>

        <div class="qa-grid">
          <router-link
            v-for="action in quickActions"
            :key="action.label"
            :to="action.route"
            class="qa-item"
          >
            <div class="qa-icon-wrap" :style="{ background: action.bg }">
              <q-icon :name="action.icon" size="20px" :style="{ color: action.iconColor }" />
            </div>
            <span class="qa-label">{{ action.label }}</span>
            <q-icon name="chevron_right" size="14px" color="grey-4" class="qa-arrow" />
          </router-link>
        </div>
      </q-card>

    </div>

    <!-- ── Reject Dialog ───────────────────────────────────── -->
    <q-dialog v-model="rejectDialog" persistent>
      <q-card class="nexus-dialog">
        <div class="dialog-header">
          <div class="dialog-header-icon dialog-header-icon--red">
            <q-icon name="gpp_bad" size="20px" color="white" />
          </div>
          <div>
            <div class="dialog-title">Reject Registration</div>
            <div class="dialog-sub">{{ rejectTarget?.name }} · {{ rejectTarget?.specialty }}</div>
          </div>
        </div>

        <q-card-section class="q-pt-none">
          <q-input
            v-model="rejectReason"
            type="textarea"
            outlined
            label="Rejection Reason *"
            rows="3"
            placeholder="Provide a clear reason for rejection..."
            :rules="[v => (v && v.trim().length >= 10) || 'Minimum 10 characters required']"
            class="nexus-input"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn flat no-caps label="Cancel" color="grey-6" v-close-popup />
          <q-btn
            unelevated no-caps
            label="Confirm Rejection"
            color="red-5"
            :loading="processingId === rejectTarget?.doctorId"
            @click="confirmReject"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from '../../stores/authStore'
import { adminApi, paymentApi } from '../../services/adminApi'

const $q = useQuasar()
const authStore = useAuthStore()

const adminName = computed(() => authStore.user?.name || 'Administrator')

// Time
const currentTime = ref('')
const todayDate = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
const timeOfDay = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
})

let clockTimer
function updateClock() {
  currentTime.value = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// State
const loading        = ref(true)
const pendingLoading = ref(true)
const usersLoading   = ref(true)
const paymentLoading = ref(true)
const processingId   = ref(null)

const stats           = ref({})
const pendingDoctors  = ref([])
const recentUsers     = ref([])
const paymentStats    = ref({ totalRevenue: 0, totalTransactions: 0, avgAmount: 0 })
const paymentByStatus = ref({})

const rejectDialog = ref(false)
const rejectTarget = ref(null)
const rejectReason = ref('')

const statsCards = [
  { key: 'totalUsers',       label: 'Total Users',          icon: 'group',             color: 'blue',   trend: 12 },
  { key: 'totalPatients',    label: 'Patients',             icon: 'personal_injury',   color: 'teal',   trend: 8  },
  { key: 'totalDoctors',     label: 'Doctors',              icon: 'medical_services',  color: 'indigo', trend: 5  },
  { key: 'verifiedDoctors',  label: 'Verified Doctors',     icon: 'verified',          color: 'green',  trend: 3  },
  { key: 'pendingDoctors',   label: 'Pending Verifications',icon: 'pending_actions',   color: 'orange', trend: null },
  { key: 'activeUsers',      label: 'Active Users',         icon: 'how_to_reg',        color: 'cyan',   trend: 6  },
]

const quickActions = [
  { label: 'Verify Doctors',  icon: 'verified_user',   route: '/admin/doctors/pending', bg: '#f0fdf4', iconColor: '#16a34a' },
  { label: 'Manage Users',    icon: 'manage_accounts', route: '/admin/users',           bg: '#eff6ff', iconColor: '#2563eb' },
  { label: 'View Payments',   icon: 'account_balance', route: '/admin/payments',        bg: '#f0fdfa', iconColor: '#0d9488' },
  { label: 'Fee Settings',    icon: 'price_change',    route: '/admin/fees',            bg: '#fff7ed', iconColor: '#ea580c' },
  { label: 'Hospitals',       icon: 'local_hospital',  route: '/admin/hospitals',       bg: '#fef2f2', iconColor: '#dc2626' },
  { label: 'Analytics',       icon: 'bar_chart',       route: '/admin/reports',         bg: '#faf5ff', iconColor: '#7c3aed' },
]

// Helpers
const getInitials = (n = '') => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
const getRoleGradient = (r) => ({ doctor: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', patient: 'linear-gradient(135deg,#0d9488,#14b8a6)', admin: 'linear-gradient(135deg,#7c3aed,#a78bfa)' }[r] || 'linear-gradient(135deg,#475569,#64748b)')
const formatCurrency = (n) => (n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const formatDateShort = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—'
const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''

const getBarWidth = (key) => {
  const val = stats.value[key] || 0
  const max = stats.value.totalUsers || 1
  return Math.min(Math.round((val / max) * 100), 100)
}

// Fetch
async function fetchAll() {
  await Promise.allSettled([fetchStats(), fetchPending(), fetchRecentUsers(), fetchPaymentStats()])
}

async function fetchStats() {
  loading.value = true
  try {
    const { data } = await adminApi.getStats()
    stats.value = data.data || {}
  } catch { /* silent */ }
  finally { loading.value = false }
}

async function fetchPending() {
  pendingLoading.value = true
  try {
    const { data } = await adminApi.getPendingDoctors()
    pendingDoctors.value = data.data || []
  } catch { pendingDoctors.value = [] }
  finally { pendingLoading.value = false }
}

async function fetchRecentUsers() {
  usersLoading.value = true
  try {
    const { data } = await adminApi.getUsers({ page: 1, limit: 6 })
    recentUsers.value = data.data || []
  } catch { recentUsers.value = [] }
  finally { usersLoading.value = false }
}

async function fetchPaymentStats() {
  paymentLoading.value = true
  try {
    const { data } = await paymentApi.getStats()
    paymentStats.value = data.data?.revenue || {}
    paymentByStatus.value = data.data?.byStatus || {}
  } catch { /* silent */ }
  finally { paymentLoading.value = false }
}

// Actions
async function approveDoctor(doctorId) {
  processingId.value = doctorId
  try {
    await adminApi.verifyDoctor(doctorId, 'approve')
    $q.notify({ type: 'positive', message: 'Doctor approved successfully', position: 'top-right', icon: 'check_circle' })
    await Promise.all([fetchPending(), fetchStats()])
  } catch (err) {
    $q.notify({ type: 'negative', message: err.response?.data?.message || 'Approval failed', position: 'top-right' })
  } finally { processingId.value = null }
}

function openRejectDialog(doc) {
  rejectTarget.value = doc
  rejectReason.value = ''
  rejectDialog.value = true
}

async function confirmReject() {
  if (!rejectReason.value || rejectReason.value.trim().length < 10) {
    $q.notify({ type: 'warning', message: 'Please enter at least 10 characters', position: 'top-right' })
    return
  }
  processingId.value = rejectTarget.value.doctorId
  try {
    await adminApi.verifyDoctor(rejectTarget.value.doctorId, 'reject', rejectReason.value.trim())
    $q.notify({ type: 'positive', message: 'Registration rejected', position: 'top-right' })
    rejectDialog.value = false
    await Promise.all([fetchPending(), fetchStats()])
  } catch (err) {
    $q.notify({ type: 'negative', message: err.response?.data?.message || 'Action failed', position: 'top-right' })
  } finally { processingId.value = null }
}

onMounted(() => {
  fetchAll()
  updateClock()
  clockTimer = setInterval(updateClock, 1000)
})

onUnmounted(() => clearInterval(clockTimer))
</script>

<style lang="scss" scoped>
.admin-page { padding: 28px 28px 48px; }

/* ── Welcome Banner ─────────────────────────────────────── */
.welcome-banner {
  background: linear-gradient(135deg, #0a1628 0%, #1e3a5f 60%, #0d4f3c 100%);
  border-radius: 16px;
  padding: 28px 32px;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -40px; right: -40px;
    width: 200px; height: 200px;
    background: rgba(16,185,129,0.08);
    border-radius: 50%;
  }
  &::after {
    content: '';
    position: absolute;
    bottom: -60px; right: 80px;
    width: 160px; height: 160px;
    background: rgba(59,130,246,0.06);
    border-radius: 50%;
  }
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
}

.welcome-text {
  .welcome-greeting { font-size: 14px; color: rgba(255,255,255,0.5); margin: 0 0 4px; }
  .welcome-name { font-family: 'Poppins', sans-serif; font-size: 28px; font-weight: 700; color: #ffffff; margin: 0 0 6px; }
  .welcome-sub { font-size: 13px; color: rgba(255,255,255,0.45); margin: 0; }
}

.welcome-date-card {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 14px 20px;

  .date-text { font-size: 13px; color: rgba(255,255,255,0.7); margin-top: 4px; }
  .time-text { font-size: 20px; font-weight: 700; color: #10b981; font-family: 'Poppins', sans-serif; margin-top: 2px; letter-spacing: 1px; }
}

/* ── KPI Grid ───────────────────────────────────────────── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 14px;
  margin-bottom: 20px;

  @media (max-width: 1200px) { grid-template-columns: repeat(3, 1fr); }
  @media (max-width: 700px)  { grid-template-columns: repeat(2, 1fr); }
}

.kpi-card {
  background: #ffffff;
  border-radius: 14px;
  padding: 18px 18px 14px;
  border: 1px solid #eef0f4;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  animation: kpiSlideIn 0.4s ease both;
  cursor: default;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.08);
  }

  @keyframes kpiSlideIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
}

.kpi-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.kpi-icon-wrap {
  width: 40px; height: 40px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
}

.kpi-trend {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  font-weight: 600;
  color: #16a34a;
  background: #f0fdf4;
  padding: 2px 6px;
  border-radius: 20px;
}

.kpi-value {
  margin-bottom: 4px;
  .kpi-num { font-size: 28px; font-weight: 800; color: #0f172a; font-family: 'Poppins', sans-serif; line-height: 1; }
  .kpi-skeleton { display: block; width: 60px; height: 28px; background: linear-gradient(90deg, #f0f4f8 25%, #e2e8f0 50%, #f0f4f8 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 6px; }
}

.kpi-label { font-size: 12px; color: #64748b; margin-bottom: 10px; }

.kpi-bar {
  height: 3px;
  background: #f0f4f8;
  border-radius: 2px;
  overflow: hidden;

  .kpi-bar-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 1s ease;
  }
}

// Color variants
.kpi-card--blue   { .kpi-icon-wrap { background: #eff6ff; color: #2563eb; } .kpi-bar-fill { background: #2563eb; } }
.kpi-card--teal   { .kpi-icon-wrap { background: #f0fdfa; color: #0d9488; } .kpi-bar-fill { background: #0d9488; } }
.kpi-card--indigo { .kpi-icon-wrap { background: #eef2ff; color: #4f46e5; } .kpi-bar-fill { background: #4f46e5; } }
.kpi-card--green  { .kpi-icon-wrap { background: #f0fdf4; color: #16a34a; } .kpi-bar-fill { background: #16a34a; } }
.kpi-card--orange { .kpi-icon-wrap { background: #fff7ed; color: #ea580c; } .kpi-bar-fill { background: #ea580c; } .kpi-trend { color: #ea580c; background: #fff7ed; } }
.kpi-card--cyan   { .kpi-icon-wrap { background: #ecfeff; color: #0891b2; } .kpi-bar-fill { background: #0891b2; } }

@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* ── Shared Card Styles ─────────────────────────────────── */
.dash-card {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #eef0f4;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px 14px;
  border-bottom: 1px solid #f8fafc;
}

.card-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-icon-dot {
  width: 8px; height: 8px;
  border-radius: 50%;

  &--green  { background: #10b981; box-shadow: 0 0 6px rgba(16,185,129,0.4); }
  &--orange { background: #f97316; box-shadow: 0 0 6px rgba(249,115,22,0.4); }
  &--blue   { background: #3b82f6; box-shadow: 0 0 6px rgba(59,130,246,0.4); }
  &--purple { background: #8b5cf6; box-shadow: 0 0 6px rgba(139,92,246,0.4); }
}

.card-title { font-size: 14px; font-weight: 600; color: #0f172a; }
.card-link  { font-size: 12px; color: #10b981; text-decoration: none; font-weight: 500; &:hover { text-decoration: underline; } }

/* ── Main Row ───────────────────────────────────────────── */
.main-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;

  @media (max-width: 900px) { grid-template-columns: 1fr; }
}

/* Revenue Card */
.revenue-hero {
  padding: 20px 20px 16px;
  border-bottom: 1px solid #f8fafc;
}

.revenue-main-block {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;

  .revenue-label  { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 4px; }
  .revenue-amount { font-size: 32px; font-weight: 800; color: #0f172a; font-family: 'Poppins', sans-serif; }
}

.revenue-sub-stats {
  display: flex;
  align-items: center;
  gap: 20px;
}

.rev-sub-item {
  display: flex; flex-direction: column;
  .rev-sub-val { font-size: 18px; font-weight: 700; }
  .rev-sub-key { font-size: 11px; color: #94a3b8; margin-top: 1px; }
}

.rev-sub-divider { width: 1px; height: 32px; background: #f0f4f8; }

.payment-status-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 14px 20px;
}

.pay-status-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;

  .pay-dot { width: 7px; height: 7px; border-radius: 50%; }
  .pay-status-name { color: #475569; }
  .pay-count { font-weight: 700; color: #0f172a; }

  &--success    { background: #f0fdf4; .pay-dot { background: #22c55e; } }
  &--pending    { background: #fff7ed; .pay-dot { background: #f97316; } }
  &--failed     { background: #fef2f2; .pay-dot { background: #ef4444; } }
  &--cancelled  { background: #f8fafc; .pay-dot { background: #94a3b8; } }
  &--chargedback{ background: #faf5ff; .pay-dot { background: #8b5cf6; } }
}

/* Pending Card */
.pending-badge-count { font-size: 12px; padding: 4px 10px; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 36px 20px;

  .empty-icon-wrap {
    width: 60px; height: 60px;
    background: #f0fdf4;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 12px;
  }
  .empty-title { font-size: 15px; font-weight: 600; color: #0f172a; margin: 0 0 4px; }
  .empty-sub   { font-size: 13px; color: #94a3b8; margin: 0; }
}

.pending-list { padding: 8px 0; }

.pending-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  transition: background 0.15s;

  &:hover { background: #f8fafc; }
}

.pending-avatar {
  width: 38px; height: 38px;
  border-radius: 9px;
  background: linear-gradient(135deg, #0a1628, #1e3a5f);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.pending-info {
  flex: 1;
  min-width: 0;
  .pending-name { display: block; font-size: 13px; font-weight: 600; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pending-meta { display: block; font-size: 11px; color: #94a3b8; margin-top: 1px; }
}

.pending-actions { display: flex; align-items: center; flex-shrink: 0; }
.pend-btn { font-size: 11px; border-radius: 6px; padding: 3px 10px; }

.card-footer-link {
  padding: 12px 20px;
  border-top: 1px solid #f8fafc;
  text-align: center;
  a { font-size: 12px; color: #10b981; text-decoration: none; font-weight: 500; &:hover { text-decoration: underline; } }
}

/* ── Secondary Row ──────────────────────────────────────── */
.secondary-row {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;

  @media (max-width: 900px) { grid-template-columns: 1fr; }
}

/* Recent Users */
.users-list { padding: 4px 0; }

.user-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  transition: background 0.15s;

  &:hover { background: #f8fafc; }
}

.user-row-avatar {
  width: 36px; height: 36px;
  border-radius: 8px;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.user-row-info {
  flex: 1;
  min-width: 0;
  .user-row-name  { display: block; font-size: 13px; font-weight: 600; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .user-row-email { display: block; font-size: 11px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
}

.user-row-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  flex-shrink: 0;
}

.role-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.4px;

  &--doctor  { background: #eff6ff; color: #2563eb; }
  &--patient { background: #f0fdfa; color: #0d9488; }
  &--admin   { background: #faf5ff; color: #7c3aed; }
}

.user-row-date { font-size: 11px; color: #cbd5e1; }

/* Quick Actions */
.qa-grid { padding: 8px 12px 12px; display: flex; flex-direction: column; gap: 4px; }

.qa-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 10px;
  border-radius: 10px;
  text-decoration: none;
  transition: background 0.15s;

  &:hover { background: #f8fafc; .qa-arrow { color: #10b981 !important; } }
}

.qa-icon-wrap {
  width: 36px; height: 36px;
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.qa-label { flex: 1; font-size: 13px; font-weight: 500; color: #334155; }
.qa-arrow { transition: color 0.15s; }

/* ── Dialog ─────────────────────────────────────────────── */
.nexus-dialog {
  min-width: 440px;
  border-radius: 16px !important;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 20px 16px;
  border-bottom: 1px solid #f0f4f8;
}

.dialog-header-icon {
  width: 44px; height: 44px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;

  &--red { background: linear-gradient(135deg, #ef4444, #dc2626); }
}

.dialog-title { font-size: 16px; font-weight: 700; color: #0f172a; }
.dialog-sub   { font-size: 12px; color: #94a3b8; margin-top: 2px; }

.nexus-input :deep(.q-field__control) { border-radius: 8px; }
</style>
