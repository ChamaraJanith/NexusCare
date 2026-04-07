<template>
  <q-page class="admin-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">Fee Management</h2>
        <p class="page-subtitle">Configure service fees, hospital fees, and doctor consultation fees</p>
      </div>
    </div>

    <div class="fee-grid">

      <!-- ── Service Fee ──────────────────────────────────────── -->
      <q-card class="fee-card">
        <q-card-section class="fee-card-header">
          <div class="fee-card-title">
            <q-icon name="price_change" size="20px" color="green-6" class="q-mr-sm" />
            Platform Service Fee
          </div>
          <q-badge label="Global" color="green-6" />
        </q-card-section>

        <q-card-section>
          <q-inner-loading :showing="serviceFeeLoading" color="green-6" />

          <div class="current-fee-display">
            <span class="fee-label">Current Service Fee</span>
            <span class="fee-amount">LKR {{ serviceFee.amount?.toLocaleString() || '—' }}</span>
            <span class="fee-desc">{{ serviceFee.description || '' }}</span>
          </div>

          <q-separator class="q-my-md" />

          <div class="fee-edit-form">
            <q-input
              v-model.number="newServiceFee"
              type="number"
              outlined
              label="New Service Fee (LKR)"
              prefix="LKR"
              :rules="[val => val > 0 || 'Fee must be greater than 0']"
              class="fee-input"
            />
            <q-input
              v-model="newServiceFeeDesc"
              outlined
              label="Description"
              class="fee-input q-mt-sm"
            />
            <q-btn
              unelevated no-caps
              label="Update Service Fee"
              color="green-6"
              icon="save"
              class="save-btn q-mt-md"
              :loading="savingServiceFee"
              @click="updateServiceFee"
            />
          </div>
        </q-card-section>
      </q-card>

      <!-- ── Doctor Fees ──────────────────────────────────────── -->
      <q-card class="fee-card">
        <q-card-section class="fee-card-header">
          <div class="fee-card-title">
            <q-icon name="medical_services" size="20px" color="blue-6" class="q-mr-sm" />
            Doctor Consultation Fees
          </div>
        </q-card-section>

        <q-card-section class="q-pa-none">
          <q-inner-loading :showing="doctorFeesLoading" color="green-6" />

          <q-list separator>
            <q-item v-for="doc in doctorFees" :key="doc.doctorId" class="fee-list-item">
              <q-item-section avatar>
                <q-avatar size="36px" style="background:linear-gradient(135deg,#0d1b2a,#1e3a5f);color:#fff;font-weight:700;font-size:13px;border-radius:8px;">
                  {{ getInitials(doc.name) }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="item-name">{{ doc.name }}</q-item-label>
                <q-item-label caption>{{ doc.specialty }} · {{ doc.doctorId }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="inline-fee-edit" v-if="editingFeeId === doc.doctorId">
                  <q-input
                    v-model.number="editFeeAmount"
                    type="number"
                    outlined dense
                    prefix="LKR"
                    style="width: 130px"
                  />
                  <q-btn flat dense icon="check" color="green-6" :loading="savingFeeId === doc.doctorId" @click="saveDoctorFee(doc.doctorId)" />
                  <q-btn flat dense icon="close" color="grey-5" @click="editingFeeId = null" />
                </div>
                <div v-else class="fee-display-row">
                  <span class="fee-badge">LKR {{ doc.consultationFee?.toLocaleString() || 0 }}</span>
                  <q-btn flat dense size="sm" icon="edit" color="blue-5" @click="startEditFee(doc)" />
                </div>
              </q-item-section>
            </q-item>
          </q-list>

          <div v-if="!doctorFeesLoading && doctorFees.length === 0" class="empty-state">
            <p>No doctors found.</p>
          </div>
        </q-card-section>
      </q-card>

    </div>

    <!-- ── Hospitals ──────────────────────────────────────────── -->
    <q-card class="fee-card q-mt-lg">
      <q-card-section class="fee-card-header">
        <div class="fee-card-title">
          <q-icon name="local_hospital" size="20px" color="red-5" class="q-mr-sm" />
          Hospital Fee Management
        </div>
        <q-btn unelevated no-caps icon="add" label="Add Hospital" color="green-6" size="sm" @click="openHospitalDialog(null)" />
      </q-card-section>

      <q-card-section class="q-pa-none">
        <q-inner-loading :showing="hospitalsLoading" color="green-6" />
        <q-table
          :rows="hospitals"
          :columns="hospColumns"
          row-key="hospitalId"
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
              <q-td key="name"       :props="props"><span class="item-name">{{ props.row.name }}</span></q-td>
              <q-td key="location"   :props="props"><span class="cell-text">{{ props.row.location || '—' }}</span></q-td>
              <q-td key="fee"        :props="props"><span class="fee-badge">LKR {{ props.row.hospitalFee?.toLocaleString() || 0 }}</span></q-td>
              <q-td key="status"     :props="props">
                <q-badge :label="props.row.isActive ? 'Active' : 'Inactive'" :color="props.row.isActive ? 'green-6' : 'grey-5'" rounded />
              </q-td>
              <q-td key="actions" :props="props">
                <div class="table-actions">
                  <q-btn flat round dense size="sm" icon="edit" color="blue-5" @click="openHospitalDialog(props.row)" />
                  <q-btn flat round dense size="sm" icon="delete_outline" color="red-5" @click="confirmDeleteHospital(props.row)" />
                </div>
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Hospital Dialog -->
    <q-dialog v-model="hospitalDialog" persistent>
      <q-card class="hospital-dialog">
        <q-card-section>
          <div class="dialog-title q-mb-md">{{ editHospital?.hospitalId ? 'Edit Hospital' : 'Add Hospital' }}</div>

          <q-input v-model="hospForm.name"          outlined label="Hospital Name *" class="q-mb-sm nexus-input" :rules="[v => !!v || 'Required']" />
          <q-input v-model="hospForm.location"      outlined label="Location"         class="q-mb-sm nexus-input" />
          <q-input v-model="hospForm.contactNumber" outlined label="Contact Number"   class="q-mb-sm nexus-input" />
          <q-input v-model="hospForm.email"         outlined label="Email"            class="q-mb-sm nexus-input" type="email" />
          <q-input v-model.number="hospForm.hospitalFee" outlined label="Hospital Fee (LKR) *" type="number" prefix="LKR" class="nexus-input" :rules="[v => v >= 0 || 'Must be 0 or greater']" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat no-caps label="Cancel" v-close-popup />
          <q-btn
            unelevated no-caps
            :label="editHospital?.hospitalId ? 'Update' : 'Create'"
            color="green-6"
            :loading="savingHospital"
            @click="saveHospital"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Delete Hospital Confirm -->
    <q-dialog v-model="deleteHospDialog" persistent>
      <q-card class="confirm-dialog">
        <q-card-section>
          <div class="row items-center">
            <q-icon name="warning" color="red-5" size="26px" class="q-mr-sm" />
            <span class="dialog-title">Delete Hospital</span>
          </div>
          <p class="q-mt-md text-grey-7">Delete <strong>{{ deleteHospTarget?.name }}</strong>? This cannot be undone.</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn unelevated label="Delete" color="red-5" :loading="savingHospital" @click="deleteHospital" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { adminApi, feeApi } from '../../services/adminApi'

const $q = useQuasar()

// Service Fee
const serviceFeeLoading = ref(true)
const savingServiceFee  = ref(false)
const serviceFee        = ref({})
const newServiceFee     = ref(0)
const newServiceFeeDesc = ref('')

// Doctor Fees
const doctorFeesLoading = ref(true)
const doctorFees        = ref([])
const editingFeeId      = ref(null)
const editFeeAmount     = ref(0)
const savingFeeId       = ref(null)

// Hospitals
const hospitalsLoading   = ref(true)
const hospitals          = ref([])
const hospitalDialog     = ref(false)
const deleteHospDialog   = ref(false)
const savingHospital     = ref(false)
const editHospital       = ref(null)
const deleteHospTarget   = ref(null)
const hospForm           = ref({ name: '', location: '', contactNumber: '', email: '', hospitalFee: 0 })

const hospColumns = [
  { name: 'name',     label: 'Hospital Name', align: 'left',   field: 'name'        },
  { name: 'location', label: 'Location',      align: 'left',   field: 'location'    },
  { name: 'fee',      label: 'Hospital Fee',  align: 'right',  field: 'hospitalFee' },
  { name: 'status',   label: 'Status',        align: 'center', field: 'isActive'    },
  { name: 'actions',  label: 'Actions',       align: 'center', field: 'actions'     },
]

const getInitials = (n = '') => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

// Load
async function loadServiceFee() {
  serviceFeeLoading.value = true
  try {
    const { data } = await feeApi.getServiceFee()
    serviceFee.value = data.data || {}
    newServiceFee.value = serviceFee.value.amount || 500
    newServiceFeeDesc.value = serviceFee.value.description || 'Platform service fee'
  } catch { /* */ }
  finally { serviceFeeLoading.value = false }
}

async function loadDoctorFees() {
  doctorFeesLoading.value = true
  try {
    const { data } = await adminApi.getAllDoctorFees()
    doctorFees.value = data.data || []
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

// Actions
async function updateServiceFee() {
  if (!newServiceFee.value || newServiceFee.value <= 0) {
    $q.notify({ type: 'warning', message: 'Fee must be greater than 0', position: 'top-right' }); return
  }
  savingServiceFee.value = true
  try {
    await feeApi.updateServiceFee(newServiceFee.value, newServiceFeeDesc.value)
    $q.notify({ type: 'positive', message: 'Service fee updated', position: 'top-right' })
    await loadServiceFee()
  } catch (err) {
    $q.notify({ type: 'negative', message: err.response?.data?.message || 'Failed', position: 'top-right' })
  } finally { savingServiceFee.value = false }
}

function startEditFee(doc) {
  editingFeeId.value  = doc.doctorId
  editFeeAmount.value = doc.consultationFee || 0
}

async function saveDoctorFee(doctorId) {
  savingFeeId.value = doctorId
  try {
    await adminApi.updateDoctorFee(doctorId, editFeeAmount.value)
    $q.notify({ type: 'positive', message: 'Doctor fee updated', position: 'top-right' })
    editingFeeId.value = null
    await loadDoctorFees()
  } catch (err) {
    $q.notify({ type: 'negative', message: err.response?.data?.message || 'Failed', position: 'top-right' })
  } finally { savingFeeId.value = null }
}

function openHospitalDialog(hosp) {
  editHospital.value = hosp
  if (hosp) {
    hospForm.value = { name: hosp.name, location: hosp.location, contactNumber: hosp.contactNumber, email: hosp.email, hospitalFee: hosp.hospitalFee }
  } else {
    hospForm.value = { name: '', location: '', contactNumber: '', email: '', hospitalFee: 0 }
  }
  hospitalDialog.value = true
}

async function saveHospital() {
  if (!hospForm.value.name) { $q.notify({ type: 'warning', message: 'Hospital name required', position: 'top-right' }); return }
  savingHospital.value = true
  try {
    if (editHospital.value?.hospitalId) {
      await feeApi.updateHospital(editHospital.value.hospitalId, hospForm.value)
      $q.notify({ type: 'positive', message: 'Hospital updated', position: 'top-right' })
    } else {
      await feeApi.createHospital(hospForm.value)
      $q.notify({ type: 'positive', message: 'Hospital created', position: 'top-right' })
    }
    hospitalDialog.value = false
    await loadHospitals()
  } catch (err) {
    $q.notify({ type: 'negative', message: err.response?.data?.message || 'Save failed', position: 'top-right' })
  } finally { savingHospital.value = false }
}

function confirmDeleteHospital(hosp) {
  deleteHospTarget.value = hosp
  deleteHospDialog.value = true
}

async function deleteHospital() {
  savingHospital.value = true
  try {
    await feeApi.deleteHospital(deleteHospTarget.value.hospitalId)
    $q.notify({ type: 'positive', message: 'Hospital deleted', position: 'top-right' })
    deleteHospDialog.value = false
    await loadHospitals()
  } catch (err) {
    $q.notify({ type: 'negative', message: err.response?.data?.message || 'Delete failed', position: 'top-right' })
  } finally { savingHospital.value = false }
}

onMounted(() => { loadServiceFee(); loadDoctorFees(); loadHospitals() })
</script>

<style lang="scss" scoped>
.admin-page { padding: 28px; }

.page-header {
  margin-bottom: 24px;
  .page-title    { font-size: 22px; font-weight: 700; color: #1a2332; margin: 0; font-family: 'Poppins', sans-serif; }
  .page-subtitle { font-size: 13px; color: #64748b; margin: 4px 0 0; }
}

.fee-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
}

.fee-card {
  border-radius: 12px;
  border: 1px solid #e9ecef;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.fee-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f2f5;

  .fee-card-title { font-size: 14px; font-weight: 600; color: #1a2332; display: flex; align-items: center; }
}

.current-fee-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;

  .fee-label  { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px; }
  .fee-amount { font-size: 36px; font-weight: 800; color: #1a2332; margin: 4px 0; font-family: 'Poppins', sans-serif; }
  .fee-desc   { font-size: 12px; color: #64748b; }
}

.fee-edit-form { .fee-input { .q-field__control { border-radius: 8px; } } }
.save-btn { width: 100%; height: 44px; border-radius: 8px; font-weight: 600; }

.fee-list-item { padding: 10px 20px; &:hover { background: #f8fafc; } }
.item-name     { font-size: 14px; font-weight: 600; color: #1a2332; }
.cell-text     { font-size: 13px; color: #475569; }

.fee-badge {
  background: #f0fdf4;
  color: #16a34a;
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  border: 1px solid #bbf7d0;
}

.inline-fee-edit {
  display: flex;
  align-items: center;
  gap: 4px;
}

.fee-display-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.nexus-table { font-family: 'Inter', sans-serif; }
.table-header-row { background: #f8fafc; }
.table-th { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
.table-row:hover td { background: #f8fafc; }
.table-actions { display: flex; align-items: center; gap: 2px; justify-content: center; }

.empty-state { padding: 24px; text-align: center; color: #94a3b8; font-size: 13px; }

.hospital-dialog { min-width: 440px; border-radius: 12px !important; }
.confirm-dialog  { min-width: 360px; border-radius: 12px !important; }
.dialog-title    { font-size: 17px; font-weight: 600; color: #1a2332; }
.nexus-input     { .q-field__control { border-radius: 8px; } }
</style>