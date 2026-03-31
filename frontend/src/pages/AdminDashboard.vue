<template>
  <q-page class="q-pa-lg admin-dash">

    <!-- Header -->
    <div class="row items-start justify-between q-mb-xl">
      <div>
        <div class="font-sora text-blue-7 text-caption uppercase letter-spacing-2 q-mb-xs">
          ◈ ADMINISTRATOR CONTROL NODE
        </div>
        <h1 class="text-h4 text-white font-sora q-ma-none q-mb-xs">
          System <span class="text-blue-4">Control</span>
        </h1>
        <div class="row items-center q-gutter-sm">
          <q-chip dense dark color="blue-10" class="font-sora text-caption">
            {{ adminUser.userId }}
          </q-chip>
          <q-chip dense dark color="grey-9" class="font-sora text-caption">
            {{ adminUser.name }}
          </q-chip>
        </div>
      </div>

      <div class="row items-center q-gutter-sm">
        <q-btn flat round icon="refresh" color="grey-6" size="sm" @click="loadAll">
          <q-tooltip class="font-sora bg-dark">Refresh all</q-tooltip>
        </q-btn>
        <q-btn flat round icon="logout" color="red-4" size="sm" @click="logout">
          <q-tooltip class="font-sora bg-dark text-red-4">Logout</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- ── Platform Stats ───────────────────────────────────────── -->
    <div class="row q-col-gutter-md q-mb-xl">
      <div v-for="s in statsCards" :key="s.label" class="col-6 col-sm-4 col-md-2">
        <div class="stat-block q-pa-md" :style="{ borderColor: s.border }">
          <div class="stat-icon q-mb-xs">
            <q-icon :name="s.icon" :color="s.color" size="1.4rem" />
          </div>
          <div class="text-h4 text-white font-sora">{{ s.value }}</div>
          <div class="font-sora text-caption q-mt-xs" :class="`text-${s.color}`" style="font-size:0.58rem;letter-spacing:2px">
            {{ s.label }}
          </div>
        </div>
      </div>
    </div>

    <!-- ── Revenue Summary Cards ────────────────────────────────── -->
    <div class="row q-col-gutter-md q-mb-xl">
      <div class="col-12 col-md-4">
        <div class="revenue-card q-pa-lg">
          <div class="row items-center q-mb-md">
            <q-icon name="payments" color="green-4" size="1.6rem" class="q-mr-sm" />
            <span class="font-sora text-grey-5 text-caption uppercase" style="letter-spacing:1.5px">Total Revenue</span>
          </div>
          <div class="text-h4 text-white font-sora">
            LKR {{ formatAmount(paymentStats.revenue?.totalRevenue) }}
          </div>
          <div class="text-grey-7 text-caption font-sora q-mt-xs">
            From {{ paymentStats.revenue?.totalTransactions || 0 }} successful payments
          </div>
        </div>
      </div>

      <div class="col-12 col-md-4">
        <div class="revenue-card q-pa-lg">
          <div class="row items-center q-mb-md">
            <q-icon name="trending_up" color="blue-4" size="1.6rem" class="q-mr-sm" />
            <span class="font-sora text-grey-5 text-caption uppercase" style="letter-spacing:1.5px">Avg. per Consult</span>
          </div>
          <div class="text-h4 text-white font-sora">
            LKR {{ formatAmount(paymentStats.revenue?.avgAmount) }}
          </div>
          <div class="text-grey-7 text-caption font-sora q-mt-xs">Average consultation fee paid</div>
        </div>
      </div>

      <div class="col-12 col-md-4">
        <div class="revenue-card q-pa-lg">
          <div class="row items-center q-mb-md">
            <q-icon name="hourglass_empty" color="amber-4" size="1.6rem" class="q-mr-sm" />
            <span class="font-sora text-grey-5 text-caption uppercase" style="letter-spacing:1.5px">Pending Payments</span>
          </div>
          <div class="text-h4 text-white font-sora">
            {{ paymentStats.byStatus?.pending?.count || 0 }}
          </div>
          <div class="text-grey-7 text-caption font-sora q-mt-xs">
            LKR {{ formatAmount(paymentStats.byStatus?.pending?.total) }} in transit
          </div>
        </div>
      </div>
    </div>

    <!-- ── Tabs ──────────────────────────────────────────────────── -->
    <q-tabs
      v-model="tab" dense align="left"
      class="nexus-tabs font-sora q-mb-lg"
      active-color="blue-4" indicator-color="blue-4"
    >
      <q-tab name="users" label="USER REGISTRY" icon="group" />
      <q-tab name="pending" label="PENDING VERIFICATION" icon="pending_actions">
        <q-badge v-if="pendingDocs.length" color="orange-8" floating class="font-sora" style="font-size:0.5rem">
          {{ pendingDocs.length }}
        </q-badge>
      </q-tab>
      <q-tab name="payments" label="PAYMENTS" icon="receipt_long">
        <q-badge v-if="(paymentStats.byStatus?.pending?.count || 0) > 0" color="amber-8" floating class="font-sora" style="font-size:0.5rem">
          {{ paymentStats.byStatus?.pending?.count }}
        </q-badge>
      </q-tab>
    </q-tabs>

    <q-tab-panels v-model="tab" animated transition-prev="fade" transition-next="fade" class="bg-transparent">

      <!-- ══ USER REGISTRY ════════════════════════════════════════ -->
      <q-tab-panel name="users" class="q-pa-none">
        <div class="nexus-panel q-pa-xl">

          <div class="row q-col-gutter-md items-center q-mb-lg">
            <div class="col-12 col-sm-5">
              <q-input
                v-model="search" placeholder="Search by name, email or ID..."
                dark outlined color="blue-4" dense class="nexus-field-blue"
                @update:model-value="debouncedLoad"
              >
                <template #prepend><q-icon name="search" size="xs" color="blue-8" /></template>
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
                dark outlined color="blue-4" dense class="nexus-field-blue"
                behavior="menu" :popup-content-style="ddStyle"
                @update:model-value="loadUsers"
              />
            </div>

            <div class="col-auto">
              <q-chip dark color="grey-9" class="font-sora text-caption">
                {{ totalUsers }} TOTAL
              </q-chip>
            </div>
          </div>

          <div v-if="loadingUsers" class="q-gutter-y-sm">
            <q-skeleton v-for="i in 5" :key="i" type="rect" dark height="60px" class="rounded-borders" />
          </div>

          <div v-else class="q-gutter-y-sm">
            <div v-for="u in users" :key="u._id" class="user-row q-pa-md row items-center">

              <div class="row items-center col-12 col-md-4">
                <q-avatar size="38px" class="user-avatar q-mr-md">
                  <q-icon :name="roleIcon(u.role)" :color="roleColor(u.role)" size="1.3rem" />
                </q-avatar>
                <div>
                  <div class="text-white font-sora text-subtitle2">{{ u.name }}</div>
                  <div class="text-grey-6 text-caption">{{ u.email }}</div>
                </div>
              </div>

              <div class="col-12 col-md-3 q-mt-sm q-mt-md-none">
                <q-chip dense dark :color="roleChipColor(u.role)" class="font-sora" style="font-size:0.55rem">
                  {{ u.userId }}
                </q-chip>
                <q-chip v-if="u.roleId" dense dark color="grey-9" class="font-sora q-ml-xs" style="font-size:0.55rem">
                  {{ u.roleId }}
                </q-chip>
              </div>

              <div class="col-auto q-mx-md">
                <q-badge
                  :color="u.isActive ? 'green-9' : 'red-9'"
                  class="font-sora q-pa-xs"
                  style="font-size:0.55rem;letter-spacing:1px"
                >
                  {{ u.isActive ? '● ACTIVE' : '○ INACTIVE' }}
                </q-badge>
              </div>

              <div class="col text-grey-7 text-caption font-sora" style="font-size:0.6rem">
                {{ new Date(u.createdAt).toLocaleDateString('en-GB') }}
              </div>

              <div class="col-auto row q-gutter-xs">
                <q-btn
                  flat round dense size="sm"
                  :icon="u.isActive ? 'do_not_disturb' : 'check_circle'"
                  :color="u.isActive ? 'orange-5' : 'green-5'"
                  @click="doToggleStatus(u)"
                >
                  <q-tooltip class="font-sora bg-dark">{{ u.isActive ? 'Deactivate' : 'Activate' }}</q-tooltip>
                </q-btn>
                <q-btn flat round dense size="sm" icon="delete_outline" color="red-5" @click="doDeleteUser(u)">
                  <q-tooltip class="font-sora bg-dark">Delete user</q-tooltip>
                </q-btn>
              </div>
            </div>

            <div v-if="users.length === 0" class="empty-state q-pa-xl">
              <q-icon name="group_off" size="4rem" color="grey-9" />
              <div class="font-sora text-grey-8 q-mt-md">NO USERS FOUND</div>
            </div>
          </div>

          <div v-if="totalPages > 1" class="row justify-center q-mt-lg">
            <q-pagination v-model="page" :max="totalPages" dark color="blue-4" @update:model-value="loadUsers" />
          </div>
        </div>
      </q-tab-panel>

      <!-- ══ PENDING VERIFICATION ══════════════════════════════════ -->
      <q-tab-panel name="pending" class="q-pa-none">
        <div class="nexus-panel q-pa-xl">
          <div class="panel-header q-mb-xl">
            <q-icon name="pending_actions" color="amber-4" class="q-mr-sm" />
            <span class="font-sora text-white uppercase">Pending Doctor Verifications</span>
          </div>

          <div v-if="loadingPending" class="q-gutter-y-sm">
            <q-skeleton v-for="i in 3" :key="i" type="rect" dark height="120px" class="rounded-borders" />
          </div>

          <div v-else-if="pendingDocs.length === 0" class="empty-state q-pa-xl">
            <q-icon name="verified" size="4rem" color="green-8" />
            <div class="font-sora text-grey-7 q-mt-md">ALL DOCTORS VERIFIED</div>
            <div class="text-grey-9 text-caption q-mt-xs">No pending verification requests</div>
          </div>

          <div v-else class="q-gutter-y-md">
            <div v-for="doc in pendingDocs" :key="doc.doctorId" class="doc-card q-pa-xl">
              <div class="row items-start justify-between">
                <div class="row items-start">
                  <div class="doc-avatar-wrap q-mr-lg">
                    <q-avatar size="56px" class="doc-avatar">
                      <q-icon name="medical_services" color="orange-4" size="2rem" />
                    </q-avatar>
                    <div class="doc-pending-badge font-sora">PENDING</div>
                  </div>

                  <div>
                    <div class="text-h6 text-white font-sora q-mb-xs">{{ doc.name }}</div>
                    <div class="text-grey-5 text-caption q-mb-sm">{{ doc.email }}</div>

                    <div class="row q-gutter-xs q-mb-sm flex-wrap">
                      <q-chip dense dark color="cyan-10" class="font-sora" style="font-size:0.55rem">
                        {{ doc.doctorId }}
                      </q-chip>
                      <q-chip dense dark color="deep-orange-10" class="font-sora" style="font-size:0.55rem">
                        {{ doc.specialty }}
                      </q-chip>
                      <q-chip v-if="doc.hospital" dense dark color="grey-9" style="font-size:0.55rem">
                        {{ doc.hospital }}
                      </q-chip>
                    </div>

                    <div class="row q-gutter-md text-caption">
                      <div>
                        <span class="text-grey-7 font-sora" style="font-size:0.58rem">SLMC: </span>
                        <span class="text-cyan-6 font-sora">{{ doc.registrationNumber }}</span>
                      </div>
                      <div v-if="doc.qualifications?.length">
                        <span class="text-grey-7 font-sora" style="font-size:0.58rem">QUALS: </span>
                        <span class="text-grey-4">{{ doc.qualifications.join(', ') }}</span>
                      </div>
                    </div>

                    <div class="text-grey-8 font-sora q-mt-xs" style="font-size:0.58rem;letter-spacing:1px">
                      APPLIED {{ new Date(doc.createdAt).toLocaleDateString('en-GB') }}
                    </div>
                  </div>
                </div>

                <div class="column q-gutter-sm q-mt-sm">
                  <q-btn
                    class="verify-approve-btn font-sora"
                    icon="check_circle" label="APPROVE"
                    :loading="verifyingId === doc.doctorId + '_approve'"
                    @click="doVerify(doc.doctorId, 'approve')"
                  />
                  <q-btn
                    flat class="verify-reject-btn font-sora"
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
            <div class="card-accent-bar q-mb-lg"></div>
            <div class="font-sora text-white uppercase q-mb-xs">Reject Doctor Registration</div>
            <div class="text-grey-6 text-caption q-mb-lg">
              Rejecting: <span class="text-orange-4 font-sora">{{ rejectDlg.doctor?.name }}</span> ({{ rejectDlg.doctor?.doctorId }})
            </div>

            <div class="field-label q-mb-xs">REJECTION REASON *</div>
            <q-input
              v-model="rejectDlg.reason"
              type="textarea" rows="3"
              placeholder="Provide a clear reason for rejection..."
              dark outlined color="blue-4" class="nexus-field q-mb-lg"
            />

            <div class="row q-gutter-sm justify-end">
              <q-btn flat label="CANCEL" color="grey-6" class="font-sora" v-close-popup />
              <q-btn
                label="CONFIRM REJECT" color="red-9" class="font-sora"
                :loading="verifyingId === rejectDlg.doctor?.doctorId + '_reject'"
                :disable="!rejectDlg.reason"
                @click="confirmReject"
              />
            </div>
          </q-card>
        </q-dialog>
      </q-tab-panel>

      <!-- ══ PAYMENTS TAB ══════════════════════════════════════════ -->
      <q-tab-panel name="payments" class="q-pa-none">
        <div class="nexus-panel q-pa-xl">

          <div class="panel-header q-mb-xl">
            <q-icon name="receipt_long" color="blue-4" class="q-mr-sm" />
            <span class="font-sora text-white uppercase">Financial Transactions</span>
            <q-space />
            <!-- Status filter -->
            <q-select
              v-model="paymentStatusFilter"
              :options="paymentStatusOptions"
              option-label="label" option-value="value"
              emit-value map-options
              dark outlined color="blue-4" dense class="nexus-field-blue"
              style="min-width:160px"
              behavior="menu" :popup-content-style="ddStyle"
              @update:model-value="loadPayments"
            />
          </div>

          <!-- Loading -->
          <div v-if="loadingPayments" class="q-gutter-y-sm">
            <q-skeleton v-for="i in 5" :key="i" type="rect" dark height="68px" class="rounded-borders" />
          </div>

          <!-- Empty -->
          <div v-else-if="allPayments.length === 0" class="empty-state q-pa-xl">
            <q-icon name="payments" size="4rem" color="grey-9" />
            <div class="font-sora text-grey-8 q-mt-md">NO TRANSACTIONS FOUND</div>
          </div>

          <!-- Payment rows -->
          <div v-else class="q-gutter-y-sm">
            <div
              v-for="p in allPayments" :key="p._id"
              class="payment-row-admin q-pa-md row items-center"
            >
              <!-- Status icon -->
              <div class="col-auto q-mr-md">
                <div class="pay-status-icon" :class="`pstatus-${p.status}`">
                  <q-icon :name="payStatusIcon(p.status)" size="1.2rem" :color="payStatusColor(p.status)" />
                </div>
              </div>

              <!-- Patient -->
              <div class="col-12 col-md-3">
                <div class="text-white font-sora text-caption" style="font-weight:600">{{ p.patientName }}</div>
                <div class="text-grey-7 font-sora" style="font-size:0.6rem;letter-spacing:0.5px">{{ p.patientEmail }}</div>
              </div>

              <!-- Doctor -->
              <div class="col-12 col-md-2 q-mt-xs q-mt-md-none">
                <div class="text-blue-5 font-sora text-caption">Dr. {{ p.doctorName || '—' }}</div>
                <div class="text-grey-8 font-sora" style="font-size:0.58rem">{{ p.doctorId }}</div>
              </div>

              <!-- Order ID -->
              <div class="col-12 col-md-2 q-mt-xs q-mt-md-none">
                <div class="text-grey-6 font-sora" style="font-size:0.58rem;letter-spacing:0.5px">{{ p.orderId }}</div>
              </div>

              <!-- Amount -->
              <div class="col-auto q-mx-md">
                <div class="font-sora text-white" style="font-size:1rem;font-weight:700">
                  LKR {{ formatAmount(p.amount) }}
                </div>
              </div>

              <!-- Status badge -->
              <div class="col-auto q-mr-md">
                <q-badge
                  :color="payStatusBadge(p.status)"
                  class="font-sora q-pa-xs"
                  style="font-size:0.55rem;letter-spacing:1.5px"
                >
                  {{ p.status.toUpperCase() }}
                </q-badge>
              </div>

              <!-- Date -->
              <div class="col text-grey-7 text-caption font-sora" style="font-size:0.58rem">
                {{ formatDate(p.createdAt) }}
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="paymentTotalPages > 1" class="row justify-center q-mt-lg">
            <q-pagination v-model="paymentPage" :max="paymentTotalPages" dark color="blue-4" @update:model-value="loadPayments" />
          </div>

        </div>
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

// User registry state
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

// Payments state
const allPayments = ref([])
const paymentStats = ref({ revenue: {}, byStatus: {} })
const loadingPayments = ref(false)
const paymentStatusFilter = ref('')
const paymentPage = ref(1)
const paymentTotalPages = ref(1)

const ddStyle = {
  backgroundColor: 'rgba(7,15,32,0.96)',
  border: '1px solid rgba(59,130,246,0.28)',
  boxShadow: '0 16px 36px rgba(2,6,23,0.75)',
  zIndex: 9999
}

const roleOptions = [
  { label: 'ALL ROLES', value: '' },
  { label: 'PATIENTS', value: 'patient' },
  { label: 'DOCTORS', value: 'doctor' },
  { label: 'ADMINS', value: 'admin' }
]

const paymentStatusOptions = [
  { label: 'ALL STATUS', value: '' },
  { label: 'SUCCESS', value: 'success' },
  { label: 'PENDING', value: 'pending' },
  { label: 'FAILED', value: 'failed' },
  { label: 'CANCELLED', value: 'cancelled' },
]

// API clients
const api = axios.create({
  baseURL: 'http://localhost:5001',
  headers: { Authorization: `Bearer ${token}` }
})

const paymentApi = axios.create({
  baseURL: 'http://localhost:5009',
  headers: { Authorization: `Bearer ${token}` }
})

// ── Stats cards ───────────────────────────────────────────────────
const statsCards = computed(() => {
  const s = platformStats.value
  return [
    { label: 'TOTAL USERS',  value: s.totalUsers      || 0, icon: 'group',           color: 'white',    border: 'rgba(255,255,255,0.08)' },
    { label: 'PATIENTS',     value: s.totalPatients   || 0, icon: 'person',           color: 'cyan-4',   border: 'rgba(0,229,255,0.2)' },
    { label: 'DOCTORS',      value: s.totalDoctors    || 0, icon: 'medical_services', color: 'blue-4',   border: 'rgba(33,150,243,0.2)' },
    { label: 'VERIFIED',     value: s.verifiedDoctors || 0, icon: 'verified',         color: 'green-4',  border: 'rgba(76,175,80,0.2)' },
    { label: 'PENDING',      value: s.pendingDoctors  || 0, icon: 'pending',          color: 'orange-4', border: 'rgba(255,152,0,0.2)' },
    { label: 'ACTIVE',       value: s.activeUsers     || 0, icon: 'check_circle',     color: 'green-6',  border: 'rgba(76,175,80,0.15)' }
  ]
})

// ── Helpers ───────────────────────────────────────────────────────
const roleIcon      = (r) => ({ patient: 'person', doctor: 'medical_services', admin: 'shield' }[r] || 'person')
const roleColor     = (r) => ({ patient: 'cyan-4', doctor: 'blue-4', admin: 'red-4' }[r] || 'grey-4')
const roleChipColor = (r) => ({ patient: 'cyan-10', doctor: 'blue-10', admin: 'red-10' }[r] || 'grey-9')

const formatAmount = (amt) =>
  parseFloat(amt || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

const payStatusIcon  = (s) => ({ success: 'check_circle', pending: 'hourglass_empty', failed: 'cancel', cancelled: 'do_not_disturb', chargedback: 'warning' }[s] || 'help')
const payStatusColor = (s) => ({ success: 'green-4', pending: 'amber-4', failed: 'red-4', cancelled: 'grey-5', chargedback: 'orange-4' }[s] || 'grey-5')
const payStatusBadge = (s) => ({ success: 'green-9', pending: 'amber-9', failed: 'red-9', cancelled: 'grey-8', chargedback: 'orange-9' }[s] || 'grey-8')

// Debounced search
let searchTimer
const debouncedLoad = () => { clearTimeout(searchTimer); searchTimer = setTimeout(loadUsers, 400) }

// ── Load functions ────────────────────────────────────────────────
const loadAll = async () => {
  await Promise.all([loadStats(), loadUsers(), loadPendingDocs(), loadPaymentStats(), loadPayments()])
}

const loadStats = async () => {
  try {
    const { data } = await api.get('/api/admin/stats')
    platformStats.value = data.data
  } catch (err) { console.error('loadStats:', err) }
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
  } catch (err) { console.error('loadPendingDocs:', err) }
  finally { loadingPending.value = false }
}

const loadPaymentStats = async () => {
  try {
    const { data } = await paymentApi.get('/api/payments/admin/stats')
    paymentStats.value = data.data
  } catch (err) { console.error('loadPaymentStats:', err) }
}

const loadPayments = async () => {
  loadingPayments.value = true
  try {
    const params = { page: paymentPage.value, limit: 20 }
    if (paymentStatusFilter.value) params.status = paymentStatusFilter.value
    const { data } = await paymentApi.get('/api/payments/admin/all', { params })
    allPayments.value = data.data
    paymentTotalPages.value = data.pages
  } catch (err) {
    console.error('loadPayments:', err)
    $q.notify({ type: 'negative', message: 'Failed to load payment records', position: 'top-right' })
  } finally {
    loadingPayments.value = false
  }
}

// ── User actions ──────────────────────────────────────────────────
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

// ── Doctor verify ─────────────────────────────────────────────────
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
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');

.font-sora { font-family: 'Sora', sans-serif; }
.letter-spacing-2 { letter-spacing: 2px; }

.admin-dash {
  min-height: 100vh;
  background:
    radial-gradient(circle at 50% 16%, rgba(37,99,235,0.16), transparent 56%),
    radial-gradient(circle at 10% 84%, rgba(56,189,248,0.08), transparent 50%),
    radial-gradient(circle at 88% 78%, rgba(29,78,216,0.1), transparent 48%),
    #040812;
}

/* Stats */
.stat-block {
  background: linear-gradient(150deg, rgba(10,18,38,0.84), rgba(7,15,32,0.72));
  border: 1px solid;
  border-radius: 16px;
  box-shadow: 0 10px 28px rgba(2,6,23,0.45);
  transition: all 0.28s ease;
}
.stat-block:hover {
  transform: translateY(-3px);
  background: linear-gradient(150deg, rgba(14,25,54,0.88), rgba(7,15,32,0.76));
  box-shadow: 0 14px 34px rgba(2,6,23,0.6);
}

/* Revenue cards */
.revenue-card {
  background: linear-gradient(150deg, rgba(10,18,38,0.84), rgba(7,15,32,0.72));
  border: 1px solid rgba(59,130,246,0.18);
  border-radius: 16px;
  box-shadow: 0 10px 28px rgba(2,6,23,0.4);
  transition: all 0.28s;
  height: 100%;
}
.revenue-card:hover {
  border-color: rgba(59,130,246,0.32);
  transform: translateY(-2px);
}

/* Tabs */
.nexus-tabs {
  border-bottom: 1px solid rgba(59,130,246,0.22);
  font-size: 0.7rem;
  letter-spacing: 1.2px;
}
.nexus-tabs :deep(.q-tab) { color: rgba(203,213,225,0.72); }

/* Panel */
.nexus-panel {
  background: linear-gradient(160deg, rgba(10,18,38,0.88), rgba(7,15,32,0.76));
  border: 1px solid rgba(59,130,246,0.2);
  border-radius: 20px;
  backdrop-filter: blur(22px) saturate(130%);
  box-shadow: 0 26px 60px rgba(2,6,23,0.62), inset 0 1px 0 rgba(255,255,255,0.06);
}
.panel-header { display: flex; align-items: center; font-size: 0.9rem; }

/* Fields */
.field-label {
  font-family: 'Sora', sans-serif;
  font-size: 0.58rem; letter-spacing: 1.8px;
  color: rgba(191,219,254,0.62);
}
.nexus-field :deep(.q-field__control) {
  border-radius: 12px;
  background: rgba(15,23,42,0.52);
}
.nexus-field-blue :deep(.q-field__control) {
  border-radius: 12px;
  background: rgba(59,130,246,0.06);
  border: 1px solid rgba(59,130,246,0.18);
}

/* User rows */
.user-row {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(148,163,184,0.16);
  border-radius: 14px;
  transition: all 0.25s;
}
.user-row:hover {
  border-color: rgba(96,165,250,0.36);
  background: rgba(59,130,246,0.08);
}
.user-avatar {
  background: rgba(59,130,246,0.1);
  border: 1px solid rgba(96,165,250,0.28);
}

/* Payment rows */
.payment-row-admin {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(148,163,184,0.14);
  border-radius: 14px;
  transition: all 0.25s;
}
.payment-row-admin:hover {
  border-color: rgba(96,165,250,0.32);
  background: rgba(59,130,246,0.06);
}

/* Payment status icon */
.pay-status-icon {
  width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
}
.pstatus-success  { background: rgba(34,197,94,0.1);  border: 1px solid rgba(34,197,94,0.22); }
.pstatus-pending  { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.22); }
.pstatus-failed   { background: rgba(239,68,68,0.1);  border: 1px solid rgba(239,68,68,0.22); }
.pstatus-cancelled{ background: rgba(100,116,139,0.1);border: 1px solid rgba(100,116,139,0.2); }
.pstatus-chargedback{ background: rgba(249,115,22,0.1);border: 1px solid rgba(249,115,22,0.22); }

/* Doctor cards */
.doc-card {
  background: rgba(245,158,11,0.05);
  border: 1px solid rgba(245,158,11,0.26);
  border-radius: 18px;
  transition: all 0.3s;
}
.doc-card:hover {
  border-color: rgba(245,158,11,0.45);
  background: rgba(245,158,11,0.08);
}
.doc-avatar-wrap { position: relative; display: inline-block; }
.doc-avatar {
  background: rgba(245,158,11,0.14);
  border: 1px solid rgba(245,158,11,0.3);
}
.doc-pending-badge {
  position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%);
  background: rgba(245,158,11,0.95); color: #0b0b0b;
  font-size: 0.45rem; letter-spacing: 1px; padding: 2px 6px;
  border-radius: 4px; white-space: nowrap;
}

/* Verify buttons */
.verify-approve-btn {
  background: linear-gradient(135deg, #1d4ed8, #2563eb, #0ea5e9);
  color: #fff !important; border-radius: 10px;
  font-size: 0.65rem; letter-spacing: 1.6px;
  box-shadow: 0 8px 22px rgba(37,99,235,0.35);
  transition: all 0.28s; padding: 8px 16px;
}
.verify-approve-btn:hover { box-shadow: 0 12px 28px rgba(37,99,235,0.5); transform: translateY(-2px); }
.verify-reject-btn {
  color: rgba(248,113,113,0.95) !important;
  font-size: 0.65rem; letter-spacing: 1.4px;
  border: 1px solid rgba(248,113,113,0.35);
  border-radius: 10px;
  background: rgba(239,68,68,0.06);
}
.verify-reject-btn:hover {
  color: rgba(254,202,202,1) !important;
  border-color: rgba(248,113,113,0.6);
  background: rgba(239,68,68,0.14);
}

/* Dialog */
.dialog-card {
  background: linear-gradient(160deg, rgba(10,18,38,0.94), rgba(7,15,32,0.9)) !important;
  border: 1px solid rgba(59,130,246,0.24) !important;
  border-radius: 18px !important;
  box-shadow: 0 24px 56px rgba(2,6,23,0.7);
}
.card-accent-bar {
  height: 3px;
  background: linear-gradient(90deg, transparent, #2563eb, #38bdf8, transparent);
  border-radius: 2px;
}

.empty-state {
  display: flex; flex-direction: column; align-items: center; opacity: 0.72;
}

@media (max-width: 760px) {
  .admin-dash { padding: 16px !important; }
  .nexus-panel { padding: 16px !important; }
}
</style>