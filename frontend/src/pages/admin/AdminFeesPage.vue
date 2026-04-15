<template>
  <q-page class="admin-page">

    <!-- ── Page Header ──────────────────────────────────────── -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Fee Management</h2>
        <p class="page-subtitle">Configure all platform fees — service, doctor consultation, and hospital fees</p>
      </div>
      <q-btn unelevated no-caps icon="refresh" label="Refresh" color="green-6" size="sm" :loading="anyLoading" @click="loadAll" />
    </div>

    <!-- ── KPI Summary Row ──────────────────────────────────── -->
    <div class="kpi-row">
      <div class="kpi-card kpi-card--green" @click="activeTab = 'service'" style="cursor:pointer">
        <div class="kpi-icon"><q-icon name="price_change" size="20px" color="white" /></div>
        <div class="kpi-content">
          <span class="kpi-value">LKR {{ serviceFee.amount?.toLocaleString() || '—' }}</span>
          <span class="kpi-label">Platform Service Fee</span>
        </div>
      </div>
      <div class="kpi-card kpi-card--blue" @click="activeTab = 'doctors'" style="cursor:pointer">
        <div class="kpi-icon kpi-icon--blue"><q-icon name="medical_services" size="20px" color="white" /></div>
        <div class="kpi-content">
          <span class="kpi-value">{{ doctorFees.length }}</span>
          <span class="kpi-label">Doctors with Fees</span>
        </div>
      </div>
      <div class="kpi-card kpi-card--red" @click="activeTab = 'hospitals'" style="cursor:pointer">
        <div class="kpi-icon kpi-icon--red"><q-icon name="local_hospital" size="20px" color="white" /></div>
        <div class="kpi-content">
          <span class="kpi-value">{{ hospitals.length }}</span>
          <span class="kpi-label">Hospitals</span>
        </div>
      </div>
      <div class="kpi-card kpi-card--teal">
        <div class="kpi-icon kpi-icon--teal"><q-icon name="calculate" size="20px" color="white" /></div>
        <div class="kpi-content">
          <span class="kpi-value">LKR {{ avgTotal.toLocaleString() }}</span>
          <span class="kpi-label">Avg. Total per Appointment</span>
        </div>
      </div>
    </div>

    <!-- ── Tabbed Fee Panel ──────────────────────────────────── -->
    <q-card class="fee-panel">

      <!-- Tab Bar -->
      <div class="tab-bar">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <div class="tab-icon-wrap" :class="`tab-icon-wrap--${tab.color}`">
            <q-icon :name="tab.icon" size="16px" color="white" />
          </div>
          <span class="tab-label">{{ tab.label }}</span>
          <span class="tab-count" v-if="tab.count !== null">{{ tab.count }}</span>
        </button>
      </div>

      <!-- ── Tab: Platform Service Fee ──────────────────────── -->
      <transition name="tab-fade" mode="out-in">
        <div v-if="activeTab === 'service'" key="service" class="tab-content">
          <q-inner-loading :showing="serviceFeeLoading" color="green-5" size="32px" />

          <div class="service-layout">
            <!-- Left: Current fee display -->
            <div class="service-current">
              <div class="service-current-inner">
                <span class="sc-label">Current Platform Service Fee</span>
                <span class="sc-amount">LKR {{ serviceFee.amount?.toLocaleString() || '—' }}</span>
                <span class="sc-desc">{{ serviceFee.description || 'Applied to every appointment' }}</span>
                <div class="sc-badge">
                  <q-icon name="info_outline" size="13px" color="green-6" />
                  This fee is added on top of doctor and hospital fees
                </div>
              </div>
            </div>

            <!-- Divider -->
            <div class="service-divider"></div>

            <!-- Right: Update form -->
            <div class="service-form">
              <p class="form-section-title">Update Service Fee</p>
              <q-input
                v-model.number="newServiceFee"
                type="number" outlined
                label="New Amount (LKR)" prefix="LKR"
                :rules="[v => v > 0 || 'Must be greater than 0']"
                class="nexus-input q-mb-md"
              />
              <q-input
                v-model="newServiceFeeDesc"
                outlined label="Description"
                class="nexus-input q-mb-lg"
              />
              <q-btn
                unelevated no-caps
                label="Save Service Fee"
                color="green-6" icon="save"
                class="full-btn"
                :loading="savingServiceFee"
                @click="updateServiceFee"
              />
            </div>
          </div>
        </div>

        <!-- ── Tab: Doctor Consultation Fees ──────────────────── -->
        <div v-else-if="activeTab === 'doctors'" key="doctors" class="tab-content">
          <q-inner-loading :showing="doctorFeesLoading" color="green-5" size="32px" />

          <div v-if="!doctorFeesLoading && doctorFees.length === 0" class="empty-state">
            <q-icon name="medical_services" size="40px" color="grey-4" />
            <p>No doctors found</p>
          </div>

          <div v-else class="fee-table">
            <div class="fee-table-header">
              <span>Doctor</span>
              <span>Specialty</span>
              <span>Doctor ID</span>
              <span class="text-right">Consultation Fee</span>
              <span></span>
            </div>
            <div v-for="doc in doctorFees" :key="doc.doctorId" class="fee-table-row">
              <div class="ft-user">
                <div class="ft-avatar-wrap">
                  <img
                    v-if="getProfileImageUrl(doc)"
                    :src="getProfileImageUrl(doc)"
                    class="ft-avatar ft-avatar--img"
                    :alt="doc.name"
                    @error="e => e.target.style.display='none'"
                  />
                  <div v-else class="ft-avatar ft-avatar--doctor">{{ getInitials(doc.name) }}</div>
                </div>
                <span class="ft-name">{{ doc.name }}</span>
              </div>
              <span class="ft-cell">{{ doc.specialty || '—' }}</span>
              <span class="ft-cell ft-cell--mono">{{ doc.doctorId }}</span>
              <div class="ft-fee-cell">
                <template v-if="editingId === doc.doctorId">
                  <q-input
                    v-model.number="editAmount"
                    type="number" outlined dense prefix="LKR"
                    style="width:130px" class="nexus-input"
                    @keyup.enter="saveDocFee(doc.doctorId)"
                    autofocus
                  />
                </template>
                <template v-else>
                  <span class="fee-badge fee-badge--blue">LKR {{ (doc.consultationFee || 0).toLocaleString() }}</span>
                </template>
              </div>
              <div class="ft-actions">
                <template v-if="editingId === doc.doctorId">
                  <q-btn flat dense round icon="check" color="green-6" size="sm" :loading="savingId === doc.doctorId" @click="saveDocFee(doc.doctorId)">
                    <q-tooltip>Save</q-tooltip>
                  </q-btn>
                  <q-btn flat dense round icon="close" color="grey-5" size="sm" @click="editingId = null">
                    <q-tooltip>Cancel</q-tooltip>
                  </q-btn>
                </template>
                <template v-else>
                  <q-btn flat dense round icon="edit" color="blue-5" size="sm" @click="startEdit(doc.doctorId, doc.consultationFee)">
                    <q-tooltip>Edit fee</q-tooltip>
                  </q-btn>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Tab: Hospital Fees ──────────────────────────────── -->
        <div v-else-if="activeTab === 'hospitals'" key="hospitals" class="tab-content">
          <div class="tab-content-header">
            <span class="tab-content-note">
              <q-icon name="info_outline" size="14px" color="blue-5" />
              Hospital fees apply to physical appointments only. To add or remove hospitals, visit the
              <router-link to="/admin/hospitals" class="inline-link">Hospitals page</router-link>.
            </span>
          </div>

          <q-inner-loading :showing="hospitalsLoading" color="green-5" size="32px" />

          <div v-if="!hospitalsLoading && hospitals.length === 0" class="empty-state">
            <q-icon name="local_hospital" size="40px" color="grey-4" />
            <p>No hospitals added yet</p>
            <router-link to="/admin/hospitals" class="empty-link">Go to Hospitals →</router-link>
          </div>

          <div v-else class="fee-table">
            <div class="fee-table-header">
              <span>Hospital</span>
              <span>Location</span>
              <span>Hospital ID</span>
              <span class="text-right">Hospital Fee</span>
              <span></span>
            </div>
            <div v-for="hosp in hospitals" :key="hosp.hospitalId" class="fee-table-row">
              <div class="ft-user">
                <div class="ft-avatar ft-avatar--hospital">
                  <q-icon name="local_hospital" size="14px" color="white" />
                </div>
                <div>
                  <span class="ft-name">{{ hosp.name }}</span>
                  <span class="ft-status" :class="hosp.isActive ? 'ft-status--active' : 'ft-status--inactive'">
                    {{ hosp.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </div>
              <span class="ft-cell">{{ hosp.location || '—' }}</span>
              <span class="ft-cell ft-cell--mono">{{ hosp.hospitalId }}</span>
              <div class="ft-fee-cell">
                <template v-if="editingHospId === hosp.hospitalId">
                  <q-input
                    v-model.number="editHospAmount"
                    type="number" outlined dense prefix="LKR"
                    style="width:130px" class="nexus-input"
                    @keyup.enter="saveHospFee(hosp.hospitalId)"
                    autofocus
                  />
                </template>
                <template v-else>
                  <span class="fee-badge fee-badge--red">LKR {{ (hosp.hospitalFee || 0).toLocaleString() }}</span>
                </template>
              </div>
              <div class="ft-actions">
                <template v-if="editingHospId === hosp.hospitalId">
                  <q-btn flat dense round icon="check" color="green-6" size="sm" :loading="savingHospId === hosp.hospitalId" @click="saveHospFee(hosp.hospitalId)">
                    <q-tooltip>Save</q-tooltip>
                  </q-btn>
                  <q-btn flat dense round icon="close" color="grey-5" size="sm" @click="editingHospId = null">
                    <q-tooltip>Cancel</q-tooltip>
                  </q-btn>
                </template>
                <template v-else>
                  <q-btn flat dense round icon="edit" color="orange-6" size="sm" @click="startHospEdit(hosp.hospitalId, hosp.hospitalFee)">
                    <q-tooltip>Edit fee</q-tooltip>
                  </q-btn>
                </template>
              </div>
            </div>
          </div>
        </div>
      </transition>

    </q-card>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { adminApi, feeApi } from '../../services/adminApi'
import { getDoctorPublicProfile } from '../../services/doctorApi'

const $q = useQuasar()

const activeTab = ref('service')

const tabs = computed(() => [
  { key: 'service',   label: 'Platform Service Fee',    icon: 'price_change',    color: 'green',  count: null },
  { key: 'doctors',   label: 'Doctor Consultation Fees', icon: 'medical_services', color: 'blue',   count: doctorFees.value.length },
  { key: 'hospitals', label: 'Hospital Fees',            icon: 'local_hospital',  color: 'red',    count: hospitals.value.length },
])

// ── Service Fee ──────────────────────────────────────────────
const serviceFeeLoading = ref(true)
const savingServiceFee  = ref(false)
const serviceFee        = ref({})
const newServiceFee     = ref(0)
const newServiceFeeDesc = ref('')

// ── Doctor Fees ──────────────────────────────────────────────
const doctorFeesLoading = ref(true)
const doctorFees        = ref([])
const editingId         = ref(null)
const editAmount        = ref(0)
const savingId          = ref(null)

// ── Hospital Fees ────────────────────────────────────────────
const hospitalsLoading = ref(true)
const hospitals        = ref([])
const editingHospId    = ref(null)
const editHospAmount   = ref(0)
const savingHospId     = ref(null)

const anyLoading = computed(() => serviceFeeLoading.value || doctorFeesLoading.value || hospitalsLoading.value)

const avgTotal = computed(() => {
  const svc = serviceFee.value.amount || 0
  const avgDoc = doctorFees.value.length
    ? Math.round(doctorFees.value.reduce((a, d) => a + (d.consultationFee || 0), 0) / doctorFees.value.length)
    : 0
  return svc + avgDoc
})

const getInitials = (n = '') => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

const getProfileImageUrl = (doc) => {
  const img = doc?.profileImage
  if (!img) return null
  if (typeof img === 'string' && img.trim()) return img
  if (img?.url && img.url.trim()) return img.url
  return null
}

// ── Load ─────────────────────────────────────────────────────
async function loadAll() {
  await Promise.allSettled([loadServiceFee(), loadDoctorFees(), loadHospitals()])
}

async function loadServiceFee() {
  serviceFeeLoading.value = true
  try {
    const { data } = await feeApi.getServiceFee()
    serviceFee.value = data.data || {}
    newServiceFee.value = serviceFee.value.amount || 500
    newServiceFeeDesc.value = serviceFee.value.description || 'Platform service fee'
  } catch { /* silent */ }
  finally { serviceFeeLoading.value = false }
}

async function loadDoctorFees() {
  doctorFeesLoading.value = true
  try {
    const { data } = await adminApi.getAllDoctorFees()
    const fees = data.data || []

    // Batch-fetch MS2 profile images in parallel
    const imageResults = await Promise.allSettled(
      fees.map(d => getDoctorPublicProfile(d.doctorId))
    )
    doctorFees.value = fees.map((d, i) => {
      const ms2 = imageResults[i].status === 'fulfilled' ? imageResults[i].value : null
      return { ...d, profileImage: ms2?.profileImage || null }
    })
  } catch { doctorFees.value = [] }
  finally { doctorFeesLoading.value = false }
}

async function loadHospitals() {
  hospitalsLoading.value = true
  try {
    const { data } = await feeApi.getHospitals()
    hospitals.value = data.data || []
  } catch { hospitals.value = [] }
  finally { hospitalsLoading.value = false }
}

// ── Service Fee ──────────────────────────────────────────────
async function updateServiceFee() {
  if (!newServiceFee.value || newServiceFee.value <= 0) {
    $q.notify({ type: 'warning', message: 'Fee must be greater than 0', position: 'top-right' }); return
  }
  savingServiceFee.value = true
  try {
    await feeApi.updateServiceFee(newServiceFee.value, newServiceFeeDesc.value)
    $q.notify({ type: 'positive', message: 'Service fee updated', position: 'top-right', icon: 'check_circle' })
    await loadServiceFee()
  } catch (err) {
    $q.notify({ type: 'negative', message: err.response?.data?.message || 'Failed', position: 'top-right' })
  } finally { savingServiceFee.value = false }
}

// ── Doctor Fees ──────────────────────────────────────────────
function startEdit(id, fee) { editingId.value = id; editAmount.value = fee || 0 }

async function saveDocFee(doctorId) {
  savingId.value = doctorId
  try {
    await adminApi.updateDoctorFee(doctorId, editAmount.value)
    $q.notify({ type: 'positive', message: 'Doctor fee updated', position: 'top-right' })
    editingId.value = null
    await loadDoctorFees()
  } catch (err) {
    $q.notify({ type: 'negative', message: err.response?.data?.message || 'Failed', position: 'top-right' })
  } finally { savingId.value = null }
}

// ── Hospital Fees ────────────────────────────────────────────
function startHospEdit(id, fee) { editingHospId.value = id; editHospAmount.value = fee || 0 }

async function saveHospFee(hospitalId) {
  savingHospId.value = hospitalId
  try {
    await feeApi.updateHospital(hospitalId, { hospitalFee: editHospAmount.value })
    $q.notify({ type: 'positive', message: 'Hospital fee updated', position: 'top-right' })
    editingHospId.value = null
    await loadHospitals()
  } catch (err) {
    $q.notify({ type: 'negative', message: err.response?.data?.message || 'Failed', position: 'top-right' })
  } finally { savingHospId.value = null }
}

onMounted(loadAll)
</script>

<style lang="scss" scoped>
.admin-page { padding: 28px 28px 48px; }

.page-header {
  display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;
  .page-title    { font-family: 'Poppins', sans-serif; font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 4px; }
  .page-subtitle { font-size: 13px; color: #64748b; margin: 0; }
}

/* ── KPI Row ─────────────────────────────────────────────── */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 20px;
  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
}

.kpi-card {
  background: #fff; border-radius: 12px; border: 1px solid #eef0f4;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05); padding: 16px 18px;
  display: flex; align-items: center; gap: 14px;
  transition: transform 0.15s, box-shadow 0.15s;
  &:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }

  &--green { border-left: 3px solid #10b981; .kpi-icon { background: linear-gradient(135deg,#10b981,#059669); } }
  &--blue  { border-left: 3px solid #3b82f6; }
  &--red   { border-left: 3px solid #ef4444; }
  &--teal  { border-left: 3px solid #0d9488; }
}

.kpi-icon {
  width: 42px; height: 42px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  background: linear-gradient(135deg, #10b981, #059669);
  &--blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
  &--red  { background: linear-gradient(135deg, #ef4444, #dc2626); }
  &--teal { background: linear-gradient(135deg, #0d9488, #0f766e); }
}

.kpi-content {
  display: flex; flex-direction: column;
  .kpi-value { font-size: 18px; font-weight: 800; color: #0f172a; font-family: 'Poppins', sans-serif; line-height: 1.1; }
  .kpi-label { font-size: 11px; color: #64748b; margin-top: 3px; }
}

/* ── Fee Panel ───────────────────────────────────────────── */
.fee-panel {
  border-radius: 14px;
  border: 1px solid #eef0f4;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  overflow: hidden;
}

/* ── Tab Bar ─────────────────────────────────────────────── */
.tab-bar {
  display: flex;
  border-bottom: 1px solid #eef0f4;
  background: #f8fafc;
  padding: 0 4px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all 0.18s;
  white-space: nowrap;

  &:hover { color: #0f172a; background: rgba(0,0,0,0.02); }

  &--active {
    color: #0f172a;
    font-weight: 700;
    border-bottom-color: #10b981;
    background: #ffffff;
  }
}

.tab-icon-wrap {
  width: 26px; height: 26px;
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;

  &--green  { background: linear-gradient(135deg, #10b981, #059669); }
  &--blue   { background: linear-gradient(135deg, #3b82f6, #2563eb); }
  &--red    { background: linear-gradient(135deg, #ef4444, #dc2626); }
}

.tab-label { flex: 1; }

.tab-count {
  background: #f0f4f8;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 20px;
  min-width: 22px;
  text-align: center;

  .tab-btn--active & { background: #dcfce7; color: #16a34a; }
}

/* ── Tab Content ─────────────────────────────────────────── */
.tab-content {
  padding: 28px;
  min-height: 320px;
  position: relative;
}

.tab-content-header {
  margin-bottom: 20px;
}

.tab-content-note {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  color: #475569;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 8px 14px;
}

.inline-link { color: #2563eb; font-weight: 600; text-decoration: none; &:hover { text-decoration: underline; } }

/* ── Service Fee Tab ─────────────────────────────────────── */
.service-layout {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 0;
  align-items: start;

  @media (max-width: 700px) { grid-template-columns: 1fr; }
}

.service-current {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 32px;
}

.service-current-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  .sc-label  { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 8px; }
  .sc-amount { font-size: 52px; font-weight: 800; color: #0f172a; font-family: 'Poppins', sans-serif; line-height: 1; margin-bottom: 8px; }
  .sc-desc   { font-size: 13px; color: #64748b; margin-bottom: 16px; }
}

.sc-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 7px 12px;
  font-size: 12px;
  color: #16a34a;
}

.service-divider {
  width: 1px;
  background: #eef0f4;
  margin: 0 8px;
  align-self: stretch;

  @media (max-width: 700px) { display: none; }
}

.service-form {
  padding: 20px 32px;

  .form-section-title { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 16px; }
}

.full-btn { width: 100%; height: 42px; border-radius: 9px; font-weight: 600; }

/* ── Fee Table ───────────────────────────────────────────── */
.fee-table { width: 100%; }

.fee-table-header {
  display: grid;
  grid-template-columns: 2fr 1.2fr 1.2fr 1.4fr 80px;
  gap: 0;
  padding: 10px 16px;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 4px;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.fee-table-row {
  display: grid;
  grid-template-columns: 2fr 1.2fr 1.2fr 1.4fr 80px;
  gap: 0;
  align-items: center;
  padding: 10px 16px;
  border-radius: 8px;
  transition: background 0.12s;

  &:hover { background: #f8fafc; }
}

.ft-user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ft-avatar-wrap { position: relative; flex-shrink: 0; }

.ft-avatar {
  width: 34px; height: 34px;
  border-radius: 8px;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;

  &--doctor  { background: linear-gradient(135deg, #0a1628, #1e3a5f); }
  &--hospital { background: linear-gradient(135deg, #ef4444, #dc2626); }
  &--img { object-fit: cover; background: #f0f4f8; }
}

.ft-name { font-size: 13px; font-weight: 600; color: #0f172a; }

.ft-status {
  display: block;
  font-size: 10px;
  font-weight: 600;
  margin-top: 1px;

  &--active   { color: #16a34a; }
  &--inactive { color: #dc2626; }
}

.ft-cell {
  font-size: 13px;
  color: #475569;

  &--mono { font-family: monospace; font-size: 12px; color: #64748b; }
}

.ft-fee-cell {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.ft-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
}

.fee-badge {
  font-size: 12px; font-weight: 700;
  padding: 4px 12px; border-radius: 20px;

  &--blue { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
  &--red  { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
}

/* ── Empty State ─────────────────────────────────────────── */
.empty-state {
  display: flex; flex-direction: column; align-items: center; padding: 48px; color: #94a3b8;
  p { margin: 10px 0 6px; font-size: 14px; }
}

.empty-link { font-size: 13px; color: #10b981; text-decoration: none; font-weight: 600; &:hover { text-decoration: underline; } }

/* ── Tab Transition ──────────────────────────────────────── */
.tab-fade-enter-active,
.tab-fade-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.tab-fade-enter-from   { opacity: 0; transform: translateY(6px); }
.tab-fade-leave-to     { opacity: 0; transform: translateY(-4px); }

.nexus-input :deep(.q-field__control) { border-radius: 8px; }
</style>
