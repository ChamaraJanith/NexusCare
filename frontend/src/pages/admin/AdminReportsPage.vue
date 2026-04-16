<template>
  <q-page class="rp-page">

    <!-- ── Header ─────────────────────────────────────────────────── -->
    <div class="rp-header">
      <div>
        <h2 class="rp-title">Reports & Analytics</h2>
        <p class="rp-sub">Real-time platform performance, revenue breakdown and system health</p>
      </div>
      <div class="rp-header-actions">
        <div class="rp-date-range">
          <q-icon name="date_range" size="15px" color="grey-5" />
          <input v-model="revFrom" type="date" class="rp-date-input" @change="loadRevenue" />
          <span class="rp-date-sep">→</span>
          <input v-model="revTo" type="date" class="rp-date-input" @change="loadRevenue" />
        </div>
        <q-btn unelevated no-caps icon="file_download" label="Export CSV" color="blue-7" size="sm" class="rp-export-btn" @click="exportCSV" />
        <q-btn unelevated no-caps icon="refresh" label="Refresh" color="green-6" size="sm" @click="loadAll" :loading="loading || revLoading" />
      </div>
    </div>

    <!-- ── Section: Overview KPIs ─────────────────────────────────── -->
    <div class="rp-section-label">Platform Overview</div>
    <div class="rp-kpi-grid">
      <div v-for="kpi in kpiCards" :key="kpi.key" class="rp-kpi" :class="`rp-kpi--${kpi.color}`">
        <div class="rp-kpi-icon" :class="`rp-kpi-icon--${kpi.color}`">
          <q-icon :name="kpi.icon" size="20px" color="white" />
        </div>
        <div class="rp-kpi-body">
          <span class="rp-kpi-val">
            <span v-if="loading" class="rp-skeleton"></span>
            <span v-else>{{ kpi.prefix }}{{ formatValue(kpi.key) }}</span>
          </span>
          <span class="rp-kpi-label">{{ kpi.label }}</span>
        </div>
        <div v-if="kpi.trend" class="rp-kpi-trend">
          <q-icon name="trending_up" size="12px" color="green-5" />
        </div>
      </div>
    </div>

    <!-- ── Section: Revenue KPIs ──────────────────────────────────── -->
    <div class="rp-section-label">Revenue Summary
      <span class="rp-section-badge" v-if="revFrom || revTo">Filtered</span>
    </div>
    <div class="rp-rev-kpi-grid">
      <div class="rp-rev-kpi rp-rev-kpi--primary">
        <div class="rp-rev-kpi-left">
          <span class="rp-rev-kpi-label">Total Platform Revenue</span>
          <span class="rp-rev-kpi-val">
            <span v-if="revLoading" class="rp-skeleton rp-skeleton--lg"></span>
            <span v-else>LKR {{ fmt(revSummary.totalRevenue) }}</span>
          </span>
          <span class="rp-rev-kpi-sub">{{ revSummary.totalTransactions || 0 }} paid transactions</span>
        </div>
        <div class="rp-rev-kpi-icon"><q-icon name="account_balance_wallet" size="28px" color="white" /></div>
      </div>
      <div class="rp-rev-kpi rp-rev-kpi--blue">
        <div class="rp-rev-kpi-left">
          <span class="rp-rev-kpi-label">Doctor Consultation Revenue</span>
          <span class="rp-rev-kpi-val">LKR {{ fmt(revSummary.doctorFeeRevenue) }}</span>
          <span class="rp-rev-kpi-sub">{{ doctorRevPct }}% of total</span>
        </div>
        <div class="rp-rev-kpi-icon rp-rev-kpi-icon--blue"><q-icon name="medical_services" size="28px" color="white" /></div>
      </div>
      <div class="rp-rev-kpi rp-rev-kpi--red">
        <div class="rp-rev-kpi-left">
          <span class="rp-rev-kpi-label">Hospital Revenue</span>
          <span class="rp-rev-kpi-val">LKR {{ fmt(revSummary.hospitalFeeRevenue) }}</span>
          <span class="rp-rev-kpi-sub">{{ hospitalRevPct }}% of total</span>
        </div>
        <div class="rp-rev-kpi-icon rp-rev-kpi-icon--red"><q-icon name="local_hospital" size="28px" color="white" /></div>
      </div>
      <div class="rp-rev-kpi rp-rev-kpi--teal">
        <div class="rp-rev-kpi-left">
          <span class="rp-rev-kpi-label">Platform Service Fee</span>
          <span class="rp-rev-kpi-val">LKR {{ fmt(revSummary.serviceFeeRevenue) }}</span>
          <span class="rp-rev-kpi-sub">Avg LKR {{ fmt(revSummary.avgAmount) }} / txn</span>
        </div>
        <div class="rp-rev-kpi-icon rp-rev-kpi-icon--teal"><q-icon name="price_change" size="28px" color="white" /></div>
      </div>
    </div>

    <!-- ── Section: Charts Row ────────────────────────────────────── -->
    <div class="rp-charts-row">

      <!-- Monthly Revenue Trend -->
      <q-card class="rp-card rp-card--wide">
        <div class="rp-card-header">
          <div class="rp-card-title-wrap">
            <span class="rp-card-dot rp-card-dot--green"></span>
            <span class="rp-card-title">Monthly Revenue Trend</span>
          </div>
          <span class="rp-card-meta">Last 12 months</span>
        </div>
        <div class="rp-card-body">
          <q-inner-loading :showing="revLoading" color="green-5" size="22px" />
          <div v-if="!revLoading && monthlyTrend.length === 0" class="rp-empty">
            <q-icon name="bar_chart" size="36px" color="grey-4" /><p>No data available</p>
          </div>
          <div v-else-if="!revLoading" class="rp-trend-chart">
            <div v-for="m in monthlyTrend" :key="m.label" class="rp-trend-col">
              <span class="rp-trend-val">{{ fmtShort(m.revenue) }}</span>
              <div class="rp-trend-bar-wrap">
                <div class="rp-trend-bar" :style="{ height: getTrendPct(m.revenue) + '%' }">
                  <q-tooltip>LKR {{ fmt(m.revenue) }} · {{ m.transactions }} txn</q-tooltip>
                </div>
              </div>
              <span class="rp-trend-label">{{ m.label }}</span>
            </div>
          </div>
        </div>
      </q-card>

      <!-- Revenue by Status + User Distribution stacked -->
      <div class="rp-side-stack">

        <!-- Revenue by Status -->
        <q-card class="rp-card">
          <div class="rp-card-header">
            <div class="rp-card-title-wrap">
              <span class="rp-card-dot rp-card-dot--indigo"></span>
              <span class="rp-card-title">Revenue by Payment Status</span>
            </div>
          </div>
          <div class="rp-card-body rp-card-body--compact">
            <q-inner-loading :showing="loading" color="green-5" size="20px" />
            <div v-if="!loading" class="rp-status-bars">
              <div v-for="(item, status) in paymentByStatus" :key="status" class="rp-status-row">
                <div class="rp-status-label-row">
                  <div class="rp-status-dot" :class="`rp-status-dot--${status}`"></div>
                  <span class="rp-status-name">{{ capitalize(status) }}</span>
                  <span class="rp-status-count">{{ item.count }}</span>
                  <span class="rp-status-amt">LKR {{ fmtShort(item.total) }}</span>
                </div>
                <div class="rp-status-track">
                  <div class="rp-status-fill" :class="`rp-status-fill--${status}`" :style="{ width: getBarPct(item.total) + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </q-card>

        <!-- User Distribution -->
        <q-card class="rp-card">
          <div class="rp-card-header">
            <div class="rp-card-title-wrap">
              <span class="rp-card-dot rp-card-dot--blue"></span>
              <span class="rp-card-title">User Distribution</span>
            </div>
          </div>
          <div class="rp-card-body rp-card-body--compact rp-donut-body">
            <q-inner-loading :showing="loading" color="green-5" size="20px" />
            <div v-if="!loading" class="rp-donut-wrap">
              <svg viewBox="0 0 120 120" class="rp-donut-svg">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#f0f4f8" stroke-width="16" />
                <circle v-for="(seg, i) in donutSegments" :key="i"
                  cx="60" cy="60" r="50" fill="none"
                  :stroke="seg.color" stroke-width="16"
                  :stroke-dasharray="`${seg.dash} ${seg.gap}`"
                  :stroke-dashoffset="seg.offset"
                  stroke-linecap="round"
                  style="transition: stroke-dasharray 0.8s ease"
                />
                <text x="60" y="55" text-anchor="middle" class="rp-donut-num">{{ userStats.totalUsers || 0 }}</text>
                <text x="60" y="67" text-anchor="middle" class="rp-donut-lbl">Users</text>
              </svg>
              <div class="rp-donut-legend">
                <div v-for="seg in donutSegments" :key="seg.label" class="rp-legend-row">
                  <span class="rp-legend-dot" :style="{ background: seg.color }"></span>
                  <span class="rp-legend-name">{{ seg.label }}</span>
                  <span class="rp-legend-val">{{ seg.count }}</span>
                </div>
              </div>
            </div>
          </div>
        </q-card>

      </div>
    </div>

    <!-- ── Section: Doctor & Hospital Revenue ─────────────────────── -->
    <div class="rp-section-label">Revenue Breakdown</div>
    <div class="rp-breakdown-row">

      <!-- Doctor Income -->
      <q-card class="rp-card">
        <div class="rp-card-header">
          <div class="rp-card-title-wrap">
            <span class="rp-card-dot rp-card-dot--blue"></span>
            <span class="rp-card-title">Doctor Income</span>
          </div>
          <span class="rp-badge">{{ byDoctor.length }} doctors</span>
        </div>
        <q-inner-loading :showing="revLoading" color="green-5" size="20px" />
        <div v-if="!revLoading && byDoctor.length === 0" class="rp-empty"><q-icon name="medical_services" size="32px" color="grey-4" /><p>No data</p></div>
        <div v-else class="rp-rank-table">
          <div class="rp-rank-header">
            <span>#</span><span>Doctor</span><span>Txn</span><span>Income</span>
          </div>
          <div v-for="(doc, i) in byDoctor" :key="doc.doctorId" class="rp-rank-row">
            <span class="rp-rank-num" :class="i < 3 ? `rp-rank-num--top${i+1}` : ''">{{ i + 1 }}</span>
            <div class="rp-rank-info">
              <div class="rp-rank-avatar rp-rank-avatar--blue">{{ getInitials(doc.doctorName) }}</div>
              <div>
                <div class="rp-rank-name">Dr. {{ doc.doctorName }}</div>
                <div class="rp-rank-id">{{ doc.doctorId }}</div>
              </div>
            </div>
            <span class="rp-rank-txn">{{ doc.transactions }}</span>
            <div class="rp-rank-amount">
              <span class="rp-rank-val rp-rank-val--blue">LKR {{ fmt(doc.totalIncome) }}</span>
              <div class="rp-rank-bar-track"><div class="rp-rank-bar rp-rank-bar--blue" :style="{ width: getDoctorPct(doc.totalIncome) + '%' }"></div></div>
            </div>
          </div>
        </div>
      </q-card>

      <!-- Hospital Revenue -->
      <q-card class="rp-card">
        <div class="rp-card-header">
          <div class="rp-card-title-wrap">
            <span class="rp-card-dot rp-card-dot--red"></span>
            <span class="rp-card-title">Hospital Revenue</span>
          </div>
          <span class="rp-badge">{{ byHospital.filter(h => h.revenue > 0).length }} active</span>
        </div>
        <q-inner-loading :showing="revLoading" color="green-5" size="20px" />
        <div v-if="!revLoading && byHospital.length === 0" class="rp-empty"><q-icon name="local_hospital" size="32px" color="grey-4" /><p>No data</p></div>
        <div v-else class="rp-rank-table">
          <div class="rp-rank-header">
            <span>#</span><span>Hospital</span><span>Appts</span><span>Revenue</span>
          </div>
          <div v-for="(hosp, i) in byHospital" :key="hosp.hospitalId" class="rp-rank-row">
            <span class="rp-rank-num" :class="i < 3 && hosp.revenue > 0 ? `rp-rank-num--top${i+1}` : ''">{{ i + 1 }}</span>
            <div class="rp-rank-info">
              <div class="rp-rank-avatar rp-rank-avatar--red"><q-icon name="local_hospital" size="13px" color="white" /></div>
              <div>
                <div class="rp-rank-name">{{ hosp.hospitalName }}</div>
                <div class="rp-rank-id">{{ hosp.location || hosp.hospitalId }}</div>
              </div>
            </div>
            <span class="rp-rank-txn">{{ hosp.appointments }}</span>
            <div class="rp-rank-amount">
              <span class="rp-rank-val rp-rank-val--red">LKR {{ fmt(hosp.revenue) }}</span>
              <div class="rp-rank-bar-track"><div class="rp-rank-bar rp-rank-bar--red" :style="{ width: getHospitalPct(hosp.revenue) + '%' }"></div></div>
            </div>
          </div>
        </div>
      </q-card>

    </div>

    <!-- ── Section: Doctor Verification ──────────────────────────── -->
    <div class="rp-section-label">Doctor Verification</div>
    <div class="rp-verif-row">
      <q-card class="rp-card rp-verif-card" v-for="v in verifCards" :key="v.label">
        <div class="rp-verif-inner">
          <div class="rp-verif-icon" :class="`rp-verif-icon--${v.color}`">
            <q-icon :name="v.icon" size="24px" color="white" />
          </div>
          <div class="rp-verif-body">
            <span class="rp-verif-count">
              <span v-if="loading" class="rp-skeleton"></span>
              <span v-else>{{ v.value }}</span>
            </span>
            <span class="rp-verif-label">{{ v.label }}</span>
            <div class="rp-verif-track">
              <div class="rp-verif-fill" :class="`rp-verif-fill--${v.color}`" :style="{ width: v.pct + '%' }"></div>
            </div>
            <span class="rp-verif-pct">{{ v.pct }}% of total doctors</span>
          </div>
        </div>
      </q-card>
    </div>

    <!-- ── Section: Platform Health ──────────────────────────────── -->
    <div class="rp-section-label">
      Platform Health
      <span class="rp-health-badge">
        <span class="rp-health-pulse"></span>
        All Systems Operational
      </span>
    </div>
    <div class="rp-health-grid">
      <div v-for="svc in services" :key="svc.name" class="rp-health-item">
        <div class="rp-health-left">
          <div class="rp-health-icon" :class="`rp-health-icon--${svc.color}`">
            <q-icon :name="svc.icon" size="15px" color="white" />
          </div>
          <div>
            <span class="rp-health-name">{{ svc.name }}</span>
            <span class="rp-health-desc">{{ svc.desc }}</span>
          </div>
        </div>
        <div class="rp-health-status rp-health-status--up">
          <span class="rp-health-dot"></span>
          Operational
        </div>
      </div>
    </div>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { adminApi, paymentApi } from '../../services/adminApi'

const loading    = ref(true)
const revLoading = ref(true)

const userStats       = ref({})
const paymentStats    = ref({})
const paymentByStatus = ref({})
const revFrom         = ref('')
const revTo           = ref('')
const revSummary      = ref({})
const byDoctor        = ref([])
const byHospital      = ref([])
const monthlyTrend    = ref([])

// ── KPI config ────────────────────────────────────────────────────
const kpiCards = [
  { key: 'totalRevenue',      label: 'Total Revenue',         icon: 'trending_up',      color: 'green',  prefix: 'LKR ', trend: true },
  { key: 'totalTransactions', label: 'Transactions',          icon: 'receipt_long',     color: 'blue',   prefix: '' },
  { key: 'totalUsers',        label: 'Total Users',           icon: 'group',            color: 'indigo', prefix: '' },
  { key: 'activeUsers',       label: 'Active Users',          icon: 'how_to_reg',       color: 'teal',   prefix: '' },
  { key: 'verifiedDoctors',   label: 'Verified Doctors',      icon: 'verified',         color: 'cyan',   prefix: '' },
  { key: 'pendingDoctors',    label: 'Pending Verifications', icon: 'pending_actions',  color: 'orange', prefix: '' },
]

const services = [
  { name: 'User Service',        desc: 'Auth & profiles',      icon: 'person',           color: 'blue'   },
  { name: 'Doctor Service',      desc: 'Profiles & schedules', icon: 'medical_services', color: 'indigo' },
  { name: 'Appointment Service', desc: 'Booking & scheduling', icon: 'event_note',       color: 'teal'   },
  { name: 'Payment Service',     desc: 'PayHere gateway',      icon: 'account_balance',  color: 'green'  },
  { name: 'Notification Service',desc: 'SMS & email',          icon: 'notifications',    color: 'orange' },
  { name: 'AI Symptom Service',  desc: 'Gemini AI checker',    icon: 'psychology',       color: 'purple' },
  { name: 'Video Service',       desc: 'Telemedicine sessions',icon: 'videocam',         color: 'red'    },
  { name: 'Fee Service',         desc: 'Fee management',       icon: 'price_change',     color: 'cyan'   },
]

// ── Helpers ───────────────────────────────────────────────────────
const fmt = (n) => (n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtShort = (n) => {
  if (!n) return '0'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000)    return (n / 1000).toFixed(1) + 'K'
  return Math.round(n).toString()
}
const capitalize  = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
const getInitials = (n = '') => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

const formatValue = (key) => {
  if (key === 'totalRevenue')      return fmt(paymentStats.value.totalRevenue)
  if (key === 'totalTransactions') return paymentStats.value.totalTransactions || 0
  return userStats.value[key] ?? 0
}

// ── Revenue % breakdowns ──────────────────────────────────────────
const doctorRevPct   = computed(() => {
  const t = revSummary.value.totalRevenue || 1
  return Math.round(((revSummary.value.doctorFeeRevenue || 0) / t) * 100)
})
const hospitalRevPct = computed(() => {
  const t = revSummary.value.totalRevenue || 1
  return Math.round(((revSummary.value.hospitalFeeRevenue || 0) / t) * 100)
})

// ── Chart computeds ───────────────────────────────────────────────
const maxRevenue     = computed(() => Math.max(...Object.values(paymentByStatus.value).map(v => v.total || 0), 1))
const maxDoctorInc   = computed(() => Math.max(...byDoctor.value.map(d => d.totalIncome), 1))
const maxHospitalRev = computed(() => Math.max(...byHospital.value.map(h => h.revenue), 1))
const maxMonthlyRev  = computed(() => Math.max(...monthlyTrend.value.map(m => m.revenue), 1))

const getBarPct     = (v) => Math.round(((v || 0) / maxRevenue.value) * 100)
const getDoctorPct  = (v) => Math.round((v / maxDoctorInc.value) * 100)
const getHospitalPct= (v) => Math.round((v / maxHospitalRev.value) * 100)
const getTrendPct   = (v) => Math.max(Math.round((v / maxMonthlyRev.value) * 100), 3)

// ── Donut ─────────────────────────────────────────────────────────
const donutSegments = computed(() => {
  const total    = userStats.value.totalUsers || 1
  const patients = userStats.value.totalPatients || 0
  const doctors  = userStats.value.totalDoctors  || 0
  const admins   = userStats.value.totalAdmins   || 0
  const C = 2 * Math.PI * 50
  const segs = [
    { label: 'Patients', count: patients, color: '#0d9488', pct: patients / total },
    { label: 'Doctors',  count: doctors,  color: '#2563eb', pct: doctors  / total },
    { label: 'Admins',   count: admins,   color: '#7c3aed', pct: admins   / total },
  ]
  let offset = C * 0.25
  return segs.map(s => {
    const dash = s.pct * C; const gap = C - dash
    const r = { ...s, dash, gap, offset: -offset }
    offset += dash; return r
  })
})

// ── Verification cards ────────────────────────────────────────────
const verifCards = computed(() => {
  const total = userStats.value.totalDoctors || 1
  return [
    { label: 'Verified Doctors',     icon: 'verified',       color: 'green',  value: userStats.value.verifiedDoctors || 0, pct: Math.round(((userStats.value.verifiedDoctors || 0) / total) * 100) },
    { label: 'Pending Verification', icon: 'pending_actions',color: 'orange', value: userStats.value.pendingDoctors  || 0, pct: Math.round(((userStats.value.pendingDoctors  || 0) / total) * 100) },
    { label: 'Total Doctors',        icon: 'group',          color: 'blue',   value: userStats.value.totalDoctors    || 0, pct: 100 },
  ]
})

// ── Data loading ──────────────────────────────────────────────────
async function loadAll() {
  loading.value = true
  try {
    const [statsRes, payRes] = await Promise.allSettled([adminApi.getStats(), paymentApi.getStats()])
    if (statsRes.status === 'fulfilled') userStats.value = statsRes.value.data?.data || {}
    if (payRes.status === 'fulfilled') {
      paymentStats.value    = payRes.value.data?.data?.revenue  || {}
      paymentByStatus.value = payRes.value.data?.data?.byStatus || {}
    }
  } catch { /* silent */ }
  finally { loading.value = false }
}

async function loadRevenue() {
  revLoading.value = true
  try {
    const params = {}
    if (revFrom.value) params.from = revFrom.value
    if (revTo.value)   params.to   = revTo.value
    const { data } = await paymentApi.getRevenueReport(params)
    const d = data.data || {}
    revSummary.value   = d.summary      || {}
    byDoctor.value     = d.byDoctor     || []
    byHospital.value   = d.byHospital   || []
    monthlyTrend.value = d.monthlyTrend || []
  } catch { /* silent */ }
  finally { revLoading.value = false }
}

function exportCSV() {
  const rows = [
    ['Type', 'ID', 'Name', 'Transactions', 'Total Revenue (LKR)'],
    ...byDoctor.value.map(d  => ['Doctor',   d.doctorId,   `Dr. ${d.doctorName}`, d.transactions, d.totalIncome.toFixed(2)]),
    ...byHospital.value.map(h => ['Hospital', h.hospitalId, h.hospitalName,        h.appointments, h.revenue.toFixed(2)]),
    ['System', 'PLATFORM', 'Service Fee Revenue', revSummary.value.totalTransactions || 0, (revSummary.value.serviceFeeRevenue || 0).toFixed(2)],
  ]
  const csv  = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = `nexuscare-report-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
  URL.revokeObjectURL(url)
}

onMounted(() => { loadAll(); loadRevenue() })
</script>

<style lang="scss" scoped>
.rp-page { padding: 24px 28px 56px; background: #f0f4f8; min-height: 100vh; }

/* ── Header ──────────────────────────────────────────────────────── */
.rp-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 28px; flex-wrap: wrap; gap: 14px;

  .rp-title { font-family: 'Poppins', sans-serif; font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 3px; }
  .rp-sub   { font-size: 13px; color: #64748b; margin: 0; }
}

.rp-header-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

.rp-date-range {
  display: flex; align-items: center; gap: 8px;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 7px 12px;
}
.rp-date-input {
  border: none; outline: none; background: transparent;
  font-size: 12px; color: #334155; width: 120px;
}
.rp-date-sep { font-size: 12px; color: #94a3b8; }
.rp-export-btn { border-radius: 8px !important; }

/* ── Section Labels ──────────────────────────────────────────────── */
.rp-section-label {
  font-size: 11px; font-weight: 700; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 1px;
  margin: 24px 0 12px; display: flex; align-items: center; gap: 10px;
}
.rp-section-badge {
  font-size: 10px; font-weight: 700; color: #2563eb;
  background: #eff6ff; border: 1px solid #bfdbfe;
  padding: 2px 8px; border-radius: 20px; text-transform: none; letter-spacing: 0;
}

/* ── Overview KPI Grid ───────────────────────────────────────────── */
.rp-kpi-grid {
  display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; margin-bottom: 4px;
  @media (max-width: 1200px) { grid-template-columns: repeat(3, 1fr); }
  @media (max-width: 700px)  { grid-template-columns: repeat(2, 1fr); }
}

.rp-kpi {
  background: #fff; border-radius: 12px; border: 1px solid #eef0f4;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05); padding: 14px 16px;
  display: flex; align-items: center; gap: 12px;
  transition: transform 0.15s, box-shadow 0.15s;
  &:hover { transform: translateY(-2px); box-shadow: 0 4px 14px rgba(0,0,0,0.08); }

  &--green  { border-left: 3px solid #10b981; }
  &--blue   { border-left: 3px solid #3b82f6; }
  &--indigo { border-left: 3px solid #4f46e5; }
  &--teal   { border-left: 3px solid #0d9488; }
  &--cyan   { border-left: 3px solid #0891b2; }
  &--orange { border-left: 3px solid #f97316; }
}

.rp-kpi-icon {
  width: 38px; height: 38px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  &--green  { background: linear-gradient(135deg,#10b981,#059669); }
  &--blue   { background: linear-gradient(135deg,#3b82f6,#2563eb); }
  &--indigo { background: linear-gradient(135deg,#4f46e5,#4338ca); }
  &--teal   { background: linear-gradient(135deg,#0d9488,#0f766e); }
  &--cyan   { background: linear-gradient(135deg,#0891b2,#0e7490); }
  &--orange { background: linear-gradient(135deg,#f97316,#ea580c); }
}

.rp-kpi-body { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.rp-kpi-val  { font-size: 17px; font-weight: 800; color: #0f172a; font-family: 'Poppins', sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rp-kpi-label{ font-size: 10px; color: #64748b; margin-top: 2px; }
.rp-kpi-trend{ margin-left: auto; }

/* ── Revenue KPI Grid ────────────────────────────────────────────── */
.rp-rev-kpi-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
  @media (max-width: 1100px) { grid-template-columns: repeat(2, 1fr); }
}

.rp-rev-kpi {
  border-radius: 14px; padding: 20px 22px;
  display: flex; justify-content: space-between; align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);

  &--primary { background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); }
  &--blue    { background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%); }
  &--red     { background: linear-gradient(135deg, #b91c1c 0%, #dc2626 100%); }
  &--teal    { background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%); }
}

.rp-rev-kpi-left { display: flex; flex-direction: column; }
.rp-rev-kpi-label{ font-size: 11px; color: rgba(255,255,255,0.65); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
.rp-rev-kpi-val  { font-size: 22px; font-weight: 800; color: #fff; font-family: 'Poppins', sans-serif; line-height: 1; margin-bottom: 6px; }
.rp-rev-kpi-sub  { font-size: 11px; color: rgba(255,255,255,0.5); }

.rp-rev-kpi-icon {
  width: 52px; height: 52px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  background: rgba(255,255,255,0.12);
  &--blue { background: rgba(255,255,255,0.15); }
  &--red  { background: rgba(255,255,255,0.15); }
  &--teal { background: rgba(255,255,255,0.15); }
}

/* ── Charts Row ──────────────────────────────────────────────────── */
.rp-charts-row {
  display: grid; grid-template-columns: 1.6fr 1fr; gap: 14px; margin-top: 4px;
  @media (max-width: 1000px) { grid-template-columns: 1fr; }
}

.rp-side-stack { display: flex; flex-direction: column; gap: 14px; }

/* ── Card Base ───────────────────────────────────────────────────── */
.rp-card {
  background: #fff; border-radius: 14px; border: 1px solid #eef0f4;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05); overflow: hidden;
}

.rp-card-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 18px; border-bottom: 1px solid #f0f4f8;
}

.rp-card-title-wrap { display: flex; align-items: center; gap: 8px; }
.rp-card-dot {
  width: 8px; height: 8px; border-radius: 50%;
  &--green  { background: #10b981; box-shadow: 0 0 5px rgba(16,185,129,0.5); }
  &--blue   { background: #3b82f6; box-shadow: 0 0 5px rgba(59,130,246,0.5); }
  &--indigo { background: #4f46e5; box-shadow: 0 0 5px rgba(79,70,229,0.5); }
  &--red    { background: #ef4444; box-shadow: 0 0 5px rgba(239,68,68,0.5); }
  &--orange { background: #f97316; box-shadow: 0 0 5px rgba(249,115,22,0.5); }
  &--teal   { background: #0d9488; box-shadow: 0 0 5px rgba(13,148,136,0.5); }
}
.rp-card-title { font-size: 13px; font-weight: 600; color: #0f172a; }
.rp-card-meta  { font-size: 11px; color: #94a3b8; }
.rp-badge      { font-size: 11px; color: #64748b; background: #f0f4f8; padding: 2px 10px; border-radius: 20px; }

.rp-card-body { padding: 18px; min-height: 180px; position: relative; }
.rp-card-body--compact { padding: 14px 18px; min-height: 120px; }

/* ── Monthly Trend Chart ─────────────────────────────────────────── */
.rp-trend-chart {
  display: flex; align-items: flex-end; gap: 6px; height: 160px; overflow-x: auto; padding-bottom: 2px;
}
.rp-trend-col { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 52px; flex: 1; }
.rp-trend-val { font-size: 9px; font-weight: 700; color: #0d9488; white-space: nowrap; }
.rp-trend-bar-wrap {
  width: 100%; height: 110px; background: #f0f4f8; border-radius: 4px 4px 0 0;
  display: flex; align-items: flex-end; overflow: hidden;
}
.rp-trend-bar {
  width: 100%; background: linear-gradient(180deg, #10b981, #059669);
  border-radius: 4px 4px 0 0; transition: height 0.8s ease; min-height: 3px; cursor: pointer;
  &:hover { background: linear-gradient(180deg, #34d399, #10b981); }
}
.rp-trend-label { font-size: 9px; color: #64748b; font-weight: 600; white-space: nowrap; }

/* ── Status Bars ─────────────────────────────────────────────────── */
.rp-status-bars { display: flex; flex-direction: column; gap: 10px; }
.rp-status-row  { display: flex; flex-direction: column; gap: 4px; }
.rp-status-label-row {
  display: flex; align-items: center; gap: 6px;
  .rp-status-name  { font-size: 12px; font-weight: 600; color: #334155; flex: 1; text-transform: capitalize; }
  .rp-status-count { font-size: 11px; color: #94a3b8; }
  .rp-status-amt   { font-size: 11px; font-weight: 700; color: #0f172a; }
}
.rp-status-dot {
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
  &--success    { background: #22c55e; }
  &--pending    { background: #f97316; }
  &--failed     { background: #ef4444; }
  &--cancelled  { background: #94a3b8; }
  &--chargedback{ background: #8b5cf6; }
}
.rp-status-track { height: 6px; background: #f0f4f8; border-radius: 3px; overflow: hidden; }
.rp-status-fill {
  height: 100%; border-radius: 3px; transition: width 0.8s ease;
  &--success    { background: linear-gradient(90deg,#22c55e,#16a34a); }
  &--pending    { background: linear-gradient(90deg,#f97316,#ea580c); }
  &--failed     { background: linear-gradient(90deg,#ef4444,#dc2626); }
  &--cancelled  { background: linear-gradient(90deg,#94a3b8,#64748b); }
  &--chargedback{ background: linear-gradient(90deg,#8b5cf6,#7c3aed); }
}

/* ── Donut ───────────────────────────────────────────────────────── */
.rp-donut-body { display: flex; align-items: center; }
.rp-donut-wrap { display: flex; align-items: center; gap: 20px; }
.rp-donut-svg  { width: 110px; height: 110px; transform: rotate(-90deg); flex-shrink: 0; }
.rp-donut-num  { font-size: 20px; font-weight: 800; fill: #0f172a; font-family: 'Poppins', sans-serif; transform: rotate(90deg); transform-origin: 60px 60px; }
.rp-donut-lbl  { font-size: 9px; fill: #94a3b8; transform: rotate(90deg); transform-origin: 60px 60px; }
.rp-donut-legend { display: flex; flex-direction: column; gap: 8px; }
.rp-legend-row { display: flex; align-items: center; gap: 7px; }
.rp-legend-dot  { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.rp-legend-name { font-size: 12px; color: #475569; flex: 1; }
.rp-legend-val  { font-size: 13px; font-weight: 700; color: #0f172a; }

/* ── Breakdown Row ───────────────────────────────────────────────── */
.rp-breakdown-row {
  display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
}

/* ── Rank Table ──────────────────────────────────────────────────── */
.rp-rank-table { padding: 4px 0; }
.rp-rank-header {
  display: grid; grid-template-columns: 28px 1fr 44px 130px;
  padding: 8px 16px; background: #f8fafc;
  font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;
}
.rp-rank-row {
  display: grid; grid-template-columns: 28px 1fr 44px 130px;
  align-items: center; padding: 9px 16px; border-radius: 6px; transition: background 0.12s;
  &:hover { background: #f8fafc; }
}
.rp-rank-num {
  font-size: 12px; font-weight: 700; color: #cbd5e1;
  &--top1 { color: #f59e0b; }
  &--top2 { color: #94a3b8; }
  &--top3 { color: #b45309; }
}
.rp-rank-info { display: flex; align-items: center; gap: 9px; }
.rp-rank-avatar {
  width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
  color: #fff; font-size: 10px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  &--blue { background: linear-gradient(135deg,#0a1628,#1e3a5f); }
  &--red  { background: linear-gradient(135deg,#ef4444,#dc2626); }
}
.rp-rank-name { font-size: 12px; font-weight: 600; color: #0f172a; }
.rp-rank-id   { font-size: 10px; color: #94a3b8; font-family: monospace; }
.rp-rank-txn  { font-size: 12px; font-weight: 600; color: #475569; text-align: right; }
.rp-rank-amount { display: flex; flex-direction: column; gap: 3px; align-items: flex-end; }
.rp-rank-val {
  font-size: 12px; font-weight: 800; font-family: 'Poppins', sans-serif;
  &--blue { color: #0d9488; }
  &--red  { color: #dc2626; }
}
.rp-rank-bar-track { width: 100%; height: 3px; background: #f0f4f8; border-radius: 2px; overflow: hidden; }
.rp-rank-bar {
  height: 100%; border-radius: 2px; transition: width 0.8s ease;
  &--blue { background: linear-gradient(90deg,#3b82f6,#2563eb); }
  &--red  { background: linear-gradient(90deg,#ef4444,#dc2626); }
}

/* ── Verification Row ────────────────────────────────────────────── */
.rp-verif-row {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
  @media (max-width: 700px) { grid-template-columns: 1fr; }
}
.rp-verif-card { border-radius: 12px !important; }
.rp-verif-inner { display: flex; align-items: flex-start; gap: 14px; padding: 18px 20px; }
.rp-verif-icon {
  width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  &--green  { background: linear-gradient(135deg,#22c55e,#16a34a); }
  &--orange { background: linear-gradient(135deg,#f97316,#ea580c); }
  &--blue   { background: linear-gradient(135deg,#3b82f6,#2563eb); }
}
.rp-verif-body { display: flex; flex-direction: column; flex: 1; }
.rp-verif-count { font-size: 30px; font-weight: 800; color: #0f172a; font-family: 'Poppins', sans-serif; line-height: 1; }
.rp-verif-label { font-size: 12px; color: #64748b; margin: 4px 0 10px; }
.rp-verif-track { height: 5px; background: #f0f4f8; border-radius: 3px; overflow: hidden; }
.rp-verif-fill {
  height: 100%; border-radius: 3px; transition: width 1s ease;
  &--green  { background: linear-gradient(90deg,#22c55e,#16a34a); }
  &--orange { background: linear-gradient(90deg,#f97316,#ea580c); }
  &--blue   { background: linear-gradient(90deg,#3b82f6,#2563eb); }
}
.rp-verif-pct { font-size: 10px; color: #94a3b8; margin-top: 4px; }

/* ── Platform Health ─────────────────────────────────────────────── */
.rp-health-badge {
  display: inline-flex; align-items: center; gap: 6px;
  background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 20px;
  padding: 3px 10px; font-size: 11px; font-weight: 600; color: #16a34a;
  text-transform: none; letter-spacing: 0;
}
.rp-health-pulse {
  width: 7px; height: 7px; border-radius: 50%; background: #22c55e;
  animation: rpPulse 2s ease infinite;
}
@keyframes rpPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
  50%       { box-shadow: 0 0 0 5px rgba(34,197,94,0); }
}

.rp-health-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 0;
  background: #fff; border-radius: 14px; border: 1px solid #eef0f4;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05); overflow: hidden;
  @media (max-width: 1100px) { grid-template-columns: repeat(2, 1fr); }
}
.rp-health-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 18px; border-bottom: 1px solid #f8fafc; border-right: 1px solid #f8fafc;
  &:nth-child(4n) { border-right: none; }
}
.rp-health-left { display: flex; align-items: center; gap: 10px; }
.rp-health-icon {
  width: 30px; height: 30px; border-radius: 7px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  &--blue   { background: linear-gradient(135deg,#3b82f6,#2563eb); }
  &--indigo { background: linear-gradient(135deg,#4f46e5,#4338ca); }
  &--teal   { background: linear-gradient(135deg,#0d9488,#0f766e); }
  &--green  { background: linear-gradient(135deg,#22c55e,#16a34a); }
  &--orange { background: linear-gradient(135deg,#f97316,#ea580c); }
  &--purple { background: linear-gradient(135deg,#8b5cf6,#7c3aed); }
  &--red    { background: linear-gradient(135deg,#ef4444,#dc2626); }
  &--cyan   { background: linear-gradient(135deg,#0891b2,#0e7490); }
}
.rp-health-name { display: block; font-size: 12px; font-weight: 600; color: #0f172a; }
.rp-health-desc { display: block; font-size: 10px; color: #94a3b8; }
.rp-health-status {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px;
  &--up { background: #f0fdf4; color: #16a34a; }
}
.rp-health-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; }

/* ── Shared ──────────────────────────────────────────────────────── */
.rp-skeleton {
  display: inline-block; width: 80px; height: 18px;
  background: linear-gradient(90deg,#f0f4f8 25%,#e2e8f0 50%,#f0f4f8 75%);
  background-size: 200% 100%; animation: rpShimmer 1.5s infinite; border-radius: 5px;
  &--lg { width: 120px; height: 24px; }
}
@keyframes rpShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

.rp-empty {
  display: flex; flex-direction: column; align-items: center; padding: 32px; color: #94a3b8;
  p { margin: 8px 0 0; font-size: 13px; }
}
</style>
