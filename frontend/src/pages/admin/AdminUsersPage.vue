<template>
  <q-page class="admin-page">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">{{ isDoctorPage ? 'Doctor Management' : 'User Management' }}</h2>
        <p class="page-subtitle">{{ isDoctorPage ? 'Browse the doctor profile catalog, not generic user profiles.' : 'Manage all platform users — patients, doctors, admins' }}</p>
      </div>
    </div>

    <!-- Filters -->
    <q-card class="filter-card">
      <q-card-section class="filter-row">
        <q-input
          v-model="search"
          :placeholder="isDoctorPage ? 'Search doctor profiles by name, email or ID...' : 'Search by name, email or ID...'"
          outlined dense
          class="search-input"
          @update:model-value="debouncedSearch"
        >
          <template #prepend><q-icon name="search" color="grey-5" /></template>
          <template #append v-if="search">
            <q-icon name="close" class="cursor-pointer" @click="search = ''; loadUsers()" />
          </template>
        </q-input>

        <template v-if="!isDoctorPage">
          <q-select
            v-model="roleFilter"
            :options="roleOptions"
            outlined dense
            label="Role"
            class="filter-select"
            emit-value map-options clearable
            @update:model-value="loadUsers"
          />

          <q-select
            v-model="statusFilter"
            :options="statusOptions"
            outlined dense
            label="Status"
            class="filter-select"
            emit-value map-options clearable
            @update:model-value="loadUsers"
          />
        </template>

        <q-btn unelevated no-caps color="green-6" icon="refresh" label="Refresh" @click="loadUsers" class="refresh-btn" />
      </q-card-section>
    </q-card>

    <!-- Table -->
    <q-card class="table-card">
      <q-table
        :rows="users"
        :columns="columns"
        row-key="userId"
        :loading="loading"
        :pagination="{ rowsPerPage: perPage, page: currentPage }"
        @request="onRequest"
        flat
        class="nexus-table"
        :rows-per-page-options="[10, 20, 50]"
      >
        <template #header="props">
          <q-tr :props="props" class="table-header-row">
            <q-th v-for="col in props.cols" :key="col.name" :props="props" class="table-th">
              {{ col.label }}
            </q-th>
          </q-tr>
        </template>

        <template #body="props">
          <q-tr :props="props" class="table-row">
            <!-- User Info -->
            <q-td key="name" :props="props">
              <div class="user-cell">
                <q-avatar size="36px" :style="{ background: getRoleColor(props.row.role) }" class="user-table-avatar">
                  {{ getInitials(props.row.name) }}
                </q-avatar>
                <div>
                  <div class="user-cell-name">{{ props.row.name }}</div>
                  <div class="user-cell-id">{{ props.row.userId }}</div>
                </div>
              </div>
            </q-td>

            <!-- Email -->
            <q-td key="email" :props="props">
              <span class="cell-text">{{ props.row.email }}</span>
            </q-td>

            <!-- Role -->
            <q-td key="role" :props="props">
              <q-badge
                :label="props.row.role"
                :color="props.row.role === 'doctor' ? 'blue-6' : props.row.role === 'patient' ? 'teal-6' : 'purple-6'"
                rounded
                class="role-badge"
              />
            </q-td>

            <!-- Status -->
            <q-td key="status" :props="props">
              <div class="status-cell" :class="props.row.isActive ? 'status-active' : 'status-inactive'">
                <span class="status-dot-sm"></span>
                {{ props.row.isActive ? 'Active' : 'Inactive' }}
              </div>
            </q-td>

            <!-- Verified -->
            <q-td key="verified" :props="props">
              <q-icon
                :name="props.row.isVerified ? 'verified' : 'pending'"
                :color="props.row.isVerified ? 'green-6' : 'orange-5'"
                size="20px"
              />
            </q-td>

            <!-- Joined -->
            <q-td key="createdAt" :props="props">
              <span class="date-cell">{{ formatDate(props.row.createdAt) }}</span>
            </q-td>

            <!-- Actions -->
            <q-td key="actions" :props="props">
              <div class="table-actions">
                <q-btn
                  flat round dense size="sm"
                  :icon="props.row.isActive ? 'block' : 'check_circle'"
                  :color="props.row.isActive ? 'orange-6' : 'green-6'"
                  @click="toggleStatus(props.row)"
                  :loading="processingId === props.row.userId"
                >
                  <q-tooltip>{{ props.row.isActive ? 'Deactivate' : 'Activate' }}</q-tooltip>
                </q-btn>
                <q-btn
                  flat round dense size="sm"
                  icon="delete_outline"
                  color="red-5"
                  @click="confirmDelete(props.row)"
                >
                  <q-tooltip>Delete User</q-tooltip>
                </q-btn>
              </div>
            </q-td>
          </q-tr>
        </template>

        <template #no-data>
          <div class="no-data-row">
            <q-icon name="search_off" size="40px" color="grey-4" />
            <p>{{ isDoctorPage ? 'No doctors found' : 'No users found' }}</p>
          </div>
        </template>
      </q-table>

      <!-- Pagination -->
      <div class="table-footer">
        <span class="total-text">Total: {{ totalUsers }} {{ isDoctorPage ? 'doctors' : 'users' }}</span>
        <q-pagination
          v-model="currentPage"
          :max="totalPages"
          :max-pages="6"
          direction-links
          color="green-6"
          @update:model-value="loadUsers"
        />
      </div>
    </q-card>

    <!-- Delete Confirmation -->
    <q-dialog v-model="deleteDialog" persistent>
      <q-card class="confirm-dialog">
        <q-card-section class="row items-center">
          <q-icon name="delete_forever" color="red-5" size="30px" class="q-mr-sm" />
          <span class="dialog-title">Delete User</span>
        </q-card-section>
        <q-card-section>
          <p>Are you sure you want to permanently delete <strong>{{ deleteTarget?.name }}</strong>?</p>
          <p class="text-red-6 text-caption">This action cannot be undone.</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn unelevated label="Delete" color="red-5" :loading="processingId === deleteTarget?.userId" @click="deleteUser" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { adminApi } from '../../services/adminApi'
import { searchDoctorProfiles } from '../../services/doctorApi'

const $q = useQuasar()
const route = useRoute()
const isDoctorPage = computed(() => route.name === 'AdminDoctors')

// State
const users        = ref([])
const loading      = ref(true)
const processingId = ref(null)
const search       = ref('')
const roleFilter   = ref(null)
const statusFilter = ref(null)
const currentPage  = ref(1)
const perPage      = ref(10)
const totalUsers   = ref(0)
const totalPages   = computed(() => Math.ceil(totalUsers.value / perPage.value))

const deleteDialog = ref(false)
const deleteTarget = ref(null)

// Options
const roleOptions   = [
  { label: 'Patient', value: 'patient' },
  { label: 'Doctor',  value: 'doctor'  },
  { label: 'Admin',   value: 'admin'   },
]
const statusOptions = [
  { label: 'Active',   value: 'true'  },
  { label: 'Inactive', value: 'false' },
]

// Table columns
const columns = [
  { name: 'name',      label: 'User',       align: 'left',   field: 'name'      },
  { name: 'email',     label: 'Email',      align: 'left',   field: 'email'     },
  { name: 'role',      label: 'Role',       align: 'center', field: 'role'      },
  { name: 'status',    label: 'Status',     align: 'center', field: 'isActive'  },
  { name: 'verified',  label: 'Verified',   align: 'center', field: 'isVerified'},
  { name: 'createdAt', label: 'Joined',     align: 'left',   field: 'createdAt' },
  { name: 'actions',   label: 'Actions',    align: 'center', field: 'actions'   },
]

// Helpers
const getInitials = (n = '') => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
const getRoleColor = (r) => ({ doctor: '#1d4ed8', patient: '#0d9488', admin: '#7c3aed' }[r] || '#64748b')
const formatDate  = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—'

let searchTimer
const debouncedSearch = () => { clearTimeout(searchTimer); searchTimer = setTimeout(loadUsers, 350) }

// Load
async function loadUsers() {
  loading.value = true
  try {
    if (isDoctorPage.value) {
      const params = {}
      if (search.value) params.search = search.value

      const doctors = await searchDoctorProfiles(params)
      users.value = Array.isArray(doctors)
        ? doctors.map(doc => ({
            userId: doc.doctorId || doc._id || doc.id,
            name: doc.name || '',
            email: doc.email || '',
            role: 'doctor',
            isActive: doc.isActive !== undefined ? doc.isActive : true,
            isVerified: doc.isVerified !== undefined ? doc.isVerified : false,
            createdAt: doc.createdAt || null,
          }))
        : []
      totalUsers.value = users.value.length
    } else {
      const params = { page: currentPage.value, limit: perPage.value }
      if (search.value)       params.search = search.value
      if (roleFilter.value)   params.role   = roleFilter.value
      if (statusFilter.value) params.isActive = statusFilter.value

      const { data } = await adminApi.getUsers(params)
      users.value      = data.data  || []
      totalUsers.value = data.total || 0
    }
  } catch {
    users.value = []
    totalUsers.value = 0
  } finally {
    loading.value = false
  }
}

function onRequest(props) {
  currentPage.value = props.pagination.page
  perPage.value     = props.pagination.rowsPerPage
  loadUsers()
}

// Toggle status
async function toggleStatus(user) {
  processingId.value = user.userId
  try {
    await adminApi.toggleUserStatus(user.userId, !user.isActive)
    $q.notify({ type: 'positive', message: `User ${user.isActive ? 'deactivated' : 'activated'}`, position: 'top-right' })
    await loadUsers()
  } catch (err) {
    $q.notify({ type: 'negative', message: err.response?.data?.message || 'Action failed', position: 'top-right' })
  } finally { processingId.value = null }
}

// Delete
function confirmDelete(user) {
  deleteTarget.value = user
  deleteDialog.value = true
}

async function deleteUser() {
  processingId.value = deleteTarget.value.userId
  try {
    await adminApi.deleteUser(deleteTarget.value.userId)
    $q.notify({ type: 'positive', message: 'User deleted successfully', position: 'top-right' })
    deleteDialog.value = false
    await loadUsers()
  } catch (err) {
    $q.notify({ type: 'negative', message: err.response?.data?.message || 'Delete failed', position: 'top-right' })
  } finally { processingId.value = null }
}

onMounted(loadUsers)
</script>

<style lang="scss" scoped>
.admin-page  { padding: 28px; }

.page-header {
  margin-bottom: 24px;
  .page-title   { font-size: 22px; font-weight: 700; color: #1a2332; margin: 0; font-family: 'Poppins', sans-serif; }
  .page-subtitle{ font-size: 13px; color: #64748b; margin: 4px 0 0; }
}

.filter-card {
  border-radius: 12px;
  margin-bottom: 16px;
  border: 1px solid #e9ecef;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input  { min-width: 260px; flex: 1; }
.filter-select { width: 140px; }
.refresh-btn   { height: 40px; border-radius: 8px; }

.table-card {
  border-radius: 12px;
  border: 1px solid #e9ecef;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  overflow: hidden;
}

.nexus-table { font-family: 'Inter', sans-serif; }

.table-header-row { background: #f8fafc; }
.table-th {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table-row {
  &:hover td { background: #f8fafc; }
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;

  .user-table-avatar { color: #fff; font-size: 13px; font-weight: 700; border-radius: 8px; }
  .user-cell-name { font-size: 14px; font-weight: 600; color: #1a2332; }
  .user-cell-id   { font-size: 11px; color: #94a3b8; }
}

.cell-text { font-size: 13px; color: #475569; }
.date-cell { font-size: 12px; color: #64748b; }

.role-badge { font-size: 11px; }

.status-cell {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 20px;
  padding: 3px 10px;

  &.status-active   { background: #f0fdf4; color: #16a34a; .status-dot-sm { background: #22c55e; } }
  &.status-inactive { background: #fef2f2; color: #dc2626; .status-dot-sm { background: #ef4444; } }

  .status-dot-sm { width: 6px; height: 6px; border-radius: 50%; }
}

.table-actions { display: flex; align-items: center; gap: 2px; justify-content: center; }

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-top: 1px solid #f0f2f5;

  .total-text { font-size: 13px; color: #64748b; }
}

.no-data-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  color: #94a3b8;
  p { margin: 8px 0 0; font-size: 14px; }
}

.confirm-dialog { min-width: 380px; border-radius: 12px !important; }
.dialog-title   { font-size: 17px; font-weight: 600; color: #1a2332; }
</style>
