<template>
  <q-page class="admin-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">Payment Management</h2>
        <p class="page-subtitle">Track all transactions and revenue across the platform</p>
      </div>
    </div>

    <!-- Revenue Stats -->
    <div class="payment-stats-row">
      <div class="pay-stat-card pay-stat-card--green">
        <q-icon name="trending_up" size="28px" color="green-6" />
        <div>
          <span class="pay-stat-amount">LKR {{ formatCurrency(stats.totalRevenue) }}</span>
          <span class="pay-stat-label">Total Revenue</span>
        </div>
      </div>
      <div class="pay-stat-card pay-stat-card--blue">
        <q-icon name="receipt_long" size="28px" color="blue-6" />
        <div>
          <span class="pay-stat-amount">{{ stats.totalTransactions || 0 }}</span>
          <span class="pay-stat-label">Transactions</span>
        </div>
      </div>
      <div class="pay-stat-card pay-stat-card--teal">
        <q-icon name="calculate" size="28px" color="teal-6" />
        <div>
          <span class="pay-stat-amount">LKR {{ formatCurrency(stats.avgAmount) }}</span>
          <span class="pay-stat-label">Average Payment</span>
        </div>
      </div>

      <!-- Status Breakdown -->
      <div v-for="(item, status) in byStatus" :key="status" class="pay-stat-card pay-stat-card--grey">
        <div class="status-icon" :class="`status-icon--${status}`">
          <q-icon :name="statusIcon(status)" size="22px" />
        </div>
        <div>
          <span class="pay-stat-amount">{{ item.count }}</span>
          <span class="pay-stat-label">{{ capitalize(status) }}</span>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <q-card class="filter-card">
      <q-card-section class="filter-row">
        <q-select
          v-model="statusFilter"
          :options="statusOptions"
          outlined dense
          label="Status"
          class="filter-select"
          emit-value map-options clearable
          @update:model-value="loadPayments"
        />
        <q-btn unelevated no-caps color="green-6" icon="refresh" label="Refresh" @click="loadPayments" class="refresh-btn" />
      </q-card-section>
    </q-card>

    <!-- Table -->
    <q-card class="table-card">
      <q-table
        :rows="payments"
        :columns="columns"
        row-key="orderId"
        :loading="loading"
        flat
        class="nexus-table"
        :rows-per-page-options="[10, 20]"
      >
        <template #header="props">
          <q-tr :props="props" class="table-header-row">
            <q-th v-for="col in props.cols" :key="col.name" :props="props" class="table-th">{{ col.label }}</q-th>
          </q-tr>
        </template>

        <template #body="props">
          <q-tr :props="props" class="table-row">
            <q-td key="orderId" :props="props">
              <span class="order-id">{{ props.row.orderId }}</span>
            </q-td>
            <q-td key="patient" :props="props">
              <div class="user-cell">
                <q-avatar size="32px" color="teal-6" text-color="white" style="font-size:12px;font-weight:700;border-radius:8px;">
                  {{ getInitials(props.row.patientName) }}
                </q-avatar>
                <div>
                  <div class="user-cell-name">{{ props.row.patientName }}</div>
                  <div class="user-cell-id">{{ props.row.patientEmail }}</div>
                </div>
              </div>
            </q-td>
            <q-td key="doctor" :props="props">
              <span class="cell-text">Dr. {{ props.row.doctorName || '—' }}</span>
            </q-td>
            <q-td key="amount" :props="props">
              <span class="amount-cell">LKR {{ formatCurrency(props.row.amount) }}</span>
            </q-td>
            <q-td key="status" :props="props">
              <q-badge
                :label="props.row.status"
                :color="statusColor(props.row.status)"
                rounded
              />
            </q-td>
            <q-td key="date" :props="props">
              <span class="date-cell">{{ formatDate(props.row.createdAt) }}</span>
            </q-td>
          </q-tr>
        </template>

        <template #no-data>
          <div class="no-data-row">
            <q-icon name="receipt_long" size="40px" color="grey-4" />
            <p>No payment records found</p>
          </div>
        </template>
      </q-table>

      <div class="table-footer">
        <span class="total-text">Total: {{ total }} records</span>
        <q-pagination v-model="page" :max="totalPages" direction-links color="green-6" @update:model-value="loadPayments" />
      </div>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { paymentApi } from '../../services/adminApi'

const loading = ref(true)
const payments = ref([])
const total   = ref(0)
const page    = ref(1)
const limit   = ref(10)
const totalPages = computed(() => Math.ceil(total.value / limit.value))

const stats    = ref({ totalRevenue: 0, totalTransactions: 0, avgAmount: 0 })
const byStatus = ref({})

const statusFilter = ref(null)
const statusOptions = [
  { label: 'Success',     value: 'success'     },
  { label: 'Pending',     value: 'pending'     },
  { label: 'Failed',      value: 'failed'      },
  { label: 'Cancelled',   value: 'cancelled'   },
  { label: 'Chargedback', value: 'chargedback' },
]

const columns = [
  { name: 'orderId',  label: 'Order ID',   align: 'left',   field: 'orderId'  },
  { name: 'patient',  label: 'Patient',    align: 'left',   field: 'patientName' },
  { name: 'doctor',   label: 'Doctor',     align: 'left',   field: 'doctorName' },
  { name: 'amount',   label: 'Amount',     align: 'right',  field: 'amount'   },
  { name: 'status',   label: 'Status',     align: 'center', field: 'status'   },
  { name: 'date',     label: 'Date',       align: 'left',   field: 'createdAt'},
]

const formatCurrency = (n) => (n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const formatDate     = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const getInitials    = (n = '') => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
const capitalize     = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''

const statusColor = (s) => ({
  success: 'green-6', pending: 'orange-5', failed: 'red-5',
  cancelled: 'grey-5', chargedback: 'purple-5'
}[s] || 'grey-5')

const statusIcon = (s) => ({
  success: 'check_circle', pending: 'schedule', failed: 'cancel',
  cancelled: 'remove_circle', chargedback: 'replay'
}[s] || 'info')

async function loadPayments() {
  loading.value = true
  try {
    const params = { page: page.value, limit: limit.value }
    if (statusFilter.value) params.status = statusFilter.value
    const { data } = await paymentApi.getAll(params)
    payments.value = data.data  || []
    total.value    = data.total || 0
  } catch { payments.value = [] }
  finally { loading.value = false }
}

async function loadStats() {
  try {
    const { data } = await paymentApi.getStats()
    stats.value    = data.data?.revenue  || {}
    byStatus.value = data.data?.byStatus || {}
  } catch { /* ignore */ }
}

onMounted(() => { loadPayments(); loadStats() })
</script>

<style lang="scss" scoped>
.admin-page { padding: 28px; }

.page-header {
  margin-bottom: 24px;
  .page-title    { font-size: 22px; font-weight: 700; color: #1a2332; margin: 0; font-family: 'Poppins', sans-serif; }
  .page-subtitle { font-size: 13px; color: #64748b; margin: 4px 0 0; }
}

.payment-stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 20px;
}

.pay-stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid #e9ecef;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  flex: 1;
  min-width: 160px;

  &--green { border-left: 3px solid #22c55e; }
  &--blue  { border-left: 3px solid #3b82f6; }
  &--teal  { border-left: 3px solid #14b8a6; }
  &--grey  { border-left: 3px solid #94a3b8; }

  .pay-stat-amount { font-size: 22px; font-weight: 700; color: #1a2332; display: block; }
  .pay-stat-label  { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; }
}

.status-icon {
  width: 44px; height: 44px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;

  &--success    { background: #f0fdf4; color: #22c55e; }
  &--pending    { background: #fff7ed; color: #f97316; }
  &--failed     { background: #fef2f2; color: #ef4444; }
  &--cancelled  { background: #f8fafc; color: #94a3b8; }
  &--chargedback{ background: #faf5ff; color: #8b5cf6; }
}

.filter-card { border-radius: 12px; margin-bottom: 16px; border: 1px solid #e9ecef; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.filter-row  { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.filter-select { width: 160px; }
.refresh-btn   { height: 40px; border-radius: 8px; }

.table-card { border-radius: 12px; border: 1px solid #e9ecef; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden; }
.nexus-table { font-family: 'Inter', sans-serif; }
.table-header-row { background: #f8fafc; }
.table-th { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
.table-row:hover td { background: #f8fafc; }

.order-id   { font-family: monospace; font-size: 12px; color: #475569; }
.amount-cell{ font-size: 14px; font-weight: 700; color: #0d9488; }
.cell-text  { font-size: 13px; color: #475569; }
.date-cell  { font-size: 12px; color: #64748b; }

.user-cell {
  display: flex; align-items: center; gap: 10px;
  .user-cell-name { font-size: 13px; font-weight: 600; color: #1a2332; }
  .user-cell-id   { font-size: 11px; color: #94a3b8; }
}

.table-footer {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 20px; border-top: 1px solid #f0f2f5;
  .total-text { font-size: 13px; color: #64748b; }
}

.no-data-row {
  display: flex; flex-direction: column; align-items: center; padding: 40px; color: #94a3b8;
  p { margin: 8px 0 0; font-size: 14px; }
}
</style>