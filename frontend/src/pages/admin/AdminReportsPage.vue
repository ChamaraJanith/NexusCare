
<template>
  <q-page class="admin-page">

    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Reports & Analytics</h2>
        <p class="page-subtitle">Platform performance overview and key metrics</p>
      </div>
      <q-btn unelevated no-caps icon="refresh" label="Refresh" color="green-6" size="sm" @click="loadAll" :loading="loading" />
    </div>

    <!-- Top KPI Row -->
    <div class="kpi-row">
      <div v-for="kpi in kpiCards" :key="kpi.key" class="kpi-card" :class="`kpi-card--${kpi.color}`">
        <div class="kpi-icon-wrap">
          <q-icon :name="kpi.icon" size="22px" color="white" />
        </div>
        <div class="kpi-content">
          <span class="kpi-value">
            <span v-if="loading" class="kpi-skeleton"></span>
            <span v-else>{{ kpi.prefix }}{{ formatValue(kpi.key) }}{{ kpi.suffix }}</span>
          </span>
          <span class="kpi-label">{{ kpi.label }}</span>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="charts-row">

      <!-- Revenue by Status -->
      <q-card class="chart-card">
        <div class="chart-card-header">
          <div class="chart-title-wrap">
            <div class="chart-dot chart-dot--green"></div>
            <span class="chart-title">Revenue by Payment Status</span>
          </div>
        </div>
        <div class="chart-body">
          <q-inner-loading :showing="loading" color="green-5" size="24px" />
          <div v-if="!loading" class="bar-chart">
            <div
              v-for="(item, status) in paymentByStatus"
              :key="status"
              class="bar-item"
            >
              <div class="bar-label-row">
                <span class="bar-label">{{ capitalize(status) }}</span>
                <span class="bar-value">LKR {{ formatCurrency(item.total) }}</span>
              </div>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  :class="`bar-fill--${status}`"
                  :style="{ width: getBarPct(item.total) + '%' }"
                ></div>
              </div>
              <span class="bar-count">{{ item.count }} transactions</span>
            </div>
          </div>
        </div>
      </q-card>

      <!-- User Distribution -->
      <q-card class="chart-card">
        <div class="chart-card-header">
          <div class="chart-title-wrap">
            <div class="chart-dot chart-dot--blue"></div>
            <span class="chart-title">User Distribution</span>
          </div>
        </div>
        <div class="chart-body">
          <q-inner-loading :showing="loading" color="green-5" size="24px" />
          <div v-if="!loading" class="donut-section">
            <div class="donut-wrap">
              <svg viewBox="0 0 120 120" class="donut-svg">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#f0f4f8" stroke-width="18" />
                <circle
                  v-for="(seg, i) in donutSegments"
                  :key="i"
                  cx="60" cy="60" r="50"
                  fill="none"
                  :stroke="seg.color"
                  stroke-width="18"
                  :stroke-dasharray="`${seg.dash} ${seg.gap}`"
                  :stroke-dashoffset="seg.offset"
                  stroke-linecap="round"
                  style="transition: stroke-dasharray 0.8s ease"
                />
                <text x="60" y="56" text-anchor="middle" class="donut-center-val">{{ userStats.totalUsers || 0 }}</text>
                <text x="60" y="68" text-anchor="middle" class="donut-center-label">Users</text>
              </svg>
            </div>
            <div class="donut-legend">
              <div v-for="seg in donutSegments" :key="seg.label" class="legend-item">
                <span class="legend-dot" :style="{ background: seg.color }"></span>
                <span class="legend-label">{{ seg.label }}</span>
                <span class="legend-val">{{ seg.count }}</span>
              </div>
            </div>
          </div>
        </div>
      </q-card>

    </div>

    <!-- Doctor Verification Status -->
    <q-card class="chart-card q-mt-lg">
      <div class="chart-card-header">
        <div class="chart-title-wrap">
          <div class="chart-dot chart-dot--orange"></div>
          <span class="chart-title">Doctor Verification Status</span>
        </div>
      </div>
      <div class="chart-body">
        <q-inner-loading :showing="loading" color="green-5" size="24px" />
        <div v-if="!loading" class="verification-stats">
          <div class="verif-item verif-item--verified">
            <div class="verif-icon">
              <q-icon name="verified" size="28px" color="white" />
            </div>
            <div class="verif-content">
              <span class="verif-count">{{ userStats.verifiedDoctors || 0 }}</span>
              <span class="verif-label">Verified Doctors</span>
              <div class="verif-bar-track">
                <div class="verif-bar-fill verif-bar-fill--green" :style="{ width: verifiedPct + '%' }"></div>
              </div>
              <span class="verif-pct">{{ verifiedPct }}% of total doctors</span>
            </div>
          </div>

          <div class="verif-divider"></div>

          <div class="verif-item verif-item--pending">
            <div class="verif-icon verif-icon--orange">
              <q-icon name="pending_actions" size="28px" color="white" />
            </div>
            <div class="verif-content">
              <span class="verif-count">{{ userStats.pendingDoctors || 0 }}</span>
              <span class="verif-label">Pending Verification</span>
              <div class="verif-bar-track">
                <div class="verif-bar-fill verif-bar-fill--orange" :style="{ width: pendingPct + '%' }"></div>
              </div>
              <span class="verif-pct">{{ pendingPct }}% of total doctors</span>
            </div>
          </div>

          <div class="verif-divider"></div>

          <div class="verif-item">
            <div class="verif-icon verif-icon--blue">
              <q-icon name="group" size="28px" color="white" />
            </div>
            <div class="verif-content">
              <span class="verif-count">{{ userStats.totalDoctors || 0 }}</span>
              <span class="verif-label">Total Doctors</span>
              <div class="verif-bar-track">
                <div class="verif-bar-fill verif-bar-fill--blue" style="width: 100%"></div>
              </div>
              <span class="verif-pct">All registered doctors</span>
            </div>
          </div>
        </div>
      </div>
    </q-card>

    <!-- Platform Health -->
    <q-card class="chart-card q-mt-lg">
      <div class="chart-card-header">
        <div class="chart-title-wrap">
          <div class="chart-dot chart-dot--teal"></div>
          <span class="chart-title">Platform Health</span>
        </div>
        <span class="health-status-badge">
          <span class="health-dot"></span>
          All Systems Operational
        </span>
      </div>
      <div class="health-grid">
        <div v-for="service in services" :key="service.name" class="health-item">
          <div class="health-item-left">
            <div class="health-icon" :class="`health-icon--${service.color}`">
              <q-icon :name="service.icon" size="16px" color="white" />
            </div>
            <div>
              <span class="health-name">{{ service.name }}</span>
              <span class="health-desc">{{ service.desc }}</span>
            </div>
          </div>
          <div class="health-status" :class="`health-status--${service.status}`">
            <span class="health-status-dot"></span>
            {{ service.status === 'up' ? 'Operational' : 'Degraded' }}
          </div>
        </div>
      </div>
    </q-card>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { adminApi, paymentApi } from '../../services/adminApi'

const loading = ref(true)

const userStats       = ref({})
const paymentStats    = ref({})
const paymentByStatus = ref({})

const kpiCards = [
  { key: 'totalRevenue',      label: 'Total Revenue',       icon: 'trending_up',       color: 'green',  prefix: 'LKR ', suffix: '' },
  { key: 'totalTransactions', label: 'Transactions',        icon: 'receipt_long',      color: 'blue',   prefix: '',     suffix: '' },
  { key: 'totalUsers',        label: 'Total Users',         icon: 'group',             color: 'indigo', prefix: '',     suffix: '' },
  { key: 'activeUsers',       label: 'Active Users',        icon: 'how_to_reg',        color: 'teal',   prefix: '',     suffix: '' },
  { key: 'verifiedDoctors',   label: 'Verified Doctors',    icon: 'verified',          color: 'cyan',   prefix: '',     suffix: '' },
  { key: 'pendingDoctors',    label: 'Pending Verifications',icon: 'pending_actions',  color: 'orange', prefix: '',     suffix: '' },
]

const services = [
  { name: 'User Service',        desc: 'Authentication & user management', icon: 'person',           color: 'blue',   status: 'up' },
  { name: 'Doctor Service',      desc: 'Doctor profiles & availability',   icon: 'medical_services', color: 'indigo', status: 'up' },
  { name: 'Appointment Service', desc: 'Booking & scheduling',             icon: 'event_note',       color: 'teal',   status: 'up' },
  { name: 'Payment Service',     desc: 'PayHere payment gateway',          icon: 'account_balance',  color: 'green',  status: 'up' },
  { name: 'Notification Service',desc: 'SMS & email notifications',        icon: 'notifications',    color: 'orange', status: 'up' },
  { name: 'AI Symptom Service',  desc: 'Gemini AI symptom checker',        icon: 'psychology',       color: 'purple', status: 'up' },
  { name: 'Video Service',       desc: 'Telemedicine video sessions',      icon: 'videocam',         color: 'red',    status: 'up' },
  { name: 'Fee Service',         desc: 'Fee & hospital management',        icon: 'price_change',     color: 'cyan',   status: 'up' },
]

const formatCurrency = (n) => (n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const capitalize     = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''

const formatValue = (key) => {
  if (key === 'totalRevenue') return formatCurrency(paymentStats.value.totalRevenue)
  if (key === 'totalTransactions') return paymentStats.value.totalTransactions || 0
  return userStats.value[key] ?? 0
}

const maxRevenue = computed(() => {
  const vals = Object.values(paymentByStatus.value).map(v => v.total || 0)
  return Math.max(...vals, 1)
})

const getBarPct = (val) => Math.round(((val || 0) / maxRevenue.value) * 100)

const donutSegments = computed(() => {
  const total = userStats.value.totalUsers || 1
  const patients = userStats.value.totalPatients || 0
  const doctors  = userStats.value.totalDoctors  || 0
  const admins   = userStats.value.totalAdmins   || 0

  const circumference = 2 * Math.PI * 50
  const segments = [
    { label: 'Patients', count: patients, color: '#0d9488', pct: patients / total },
    { label: 'Doctors',  count: doctors,  color: '#2563eb', pct: doctors  / total },
    { label: 'Admins',   count: admins,   color: '#7c3aed', pct: admins   / total },
  ]

  let offset = circumference * 0.25
  return segments.map(seg => {
    const dash = seg.pct * circumference
    const gap  = circumference - dash
    const result = { ...seg, dash, gap, offset: -offset }
    offset += dash
    return result
  })
})

const verifiedPct = computed(() => {
  const total = userStats.value.totalDoctors || 1
  return Math.round(((userStats.value.verifiedDoctors || 0) / total) * 100)
})

const pendingPct = computed(() => {
  const total = userStats.value.totalDoctors || 1
  return Math.round(((userStats.value.pendingDoctors || 0) / total) * 100)
})

async function loadAll() {
  loading.value = true
  try {
    const [statsRes, payRes] = await Promise.allSettled([
      adminApi.getStats(),
      paymentApi.getStats(),
    ])
    if (statsRes.status === 'fulfilled') userStats.value = statsRes.value.data?.data || {}
    if (payRes.status === 'fulfilled') {
      paymentStats.value    = payRes.value.data?.data?.revenue  || {}
      paymentByStatus.value = payRes.value.data?.data?.byStatus || {}
    }
  } catch { /* silent */ }
  finally { loading.value = false }
}

onMounted(loadAll)
</script>

<style lang="scss" scoped>
.admin-page { padding: 28px 28px 48px; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;

  .page-title    { font-family: 'Poppins', sans-serif; font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 4px; }
  .page-subtitle { font-size: 13px; color: #64748b; margin: 0; }
}

/* KPI Row */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 14px;
  margin-bottom: 20px;

  @media (max-width: 1200px) { grid-template-columns: repeat(3, 1fr); }
  @media (max-width: 700px)  { grid-template-columns: repeat(2, 1fr); }
}

.kpi-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #eef0f4;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: transform 0.15s, box-shadow 0.15s;

  &:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); }

  &--green  { border-left: 3px solid #10b981; .kpi-icon-wrap { background: linear-gradient(135deg,#10b981,#059669); } }
  &--blue   { border-left: 3px solid #3b82f6; .kpi-icon-wrap { background: linear-gradient(135deg,#3b82f6,#2563eb); } }
  &--indigo { border-left: 3px solid #4f46e5; .kpi-icon-wrap { background: linear-gradient(135deg,#4f46e5,#4338ca); } }
  &--teal   { border-left: 3px solid #0d9488; .kpi-icon-wrap { background: linear-gradient(135deg,#0d9488,#0f766e); } }
  &--cyan   { border-left: 3px solid #0891b2; .kpi-icon-wrap { background: linear-gradient(135deg,#0891b2,#0e7490); } }
  &--orange { border-left: 3px solid #f97316; .kpi-icon-wrap { background: linear-gradient(135deg,#f97316,#ea580c); } }
}

.kpi-icon-wrap {
  width: 42px; height: 42px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.kpi-content {
  display: flex; flex-direction: column;
  .kpi-value { font-size: 18px; font-weight: 800; color: #0f172a; font-family: 'Poppins', sans-serif; }
  .kpi-label { font-size: 11px; color: #64748b; margin-top: 1px; }
}

.kpi-skeleton {
  display: block;
  width: 80px; height: 20px;
  background: linear-gradient(90deg, #f0f4f8 25%, #e2e8f0 50%, #f0f4f8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 5px;
}

@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Charts Row */
.charts-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 16px;

  @media (max-width: 900px) { grid-template-columns: 1fr; }
}

.chart-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #eef0f4;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  overflow: hidden;
}

.chart-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f4f8;
}

.chart-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart-dot {
  width: 8px; height: 8px;
  border-radius: 50%;

  &--green  { background: #10b981; box-shadow: 0 0 6px rgba(16,185,129,0.4); }
  &--blue   { background: #3b82f6; box-shadow: 0 0 6px rgba(59,130,246,0.4); }
  &--orange { background: #f97316; box-shadow: 0 0 6px rgba(249,115,22,0.4); }
  &--teal   { background: #0d9488; box-shadow: 0 0 6px rgba(13,148,136,0.4); }
}

.chart-title { font-size: 14px; font-weight: 600; color: #0f172a; }

.chart-body { padding: 20px; min-height: 200px; position: relative; }

/* Bar Chart */
.bar-chart { display: flex; flex-direction: column; gap: 14px; }

.bar-item { display: flex; flex-direction: column; gap: 4px; }

.bar-label-row {
  display: flex;
  justify-content: space-between;
  .bar-label { font-size: 12px; font-weight: 600; color: #334155; text-transform: capitalize; }
  .bar-value { font-size: 12px; font-weight: 700; color: #0f172a; }
}

.bar-track {
  height: 8px;
  background: #f0f4f8;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.8s ease;

  &--success    { background: linear-gradient(90deg, #22c55e, #16a34a); }
  &--pending    { background: linear-gradient(90deg, #f97316, #ea580c); }
  &--failed     { background: linear-gradient(90deg, #ef4444, #dc2626); }
  &--cancelled  { background: linear-gradient(90deg, #94a3b8, #64748b); }
  &--chargedback{ background: linear-gradient(90deg, #8b5cf6, #7c3aed); }
}

.bar-count { font-size: 11px; color: #94a3b8; }

/* Donut Chart */
.donut-section {
  display: flex;
  align-items: center;
  gap: 24px;
}

.donut-wrap { width: 140px; height: 140px; flex-shrink: 0; }

.donut-svg { width: 100%; height: 100%; transform: rotate(-90deg); }

.donut-center-val {
  font-size: 22px;
  font-weight: 800;
  fill: #0f172a;
  font-family: 'Poppins', sans-serif;
  transform: rotate(90deg);
  transform-origin: 60px 60px;
}

.donut-center-label {
  font-size: 10px;
  fill: #94a3b8;
  transform: rotate(90deg);
  transform-origin: 60px 60px;
}

.donut-legend { display: flex; flex-direction: column; gap: 10px; }

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;

  .legend-dot   { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .legend-label { font-size: 13px; color: #475569; flex: 1; }
  .legend-val   { font-size: 14px; font-weight: 700; color: #0f172a; }
}

/* Verification Stats */
.verification-stats {
  display: flex;
  align-items: stretch;
  gap: 0;
  padding: 8px 0;
}

.verif-item {
  flex: 1;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 20px;
}

.verif-divider { width: 1px; background: #f0f4f8; margin: 16px 0; }

.verif-icon {
  width: 52px; height: 52px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  background: linear-gradient(135deg, #22c55e, #16a34a);

  &--orange { background: linear-gradient(135deg, #f97316, #ea580c); }
  &--blue   { background: linear-gradient(135deg, #3b82f6, #2563eb); }
}

.verif-content {
  display: flex;
  flex-direction: column;
  flex: 1;

  .verif-count { font-size: 32px; font-weight: 800; color: #0f172a; font-family: 'Poppins', sans-serif; line-height: 1; }
  .verif-label { font-size: 13px; color: #64748b; margin: 4px 0 10px; }
  .verif-pct   { font-size: 11px; color: #94a3b8; margin-top: 4px; }
}

.verif-bar-track {
  height: 6px;
  background: #f0f4f8;
  border-radius: 3px;
  overflow: hidden;
}

.verif-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 1s ease;

  &--green  { background: linear-gradient(90deg, #22c55e, #16a34a); }
  &--orange { background: linear-gradient(90deg, #f97316, #ea580c); }
  &--blue   { background: linear-gradient(90deg, #3b82f6, #2563eb); }
}

/* Health Grid */
.health-status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #16a34a;

  .health-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #22c55e;
    animation: healthPulse 2s ease infinite;
  }
}

@keyframes healthPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
  50%       { box-shadow: 0 0 0 5px rgba(34,197,94,0); }
}

.health-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  padding: 8px 0;

  @media (max-width: 1100px) { grid-template-columns: repeat(2, 1fr); }
}

.health-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid #f8fafc;
  border-right: 1px solid #f8fafc;

  &:nth-child(4n) { border-right: none; }
}

.health-item-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.health-icon {
  width: 32px; height: 32px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;

  &--blue   { background: linear-gradient(135deg, #3b82f6, #2563eb); }
  &--indigo { background: linear-gradient(135deg, #4f46e5, #4338ca); }
  &--teal   { background: linear-gradient(135deg, #0d9488, #0f766e); }
  &--green  { background: linear-gradient(135deg, #22c55e, #16a34a); }
  &--orange { background: linear-gradient(135deg, #f97316, #ea580c); }
  &--purple { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
  &--red    { background: linear-gradient(135deg, #ef4444, #dc2626); }
  &--cyan   { background: linear-gradient(135deg, #0891b2, #0e7490); }
}

.health-name { display: block; font-size: 13px; font-weight: 600; color: #0f172a; }
.health-desc { display: block; font-size: 11px; color: #94a3b8; }

.health-status {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;

  .health-status-dot { width: 6px; height: 6px; border-radius: 50%; }

  &--up   { background: #f0fdf4; color: #16a34a; .health-status-dot { background: #22c55e; } }
  &--down { background: #fef2f2; color: #dc2626; .health-status-dot { background: #ef4444; } }
}
</style>
