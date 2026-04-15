
<template>
  <q-page class="admin-page">

    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Hospital Management</h2>
        <p class="page-subtitle">Register and manage hospitals available on the platform</p>
      </div>
      <q-btn unelevated no-caps icon="add" label="Add Hospital" color="green-6" @click="openDialog(null)" />
    </div>

    <!-- Stats Row -->
    <div class="hosp-stats-row">
      <div class="hosp-stat-card hosp-stat-card--green">
        <div class="hosp-stat-icon"><q-icon name="local_hospital" size="22px" color="white" /></div>
        <div class="hosp-stat-content">
          <span class="hosp-stat-value">{{ hospitals.length }}</span>
          <span class="hosp-stat-label">Total Hospitals</span>
        </div>
      </div>
      <div class="hosp-stat-card hosp-stat-card--blue">
        <div class="hosp-stat-icon hosp-stat-icon--blue"><q-icon name="check_circle" size="22px" color="white" /></div>
        <div class="hosp-stat-content">
          <span class="hosp-stat-value">{{ hospitals.filter(h => h.isActive).length }}</span>
          <span class="hosp-stat-label">Active</span>
        </div>
      </div>
      <div class="hosp-stat-card hosp-stat-card--orange">
        <div class="hosp-stat-icon hosp-stat-icon--orange"><q-icon name="block" size="22px" color="white" /></div>
        <div class="hosp-stat-content">
          <span class="hosp-stat-value">{{ hospitals.filter(h => !h.isActive).length }}</span>
          <span class="hosp-stat-label">Inactive</span>
        </div>
      </div>
      <div class="hosp-stat-card hosp-stat-card--teal">
        <div class="hosp-stat-icon hosp-stat-icon--teal"><q-icon name="price_change" size="22px" color="white" /></div>
        <div class="hosp-stat-content">
          <span class="hosp-stat-value">LKR {{ avgFee.toLocaleString() }}</span>
          <span class="hosp-stat-label">Avg. Hospital Fee</span>
        </div>
      </div>
    </div>

    <!-- Search + Filter -->
    <q-card class="filter-bar">
      <div class="filter-inner">
        <div class="search-wrap">
          <q-icon name="search" size="16px" color="grey-5" />
          <input v-model="search" placeholder="Search by name or location..." class="search-input" />
          <q-icon v-if="search" name="close" size="14px" color="grey-5" class="cursor-pointer" @click="search = ''" />
        </div>
        <q-select
          v-model="statusFilter"
          :options="[{ label: 'All', value: null }, { label: 'Active', value: true }, { label: 'Inactive', value: false }]"
          outlined dense label="Status" class="filter-select"
          emit-value map-options
        />
        <q-btn unelevated no-caps icon="refresh" label="Refresh" color="green-6" size="sm" class="refresh-btn" :loading="loading" @click="load" />
      </div>
    </q-card>

    <!-- Loading Skeletons -->
    <div v-if="loading" class="hospitals-grid">
      <div v-for="i in 6" :key="i" class="skeleton-card">
        <div class="sk-line sk-line--lg q-mb-sm"></div>
        <div class="sk-line sk-line--md q-mb-xs"></div>
        <div class="sk-line sk-line--sm"></div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredHospitals.length === 0" class="empty-state">
      <div class="empty-icon"><q-icon name="local_hospital" size="40px" color="grey-4" /></div>
      <p class="empty-title">No hospitals found</p>
      <p class="empty-sub">{{ search ? 'Try a different search term' : 'Add your first hospital to get started' }}</p>
      <q-btn v-if="!search" unelevated no-caps label="Add Hospital" color="green-6" icon="add" class="q-mt-md" @click="openDialog(null)" />
    </div>

    <!-- Hospital Cards -->
    <div v-else class="hospitals-grid">
      <q-card
        v-for="(hosp, idx) in filteredHospitals"
        :key="hosp.hospitalId"
        class="hosp-card"
        :style="{ animationDelay: `${idx * 40}ms` }"
      >
        <div class="hosp-card-top">
          <div class="hosp-card-icon-wrap">
            <q-icon name="local_hospital" size="24px" color="white" />
          </div>
          <div class="hosp-card-identity">
            <span class="hosp-card-name">{{ hosp.name }}</span>
            <span class="hosp-card-id">{{ hosp.hospitalId }}</span>
          </div>
          <div class="hosp-status-badge" :class="hosp.isActive ? 'hosp-status-badge--active' : 'hosp-status-badge--inactive'">
            <span class="status-dot"></span>
            {{ hosp.isActive ? 'Active' : 'Inactive' }}
          </div>
        </div>

        <div class="hosp-card-details">
          <div class="hosp-detail-row" v-if="hosp.location">
            <q-icon name="location_on" size="14px" color="grey-5" /><span>{{ hosp.location }}</span>
          </div>
          <div class="hosp-detail-row" v-if="hosp.contactNumber">
            <q-icon name="phone" size="14px" color="grey-5" /><span>{{ hosp.contactNumber }}</span>
          </div>
          <div class="hosp-detail-row" v-if="hosp.email">
            <q-icon name="email" size="14px" color="grey-5" /><span>{{ hosp.email }}</span>
          </div>
          <div v-if="!hosp.location && !hosp.contactNumber && !hosp.email" class="hosp-no-details">
            No contact details added
          </div>
        </div>

        <div class="hosp-card-fee">
          <span class="hosp-fee-label">Hospital Fee</span>
          <span class="hosp-fee-value">LKR {{ (hosp.hospitalFee || 0).toLocaleString() }}</span>
        </div>

        <div class="hosp-card-actions">
          <q-btn unelevated no-caps size="sm" icon="edit" label="Edit" color="blue-6" class="hosp-action-btn" @click="openDialog(hosp)" />
          <q-btn
            unelevated no-caps size="sm"
            :icon="hosp.isActive ? 'block' : 'check_circle'"
            :label="hosp.isActive ? 'Deactivate' : 'Activate'"
            :color="hosp.isActive ? 'orange-6' : 'green-6'"
            outline class="hosp-action-btn"
            :loading="togglingId === hosp.hospitalId"
            @click="toggleActive(hosp)"
          />
          <q-btn flat round dense size="sm" icon="delete_outline" color="red-5" @click="confirmDelete(hosp)">
            <q-tooltip>Delete</q-tooltip>
          </q-btn>
        </div>
      </q-card>
    </div>

    <!-- Create / Edit Dialog -->
    <q-dialog v-model="dialog" persistent>
      <q-card class="hosp-dialog">
        <div class="dialog-header">
          <div class="dialog-icon" :class="editTarget?.hospitalId ? 'dialog-icon--blue' : 'dialog-icon--green'">
            <q-icon name="local_hospital" size="20px" color="white" />
          </div>
          <div>
            <div class="dialog-title">{{ editTarget?.hospitalId ? 'Edit Hospital' : 'Add New Hospital' }}</div>
            <div class="dialog-sub">{{ editTarget?.hospitalId ? 'Update hospital details' : 'Register a new hospital on the platform' }}</div>
          </div>
          <q-btn flat round dense icon="close" color="grey-5" class="q-ml-auto" v-close-popup />
        </div>

        <q-card-section class="q-pt-sm">
          <div class="form-grid">
            <q-input v-model="form.name"          outlined label="Hospital Name *"   class="nexus-input" :rules="[v => !!v || 'Required']" />
            <q-input v-model="form.location"      outlined label="Location"           class="nexus-input" />
            <q-input v-model="form.contactNumber" outlined label="Contact Number"     class="nexus-input" />
            <q-input v-model="form.email"         outlined label="Email"              class="nexus-input" type="email" />
            <q-input
              v-model.number="form.hospitalFee"
              outlined label="Hospital Fee (LKR) *"
              type="number" prefix="LKR" class="nexus-input"
              :rules="[v => v >= 0 || 'Must be 0 or greater']"
            />
            <div class="toggle-row">
              <span class="toggle-label">Active Status</span>
              <q-toggle v-model="form.isActive" color="green-6" />
              <span class="toggle-val" :class="form.isActive ? 'text-green-6' : 'text-grey-5'">
                {{ form.isActive ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn flat no-caps label="Cancel" color="grey-6" v-close-popup />
          <q-btn
            unelevated no-caps
            :label="editTarget?.hospitalId ? 'Update Hospital' : 'Create Hospital'"
            :color="editTarget?.hospitalId ? 'blue-6' : 'green-6'"
            :loading="saving" @click="save"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Delete Confirm -->
    <q-dialog v-model="deleteDialog" persistent>
      <q-card class="confirm-dialog">
        <div class="dialog-header">
          <div class="dialog-icon dialog-icon--red">
            <q-icon name="delete_forever" size="20px" color="white" />
          </div>
          <div>
            <div class="dialog-title">Delete Hospital</div>
            <div class="dialog-sub">This cannot be undone</div>
          </div>
        </div>
        <q-card-section class="q-pt-sm">
          <p class="delete-text">Delete <strong>{{ deleteTarget?.name }}</strong>?</p>
        </q-card-section>
        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn flat no-caps label="Cancel" color="grey-6" v-close-popup />
          <q-btn unelevated no-caps label="Delete" color="red-5" icon="delete_forever" :loading="saving" @click="deleteHospital" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { feeApi } from '../../services/adminApi'

const $q = useQuasar()

const loading    = ref(true)
const saving     = ref(false)
const togglingId = ref(null)
const hospitals  = ref([])
const search     = ref('')
const statusFilter = ref(null)

const dialog       = ref(false)
const deleteDialog = ref(false)
const editTarget   = ref(null)
const deleteTarget = ref(null)

const form = ref({ name: '', location: '', contactNumber: '', email: '', hospitalFee: 0, isActive: true })

const avgFee = computed(() => {
  if (!hospitals.value.length) return 0
  const sum = hospitals.value.reduce((a, h) => a + (h.hospitalFee || 0), 0)
  return Math.round(sum / hospitals.value.length)
})

const filteredHospitals = computed(() => {
  let list = [...hospitals.value]
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(h => h.name?.toLowerCase().includes(q) || h.location?.toLowerCase().includes(q))
  }
  if (statusFilter.value !== null) {
    list = list.filter(h => h.isActive === statusFilter.value)
  }
  return list
})

async function load() {
  loading.value = true
  try {
    const { data } = await feeApi.getHospitals()
    hospitals.value = data.data || []
  } catch { hospitals.value = [] }
  finally { loading.value = false }
}

function openDialog(hosp) {
  editTarget.value = hosp
  form.value = hosp
    ? { name: hosp.name, location: hosp.location || '', contactNumber: hosp.contactNumber || '', email: hosp.email || '', hospitalFee: hosp.hospitalFee || 0, isActive: hosp.isActive !== false }
    : { name: '', location: '', contactNumber: '', email: '', hospitalFee: 0, isActive: true }
  dialog.value = true
}

async function save() {
  if (!form.value.name) { $q.notify({ type: 'warning', message: 'Hospital name required', position: 'top-right' }); return }
  saving.value = true
  try {
    if (editTarget.value?.hospitalId) {
      await feeApi.updateHospital(editTarget.value.hospitalId, form.value)
      $q.notify({ type: 'positive', message: 'Hospital updated', position: 'top-right', icon: 'check_circle' })
    } else {
      await feeApi.createHospital(form.value)
      $q.notify({ type: 'positive', message: 'Hospital created', position: 'top-right', icon: 'check_circle' })
    }
    dialog.value = false
    await load()
  } catch (err) {
    $q.notify({ type: 'negative', message: err.response?.data?.message || 'Save failed', position: 'top-right' })
  } finally { saving.value = false }
}

async function toggleActive(hosp) {
  togglingId.value = hosp.hospitalId
  try {
    await feeApi.updateHospital(hosp.hospitalId, { isActive: !hosp.isActive })
    $q.notify({ type: 'positive', message: `Hospital ${hosp.isActive ? 'deactivated' : 'activated'}`, position: 'top-right' })
    await load()
  } catch (err) {
    $q.notify({ type: 'negative', message: err.response?.data?.message || 'Failed', position: 'top-right' })
  } finally { togglingId.value = null }
}

function confirmDelete(hosp) {
  deleteTarget.value = hosp
  deleteDialog.value = true
}

async function deleteHospital() {
  saving.value = true
  try {
    await feeApi.deleteHospital(deleteTarget.value.hospitalId)
    $q.notify({ type: 'positive', message: 'Hospital deleted', position: 'top-right' })
    deleteDialog.value = false
    await load()
  } catch (err) {
    $q.notify({ type: 'negative', message: err.response?.data?.message || 'Delete failed', position: 'top-right' })
  } finally { saving.value = false }
}

onMounted(load)
</script>

<style lang="scss" scoped>
.admin-page { padding: 28px 28px 48px; }

.page-header {
  display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;
  .page-title    { font-family: 'Poppins', sans-serif; font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 4px; }
  .page-subtitle { font-size: 13px; color: #64748b; margin: 0; }
}

.hosp-stats-row { display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 20px; }

.hosp-stat-card {
  background: #fff; border-radius: 12px; border: 1px solid #eef0f4;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05); padding: 16px 20px;
  display: flex; align-items: center; gap: 14px; flex: 1; min-width: 160px;
  transition: transform 0.15s; &:hover { transform: translateY(-1px); }

  &--green  { border-left: 3px solid #10b981; .hosp-stat-icon { background: linear-gradient(135deg,#10b981,#059669); } }
  &--blue   { border-left: 3px solid #3b82f6; }
  &--orange { border-left: 3px solid #f97316; }
  &--teal   { border-left: 3px solid #0d9488; }
}

.hosp-stat-icon {
  width: 44px; height: 44px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  background: linear-gradient(135deg, #10b981, #059669);
  &--blue   { background: linear-gradient(135deg, #3b82f6, #2563eb); }
  &--orange { background: linear-gradient(135deg, #f97316, #ea580c); }
  &--teal   { background: linear-gradient(135deg, #0d9488, #0f766e); }
}

.hosp-stat-content {
  display: flex; flex-direction: column;
  .hosp-stat-value { font-size: 22px; font-weight: 800; color: #0f172a; font-family: 'Poppins', sans-serif; line-height: 1; }
  .hosp-stat-label { font-size: 11px; color: #64748b; margin-top: 3px; }
}

.filter-bar { border-radius: 12px; border: 1px solid #eef0f4; box-shadow: 0 1px 4px rgba(0,0,0,0.04); margin-bottom: 20px; }
.filter-inner { display: flex; align-items: center; gap: 12px; padding: 14px 16px; flex-wrap: wrap; }

.search-wrap {
  display: flex; align-items: center; gap: 8px; background: #f8fafc;
  border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 14px; flex: 1; min-width: 240px;
  transition: border-color 0.15s; &:focus-within { border-color: #10b981; }
  .search-input { border: none; outline: none; background: transparent; font-size: 13px; color: #334155; flex: 1; &::placeholder { color: #94a3b8; } }
}

.filter-select { width: 140px; }
.refresh-btn   { height: 38px; border-radius: 8px; }

.hospitals-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }

.skeleton-card {
  background: #fff; border-radius: 14px; border: 1px solid #eef0f4; padding: 20px;
  animation: pulse 1.5s ease infinite;
}
.sk-line { height: 12px; background: #f0f4f8; border-radius: 6px; &--lg { width: 70%; } &--md { width: 50%; } &--sm { width: 35%; } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }

.empty-state {
  display: flex; flex-direction: column; align-items: center; padding: 64px 20px; text-align: center;
  .empty-icon { width: 80px; height: 80px; background: #f8fafc; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
  .empty-title { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 6px; }
  .empty-sub   { font-size: 13px; color: #64748b; margin: 0; }
}

.hosp-card {
  background: #fff; border-radius: 14px; border: 1px solid #eef0f4;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05); overflow: hidden;
  transition: box-shadow 0.2s, transform 0.2s; animation: cardIn 0.3s ease both;
  &:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.1); transform: translateY(-2px); }
  @keyframes cardIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
}

.hosp-card-top {
  display: flex; align-items: center; gap: 12px; padding: 16px 16px 12px;
  background: linear-gradient(135deg, #f8fafc, #f0f4f8); border-bottom: 1px solid #eef0f4;
}

.hosp-card-icon-wrap {
  width: 44px; height: 44px; border-radius: 10px;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  box-shadow: 0 3px 10px rgba(239,68,68,0.25);
}

.hosp-card-identity {
  flex: 1; min-width: 0;
  .hosp-card-name { display: block; font-size: 15px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .hosp-card-id   { display: block; font-size: 11px; color: #94a3b8; font-family: monospace; margin-top: 1px; }
}

.hosp-status-badge {
  display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700;
  padding: 4px 10px; border-radius: 20px; flex-shrink: 0;
  .status-dot { width: 6px; height: 6px; border-radius: 50%; }
  &--active   { background: #f0fdf4; color: #16a34a; .status-dot { background: #22c55e; } }
  &--inactive { background: #fef2f2; color: #dc2626; .status-dot { background: #ef4444; } }
}

.hosp-card-details {
  padding: 12px 16px; display: flex; flex-direction: column; gap: 6px;
  border-bottom: 1px solid #f8fafc; min-height: 60px;
}

.hosp-detail-row { display: flex; align-items: center; gap: 7px; font-size: 12px; color: #475569; }
.hosp-no-details { font-size: 12px; color: #cbd5e1; font-style: italic; }

.hosp-card-fee {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid #eef0f4;
  .hosp-fee-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
  .hosp-fee-value { font-size: 16px; font-weight: 800; color: #16a34a; font-family: 'Poppins', sans-serif; }
}

.hosp-card-actions { display: flex; align-items: center; gap: 8px; padding: 12px 16px; }
.hosp-action-btn   { flex: 1; border-radius: 8px; font-size: 12px; }

.hosp-dialog    { min-width: 500px; border-radius: 16px !important; overflow: hidden; }
.confirm-dialog { min-width: 380px; border-radius: 16px !important; overflow: hidden; }

.dialog-header {
  display: flex; align-items: center; gap: 14px; padding: 20px 20px 16px; border-bottom: 1px solid #f0f4f8;
}

.dialog-icon {
  width: 44px; height: 44px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  &--green { background: linear-gradient(135deg, #10b981, #059669); }
  &--blue  { background: linear-gradient(135deg, #3b82f6, #2563eb); }
  &--red   { background: linear-gradient(135deg, #ef4444, #dc2626); }
}

.dialog-title { font-size: 16px; font-weight: 700; color: #0f172a; }
.dialog-sub   { font-size: 12px; color: #94a3b8; margin-top: 2px; }
.delete-text  { font-size: 14px; color: #334155; margin: 0; }

.form-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
}

.toggle-row {
  display: flex; align-items: center; gap: 8px; padding: 8px 0;
  .toggle-label { font-size: 13px; color: #64748b; flex: 1; }
  .toggle-val   { font-size: 13px; font-weight: 600; }
}

.nexus-input :deep(.q-field__control) { border-radius: 8px; }
</style>
