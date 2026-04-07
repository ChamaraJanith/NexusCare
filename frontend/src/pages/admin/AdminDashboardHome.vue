<template>
  <q-page class="admin-page">
    <!-- Welcome Bar -->
    <div class="welcome-bar">
      <div>
        <p class="welcome-sub">Welcome back,</p>
        <h1 class="welcome-name">{{ adminName }}</h1>
      </div>
      <div class="welcome-date">
        <q-icon name="calendar_today" size="16px" class="q-mr-xs" />
        {{ todayDate }}
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div v-for="stat in statsCards" :key="stat.key" class="stat-card" :class="`stat-card--${stat.color}`">
        <div class="stat-icon-wrap">
          <q-icon :name="stat.icon" size="24px" />
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ loading ? '—' : (stats[stat.key] ?? 0) }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
        <q-inner-loading :showing="loading" color="grey-5" size="24px" />
      </div>
    </div>

    <!-- Main Grid -->
    <div class="dashboard-grid">

      <!-- Pending Verifications -->
      <q-card class="dash-card">
        <q-card-section class="card-header">
          <div class="card-title">
            <q-icon name="pending_actions" size="18px" color="orange-7" class="q-mr-sm" />
            Pending Doctor Verifications
          </div>
          <q-badge :label="pendingDoctors.length" color="orange-6" rounded />
        </q-card-section>

        <q-card-section class="q-pa-none">
          <q-inner-loading :showing="pendingLoading" color="green-6" />

          <div v-if="!pendingLoading && pendingDoctors.length === 0" class="empty-state">
            <q-icon name="check_circle" size="36px" color="green-5" />
            <p>All doctors verified!</p>
          </div>

          <q-list v-else separator>
            <q-item
              v-for="doc in pendingDoctors.slice(0, 5)"
              :key="doc.doctorId"
              class="pending-item"
            >
              <q-item-section avatar>
                <q-avatar class="doctor-avatar" size="40px">
                  {{ getInitials(doc.name) }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="item-name">{{ doc.name }}</q-item-label>
                <q-item-label caption class="item-caption">{{ doc.specialty }} · {{ doc.registrationNumber }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="action-btns">
                  <q-btn
                    unelevated dense size="sm"
                    label="Approve"
                    color="green-6"
                    class="action-btn"
                    :loading="processingId === doc.doctorId"
                    @click="approveDoctor(doc.doctorId)"
                  />
                  <q-btn
                    unelevated dense size="sm"
                    label="Reject"
                    color="red-5"
                    outline
                    class="action-btn q-ml-xs"
                    @click="openRejectDialog(doc)"
                  />
                </div>
              </q-item-section>
            </q-item>
          </q-list>

          <div v-if="pendingDoctors.length > 5" class="view-all-link">
            <router-link to="/admin/doctors/pending">View all {{ pendingDoctors.length }} →</router-link>
          </div>
        </q-card-section>
      </q-card>

      <!-- Recent Users -->
      <q-card class="dash-card">
        <q-card-section class="card-header">
          <div class="card-title">
            <q-icon name="person_add" size="18px" color="blue-6" class="q-mr-sm" />
            Recent Registrations
          </div>
          <router-link to="/admin/users" class="view-all-link-inline">View all →</router-link>
        </q-card-section>

        <q-card-section class="q-pa-none">
          <q-inner-loading :showing="usersLoading" color="green-6" />
          <q-list separator>
            <q-item v-for="user in recentUsers" :key="user.userId" class="pending-item">
              <q-item-section avatar>
                <q-avatar class="user-avatar" size="38px" :style="{ background: getRoleColor(user.role) }">
                  {{ getInitials(user.name) }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="item-name">{{ user.name }}</q-item-label>
                <q-item-label caption>{{ user.email }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge
                  :label="user.role"
                  :color="user.role === 'doctor' ? 'blue-6' : user.role === 'patient' ? 'teal-6' : 'purple-6'"
                  rounded
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>

      <!-- Payment Summary -->
      <q-card class="dash-card">
        <q-card-section class="card-header">
          <div class="card-title">
            <q-icon name="account_balance_wallet" size="18px" color="green-6" class="q-mr-sm" />
            Revenue Overview
          </div>
          <router-link to="/admin/payments" class="view-all-link-inline">Details →</router-link>
        </q-card-section>

        <q-card-section>
          <q-inner-loading :showing="paymentLoading" color="green-6" />

          <div class="revenue-main">
            <span class="revenue-label">Total Revenue</span>
            <span class="revenue-amount">LKR {{ formatCurrency(paymentStats.totalRevenue) }}</span>
          </div>

          <div class="revenue-stats">
            <div class="rev-stat">
              <span class="rev-stat-val text-green-7">{{ paymentStats.totalTransactions || 0 }}</span>
              <span class="rev-stat-key">Transactions</span>
            </div>
            <div class="rev-stat">
              <span class="rev-stat-val text-blue-7">LKR {{ formatCurrency(paymentStats.avgAmount) }}</span>
              <span class="rev-stat-key">Avg. Payment</span>
            </div>
          </div>

          <div class="status-breakdown" v-if="paymentByStatus">
            <div v-for="(item, status) in paymentByStatus" :key="status" class="status-chip">
              <span class="status-dot" :class="`status-dot--${status}`"></span>
              <span>{{ status }}</span>
              <span class="status-count">{{ item.count }}</span>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Quick Actions -->
      <q-card class="dash-card">
        <q-card-section class="card-header">
          <div class="card-title">
            <q-icon name="bolt" size="18px" color="yellow-8" class="q-mr-sm" />
            Quick Actions
          </div>
        </q-card-section>
        <q-card-section>
          <div class="quick-actions-grid">
            <q-btn
              v-for="action in quickActions"
              :key="action.label"
              unelevated
              no-caps
              class="quick-action-btn"
              :to="action.route"
            >
              <div class="qa-inner">
                <q-icon :name="action.icon" size="22px" :color="action.color" />
                <span>{{ action.label }}</span>
              </div>
            </q-btn>
          </div>
        </q-card-section>
      </q-card>

    </div>

    <!-- Reject Dialog -->
    <q-dialog v-model="rejectDialog" persistent>
      <q-card class="reject-dialog">
        <q-card-section class="row items-center">
          <q-icon name="warning" color="red-5" size="28px" class="q-mr-sm" />
          <span class="dialog-title">Reject Doctor Registration</span>
        </q-card-section>

        <q-card-section>
          <p class="q-mb-sm text-grey-7">Rejecting: <strong>{{ rejectTarget?.name }}</strong></p>
          <q-input
            v-model="rejectReason"
            type="textarea"
            outlined
            label="Rejection Reason *"
            rows="3"
            :rules="[val => !!val || 'Reason is required']"
            class="nexus-input"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            unelevated
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
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from '../../stores/authStore'
import { adminApi, paymentApi } from '../../services/adminApi'

const $q = useQuasar()
const authStore = useAuthStore()

const adminName = computed(() => authStore.user?.name || 'Administrator')

const todayDate = new Date().toLocaleDateString('en-GB', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
})

// ── State ─────────────────────────────────────────────────────────────────────
const loading        = ref(true)
const pendingLoading = ref(true)
const usersLoading   = ref(true)
const paymentLoading = ref(true)
const processingId   = ref(null)

const stats          = ref({})
const pendingDoctors = ref([])
const recentUsers    = ref([])
const paymentStats   = ref({ totalRevenue: 0, totalTransactions: 0, avgAmount: 0 })
const paymentByStatus = ref({})

const rejectDialog   = ref(false)
const rejectTarget   = ref(null)
const rejectReason   = ref('')

// ── Stats card definitions ────────────────────────────────────────────────────
const statsCards = [
  { key: 'totalUsers',      label: 'Total Users',         icon: 'group',              color: 'blue'   },
  { key: 'totalPatients',   label: 'Patients',            icon: 'personal_injury',    color: 'teal'   },
  { key: 'totalDoctors',    label: 'Doctors',             icon: 'medical_services',   color: 'indigo' },
  { key: 'verifiedDoctors', label: 'Verified Doctors',    icon: 'verified',           color: 'green'  },
  { key: 'pendingDoctors',  label: 'Pending Verifications',icon: 'pending',           color: 'orange' },
  { key: 'activeUsers',     label: 'Active Users',        icon: 'how_to_reg',         color: 'cyan'   },
]

const quickActions = [
  { label: 'Verify Doctors',   icon: 'verified_user',    color: 'green-6',  route: '/admin/doctors/pending' },
  { label: 'Manage Users',     icon: 'manage_accounts',  color: 'blue-6',   route: '/admin/users' },
  { label: 'View Payments',    icon: 'payments',         color: 'teal-6',   route: '/admin/payments' },
  { label: 'Fee Settings',     icon: 'price_change',     color: 'orange-6', route: '/admin/fees' },
  { label: 'Hospitals',        icon: 'local_hospital',   color: 'red-5',    route: '/admin/hospitals' },
  { label: 'Reports',          icon: 'bar_chart',        color: 'purple-6', route: '/admin/reports' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
const getInitials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

const getRoleColor = (role) => ({
  doctor: '#1d4ed8', patient: '#0d9488', admin: '#7c3aed'
}[role] || '#64748b')

const formatCurrency = (n) =>
  (n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// ── Fetch ─────────────────────────────────────────────────────────────────────
async function fetchAll() {
  await Promise.allSettled([fetchStats(), fetchPending(), fetchRecentUsers(), fetchPaymentStats()])
}

async function fetchStats() {
  loading.value = true
  try {
    const { data } = await adminApi.getStats()
    stats.value = data.data || {}
  } catch { /* silently fail */ }
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
  } catch { /* silently */ }
  finally { paymentLoading.value = false }
}

// ── Actions ───────────────────────────────────────────────────────────────────
async function approveDoctor(doctorId) {
  processingId.value = doctorId
  try {
    await adminApi.verifyDoctor(doctorId, 'approve')
    $q.notify({ type: 'positive', message: 'Doctor approved successfully', position: 'top-right' })
    await fetchPending()
    await fetchStats()
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
  if (!rejectReason.value.trim()) {
    $q.notify({ type: 'warning', message: 'Please enter a rejection reason', position: 'top-right' })
    return
  }
  processingId.value = rejectTarget.value.doctorId
  try {
    await adminApi.verifyDoctor(rejectTarget.value.doctorId, 'reject', rejectReason.value)
    $q.notify({ type: 'positive', message: 'Doctor registration rejected', position: 'top-right' })
    rejectDialog.value = false
    await fetchPending()
    await fetchStats()
  } catch (err) {
    $q.notify({ type: 'negative', message: err.response?.data?.message || 'Action failed', position: 'top-right' })
  } finally { processingId.value = null }
}

onMounted(fetchAll)
</script>

<style lang="scss" scoped>
.admin-page { padding: 28px 28px 40px; }

/* Welcome */
.welcome-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 28px;

  .welcome-sub { font-size: 14px; color: #64748b; margin: 0 0 2px; }
  .welcome-name { font-size: 26px; font-weight: 700; color: #1a2332; margin: 0; font-family: 'Poppins', sans-serif; }
  .welcome-date { font-size: 13px; color: #64748b; display: flex; align-items: center; }
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  border-left: 3px solid transparent;
  position: relative;
  overflow: hidden;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

  &--blue   { border-color: #3b82f6; .stat-icon-wrap { background: #eff6ff; color: #3b82f6; } }
  &--teal   { border-color: #14b8a6; .stat-icon-wrap { background: #f0fdfa; color: #14b8a6; } }
  &--indigo { border-color: #6366f1; .stat-icon-wrap { background: #eef2ff; color: #6366f1; } }
  &--green  { border-color: #22c55e; .stat-icon-wrap { background: #f0fdf4; color: #22c55e; } }
  &--orange { border-color: #f97316; .stat-icon-wrap { background: #fff7ed; color: #f97316; } }
  &--cyan   { border-color: #06b6d4; .stat-icon-wrap { background: #ecfeff; color: #06b6d4; } }

  .stat-icon-wrap {
    width: 46px; height: 46px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  .stat-info {
    display: flex; flex-direction: column;
    .stat-value { font-size: 26px; font-weight: 700; color: #1a2332; line-height: 1.1; }
    .stat-label { font-size: 12px; color: #64748b; margin-top: 2px; }
  }
}

/* Dashboard Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  @media (max-width: 900px) { grid-template-columns: 1fr; }
}

.dash-card {
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  border: 1px solid #e9ecef;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f2f5;

  .card-title {
    font-size: 14px;
    font-weight: 600;
    color: #1a2332;
    display: flex;
    align-items: center;
  }
}

.view-all-link-inline {
  font-size: 12px;
  color: #3b82f6;
  text-decoration: none;
  &:hover { text-decoration: underline; }
}

/* List items */
.pending-item {
  padding: 10px 20px;
  &:hover { background: #f8fafc; }
}

.doctor-avatar {
  background: linear-gradient(135deg, #0d1b2a, #1e3a5f);
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
}

.user-avatar {
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
}

.item-name { font-size: 14px; font-weight: 600; color: #1a2332; }
.item-caption { font-size: 12px; color: #64748b; }

.action-btns { display: flex; align-items: center; }
.action-btn { font-size: 11px; padding: 2px 10px; border-radius: 6px; }

.view-all-link {
  text-align: center;
  padding: 12px;
  border-top: 1px solid #f0f2f5;
  a { font-size: 13px; color: #3b82f6; text-decoration: none; &:hover { text-decoration: underline; } }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px;
  color: #64748b;
  p { margin: 8px 0 0; font-size: 14px; }
}

/* Revenue */
.revenue-main {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;

  .revenue-label { font-size: 12px; color: #64748b; margin-bottom: 4px; }
  .revenue-amount { font-size: 28px; font-weight: 700; color: #1a2332; font-family: 'Poppins', sans-serif; }
}

.revenue-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f2f5;
}

.rev-stat {
  display: flex;
  flex-direction: column;

  .rev-stat-val { font-size: 18px; font-weight: 700; }
  .rev-stat-key { font-size: 11px; color: #64748b; margin-top: 2px; }
}

.status-breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.status-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f8fafc;
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 12px;
  color: #475569;

  .status-count { font-weight: 700; }
}

.status-dot {
  width: 8px; height: 8px;
  border-radius: 50%;

  &--success { background: #22c55e; }
  &--pending { background: #f97316; }
  &--failed  { background: #ef4444; }
  &--cancelled { background: #94a3b8; }
  &--chargedback { background: #8b5cf6; }
}

/* Quick Actions */
.quick-actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
}

.quick-action-btn {
  background: #f8fafc !important;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  padding: 12px 8px;
  transition: all 0.15s;

  &:hover { background: #f1f5f9 !important; transform: translateY(-1px); box-shadow: 0 4px 10px rgba(0,0,0,0.08); }

  .qa-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    span { font-size: 11px; font-weight: 600; color: #475569; text-align: center; line-height: 1.2; }
  }
}

/* Dialog */
.reject-dialog { min-width: 420px; border-radius: 12px !important; }
.dialog-title { font-size: 17px; font-weight: 600; color: #1a2332; }
.nexus-input { .q-field__control { border-radius: 8px; } }
</style>