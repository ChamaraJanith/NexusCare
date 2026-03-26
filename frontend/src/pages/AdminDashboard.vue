<template>
  <q-page class="bg-black q-pa-lg admin-dash">

    <!-- Header -->
    <div class="row items-start justify-between q-mb-xl">
      <div>
        <div class="font-orbitron text-red-8 text-caption uppercase letter-spacing-3 q-mb-xs">
          ◈ ADMINISTRATOR CONTROL NODE
        </div>
        <h1 class="text-h4 text-white font-orbitron q-ma-none q-mb-xs">
          System <span class="text-red-4">Control</span>
        </h1>
        <div class="row items-center q-gutter-sm">
          <q-chip dense dark color="red-10" class="font-orbitron text-caption">
            {{ adminUser.userId }}
          </q-chip>
          <q-chip dense dark color="grey-9" class="font-orbitron text-caption">
            {{ adminUser.name }}
          </q-chip>
        </div>
      </div>

      <div class="row items-center q-gutter-sm">
        <q-btn flat round icon="refresh" color="grey-6" size="sm" @click="loadAll">
          <q-tooltip class="font-orbitron bg-dark">Refresh all</q-tooltip>
        </q-btn>
        <q-btn flat round icon="logout" color="red-4" size="sm" @click="logout">
          <q-tooltip class="font-orbitron bg-dark text-red-4">Logout</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- Platform Stats -->
    <div class="row q-col-gutter-md q-mb-xl">
      <div v-for="s in statsCards" :key="s.label" class="col-6 col-sm-4 col-md-2">
        <div class="stat-block q-pa-md" :style="{ borderColor: s.border }">
          <div class="stat-icon q-mb-xs">
            <q-icon :name="s.icon" :color="s.color" size="1.4rem" />
          </div>
          <div class="text-h4 text-white font-orbitron">{{ s.value }}</div>
          <div class="font-orbitron text-caption q-mt-xs" :class="`text-${s.color}`" style="font-size:0.58rem;letter-spacing:2px">
            {{ s.label }}
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <q-tabs
      v-model="tab" dense align="left"
      class="nexus-tabs font-orbitron q-mb-lg"
      active-color="red-4" indicator-color="red-4"
    >
      <q-tab name="users" label="USER REGISTRY" icon="group" />
      <q-tab name="pending" label="PENDING VERIFICATION" icon="pending_actions">
        <q-badge v-if="pendingDocs.length" color="orange-8" floating class="font-orbitron">
          {{ pendingDocs.length }}
        </q-badge>
      </q-tab>
    </q-tabs>

    <q-tab-panels v-model="tab" animated transition-prev="fade" transition-next="fade" class="bg-transparent">

      <!-- ══ USER REGISTRY ════════════════════════════════════════════ -->
      <q-tab-panel name="users" class="q-pa-none">
        <div class="nexus-panel q-pa-xl">

          <!-- Toolbar -->
          <div class="row q-col-gutter-md items-center q-mb-lg">
            <div class="col-12 col-sm-5">
              <q-input
                v-model="search" placeholder="Search by name, email or ID..."
                dark outlined color="red-4" dense class="nexus-field-red"
                @update:model-value="debouncedLoad"
              >
                <template #prepend><q-icon name="search" size="xs" color="red-8" /></template>
                <template #append>
                  <q-icon v-if="search" name="close" size="xs" color="grey-6" class="cursor-pointer" @click="search=''; loadUsers()" />
                </template>
              </q-input>
            </div>

            <div class="col-12 col-sm-4">
              <q-select
                v-model="roleFilter"
                :options="roleOptions"
                option-label="label" option-value="value"
                emit-value map-options
                dark outlined color="red-4" dense class="nexus-field-red"
                behavior="menu" :popup-content-style="ddStyle"
                @update:model-value="loadUsers"
              />
            </div>

            <div class="col-auto">
              <q-chip dark color="grey-9" class="font-orbitron text-caption">
                {{ totalUsers }} TOTAL
              </q-chip>
            </div>
          </div>

          <!-- Loading skeleton -->
          <div v-if="loadingUsers" class="q-gutter-y-sm">
            <q-skeleton v-for="i in 5" :key="i" type="rect" dark height="60px" class="rounded-borders" />
          </div>

          <!-- User rows -->
          <div v-else class="q-gutter-y-sm">
            <div v-for="u in users" :key="u._id" class="user-row q-pa-md row items-center">

              <!-- Avatar + name -->
              <div class="row items-center col-12 col-md-4">
                <q-avatar size="38px" class="user-avatar q-mr-md">
                  <q-icon :name="roleIcon(u.role)" :color="roleColor(u.role)" size="1.3rem" />
                </q-avatar>
                <div>
                  <div class="text-white font-orbitron text-subtitle2">{{ u.name }}</div>
                  <div class="text-grey-6 text-caption">{{ u.email }}</div>
                </div>
              </div>

              <!-- IDs -->
              <div class="col-12 col-md-3 q-mt-sm q-mt-md-none">
                <q-chip dense dark :color="roleChipColor(u.role)" class="font-orbitron" style="font-size:0.55rem">
                  {{ u.userId }}
                </q-chip>
                <q-chip v-if="u.roleId" dense dark color="grey-9" class="font-orbitron q-ml-xs" style="font-size:0.55rem">
                  {{ u.roleId }}
                </q-chip>
              </div>

              <!-- Status badge -->
              <div class="col-auto q-mx-md">
                <q-badge
                  :color="u.isActive ? 'green-9' : 'red-9'"
                  class="font-orbitron q-pa-xs"
                  style="font-size:0.55rem;letter-spacing:1px"
                >
                  {{ u.isActive ? '● ACTIVE' : '○ INACTIVE' }}
                </q-badge>
              </div>

              <!-- Date -->
              <div class="col text-grey-7 text-caption font-orbitron" style="font-size:0.6rem">
                {{ new Date(u.createdAt).toLocaleDateString('en-GB') }}
              </div>

              <!-- Actions -->
              <div class="col-auto row q-gutter-xs">
                <q-btn
                  flat round dense size="sm"
                  :icon="u.isActive ? 'do_not_disturb' : 'check_circle'"
                  :color="u.isActive ? 'orange-5' : 'green-5'"
                  @click="doToggleStatus(u)"
                >
                  <q-tooltip class="font-orbitron bg-dark">{{ u.isActive ? 'Deactivate' : 'Activate' }}</q-tooltip>
                </q-btn>
                <q-btn flat round dense size="sm" icon="delete_outline" color="red-5" @click="doDeleteUser(u)">
                  <q-tooltip class="font-orbitron bg-dark">Delete user</q-tooltip>
                </q-btn>
              </div>
            </div>

            <div v-if="users.length === 0" class="empty-state q-pa-xl">
              <q-icon name="group_off" size="4rem" color="grey-9" />
              <div class="font-orbitron text-grey-8 q-mt-md">NO USERS FOUND</div>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="row justify-center q-mt-lg">
            <q-pagination v-model="page" :max="totalPages" dark color="red-4" @update:model-value="loadUsers" />
          </div>
        </div>
      </q-tab-panel>

      <!-- ══ PENDING VERIFICATION ══════════════════════════════════════ -->
      <q-tab-panel name="pending" class="q-pa-none">
        <div class="nexus-panel q-pa-xl">
          <div class="panel-header q-mb-xl">
            <q-icon name="pending_actions" color="orange-4" class="q-mr-sm" />
            <span class="font-orbitron text-white uppercase">Pending Doctor Verifications</span>
          </div>

          <div v-if="loadingPending" class="q-gutter-y-sm">
            <q-skeleton v-for="i in 3" :key="i" type="rect" dark height="120px" class="rounded-borders" />
          </div>

          <div v-else-if="pendingDocs.length === 0" class="empty-state q-pa-xl">
            <q-icon name="verified" size="4rem" color="green-8" />
            <div class="font-orbitron text-grey-7 q-mt-md">ALL DOCTORS VERIFIED</div>
            <div class="text-grey-9 text-caption q-mt-xs">No pending verification requests</div>
          </div>

          <div v-else class="q-gutter-y-md">
            <div v-for="doc in pendingDocs" :key="doc.doctorId" class="doc-card q-pa-xl">

              <div class="row items-start justify-between">
                <div class="row items-start">
                  <!-- Avatar -->
                  <div class="doc-avatar-wrap q-mr-lg">
                    <q-avatar size="56px" class="doc-avatar">
                      <q-icon name="medical_services" color="orange-4" size="2rem" />
                    </q-avatar>
                    <div class="doc-pending-badge font-orbitron">PENDING</div>
                  </div>

                  <!-- Info -->
                  <div>
                    <div class="text-h6 text-white font-orbitron q-mb-xs">{{ doc.name }}</div>
                    <div class="text-grey-5 text-caption q-mb-sm">{{ doc.email }}</div>

                    <div class="row q-gutter-xs q-mb-sm flex-wrap">
                      <q-chip dense dark color="cyan-10" class="font-orbitron" style="font-size:0.55rem">
                        {{ doc.doctorId }}
                      </q-chip>
                      <q-chip dense dark color="deep-orange-10" icon="stethoscope" class="font-orbitron" style="font-size:0.55rem">
                        {{ doc.specialty }}
                      </q-chip>
                      <q-chip v-if="doc.hospital" dense dark color="grey-9" icon="local_hospital" style="font-size:0.55rem">
                        {{ doc.hospital }}
                      </q-chip>
                    </div>

                    <div class="row q-gutter-md text-caption">
                      <div>
                        <span class="text-grey-7 font-orbitron" style="font-size:0.58rem">SLMC: </span>
                        <span class="text-cyan-6 font-orbitron">{{ doc.registrationNumber }}</span>
                      </div>
                      <div v-if="doc.qualifications?.length">
                        <span class="text-grey-7 font-orbitron" style="font-size:0.58rem">QUALS: </span>
                        <span class="text-grey-4">{{ doc.qualifications.join(', ') }}</span>
                      </div>
                    </div>

                    <div class="text-grey-8 font-orbitron q-mt-xs" style="font-size:0.58rem;letter-spacing:1px">
                      APPLIED {{ new Date(doc.createdAt).toLocaleDateString('en-GB') }}
                    </div>
                  </div>
                </div>

                <!-- Action buttons -->
                <div class="column q-gutter-sm q-mt-sm">
                  <q-btn
                    class="verify-approve-btn font-orbitron"
                    icon="check_circle" label="APPROVE"
                    :loading="verifyingId === doc.doctorId + '_approve'"
                    @click="doVerify(doc.doctorId, 'approve')"
                  />
                  <q-btn
                    flat class="verify-reject-btn font-orbitron"
                    icon="cancel" label="REJECT"
                    @click="openRejectDlg(doc)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Reject dialog -->
        <q-dialog v-model="rejectDlg.show" persistent>
          <q-card class="dialog-card q-pa-xl" style="min-width:380px">
            <div class="card-accent-bar-red q-mb-lg"></div>
            <div class="font-orbitron text-white uppercase q-mb-xs">Reject Doctor Registration</div>
            <div class="text-grey-6 text-caption q-mb-lg">
              Rejecting: <span class="text-orange-4 font-orbitron">{{ rejectDlg.doctor?.name }}</span> ({{ rejectDlg.doctor?.doctorId }})
            </div>

            <div class="field-label q-mb-xs">REJECTION REASON *</div>
            <q-input
              v-model="rejectDlg.reason"
              type="textarea" rows="3"
              placeholder="Provide a clear reason for rejection..."
              dark outlined color="red-4" class="nexus-field q-mb-lg"
            />

            <div class="row q-gutter-sm justify-end">
              <q-btn flat label="CANCEL" color="grey-6" class="font-orbitron" v-close-popup />
              <q-btn
                label="CONFIRM REJECT" color="red-9" class="font-orbitron"
                :loading="verifyingId === rejectDlg.doctor?.doctorId + '_reject'"
                :disable="!rejectDlg.reason"
                @click="confirmReject"
              />
            </div>
          </q-card>
        </q-dialog>
      </q-tab-panel>

    </q-tab-panels>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import axios from 'axios'

const router = useRouter()
const $q = useQuasar()

const token = localStorage.getItem('nexus_token')
const adminUser = JSON.parse(localStorage.getItem('nexus_user') || '{}')

const tab = ref('users')
const users = ref([])
const pendingDocs = ref([])
const platformStats = ref({})
const loadingUsers = ref(false)
const loadingPending = ref(false)
const verifyingId = ref('')
const search = ref('')
const roleFilter = ref('')
const page = ref(1)
const totalUsers = ref(0)
const totalPages = ref(1)

const rejectDlg = reactive({ show: false, doctor: null, reason: '' })

const ddStyle = {
  backgroundColor: '#020d0f',
  border: '1px solid rgba(229,57,53,0.25)',
  boxShadow: '0 0 20px rgba(229,57,53,0.1)',
  zIndex: 9999
}

const roleOptions = [
  { label: 'ALL ROLES', value: '' },
  { label: 'PATIENTS', value: 'patient' },
  { label: 'DOCTORS', value: 'doctor' },
  { label: 'ADMINS', value: 'admin' }
]

const api = axios.create({
  baseURL: 'http://localhost:5001',
  headers: { Authorization: `Bearer ${token}` }
})

// Stats display
const statsCards = computed(() => {
  const s = platformStats.value
  return [
    { label: 'TOTAL USERS', value: s.totalUsers || 0, icon: 'group', color: 'white', border: 'rgba(255,255,255,0.08)' },
    { label: 'PATIENTS', value: s.totalPatients || 0, icon: 'person', color: 'cyan-4', border: 'rgba(0,229,255,0.2)' },
    { label: 'DOCTORS', value: s.totalDoctors || 0, icon: 'medical_services', color: 'blue-4', border: 'rgba(33,150,243,0.2)' },
    { label: 'VERIFIED', value: s.verifiedDoctors || 0, icon: 'verified', color: 'green-4', border: 'rgba(76,175,80,0.2)' },
    { label: 'PENDING', value: s.pendingDoctors || 0, icon: 'pending', color: 'orange-4', border: 'rgba(255,152,0,0.2)' },
    { label: 'ACTIVE', value: s.activeUsers || 0, icon: 'check_circle', color: 'green-6', border: 'rgba(76,175,80,0.15)' }
  ]
})

const roleIcon = (r) => ({ patient: 'person', doctor: 'medical_services', admin: 'shield' }[r] || 'person')
const roleColor = (r) => ({ patient: 'cyan-4', doctor: 'blue-4', admin: 'red-4' }[r] || 'grey-4')
const roleChipColor = (r) => ({ patient: 'cyan-10', doctor: 'blue-10', admin: 'red-10' }[r] || 'grey-9')

// Debounced search
let searchTimer
const debouncedLoad = () => { clearTimeout(searchTimer); searchTimer = setTimeout(loadUsers, 400) }

const loadAll = async () => {
  await Promise.all([loadStats(), loadUsers(), loadPendingDocs()])
}

const loadStats = async () => {
  try {
    const { data } = await api.get('/api/admin/stats')
    platformStats.value = data.data
  } catch (err) {
  console.error('loadStats error:', err)
}
}

const loadUsers = async () => {
  loadingUsers.value = true
  try {
    const params = { page: page.value, limit: 15 }
    if (search.value) params.search = search.value
    if (roleFilter.value) params.role = roleFilter.value
    const { data } = await api.get('/api/admin/users', { params })
    users.value = data.data
    totalUsers.value = data.total
    totalPages.value = data.pages
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to load users', position: 'top-right' })
  } finally {
    loadingUsers.value = false
  }
}

const loadPendingDocs = async () => {
  loadingPending.value = true
  try {
    const { data } = await api.get('/api/admin/doctors/pending')
    pendingDocs.value = data.data
  } catch (err) {
  console.error('loadPendingDocs error:', err)
} finally {
  loadingPending.value = false
}
}

const doToggleStatus = async (u) => {
  try {
    await api.patch(`/api/admin/users/${u.userId}/status`, { isActive: !u.isActive })
    await Promise.all([loadUsers(), loadStats()])
    $q.notify({
      icon: u.isActive ? 'do_not_disturb' : 'check_circle',
      color: u.isActive ? 'orange-9' : 'green-9',
      message: `${u.name} ${u.isActive ? 'deactivated' : 'activated'}`,
      position: 'top-right', timeout: 2000
    })
  } catch {
    $q.notify({ type: 'negative', message: 'Action failed', position: 'top-right' })
  }
}

const doDeleteUser = (u) => {
  $q.dialog({
    title: 'Delete User',
    message: `Permanently delete ${u.name} (${u.userId})? This cannot be undone.`,
    ok: { label: 'DELETE', color: 'red', flat: true },
    cancel: { label: 'CANCEL', flat: true },
    dark: true
  }).onOk(async () => {
    try {
      await api.delete(`/api/admin/users/${u.userId}`)
      await Promise.all([loadUsers(), loadStats()])
      $q.notify({ icon: 'delete', color: 'grey-7', message: `${u.name} deleted`, position: 'top-right' })
    } catch {
      $q.notify({ type: 'negative', message: 'Delete failed', position: 'top-right' })
    }
  })
}

const doVerify = async (doctorId, action, reason = '') => {
  verifyingId.value = `${doctorId}_${action}`
  try {
    await api.patch(`/api/admin/doctors/${doctorId}/verify`, { action, rejectionReason: reason })
    await Promise.all([loadPendingDocs(), loadStats()])
    $q.notify({
      icon: action === 'approve' ? 'check_circle' : 'cancel',
      color: action === 'approve' ? 'green-9' : 'red-9',
      message: action === 'approve' ? 'Doctor approved & activated' : 'Doctor registration rejected',
      position: 'top-right', timeout: 3000
    })
  } catch {
    $q.notify({ type: 'negative', message: 'Verification action failed', position: 'top-right' })
  } finally {
    verifyingId.value = ''
  }
}

const openRejectDlg = (doc) => {
  rejectDlg.doctor = doc
  rejectDlg.reason = ''
  rejectDlg.show = true
}

const confirmReject = async () => {
  if (!rejectDlg.reason.trim()) return
  await doVerify(rejectDlg.doctor.doctorId, 'reject', rejectDlg.reason)
  rejectDlg.show = false
}

const logout = () => {
  localStorage.removeItem('nexus_token')
  localStorage.removeItem('nexus_user')
  router.push('/login')
}

onMounted(() => {
  if (!token) { router.push('/login'); return }
  if (adminUser.role !== 'admin') { router.push('/'); return }
  loadAll()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700&display=swap');
.font-orbitron { font-family: 'Orbitron', sans-serif; }
.letter-spacing-3 { letter-spacing: 3px; }

/* Stats */
.stat-block {
  background: rgba(255,255,255,0.02);
  border: 1px solid;
  border-radius: 14px;
  transition: all 0.3s;
}
.stat-block:hover { transform: translateY(-2px); background: rgba(255,255,255,0.03); }

/* Tabs */
.nexus-tabs { border-bottom: 1px solid rgba(229,57,53,0.1); font-size: 0.7rem; letter-spacing: 1.5px; }

/* Panel */
.nexus-panel {
  background: rgba(6,14,16,0.7);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 18px;
  backdrop-filter: blur(12px);
}
.panel-header { display: flex; align-items: center; font-size: 0.85rem; }

/* Fields */
.field-label { font-family: 'Orbitron', sans-serif; font-size: 0.58rem; letter-spacing: 2px; color: rgba(229,57,53,0.4); }
.nexus-field :deep(.q-field__control) { border-radius: 10px; background: rgba(0,0,0,0.2); }
.nexus-field-red :deep(.q-field__control) { border-radius: 10px; background: rgba(229,57,53,0.02); }

/* User rows */
.user-row {
  background: rgba(255,255,255,0.015);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 12px;
  transition: all 0.25s;
}
.user-row:hover { border-color: rgba(229,57,53,0.15); background: rgba(229,57,53,0.02); }
.user-avatar { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); }

/* Doctor cards */
.doc-card {
  background: rgba(255,152,0,0.02);
  border: 1px solid rgba(255,152,0,0.15);
  border-radius: 16px;
  transition: all 0.3s;
}
.doc-card:hover { border-color: rgba(255,152,0,0.3); background: rgba(255,152,0,0.04); }
.doc-avatar-wrap { position: relative; display: inline-block; }
.doc-avatar { background: rgba(255,152,0,0.08); border: 1px solid rgba(255,152,0,0.2); }
.doc-pending-badge {
  position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%);
  background: rgba(255,152,0,0.9); color: #000;
  font-size: 0.45rem; letter-spacing: 1px; padding: 2px 6px;
  border-radius: 4px; white-space: nowrap;
}

/* Verify buttons */
.verify-approve-btn {
  background: linear-gradient(135deg, #1b5e20, #2e7d32, #388e3c);
  color: #fff !important; border-radius: 8px;
  font-size: 0.65rem; letter-spacing: 2px;
  box-shadow: 0 4px 15px rgba(76,175,80,0.15);
  transition: all 0.3s; padding: 8px 16px;
}
.verify-approve-btn:hover { box-shadow: 0 4px 25px rgba(76,175,80,0.3); transform: translateY(-1px); }
.verify-reject-btn { color: rgba(229,57,53,0.7) !important; font-size: 0.65rem; letter-spacing: 1.5px; border: 1px solid rgba(229,57,53,0.2); border-radius: 8px; }
.verify-reject-btn:hover { color: rgba(229,57,53,1) !important; border-color: rgba(229,57,53,0.4); }

/* Dialog */
.dialog-card {
  background: #06060a !important;
  border: 1px solid rgba(229,57,53,0.2) !important;
  border-radius: 18px !important;
}
.card-accent-bar-red { height: 3px; background: linear-gradient(90deg, transparent, #ef5350, #e53935, transparent); border-radius: 2px; }

.empty-state { display: flex; flex-direction: column; align-items: center; opacity: 0.6; }
</style>