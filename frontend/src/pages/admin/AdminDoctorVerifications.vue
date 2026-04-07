<template>
  <q-page class="admin-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">Doctor Verifications</h2>
        <p class="page-subtitle">Review and approve doctor registrations</p>
      </div>
      <q-badge
        :label="`${pendingDoctors.length} Pending`"
        color="orange-6"
        class="header-badge"
      />
    </div>

    <q-inner-loading :showing="loading" color="green-6" />

    <!-- Empty -->
    <div v-if="!loading && pendingDoctors.length === 0" class="all-clear">
      <q-icon name="verified" size="64px" color="green-5" />
      <h3>All Clear!</h3>
      <p>No pending doctor verifications at this time.</p>
    </div>

    <!-- Cards Grid -->
    <div v-else class="doctors-grid">
      <q-card
        v-for="doc in pendingDoctors"
        :key="doc.doctorId"
        class="doctor-verify-card"
      >
        <!-- Card Header -->
        <q-card-section class="doc-card-header">
          <div class="doc-avatar-wrap">
            <div class="doc-avatar">{{ getInitials(doc.name) }}</div>
            <div>
              <div class="doc-name">{{ doc.name }}</div>
              <div class="doc-id">{{ doc.doctorId }}</div>
            </div>
          </div>
          <q-badge label="Pending" color="orange-5" />
        </q-card-section>

        <q-separator />

        <!-- Card Body -->
        <q-card-section class="doc-card-body">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-key">Specialty</span>
              <span class="info-val specialty-val">{{ doc.specialty || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-key">Registration No.</span>
              <span class="info-val">{{ doc.registrationNumber }}</span>
            </div>
            <div class="info-item">
              <span class="info-key">Email</span>
              <span class="info-val">{{ doc.email }}</span>
            </div>
            <div class="info-item">
              <span class="info-key">Phone</span>
              <span class="info-val">{{ doc.phone || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-key">Hospital</span>
              <span class="info-val">{{ doc.hospital || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-key">Experience</span>
              <span class="info-val">{{ doc.experience != null ? doc.experience + ' yrs' : '—' }}</span>
            </div>
            <div class="info-item" v-if="doc.consultationFee">
              <span class="info-key">Consult. Fee</span>
              <span class="info-val text-green-7 font-bold">LKR {{ doc.consultationFee.toLocaleString() }}</span>
            </div>
            <div class="info-item">
              <span class="info-key">Applied</span>
              <span class="info-val">{{ formatDate(doc.createdAt) }}</span>
            </div>
          </div>

          <!-- Qualifications -->
          <div v-if="doc.qualifications?.length" class="qual-section">
            <span class="info-key">Qualifications</span>
            <div class="qual-chips">
              <q-badge
                v-for="q in doc.qualifications"
                :key="q"
                :label="q"
                color="blue-1"
                text-color="blue-8"
                class="qual-chip"
              />
            </div>
          </div>

          <!-- Verification Documents -->
          <div v-if="doc.verificationDocuments?.length" class="docs-section">
            <span class="info-key">Documents ({{ doc.verificationDocuments.length }})</span>
            <div class="doc-links">
              <a
                v-for="(d, i) in doc.verificationDocuments"
                :key="i"
                :href="d.fileUrl"
                target="_blank"
                class="doc-link"
              >
                <q-icon name="description" size="14px" />
                {{ d.title || `Document ${i + 1}` }}
              </a>
            </div>
          </div>

          <!-- Rejection reason (if previously rejected) -->
          <q-banner v-if="doc.rejectionReason" class="reject-banner" rounded>
            <template #avatar><q-icon name="warning" color="orange-7" /></template>
            Previous rejection: {{ doc.rejectionReason }}
          </q-banner>
        </q-card-section>

        <!-- Actions -->
        <q-separator />
        <q-card-actions class="doc-card-actions">
          <q-btn
            unelevated no-caps
            icon="check_circle"
            label="Approve"
            color="green-6"
            class="action-btn-lg"
            :loading="processingId === doc.doctorId + '_approve'"
            @click="approveDoctor(doc.doctorId)"
          />
          <q-btn
            unelevated no-caps
            icon="cancel"
            label="Reject"
            color="red-5"
            outline
            class="action-btn-lg"
            @click="openRejectDialog(doc)"
          />
        </q-card-actions>
      </q-card>
    </div>

    <!-- Reject Dialog -->
    <q-dialog v-model="rejectDialog" persistent>
      <q-card class="reject-dialog">
        <q-card-section>
          <div class="row items-center q-mb-sm">
            <q-icon name="warning" color="red-5" size="28px" class="q-mr-sm" />
            <span class="dialog-title">Reject Doctor Registration</span>
          </div>
          <p class="text-grey-7 q-mb-md">Rejecting: <strong>{{ rejectTarget?.name }}</strong> ({{ rejectTarget?.specialty }})</p>

          <q-input
            v-model="rejectReason"
            type="textarea"
            outlined
            label="Rejection Reason *"
            rows="4"
            placeholder="Provide a clear reason so the doctor can understand and re-apply if needed..."
            :rules="[val => (val && val.trim().length >= 10) || 'Please enter at least 10 characters']"
            class="nexus-input"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps label="Cancel" v-close-popup />
          <q-btn
            unelevated no-caps
            label="Confirm Rejection"
            color="red-5"
            icon="cancel"
            :loading="processingId === rejectTarget?.doctorId + '_reject'"
            @click="confirmReject"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { adminApi } from '../../services/adminApi'

const $q = useQuasar()

const loading        = ref(true)
const pendingDoctors = ref([])
const processingId   = ref(null)
const rejectDialog   = ref(false)
const rejectTarget   = ref(null)
const rejectReason   = ref('')

const getInitials = (n = '') => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
const formatDate  = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

async function load() {
  loading.value = true
  try {
    const { data } = await adminApi.getPendingDoctors()
    pendingDoctors.value = data.data || []
  } catch { pendingDoctors.value = [] }
  finally { loading.value = false }
}

async function approveDoctor(doctorId) {
  processingId.value = doctorId + '_approve'
  try {
    await adminApi.verifyDoctor(doctorId, 'approve')
    $q.notify({ type: 'positive', message: 'Doctor approved! They can now log in.', position: 'top-right' })
    await load()
  } catch (err) {
    $q.notify({ type: 'negative', message: err.response?.data?.message || 'Failed', position: 'top-right' })
  } finally { processingId.value = null }
}

function openRejectDialog(doc) {
  rejectTarget.value = doc
  rejectReason.value = ''
  rejectDialog.value = true
}

async function confirmReject() {
  if (!rejectReason.value || rejectReason.value.trim().length < 10) {
    $q.notify({ type: 'warning', message: 'Please enter a valid rejection reason (min 10 chars)', position: 'top-right' })
    return
  }
  processingId.value = rejectTarget.value.doctorId + '_reject'
  try {
    await adminApi.verifyDoctor(rejectTarget.value.doctorId, 'reject', rejectReason.value.trim())
    $q.notify({ type: 'positive', message: 'Doctor registration rejected', position: 'top-right' })
    rejectDialog.value = false
    await load()
  } catch (err) {
    $q.notify({ type: 'negative', message: err.response?.data?.message || 'Failed', position: 'top-right' })
  } finally { processingId.value = null }
}

onMounted(load)
</script>

<style lang="scss" scoped>
.admin-page { padding: 28px; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;

  .page-title    { font-size: 22px; font-weight: 700; color: #1a2332; margin: 0; font-family: 'Poppins', sans-serif; }
  .page-subtitle { font-size: 13px; color: #64748b; margin: 4px 0 0; }
  .header-badge  { font-size: 13px; padding: 6px 14px; border-radius: 20px; margin-top: 4px; }
}

.all-clear {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: #64748b;

  h3 { font-size: 20px; font-weight: 700; color: #1a2332; margin: 16px 0 8px; }
  p  { font-size: 14px; }
}

.doctors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.doctor-verify-card {
  border-radius: 12px;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transition: box-shadow 0.15s;

  &:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
}

.doc-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
}

.doc-avatar-wrap {
  display: flex;
  align-items: center;
  gap: 12px;

  .doc-avatar {
    width: 48px; height: 48px;
    border-radius: 10px;
    background: linear-gradient(135deg, #0d1b2a, #1e3a5f);
    color: #fff;
    font-size: 16px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .doc-name { font-size: 16px; font-weight: 700; color: #1a2332; }
  .doc-id   { font-size: 12px; color: #94a3b8; }
}

.doc-card-body { padding: 16px 20px; }

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 16px;
  margin-bottom: 14px;
}

.info-item {
  display: flex;
  flex-direction: column;

  .info-key { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
  .info-val { font-size: 13px; font-weight: 600; color: #1a2332; }
  .specialty-val { color: #3b82f6; }
}

.qual-section, .docs-section { margin-top: 12px; }

.qual-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.qual-chip  { border-radius: 20px; font-size: 11px; padding: 3px 10px; }

.doc-links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
.doc-link  {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #3b82f6;
  text-decoration: none;
  background: #eff6ff;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid #bfdbfe;

  &:hover { background: #dbeafe; }
}

.reject-banner {
  margin-top: 12px;
  background: #fff7ed;
  color: #92400e;
  font-size: 12px;
  border-radius: 8px;
}

.doc-card-actions {
  padding: 12px 20px;
  gap: 10px;
}

.action-btn-lg {
  flex: 1;
  height: 40px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
}

.reject-dialog { min-width: 460px; border-radius: 12px !important; }
.dialog-title  { font-size: 17px; font-weight: 600; color: #1a2332; }
.nexus-input   { .q-field__control { border-radius: 8px; } }
</style>