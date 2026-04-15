<template>
  <q-page class="admin-page">

    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-left">
        <h2 class="page-title">Doctor Verifications</h2>
        <p class="page-subtitle">Review and approve doctor registration requests</p>
      </div>
      <div class="page-header-right">
        <div class="pending-counter" v-if="!loading">
          <q-icon name="pending_actions" size="18px" color="orange-6" />
          <span>{{ pendingDoctors.length }} Pending</span>
        </div>
        <q-btn unelevated no-caps icon="refresh" label="Refresh" color="green-6" size="sm" @click="load" :loading="loading" />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-grid">
      <div v-for="i in 4" :key="i" class="skeleton-card">
        <div class="sk-header">
          <div class="sk-avatar"></div>
          <div class="sk-lines">
            <div class="sk-line sk-line--lg"></div>
            <div class="sk-line sk-line--sm"></div>
          </div>
        </div>
        <div class="sk-body">
          <div v-for="j in 6" :key="j" class="sk-line"></div>
        </div>
      </div>
    </div>

    <!-- All Clear -->
    <div v-else-if="pendingDoctors.length === 0" class="all-clear-state">
      <div class="all-clear-icon">
        <q-icon name="verified" size="48px" color="green-5" />
      </div>
      <h3 class="all-clear-title">All Verified!</h3>
      <p class="all-clear-sub">No pending doctor registrations at this time.</p>
      <q-btn unelevated no-caps label="Go to Dashboard" color="green-6" to="/admin/dashboard" class="q-mt-md" />
    </div>

    <!-- Doctor Cards Grid -->
    <div v-else class="doctors-grid">
      <div
        v-for="(doc, idx) in pendingDoctors"
        :key="doc.doctorId"
        class="doctor-card"
        :style="{ animationDelay: `${idx * 50}ms` }"
      >
        <!-- Card Header -->
        <div class="doc-card-top">
          <div class="doc-avatar-section">
            <div class="doc-avatar">{{ getInitials(doc.name) }}</div>
            <div class="doc-identity">
              <span class="doc-name">{{ doc.name }}</span>
              <span class="doc-id-tag">{{ doc.doctorId }}</span>
            </div>
          </div>
          <div class="doc-status-badge">
            <span class="status-dot-pulse"></span>
            Pending Review
          </div>
        </div>

        <!-- Info Grid -->
        <div class="doc-info-grid">
          <div class="info-cell">
            <span class="info-key">Specialty</span>
            <span class="info-val info-val--specialty">{{ doc.specialty || '—' }}</span>
          </div>
          <div class="info-cell">
            <span class="info-key">Reg. Number</span>
            <span class="info-val">{{ doc.registrationNumber }}</span>
          </div>
          <div class="info-cell">
            <span class="info-key">Email</span>
            <span class="info-val info-val--email">{{ doc.email }}</span>
          </div>
          <div class="info-cell">
            <span class="info-key">Phone</span>
            <span class="info-val">{{ doc.phone || '—' }}</span>
          </div>
          <div class="info-cell">
            <span class="info-key">Hospital</span>
            <span class="info-val">{{ doc.hospital || '—' }}</span>
          </div>
          <div class="info-cell">
            <span class="info-key">Experience</span>
            <span class="info-val">{{ doc.experience != null ? doc.experience + ' years' : '—' }}</span>
          </div>
          <div class="info-cell" v-if="doc.consultationFee">
            <span class="info-key">Consult. Fee</span>
            <span class="info-val info-val--fee">LKR {{ doc.consultationFee.toLocaleString() }}</span>
          </div>
          <div class="info-cell">
            <span class="info-key">Applied</span>
            <span class="info-val">{{ formatDate(doc.createdAt) }}</span>
          </div>
        </div>

        <!-- Qualifications -->
        <div v-if="doc.qualifications?.length" class="doc-section">
          <span class="section-label">Qualifications</span>
          <div class="qual-chips">
            <span v-for="q in doc.qualifications" :key="q" class="qual-chip">{{ q }}</span>
          </div>
        </div>

        <!-- Bio -->
        <div v-if="doc.bio" class="doc-section">
          <span class="section-label">Bio</span>
          <p class="doc-bio">{{ doc.bio }}</p>
        </div>

        <!-- Documents -->
        <div v-if="doc.verificationDocuments?.length" class="doc-section">
          <span class="section-label">Verification Documents ({{ doc.verificationDocuments.length }})</span>
          <div class="doc-links">
            <a
              v-for="(d, i) in doc.verificationDocuments"
              :key="i"
              :href="d.fileUrl"
              target="_blank"
              class="doc-link-chip"
            >
              <q-icon name="description" size="13px" />
              {{ d.title || `Document ${i + 1}` }}
              <q-icon name="open_in_new" size="11px" />
            </a>
          </div>
        </div>

        <!-- Previous Rejection -->
        <div v-if="doc.rejectionReason" class="rejection-notice">
          <q-icon name="info" size="14px" color="orange-7" />
          <span>Previously rejected: {{ doc.rejectionReason }}</span>
        </div>

        <!-- Action Buttons -->
        <div class="doc-card-actions">
          <q-btn
            unelevated no-caps
            icon="check_circle_outline"
            label="Approve Doctor"
            color="green-6"
            class="action-btn action-btn--approve"
            :loading="processingId === doc.doctorId + '_approve'"
            @click="approveDoctor(doc.doctorId)"
          />
          <q-btn
            unelevated no-caps
            icon="cancel"
            label="Reject"
            color="red-5"
            outline
            class="action-btn action-btn--reject"
            @click="openRejectDialog(doc)"
          />
        </div>
      </div>
    </div>

    <!-- Reject Dialog -->
    <q-dialog v-model="rejectDialog" persistent>
      <q-card class="nexus-dialog">
        <div class="dialog-header">
          <div class="dialog-icon dialog-icon--red">
            <q-icon name="gpp_bad" size="20px" color="white" />
          </div>
          <div>
            <div class="dialog-title">Reject Registration</div>
            <div class="dialog-sub">{{ rejectTarget?.name }} · {{ rejectTarget?.specialty }}</div>
          </div>
        </div>
        <q-card-section class="q-pt-sm">
          <q-input
            v-model="rejectReason"
            type="textarea"
            outlined
            label="Rejection Reason *"
            rows="4"
            placeholder="Provide a clear reason so the doctor can understand and re-apply if needed..."
            :rules="[v => (v && v.trim().length >= 10) || 'Minimum 10 characters required']"
            class="nexus-input"
          />
        </q-card-section>
        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn flat no-caps label="Cancel" color="grey-6" v-close-popup />
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
    $q.notify({ type: 'positive', message: 'Doctor approved! They can now log in.', position: 'top-right', icon: 'check_circle' })
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
    $q.notify({ type: 'warning', message: 'Please enter at least 10 characters', position: 'top-right' })
    return
  }
  processingId.value = rejectTarget.value.doctorId + '_reject'
  try {
    await adminApi.verifyDoctor(rejectTarget.value.doctorId, 'reject', rejectReason.value.trim())
    $q.notify({ type: 'positive', message: 'Registration rejected', position: 'top-right' })
    rejectDialog.value = false
    await load()
  } catch (err) {
    $q.notify({ type: 'negative', message: err.response?.data?.message || 'Failed', position: 'top-right' })
  } finally { processingId.value = null }
}

onMounted(load)
</script>

<style lang="scss" scoped>
.admin-page { padding: 28px 28px 48px; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;

  .page-title    { font-family: 'Poppins', sans-serif; font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 4px; }
  .page-subtitle { font-size: 13px; color: #64748b; margin: 0; }
}

.page-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pending-counter {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #ea580c;
}

/* Skeleton */
.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 20px;
}

.skeleton-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #eef0f4;
  padding: 20px;
  animation: pulse 1.5s ease infinite;
}

.sk-header { display: flex; gap: 12px; margin-bottom: 20px; }
.sk-avatar { width: 48px; height: 48px; border-radius: 10px; background: #f0f4f8; flex-shrink: 0; }
.sk-lines  { flex: 1; display: flex; flex-direction: column; gap: 8px; justify-content: center; }
.sk-body   { display: flex; flex-direction: column; gap: 8px; }

.sk-line {
  height: 12px;
  background: #f0f4f8;
  border-radius: 6px;
  width: 100%;

  &--lg { width: 60%; }
  &--sm { width: 40%; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.6; }
}

/* All Clear */
.all-clear-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;

  .all-clear-icon {
    width: 90px; height: 90px;
    background: #f0fdf4;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 20px;
    box-shadow: 0 0 0 12px rgba(16,185,129,0.06);
  }

  .all-clear-title { font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 8px; }
  .all-clear-sub   { font-size: 14px; color: #64748b; margin: 0; }
}

/* Doctor Cards */
.doctors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 20px;
}

.doctor-card {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #eef0f4;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  overflow: hidden;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  animation: cardIn 0.35s ease both;

  &:hover {
    box-shadow: 0 8px 24px rgba(0,0,0,0.1);
    transform: translateY(-2px);
  }

  @keyframes cardIn {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
}

.doc-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  background: linear-gradient(135deg, #f8fafc, #f0f4f8);
  border-bottom: 1px solid #eef0f4;
}

.doc-avatar-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.doc-avatar {
  width: 50px; height: 50px;
  border-radius: 12px;
  background: linear-gradient(135deg, #0a1628, #1e3a5f);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 12px rgba(10,22,40,0.2);
}

.doc-identity {
  .doc-name   { display: block; font-size: 16px; font-weight: 700; color: #0f172a; }
  .doc-id-tag { display: block; font-size: 11px; color: #94a3b8; margin-top: 2px; font-family: monospace; }
}

.doc-status-badge {
  display: flex;
  align-items: center;
  gap: 7px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 20px;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #ea580c;
}

.status-dot-pulse {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #f97316;
  animation: dotPulse 1.5s ease infinite;
}

@keyframes dotPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(249,115,22,0.4); }
  50%       { box-shadow: 0 0 0 5px rgba(249,115,22,0); }
}

.doc-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 20px;
  padding: 16px 20px;
  border-bottom: 1px solid #f8fafc;
}

.info-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;

  .info-key { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.6px; font-weight: 600; }
  .info-val { font-size: 13px; font-weight: 600; color: #0f172a; }
  .info-val--specialty { color: #2563eb; }
  .info-val--email     { color: #0d9488; font-size: 12px; }
  .info-val--fee       { color: #16a34a; }
}

.doc-section {
  padding: 12px 20px;
  border-bottom: 1px solid #f8fafc;

  .section-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.6px; font-weight: 600; display: block; margin-bottom: 8px; }
}

.qual-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.qual-chip  {
  background: #eff6ff;
  color: #2563eb;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  border: 1px solid #bfdbfe;
}

.doc-bio { font-size: 13px; color: #475569; line-height: 1.5; margin: 0; }

.doc-links { display: flex; flex-wrap: wrap; gap: 8px; }
.doc-link-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  padding: 5px 10px;
  font-size: 12px;
  color: #2563eb;
  text-decoration: none;
  transition: all 0.15s;

  &:hover { background: #eff6ff; border-color: #bfdbfe; }
}

.rejection-notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0 20px 0;
  padding: 10px 14px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 8px;
  font-size: 12px;
  color: #92400e;
  margin-bottom: 0;
}

.doc-card-actions {
  display: flex;
  gap: 10px;
  padding: 14px 20px;
}

.action-btn {
  flex: 1;
  height: 40px;
  border-radius: 9px;
  font-weight: 600;
  font-size: 13px;

  &--approve { box-shadow: 0 2px 8px rgba(16,185,129,0.2); }
}

/* Dialog */
.nexus-dialog { min-width: 460px; border-radius: 16px !important; overflow: hidden; }

.dialog-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 20px 16px;
  border-bottom: 1px solid #f0f4f8;
}

.dialog-icon {
  width: 44px; height: 44px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;

  &--red { background: linear-gradient(135deg, #ef4444, #dc2626); }
}

.dialog-title { font-size: 16px; font-weight: 700; color: #0f172a; }
.dialog-sub   { font-size: 12px; color: #94a3b8; margin-top: 2px; }
.nexus-input :deep(.q-field__control) { border-radius: 8px; }
</style>
