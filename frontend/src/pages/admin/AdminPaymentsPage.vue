<template>
  <q-page class="admin-page">

    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Payment Management</h2>
        <p class="page-subtitle">Track all transactions and platform revenue</p>
      </div>
      <q-btn unelevated no-caps icon="refresh" label="Refresh" color="green-6" size="sm" @click="init" :loading="loading" />
    </div>

    <!-- Revenue KPI Row -->
    <div class="revenue-kpi-row">
      <div class="rev-kpi-card rev-kpi-card--primary">
        <div class="rev-kpi-icon">
          <q-icon name="trending_up" size="24px" color="white" />
        </div>
        <div class="rev-kpi-content">
          <span class="rev-kpi-label">Total Revenue</span>
          <span class="rev-kpi-value">
            <span v-if="statsLoading" class="kpi-skeleton"></span>
            <span v-else>LKR {{ formatCurrency(stats.totalRevenue) }}</span>
          </span>
        </div>
      </div>

      <div class="rev-kpi-card rev-kpi-card--blue">
        <div class="rev-kpi-icon rev-kpi-icon--blue">
          <q-icon name="receipt_long" size="24px" color="white" />
        </div>
        <div class="rev-kpi-content">
          <span class="rev-kpi-label">Total Transactions</span>
          <span class="rev-kpi-value">{{ stats.totalTransactions || 0 }}</span>
        </div>
      </div>

      <div class="rev-kpi-card rev-kpi-card--teal">
        <div class="rev-kpi-icon rev-kpi-icon--teal">
          <q-icon name="calculate" size="24px" color="white" />
        </div>
        <div class="rev-kpi-content">
          <span class="rev-kpi-label">Average Payment</span>
          <span class="rev-kpi-value">LKR {{ formatCurrency(stats.avgAmount) }}</span>
        </div>
      </div>

      <div
        v-for="(item, status) in byStatus"
        :key="status"
        class="rev-kpi-card rev-kpi-card--status"
      >
        <div class="rev-kpi-icon" :class="`rev-kpi-icon--${status}`">
          <q-icon :name="statusIcon(status)" size="22px" color="white" />
        </div>
        <div class="rev-kpi-content">
          <span class="rev-kpi-label">{{ capitalize(status) }}</span>
          <span class="rev-kpi-value">{{ item.count }}</span>
          <span class="rev-kpi-sub">LKR {{ formatCurrency(item.total) }}</span>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <q-card class="filter-bar">
      <div class="filter-inner">
        <div class="search-wrap">
          <q-icon name="search" size="16px" color="grey-5" />
          <input v-model="searchQuery" placeholder="Search by order ID, patient or doctor..." class="search-input" @input="debouncedSearch" />
          <q-icon v-if="searchQuery" name="close" size="14px" color="grey-5" class="cursor-pointer" @click="searchQuery = ''; loadPayments()" />
        </div>

        <q-select
          v-model="statusFilter"
          :options="statusOptions"
          outlined dense
          label="Status"
          class="filter-select"
          emit-value map-options clearable
          @update:model-value="loadPayments"
        />

        <q-select
          v-model="sortBy"
          :options="sortOptions"
          outlined dense
          label="Sort By"
          class="filter-select"
          emit-value map-options
          @update:model-value="loadPayments"
        />
      </div>
    </q-card>

    <!-- Payments Table -->
    <q-card class="table-card">
      <q-table
        :rows="filteredPayments"
        :columns="columns"
        row-key="orderId"
        :loading="loading"
        flat
        class="nexus-table"
        :rows-per-page-options="[10, 20, 50]"
        :pagination="{ rowsPerPage: perPage, page: currentPage }"
        @request="onRequest"
      >
        <template #header="props">
          <q-tr :props="props" class="table-header-row">
            <q-th v-for="col in props.cols" :key="col.name" :props="props" class="table-th">{{ col.label }}</q-th>
          </q-tr>
        </template>

        <template #body="props">
          <q-tr :props="props" class="table-row" @click="openDetail(props.row)" style="cursor:pointer">

            <q-td key="orderId" :props="props">
              <span class="order-id-cell">{{ props.row.orderId }}</span>
            </q-td>

            <q-td key="patient" :props="props">
              <div class="user-cell">
                <div class="user-avatar user-avatar--patient">{{ getInitials(props.row.patientName) }}</div>
                <div>
                  <div class="user-cell-name">{{ props.row.patientName }}</div>
                  <div class="user-cell-email">{{ props.row.patientEmail }}</div>
                </div>
              </div>
            </q-td>

            <q-td key="doctor" :props="props">
              <span class="doctor-cell">Dr. {{ props.row.doctorName || '—' }}</span>
            </q-td>

            <q-td key="amount" :props="props">
              <span class="amount-cell">LKR {{ formatCurrency(props.row.amount) }}</span>
            </q-td>

            <q-td key="status" :props="props">
              <div class="status-badge" :class="`status-badge--${props.row.status}`">
                <span class="status-dot-sm"></span>
                {{ capitalize(props.row.status) }}
              </div>
            </q-td>

            <q-td key="date" :props="props">
              <div class="date-cell-wrap">
                <span class="date-main">{{ formatDate(props.row.createdAt) }}</span>
                <span class="date-time">{{ formatTime(props.row.createdAt) }}</span>
              </div>
            </q-td>

          </q-tr>
        </template>

        <template #no-data>
          <div class="no-data-state">
            <q-icon name="receipt_long" size="44px" color="grey-3" />
            <p>No payment records found</p>
          </div>
        </template>

        <template #loading>
          <q-inner-loading showing color="green-6" />
        </template>
      </q-table>

      <div class="table-footer">
        <span class="footer-total">{{ total }} records total</span>
        <q-pagination v-model="currentPage" :max="totalPages" direction-links color="green-6" @update:model-value="loadPayments" />
      </div>
    </q-card>

    <!-- Payment Detail Dialog -->
    <q-dialog v-model="detailDialog">
      <q-card class="detail-dialog">
        <div class="detail-header">
          <div class="detail-header-left">
            <div class="detail-icon" :class="`detail-icon--${selectedPayment?.status}`">
              <q-icon :name="statusIcon(selectedPayment?.status)" size="20px" color="white" />
            </div>
            <div>
              <div class="detail-title">Payment Details</div>
              <div class="detail-order-id">{{ selectedPayment?.orderId }}</div>
            </div>
          </div>
          <q-btn flat round dense icon="close" color="grey-5" v-close-popup />
        </div>

        <q-card-section v-if="selectedPayment" class="detail-body">
          <div class="detail-amount-hero">
            <span class="detail-amount-label">Amount Paid</span>
            <span class="detail-amount-value">LKR {{ formatCurrency(selectedPayment.amount) }}</span>
            <div class="detail-status-badge" :class="`detail-status-badge--${selectedPayment.status}`">
              {{ capitalize(selectedPayment.status) }}
            </div>
          </div>

          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-key">Patient</span>
              <span class="detail-val">{{ selectedPayment.patientName }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-key">Patient Email</span>
              <span class="detail-val">{{ selectedPayment.patientEmail }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-key">Doctor</span>
              <span class="detail-val">Dr. {{ selectedPayment.doctorName || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-key">Appointment ID</span>
              <span class="detail-val detail-val--mono">{{ selectedPayment.appointmentId || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-key">PayHere Payment ID</span>
              <span class="detail-val detail-val--mono">{{ selectedPayment.payherePaymentId || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-key">Date & Time</span>
              <span class="detail-val">{{ formatDate(selectedPayment.createdAt) }} {{ formatTime(selectedPayment.createdAt) }}</span>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { paymentApi } from '../../services/adminApi'

const loading      = ref(true)
const statsLoading = ref(true)
const payments     = ref([])
const total        = ref(0)
const currentPage  = ref(1)
const perPage      = ref(10)
const totalPages   = computed(() => Math.ceil(total.value / perPage.value))

const stats    = ref({ totalRevenue: 0, totalTransactions: 0, avgAmount: 0 })
const byStatus = ref({})

const statusFilter = ref(null)
const searchQuery  = ref('')
const sortBy       = ref('newest')

const detailDialog    = ref(false)
const selectedPayment = ref(null)

const statusOptions = [
  { label: 'Success',     value: 'success'     },
  { label: 'Pending',     value: 'pending'     },
  { label: 'Failed',      value: 'failed'      },
  { label: 'Cancelled',   value: 'cancelled'   },
  { label: 'Chargedback', value: 'chargedback' },
]

const sortOptions = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Highest Amount', value: 'amount_desc' },
  { label: 'Lowest Amount',  value: 'amount_asc'  },
]

const columns = [
  { name: 'orderId',  label: 'Order ID',  align: 'left',   field: 'orderId'     },
  { name: 'patient',  label: 'Patient',   align: 'left',   field: 'patientName' },
  { name: 'doctor',   label: 'Doctor',    align: 'left',   field: 'doctorName'  },
  { name: 'amount',   label: 'Amount',    align: 'right',  field: 'amount'      },
  { name: 'status',   label: 'Status',    align: 'center', field: 'status'      },
  { name: 'date',     label: 'Date',      align: 'left',   field: 'createdAt'   },
]

const filteredPayments = computed(() => {
  let list = [...payments.value]
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(p =>
      p.orderId?.toLowerCase().includes(q) ||
      p.patientName?.toLowerCase().includes(q) ||
      p.doctorName?.toLowerCase().includes(q) ||
      p.patientEmail?.toLowerCase().includes(q)
    )
  }
  if (sortBy.value === 'oldest')      list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  if (sortBy.value === 'amount_desc') list.sort((a, b) => b.amount - a.amount)
  if (sortBy.value === 'amount_asc')  list.sort((a, b) => a.amount - b.amount)
  return list
})

const formatCurrency = (n) => (n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const formatDate     = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const formatTime     = (d) => d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''
const getInitials    = (n = '') => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
const capitalize     = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''

const statusIcon = (s) => ({
  success: 'check_circle', pending: 'schedule', failed: 'cancel',
  cancelled: 'remove_circle', chargedback: 'replay'
}[s] || 'info')

let searchTimer
const debouncedSearch = () => { clearTimeout(searchTimer); searchTimer = setTimeout(loadPayments, 350) }

async function loadPayments() {
  loading.value = true
  try {
    const params = { page: currentPage.value, limit: perPage.value }
    if (statusFilter.value) params.status = statusFilter.value
    const { data } = await paymentApi.getAll(params)
    payments.value = data.data  || []
    total.value    = data.total || 0
  } catch { payments.value = [] }
  finally { loading.value = false }
}

async function loadStats() {
  statsLoading.value = true
  try {
    const { data } = await paymentApi.getStats()
    stats.value    = data.data?.revenue  || {}
    byStatus.value = data.data?.byStatus || {}
  } catch { /* silent */ }
  finally { statsLoading.value = false }
}

function onRequest(props) {
  currentPage.value = props.pagination.page
  perPage.value     = props.pagination.rowsPerPage
  loadPayments()
}

function openDetail(payment) {
  selectedPayment.value = payment
  detailDialog.value = true
}

function init() {
  loadPayments()
  loadStats()
}

onMounted(init)
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

/* Revenue KPI Row */
.revenue-kpi-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 20px;
}

.rev-kpi-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #eef0f4;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  min-width: 160px;
  transition: transform 0.15s, box-shadow 0.15s;

  &:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }

  &--primary { border-left: 3px solid #10b981; }
  &--blue    { border-left: 3px solid #3b82f6; }
  &--teal    { border-left: 3px solid #0d9488; }
  &--status  { border-left: 3px solid #94a3b8; }
}

.rev-kpi-icon {
  width: 46px; height: 46px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  background: linear-gradient(135deg, #10b981, #059669);

  &--blue       { background: linear-gradient(135deg, #3b82f6, #2563eb); }
  &--teal       { background: linear-gradient(135deg, #0d9488, #0f766e); }
  &--success    { background: linear-gradient(135deg, #22c55e, #16a34a); }
  &--pending    { background: linear-gradient(135deg, #f97316, #ea580c); }
  &--failed     { background: linear-gradient(135deg, #ef4444, #dc2626); }
  &--cancelled  { background: linear-gradient(135deg, #94a3b8, #64748b); }
  &--chargedback{ background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
}

.rev-kpi-content {
  display: flex;
  flex-direction: column;

  .rev-kpi-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
  .rev-kpi-value { font-size: 20px; font-weight: 800; color: #0f172a; font-family: 'Poppins', sans-serif; }
  .rev-kpi-sub   { font-size: 11px; color: #94a3b8; margin-top: 1px; }
}

.kpi-skeleton {
  display: block;
  width: 100px; height: 24px;
  background: linear-gradient(90deg, #f0f4f8 25%, #e2e8f0 50%, #f0f4f8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 6px;
}

@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Filter Bar */
.filter-bar {
  border-radius: 12px;
  border: 1px solid #eef0f4;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  margin-bottom: 16px;
}

.filter-inner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  flex-wrap: wrap;
}

.search-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 14px;
  flex: 1;
  min-width: 240px;
  transition: border-color 0.15s;

  &:focus-within { border-color: #10b981; }

  .search-input {
    border: none; outline: none; background: transparent;
    font-size: 13px; color: #334155; flex: 1;
    &::placeholder { color: #94a3b8; }
  }
}

.filter-select { width: 150px; }

/* Table */
.table-card {
  border-radius: 12px;
  border: 1px solid #eef0f4;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  overflow: hidden;
}

.nexus-table { font-family: 'Inter', sans-serif; }
.table-header-row { background: #f8fafc; }
.table-th {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  padding: 12px 16px !important;
}

.table-row {
  transition: background 0.12s;
  &:hover td { background: #f8fafc !important; }
}

.order-id-cell { font-family: monospace; font-size: 12px; color: #475569; font-weight: 600; }

.user-cell {
  display: flex; align-items: center; gap: 10px;
  .user-cell-name  { font-size: 13px; font-weight: 600; color: #0f172a; }
  .user-cell-email { font-size: 11px; color: #94a3b8; }
}

.user-avatar {
  width: 34px; height: 34px;
  border-radius: 8px;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;

  &--patient { background: linear-gradient(135deg, #0d9488, #14b8a6); }
}

.doctor-cell { font-size: 13px; color: #334155; font-weight: 500; }

.amount-cell { font-size: 14px; font-weight: 800; color: #0d9488; font-family: 'Poppins', sans-serif; }

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;

  .status-dot-sm { width: 6px; height: 6px; border-radius: 50%; }

  &--success    { background: #f0fdf4; color: #16a34a; .status-dot-sm { background: #22c55e; } }
  &--pending    { background: #fff7ed; color: #ea580c; .status-dot-sm { background: #f97316; } }
  &--failed     { background: #fef2f2; color: #dc2626; .status-dot-sm { background: #ef4444; } }
  &--cancelled  { background: #f8fafc; color: #64748b; .status-dot-sm { background: #94a3b8; } }
  &--chargedback{ background: #faf5ff; color: #7c3aed; .status-dot-sm { background: #8b5cf6; } }
}

.date-cell-wrap {
  .date-main { display: block; font-size: 12px; color: #334155; font-weight: 500; }
  .date-time { display: block; font-size: 11px; color: #94a3b8; }
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-top: 1px solid #f0f4f8;

  .footer-total { font-size: 13px; color: #64748b; }
}

.no-data-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px;
  color: #94a3b8;
  p { margin: 10px 0 0; font-size: 14px; }
}

/* Detail Dialog */
.detail-dialog { min-width: 480px; border-radius: 16px !important; overflow: hidden; }

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  border-bottom: 1px solid #f0f4f8;
}

.detail-header-left { display: flex; align-items: center; gap: 12px; }

.detail-icon {
  width: 44px; height: 44px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;

  &--success    { background: linear-gradient(135deg, #22c55e, #16a34a); }
  &--pending    { background: linear-gradient(135deg, #f97316, #ea580c); }
  &--failed     { background: linear-gradient(135deg, #ef4444, #dc2626); }
  &--cancelled  { background: linear-gradient(135deg, #94a3b8, #64748b); }
  &--chargedback{ background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
}

.detail-title    { font-size: 16px; font-weight: 700; color: #0f172a; }
.detail-order-id { font-size: 12px; color: #94a3b8; font-family: monospace; margin-top: 2px; }

.detail-body { padding: 20px; }

.detail-amount-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 20px;

  .detail-amount-label { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .detail-amount-value { font-size: 32px; font-weight: 800; color: #0f172a; font-family: 'Poppins', sans-serif; margin-bottom: 8px; }
}

.detail-status-badge {
  font-size: 12px;
  font-weight: 700;
  padding: 4px 14px;
  border-radius: 20px;

  &--success    { background: #f0fdf4; color: #16a34a; }
  &--pending    { background: #fff7ed; color: #ea580c; }
  &--failed     { background: #fef2f2; color: #dc2626; }
  &--cancelled  { background: #f8fafc; color: #64748b; }
  &--chargedback{ background: #faf5ff; color: #7c3aed; }
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 3px;

  .detail-key { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
  .detail-val { font-size: 13px; font-weight: 600; color: #0f172a; }
  .detail-val--mono { font-family: monospace; font-size: 12px; }
}
</style>
