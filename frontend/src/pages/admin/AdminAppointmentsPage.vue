
<template>
  <q-page class="admin-page">

    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Appointments Overview</h2>
        <p class="page-subtitle">Monitor all appointments across the platform in real time</p>
      </div>
      <q-btn unelevated no-caps icon="refresh" label="Refresh" color="green-6" size="sm" @click="loadAppointments" :loading="loading" />
    </div>

    <!-- Stats Row -->
    <div class="appt-stats-row">
      <div
        v-for="stat in apptStats"
        :key="stat.key"
        class="appt-stat-card"
        :class="`appt-stat-card--${stat.color}`"
      >
        <div class="appt-stat-icon">
          <q-icon :name="stat.icon" size="20px" color="white" />
        </div>
        <div class="appt-stat-content">
          <span class="appt-stat-value">{{ statCounts[stat.key] ?? 0 }}</span>
          <span class="appt-stat-label">{{ stat.label }}</span>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <q-card class="filter-bar">
      <div class="filter-inner">
        <div class="search-wrap">
          <q-icon name="search" size="16px" color="grey-5" />
          <input v-model="search" placeholder="Search by patient, doctor or appointment ID..." class="search-input" @input="debouncedSearch" />
          <q-icon v-if="search" name="close" size="14px" color="grey-5" class="cursor-pointer" @click="search = ''; applyFilters()" />
        </div>

        <q-select
          v-model="statusFilter"
          :options="statusOptions"
          outlined dense
          label="Status"
          class="filter-select"
          emit-value map-options clearable
          @update:model-value="applyFilters"
        />

        <q-select
          v-model="typeFilter"
          :options="typeOptions"
          outlined dense
          label="Type"
          class="filter-select"
          emit-value map-options clearable
          @update:model-value="applyFilters"
        />

        <q-select
          v-model="paymentFilter"
          :options="paymentOptions"
          outlined dense
          label="Payment"
          class="filter-select"
          emit-value map-options clearable
          @update:model-value="applyFilters"
        />
      </div>
    </q-card>

    <!-- Table -->
    <q-card class="table-card">
      <q-table
        :rows="filteredAppointments"
        :columns="columns"
        row-key="_id"
        :loading="loading"
        flat
        class="nexus-table"
        :rows-per-page-options="[10, 20, 50]"
      >
        <template #header="props">
          <q-tr :props="props" class="table-header-row">
            <q-th v-for="col in props.cols" :key="col.name" :props="props" class="table-th">{{ col.label }}</q-th>
          </q-tr>
        </template>

        <template #body="props">
          <q-tr :props="props" class="table-row" @click="openDetail(props.row)" style="cursor:pointer">

            <q-td key="id" :props="props">
              <span class="appt-id-cell">{{ props.row.appointmentId || props.row._id?.slice(-8) }}</span>
            </q-td>

            <q-td key="patient" :props="props">
              <div class="user-cell">
                <div class="avatar-wrap">
                  <img
                    v-if="patientImages[props.row.patientId]"
                    :src="patientImages[props.row.patientId]"
                    class="user-avatar user-avatar--img"
                    :alt="props.row.patientName"
                    @error="e => e.target.style.display='none'"
                  />
                  <div v-else class="user-avatar user-avatar--patient">{{ getInitials(props.row.patientName) }}</div>
                </div>
                <div>
                  <div class="user-cell-name">{{ props.row.patientName || '—' }}</div>
                  <div class="user-cell-sub">{{ props.row.patientId }}</div>
                </div>
              </div>
            </q-td>

            <q-td key="doctor" :props="props">
              <div class="user-cell">
                <div class="avatar-wrap">
                  <img
                    v-if="doctorImages[props.row.doctorId]"
                    :src="doctorImages[props.row.doctorId]"
                    class="user-avatar user-avatar--img"
                    :alt="props.row.doctorName"
                    @error="e => e.target.style.display='none'"
                  />
                  <div v-else class="user-avatar user-avatar--doctor">{{ getInitials(props.row.doctorName) }}</div>
                </div>
                <div>
                  <div class="user-cell-name">{{ props.row.doctorName ? 'Dr. ' + props.row.doctorName : '—' }}</div>
                  <div class="user-cell-sub">{{ props.row.doctorSpecialization || '' }}</div>
                </div>
              </div>
            </q-td>

            <q-td key="datetime" :props="props">
              <div class="datetime-cell">
                <span class="dt-date">{{ props.row.date }}</span>
                <span class="dt-time">{{ props.row.time }}</span>
              </div>
            </q-td>

            <q-td key="type" :props="props">
              <div class="type-badge" :class="`type-badge--${props.row.appointmentType?.toLowerCase()}`">
                <q-icon :name="props.row.appointmentType === 'ONLINE' ? 'videocam' : 'local_hospital'" size="13px" />
                {{ props.row.appointmentType }}
              </div>
            </q-td>

            <q-td key="status" :props="props">
              <div class="status-badge" :class="`status-badge--${props.row.status?.toLowerCase()}`">
                <span class="status-dot-sm"></span>
                {{ props.row.status }}
              </div>
            </q-td>

            <q-td key="payment" :props="props">
              <div class="payment-badge" :class="props.row.paymentStatus === 'PAID' ? 'payment-badge--paid' : 'payment-badge--pending'">
                <q-icon :name="props.row.paymentStatus === 'PAID' ? 'check_circle' : 'schedule'" size="13px" />
                {{ props.row.paymentStatus || 'PENDING' }}
              </div>
            </q-td>

            <q-td key="amount" :props="props">
              <span class="amount-cell">LKR {{ formatCurrency(props.row.charges?.total) }}</span>
            </q-td>

          </q-tr>
        </template>

        <template #no-data>
          <div class="no-data-state">
            <q-icon name="event_busy" size="44px" color="grey-3" />
            <p>No appointments found</p>
          </div>
        </template>

        <template #loading>
          <q-inner-loading showing color="green-6" />
        </template>
      </q-table>

      <div class="table-footer">
        <span class="footer-total">{{ filteredAppointments.length }} appointments</span>
      </div>
    </q-card>

    <!-- Detail Dialog -->
    <q-dialog v-model="detailDialog">
      <q-card class="detail-dialog" v-if="selectedAppt">
        <div class="detail-header">
          <div class="detail-header-left">
            <div class="detail-icon" :class="`detail-icon--${selectedAppt.status?.toLowerCase()}`">
              <q-icon name="event_note" size="20px" color="white" />
            </div>
            <div>
              <div class="detail-title">Appointment Details</div>
              <div class="detail-sub">{{ selectedAppt.appointmentId || selectedAppt._id }}</div>
            </div>
          </div>
          <q-btn flat round dense icon="close" color="grey-5" v-close-popup />
        </div>

        <q-card-section class="detail-body">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-key">Patient</span>
              <span class="detail-val">{{ selectedAppt.patientName || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-key">Doctor</span>
              <span class="detail-val">{{ selectedAppt.doctorName ? 'Dr. ' + selectedAppt.doctorName : '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-key">Specialty</span>
              <span class="detail-val">{{ selectedAppt.doctorSpecialization || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-key">Hospital</span>
              <span class="detail-val">{{ selectedAppt.doctorHospital || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-key">Date</span>
              <span class="detail-val">{{ selectedAppt.date }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-key">Time</span>
              <span class="detail-val">{{ selectedAppt.time }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-key">Type</span>
              <span class="detail-val">{{ selectedAppt.appointmentType }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-key">Queue No.</span>
              <span class="detail-val">{{ selectedAppt.queueNumber || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-key">Status</span>
              <span class="detail-val">{{ selectedAppt.status }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-key">Payment</span>
              <span class="detail-val">{{ selectedAppt.paymentStatus || 'PENDING' }}</span>
            </div>
          </div>

          <div v-if="selectedAppt.charges" class="charges-section">
            <div class="charges-title">Fee Breakdown</div>
            <div class="charges-grid">
              <div class="charge-item">
                <span>Doctor Fee</span>
                <span>LKR {{ formatCurrency(selectedAppt.charges.doctorFee) }}</span>
              </div>
              <div class="charge-item">
                <span>Hospital Fee</span>
                <span>LKR {{ formatCurrency(selectedAppt.charges.hospitalFee) }}</span>
              </div>
              <div class="charge-item">
                <span>Service Fee</span>
                <span>LKR {{ formatCurrency(selectedAppt.charges.serviceFee) }}</span>
              </div>
              <div class="charge-item charge-item--total">
                <span>Total</span>
                <span>LKR {{ formatCurrency(selectedAppt.charges.total) }}</span>
              </div>
            </div>
          </div>

          <div v-if="selectedAppt.rejectionReason" class="rejection-notice">
            <q-icon name="info" size="14px" color="orange-7" />
            Rejection reason: {{ selectedAppt.rejectionReason }}
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { getDoctorPublicProfile } from '../../services/doctorApi'
import { adminApi } from '../../services/adminApi'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` })

const loading      = ref(true)
const appointments = ref([])
const search       = ref('')
const statusFilter = ref(null)
const typeFilter   = ref(null)
const paymentFilter = ref(null)

// Image caches: patientId → imageUrl, doctorId → imageUrl
const patientImages = ref({})
const doctorImages  = ref({})

const detailDialog = ref(false)
const selectedAppt = ref(null)

const statusOptions = [
  { label: 'Pending',   value: 'PENDING'   },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Verified',  value: 'VERIFIED'  },
]

const typeOptions = [
  { label: 'Online',   value: 'ONLINE'   },
  { label: 'Physical', value: 'PHYSICAL' },
]

const paymentOptions = [
  { label: 'Paid',    value: 'PAID'    },
  { label: 'Pending', value: 'PENDING' },
]

const columns = [
  { name: 'id',       label: 'Appt. ID',  align: 'left',   field: 'appointmentId' },
  { name: 'patient',  label: 'Patient',   align: 'left',   field: 'patientName'   },
  { name: 'doctor',   label: 'Doctor',    align: 'left',   field: 'doctorName'    },
  { name: 'datetime', label: 'Date/Time', align: 'left',   field: 'date'          },
  { name: 'type',     label: 'Type',      align: 'center', field: 'appointmentType'},
  { name: 'status',   label: 'Status',    align: 'center', field: 'status'        },
  { name: 'payment',  label: 'Payment',   align: 'center', field: 'paymentStatus' },
  { name: 'amount',   label: 'Amount',    align: 'right',  field: 'charges'       },
]

const apptStats = [
  { key: 'total',     label: 'Total',     icon: 'event_note',    color: 'blue'   },
  { key: 'pending',   label: 'Pending',   icon: 'pending',       color: 'orange' },
  { key: 'confirmed', label: 'Confirmed', icon: 'check_circle',  color: 'green'  },
  { key: 'completed', label: 'Completed', icon: 'task_alt',      color: 'teal'   },
  { key: 'cancelled', label: 'Cancelled', icon: 'cancel',        color: 'red'    },
  { key: 'online',    label: 'Online',    icon: 'videocam',      color: 'purple' },
]

const statCounts = computed(() => {
  const list = appointments.value
  return {
    total:     list.length,
    pending:   list.filter(a => a.status === 'PENDING').length,
    confirmed: list.filter(a => a.status === 'CONFIRMED').length,
    completed: list.filter(a => a.status === 'COMPLETED').length,
    cancelled: list.filter(a => a.status === 'CANCELLED').length,
    online:    list.filter(a => a.appointmentType === 'ONLINE').length,
  }
})

const filteredAppointments = computed(() => {
  let list = [...appointments.value]
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(a =>
      a.patientName?.toLowerCase().includes(q) ||
      a.doctorName?.toLowerCase().includes(q) ||
      a.appointmentId?.toLowerCase().includes(q) ||
      a._id?.toLowerCase().includes(q)
    )
  }
  if (statusFilter.value)  list = list.filter(a => a.status === statusFilter.value)
  if (typeFilter.value)    list = list.filter(a => a.appointmentType === typeFilter.value)
  if (paymentFilter.value) list = list.filter(a => (a.paymentStatus || 'PENDING') === paymentFilter.value)
  return list
})

const getInitials    = (n = '') => (n || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
const formatCurrency = (n) => (n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Resolve profileImage object or string to URL
const resolveImg = (img) => {
  if (!img) return null
  if (typeof img === 'string' && img.trim()) return img
  if (img?.url && img.url.trim()) return img.url
  return null
}

let searchTimer
const debouncedSearch = () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => {}, 300) }
function applyFilters() { /* reactive computed handles it */ }

async function loadAppointments() {
  loading.value = true
  try {
    const { data } = await axios.get(`${API}/api/appointments/admin/all`, {
      headers: getHeaders(),
      params: { limit: 200 }
    })
    const list = data?.data && Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []
    appointments.value = list

    // Batch-fetch profile images in background
    fetchProfileImages(list)
  } catch (err) {
    console.error('Failed to load appointments:', err.response?.data || err.message)
    appointments.value = []
  } finally {
    loading.value = false
  }
}

async function fetchProfileImages(list) {
  // Collect unique doctor IDs
  const uniqueDoctorIds  = [...new Set(list.map(a => a.doctorId).filter(Boolean))]

  // Fetch patient images: GET /api/admin/users returns profileImage on each user
  // Use the admin users endpoint with role=patient to get all at once
  try {
    const { data } = await adminApi.getUsers({ role: 'patient', limit: 200 })
    const users = data.data || []
    users.forEach(u => {
      const img = resolveImg(u.profileImage)
      if (img && u.roleId) patientImages.value[u.roleId] = img
    })
  } catch { /* silent */ }

  // Fetch doctor images from MS2 in parallel
  const doctorResults = await Promise.allSettled(
    uniqueDoctorIds.map(id => getDoctorPublicProfile(id))
  )
  uniqueDoctorIds.forEach((id, i) => {
    const result = doctorResults[i]
    if (result.status === 'fulfilled' && result.value?.profileImage) {
      const img = resolveImg(result.value.profileImage)
      if (img) doctorImages.value[id] = img
    }
  })
}

function openDetail(appt) {
  selectedAppt.value = appt
  detailDialog.value = true
}

onMounted(loadAppointments)
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

/* Stats Row */
.appt-stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 20px;
}

.appt-stat-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #eef0f4;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 130px;
  transition: transform 0.15s;

  &:hover { transform: translateY(-1px); }

  &--blue   { border-left: 3px solid #3b82f6; .appt-stat-icon { background: linear-gradient(135deg,#3b82f6,#2563eb); } }
  &--orange { border-left: 3px solid #f97316; .appt-stat-icon { background: linear-gradient(135deg,#f97316,#ea580c); } }
  &--green  { border-left: 3px solid #22c55e; .appt-stat-icon { background: linear-gradient(135deg,#22c55e,#16a34a); } }
  &--teal   { border-left: 3px solid #0d9488; .appt-stat-icon { background: linear-gradient(135deg,#0d9488,#0f766e); } }
  &--red    { border-left: 3px solid #ef4444; .appt-stat-icon { background: linear-gradient(135deg,#ef4444,#dc2626); } }
  &--purple { border-left: 3px solid #8b5cf6; .appt-stat-icon { background: linear-gradient(135deg,#8b5cf6,#7c3aed); } }
}

.appt-stat-icon {
  width: 40px; height: 40px;
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.appt-stat-content {
  display: flex; flex-direction: column;
  .appt-stat-value { font-size: 22px; font-weight: 800; color: #0f172a; font-family: 'Poppins', sans-serif; line-height: 1; }
  .appt-stat-label { font-size: 11px; color: #64748b; margin-top: 2px; }
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

.filter-select { width: 140px; }

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

.appt-id-cell { font-family: monospace; font-size: 12px; color: #475569; font-weight: 600; }

.user-cell {
  display: flex; align-items: center; gap: 10px;
  .user-cell-name { font-size: 13px; font-weight: 600; color: #0f172a; }
  .user-cell-sub  { font-size: 11px; color: #94a3b8; }
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
  &--doctor  { background: linear-gradient(135deg, #1d4ed8, #3b82f6); }
  &--img     { object-fit: cover; background: #f0f4f8; }
}

.avatar-wrap { position: relative; flex-shrink: 0; }

.datetime-cell {
  .dt-date { display: block; font-size: 13px; font-weight: 600; color: #0f172a; }
  .dt-time { display: block; font-size: 11px; color: #94a3b8; }
}

.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;

  &--online   { background: #eff6ff; color: #2563eb; }
  &--physical { background: #fef2f2; color: #dc2626; }
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;

  .status-dot-sm { width: 6px; height: 6px; border-radius: 50%; }

  &--pending   { background: #fff7ed; color: #ea580c; .status-dot-sm { background: #f97316; } }
  &--confirmed { background: #f0fdf4; color: #16a34a; .status-dot-sm { background: #22c55e; } }
  &--completed { background: #f0fdfa; color: #0d9488; .status-dot-sm { background: #14b8a6; } }
  &--cancelled { background: #fef2f2; color: #dc2626; .status-dot-sm { background: #ef4444; } }
  &--verified  { background: #eff6ff; color: #2563eb; .status-dot-sm { background: #3b82f6; } }
}

.payment-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;

  &--paid    { background: #f0fdf4; color: #16a34a; }
  &--pending { background: #fff7ed; color: #ea580c; }
}

.amount-cell { font-size: 13px; font-weight: 700; color: #0d9488; }

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
.detail-dialog { min-width: 520px; border-radius: 16px !important; overflow: hidden; }

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

  &--pending   { background: linear-gradient(135deg, #f97316, #ea580c); }
  &--confirmed { background: linear-gradient(135deg, #22c55e, #16a34a); }
  &--completed { background: linear-gradient(135deg, #0d9488, #0f766e); }
  &--cancelled { background: linear-gradient(135deg, #ef4444, #dc2626); }
  &--verified  { background: linear-gradient(135deg, #3b82f6, #2563eb); }
}

.detail-title { font-size: 16px; font-weight: 700; color: #0f172a; }
.detail-sub   { font-size: 12px; color: #94a3b8; font-family: monospace; margin-top: 2px; }

.detail-body { padding: 20px; }

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 16px;
}

.detail-item {
  display: flex; flex-direction: column; gap: 3px;
  .detail-key { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
  .detail-val { font-size: 13px; font-weight: 600; color: #0f172a; }
}

.charges-section {
  background: #f8fafc;
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 12px;

  .charges-title { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
}

.charges-grid { display: flex; flex-direction: column; gap: 6px; }

.charge-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #475569;

  &--total {
    font-weight: 700;
    color: #0f172a;
    padding-top: 8px;
    border-top: 1px solid #e2e8f0;
    margin-top: 4px;
  }
}

.rejection-notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 14px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 8px;
  font-size: 12px;
  color: #92400e;
}
</style>
