<template>
  <q-page class="admin-page">

    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Revenue Report</h2>
        <p class="page-subtitle">Hospital revenue, doctor income, and platform earnings breakdown</p>
      </div>
      <div class="header-actions">
        <!-- Date range filter -->
        <q-input
          v-model="dateFrom"
          type="date" outlined dense
          label="From" class="date-input"
          @update:model-value="loadReport"
        />
        <q-input
          v-model="dateTo"
          type="date" outlined dense
          label="To" class="date-input"
          @update:model-value="loadReport"
        />
        <q-btn unelevated no-caps icon="refresh" label="Refresh" color="green-6" size="sm" @click="loadReport" :loading="loading" />
        <q-btn unelevated no-caps icon="download" label="Export CSV" color="blue-6" size="sm" @click="exportCSV" />
        <q-btn unelevated no-caps icon="picture_as_pdf" label="Export PDF" color="red-7" size="sm" @click="exportPDF" :loading="pdfLoading" />
      </div>
    </div>

    <!-- Summary KPI Row -->
    <div class="kpi-row">
      <div class="kpi-card kpi-card--green">
        <div class="kpi-icon"><q-icon name="trending_up" size="22px" color="white" /></div>
        <div class="kpi-content">
          <span class="kpi-label">Total Platform Revenue</span>
          <span class="kpi-value">
            <span v-if="loading" class="kpi-skeleton"></span>
            <span v-else>LKR {{ fmt(summary.totalRevenue) }}</span>
          </span>
        </div>
      </div>
      <div class="kpi-card kpi-card--blue">
        <div class="kpi-icon kpi-icon--blue"><q-icon name="receipt_long" size="22px" color="white" /></div>
        <div class="kpi-content">
          <span class="kpi-label">Paid Transactions</span>
          <span class="kpi-value">{{ summary.totalTransactions || 0 }}</span>
        </div>
      </div>
      <div class="kpi-card kpi-card--teal">
        <div class="kpi-icon kpi-icon--teal"><q-icon name="price_change" size="22px" color="white" /></div>
        <div class="kpi-content">
          <span class="kpi-label">Service Fee Revenue</span>
          <span class="kpi-value">LKR {{ fmt(summary.serviceFeeRevenue) }}</span>
        </div>
      </div>
      <div class="kpi-card kpi-card--indigo">
        <div class="kpi-icon kpi-icon--indigo"><q-icon name="calculate" size="22px" color="white" /></div>
        <div class="kpi-content">
          <span class="kpi-label">Avg. Transaction</span>
          <span class="kpi-value">LKR {{ fmt(summary.avgAmount) }}</span>
        </div>
      </div>
    </div>

    <!-- Monthly Trend -->
    <q-card class="section-card q-mb-lg">
      <div class="section-header">
        <div class="section-dot section-dot--green"></div>
        <span class="section-title">Monthly Revenue Trend</span>
      </div>
      <div class="trend-body">
        <q-inner-loading :showing="loading" color="green-5" size="24px" />
        <div v-if="!loading && monthlyTrend.length === 0" class="empty-state">
          <q-icon name="bar_chart" size="40px" color="grey-4" />
          <p>No data available</p>
        </div>
        <div v-else-if="!loading" class="trend-chart">
          <div
            v-for="m in monthlyTrend"
            :key="m.label"
            class="trend-bar-wrap"
          >
            <div class="trend-bar-col">
              <span class="trend-val">LKR {{ fmtShort(m.revenue) }}</span>
              <div class="trend-bar-track">
                <div
                  class="trend-bar-fill"
                  :style="{ height: getTrendPct(m.revenue) + '%' }"
                ></div>
              </div>
              <span class="trend-txn">{{ m.transactions }} txn</span>
            </div>
            <span class="trend-label">{{ m.label }}</span>
          </div>
        </div>
      </div>
    </q-card>

    <!-- Doctor Income + Hospital Revenue side by side -->
    <div class="two-col-row">

      <!-- Doctor Income Table -->
      <q-card class="section-card">
        <div class="section-header">
          <div class="section-dot section-dot--blue"></div>
          <span class="section-title">Doctor Income</span>
          <q-space />
          <span class="section-count">{{ byDoctor.length }} doctors</span>
        </div>
        <q-inner-loading :showing="loading" color="green-5" size="24px" />
        <div v-if="!loading && byDoctor.length === 0" class="empty-state">
          <q-icon name="medical_services" size="40px" color="grey-4" />
          <p>No doctor income data</p>
        </div>
        <div v-else class="income-table">
          <div class="income-table-header">
            <span>Doctor</span>
            <span class="text-right">Transactions</span>
            <span class="text-right">Total Income</span>
          </div>
          <div
            v-for="(doc, i) in byDoctor"
            :key="doc.doctorId"
            class="income-row"
          >
            <div class="income-rank">{{ i + 1 }}</div>
            <div class="income-info">
              <div class="income-avatar">{{ getInitials(doc.doctorName) }}</div>
              <div>
                <div class="income-name">Dr. {{ doc.doctorName }}</div>
                <div class="income-id">{{ doc.doctorId }}</div>
              </div>
            </div>
            <div class="income-txn">{{ doc.transactions }}</div>
            <div class="income-amount">
              <span class="income-val">LKR {{ fmt(doc.totalIncome) }}</span>
              <div class="income-bar-track">
                <div
                  class="income-bar-fill income-bar-fill--blue"
                  :style="{ width: getDoctorPct(doc.totalIncome) + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </q-card>

      <!-- Hospital Revenue Table -->
      <q-card class="section-card">
        <div class="section-header">
          <div class="section-dot section-dot--red"></div>
          <span class="section-title">Hospital Revenue</span>
          <q-space />
          <span class="section-count">{{ byHospital.length }} hospitals</span>
        </div>
        <q-inner-loading :showing="loading" color="green-5" size="24px" />
        <div v-if="!loading && byHospital.length === 0" class="empty-state">
          <q-icon name="local_hospital" size="40px" color="grey-4" />
          <p>No hospital data</p>
        </div>
        <div v-else class="income-table">
          <div class="income-table-header">
            <span>Hospital</span>
            <span class="text-right">Appointments</span>
            <span class="text-right">Revenue</span>
          </div>
          <div
            v-for="(hosp, i) in byHospital"
            :key="hosp.hospitalId"
            class="income-row"
          >
            <div class="income-rank">{{ i + 1 }}</div>
            <div class="income-info">
              <div class="income-avatar income-avatar--red">
                <q-icon name="local_hospital" size="14px" color="white" />
              </div>
              <div>
                <div class="income-name">{{ hosp.hospitalName }}</div>
                <div class="income-id">{{ hosp.location || hosp.hospitalId }}</div>
              </div>
            </div>
            <div class="income-txn">{{ hosp.appointments }}</div>
            <div class="income-amount">
              <span class="income-val income-val--red">LKR {{ fmt(hosp.revenue) }}</span>
              <div class="income-bar-track">
                <div
                  class="income-bar-fill income-bar-fill--red"
                  :style="{ width: getHospitalPct(hosp.revenue) + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </q-card>

    </div>

    <!-- System Revenue Breakdown -->
    <q-card class="section-card q-mt-lg">
      <div class="section-header">
        <div class="section-dot section-dot--teal"></div>
        <span class="section-title">System Revenue Breakdown by Payment Status</span>
      </div>
      <div class="status-breakdown">
        <q-inner-loading :showing="loading" color="green-5" size="24px" />
        <div v-if="!loading" class="status-grid">
          <div
            v-for="(item, status) in byStatus"
            :key="status"
            class="status-card"
            :class="`status-card--${status}`"
          >
            <div class="status-icon-wrap" :class="`status-icon-wrap--${status}`">
              <q-icon :name="statusIcon(status)" size="20px" color="white" />
            </div>
            <div class="status-info">
              <span class="status-name">{{ capitalize(status) }}</span>
              <span class="status-count">{{ item.count }} transactions</span>
              <span class="status-total">LKR {{ fmt(item.total) }}</span>
            </div>
          </div>
        </div>
      </div>
    </q-card>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { paymentApi } from '../../services/adminApi'
import { generateRevenueReportPDF } from '../../utils/generateRevenueReportPDF'

const $q = useQuasar()

const loading     = ref(true)
const pdfLoading  = ref(false)
const dateFrom    = ref('')
const dateTo      = ref('')

const summary      = ref({})
const byDoctor     = ref([])
const byHospital   = ref([])
const monthlyTrend = ref([])
const byStatus     = ref({})

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => (n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtShort = (n) => {
  if (!n) return '0'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000)    return (n / 1000).toFixed(1) + 'K'
  return n.toFixed(0)
}
const getInitials = (n = '') => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
const capitalize  = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''

const statusIcon = (s) => ({
  success: 'check_circle', pending: 'schedule', failed: 'cancel',
  cancelled: 'remove_circle', chargedback: 'replay'
}[s] || 'info')

const maxDoctorIncome  = computed(() => Math.max(...byDoctor.value.map(d => d.totalIncome), 1))
const maxHospitalRev   = computed(() => Math.max(...byHospital.value.map(h => h.revenue), 1))
const maxMonthlyRev    = computed(() => Math.max(...monthlyTrend.value.map(m => m.revenue), 1))

const getDoctorPct  = (v) => Math.round((v / maxDoctorIncome.value)  * 100)
const getHospitalPct= (v) => Math.round((v / maxHospitalRev.value)   * 100)
const getTrendPct   = (v) => Math.max(Math.round((v / maxMonthlyRev.value) * 100), 4)

// ── Load ──────────────────────────────────────────────────────────────────────
async function loadReport() {
  loading.value = true
  try {
    const params = {}
    if (dateFrom.value) params.from = dateFrom.value
    if (dateTo.value)   params.to   = dateTo.value

    const { data } = await paymentApi.getRevenueReport(params)
    const d = data.data || {}

    summary.value      = d.summary      || {}
    byDoctor.value     = d.byDoctor     || []
    byHospital.value   = d.byHospital   || []
    monthlyTrend.value = d.monthlyTrend || []
    byStatus.value     = d.byStatus     || {}
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to load revenue report', position: 'top-right' })
  } finally {
    loading.value = false
  }
}

// ── Export CSV ────────────────────────────────────────────────────────────────
function exportCSV() {
  const rows = [
    ['Type', 'ID', 'Name', 'Transactions', 'Total Revenue (LKR)'],
    ...byDoctor.value.map(d => ['Doctor', d.doctorId, `Dr. ${d.doctorName}`, d.transactions, d.totalIncome.toFixed(2)]),
    ...byHospital.value.map(h => ['Hospital', h.hospitalId, h.hospitalName, h.appointments, h.revenue.toFixed(2)]),
    ['System', 'PLATFORM', 'Service Fee Revenue', summary.value.totalTransactions || 0, (summary.value.serviceFeeRevenue || 0).toFixed(2)],
  ]
  const csv = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `revenue-report-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Export PDF ────────────────────────────────────────────────────────────
async function exportPDF() {
  pdfLoading.value = true
  try {
    await generateRevenueReportPDF({
      summary:      summary.value,
      byDoctor:     byDoctor.value,
      byHospital:   byHospital.value,
      monthlyTrend: monthlyTrend.value,
      byStatus:     byStatus.value,
      dateFrom:     dateFrom.value,
      dateTo:       dateTo.value,
    })
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to generate PDF', position: 'top-right' })
  } finally {
    pdfLoading.value = false
  }
}

onMounted(loadReport)
</script>

<style lang="scss" scoped>
.admin-page { padding: 28px 28px 48px; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;

  .page-title    { font-family: 'Poppins', sans-serif; font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 4px; }
  .page-subtitle { font-size: 13px; color: #64748b; margin: 0; }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.date-input { width: 140px; }

/* KPI Row */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 20px;
  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
}

.kpi-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #eef0f4;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: transform 0.15s, box-shadow 0.15s;
  &:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }

  &--green  { border-left: 3px solid #10b981; .kpi-icon { background: linear-gradient(135deg,#10b981,#059669); } }
  &--blue   { border-left: 3px solid #3b82f6; }
  &--teal   { border-left: 3px solid #0d9488; }
  &--indigo { border-left: 3px solid #4f46e5; }
}

.kpi-icon {
  width: 44px; height: 44px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  background: linear-gradient(135deg, #10b981, #059669);
  &--blue   { background: linear-gradient(135deg, #3b82f6, #2563eb); }
  &--teal   { background: linear-gradient(135deg, #0d9488, #0f766e); }
  &--indigo { background: linear-gradient(135deg, #4f46e5, #4338ca); }
}

.kpi-content {
  display: flex; flex-direction: column;
  .kpi-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
  .kpi-value { font-size: 20px; font-weight: 800; color: #0f172a; font-family: 'Poppins', sans-serif; }
}

.kpi-skeleton {
  display: block; width: 100px; height: 24px;
  background: linear-gradient(90deg, #f0f4f8 25%, #e2e8f0 50%, #f0f4f8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 6px;
}
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

/* Section Card */
.section-card {
  border-radius: 14px;
  border: 1px solid #eef0f4;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f4f8;
}

.section-dot {
  width: 8px; height: 8px; border-radius: 50%;
  &--green { background: #10b981; box-shadow: 0 0 6px rgba(16,185,129,0.4); }
  &--blue  { background: #3b82f6; box-shadow: 0 0 6px rgba(59,130,246,0.4); }
  &--red   { background: #ef4444; box-shadow: 0 0 6px rgba(239,68,68,0.4); }
  &--teal  { background: #0d9488; box-shadow: 0 0 6px rgba(13,148,136,0.4); }
}

.section-title { font-size: 14px; font-weight: 600; color: #0f172a; }
.section-count { font-size: 12px; color: #94a3b8; background: #f0f4f8; padding: 2px 10px; border-radius: 20px; }

/* Monthly Trend Chart */
.trend-body { padding: 20px; min-height: 200px; position: relative; }

.trend-chart {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  height: 180px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.trend-bar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 64px;
  flex: 1;
}

.trend-bar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 150px;
  justify-content: flex-end;
  gap: 4px;
}

.trend-val  { font-size: 10px; font-weight: 700; color: #0d9488; white-space: nowrap; }
.trend-txn  { font-size: 10px; color: #94a3b8; }
.trend-label{ font-size: 10px; color: #64748b; font-weight: 600; white-space: nowrap; }

.trend-bar-track {
  width: 100%;
  height: 120px;
  background: #f0f4f8;
  border-radius: 6px 6px 0 0;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.trend-bar-fill {
  width: 100%;
  background: linear-gradient(180deg, #10b981, #059669);
  border-radius: 6px 6px 0 0;
  transition: height 0.8s ease;
  min-height: 4px;
}

/* Two-col layout */
.two-col-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
}

/* Income Table */
.income-table { padding: 8px 0; }

.income-table-header {
  display: grid;
  grid-template-columns: 32px 1fr 80px 140px;
  gap: 0;
  padding: 8px 16px;
  background: #f8fafc;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.income-row {
  display: grid;
  grid-template-columns: 32px 1fr 80px 140px;
  align-items: center;
  padding: 10px 16px;
  border-radius: 8px;
  transition: background 0.12s;
  &:hover { background: #f8fafc; }
}

.income-rank {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
}

.income-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.income-avatar {
  width: 32px; height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #0a1628, #1e3a5f);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;

  &--red { background: linear-gradient(135deg, #ef4444, #dc2626); }
}

.income-name { font-size: 13px; font-weight: 600; color: #0f172a; }
.income-id   { font-size: 11px; color: #94a3b8; font-family: monospace; }

.income-txn {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  text-align: right;
}

.income-amount { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; }

.income-val {
  font-size: 13px;
  font-weight: 800;
  color: #0d9488;
  font-family: 'Poppins', sans-serif;
  &--red { color: #dc2626; }
}

.income-bar-track {
  width: 100%;
  height: 4px;
  background: #f0f4f8;
  border-radius: 2px;
  overflow: hidden;
}

.income-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.8s ease;
  &--blue { background: linear-gradient(90deg, #3b82f6, #2563eb); }
  &--red  { background: linear-gradient(90deg, #ef4444, #dc2626); }
}

/* Status Breakdown */
.status-breakdown { padding: 20px; position: relative; min-height: 80px; }

.status-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.status-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #f8fafc;
  border: 1px solid #eef0f4;
  border-radius: 12px;
  padding: 14px 18px;
  flex: 1;
  min-width: 160px;
  transition: transform 0.15s;
  &:hover { transform: translateY(-1px); }

  &--success    { border-left: 3px solid #22c55e; }
  &--pending    { border-left: 3px solid #f97316; }
  &--failed     { border-left: 3px solid #ef4444; }
  &--cancelled  { border-left: 3px solid #94a3b8; }
  &--chargedback{ border-left: 3px solid #8b5cf6; }
}

.status-icon-wrap {
  width: 40px; height: 40px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;

  &--success    { background: linear-gradient(135deg, #22c55e, #16a34a); }
  &--pending    { background: linear-gradient(135deg, #f97316, #ea580c); }
  &--failed     { background: linear-gradient(135deg, #ef4444, #dc2626); }
  &--cancelled  { background: linear-gradient(135deg, #94a3b8, #64748b); }
  &--chargedback{ background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
}

.status-info {
  display: flex; flex-direction: column;
  .status-name  { font-size: 13px; font-weight: 700; color: #0f172a; }
  .status-count { font-size: 11px; color: #64748b; margin-top: 1px; }
  .status-total { font-size: 14px; font-weight: 800; color: #0f172a; font-family: 'Poppins', sans-serif; margin-top: 3px; }
}

/* Empty state */
.empty-state {
  display: flex; flex-direction: column; align-items: center; padding: 40px; color: #94a3b8;
  p { margin: 10px 0 0; font-size: 14px; }
}
</style>
