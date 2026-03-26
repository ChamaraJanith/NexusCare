<template>
  <q-page class="patient-dashboard-bg">
    <!-- ══ TOP BAR ═════════════════════════════════════════════════════ -->
    <div class="top-bar">
      <div class="top-left">
        <div class="logo-wrapper">
          <div class="logo-inner">
            <q-icon name="health_and_safety" size="1.8rem" color="cyan-4" />
            <span class="logo-text font-orbitron text-cyan-4">NEXUS</span>
          </div>
          <div class="logo-glow"></div>
        </div>
        <div class="user-info">
          <div class="user-avatar">
            <img v-if="profileData.profileImage?.url" :src="profileData.profileImage.url" />
            <q-icon v-else name="person" color="cyan-4" size="1.2rem" />
          </div>
          <div>
            <div class="user-name font-orbitron text-white">{{ profileData.name }}</div>
            <div class="user-role text-cyan-8">PATIENT PORTAL</div>
          </div>
        </div>
      </div>
      <div class="top-right">
        <q-btn flat round icon="notifications" class="top-btn q-mr-sm" @click="$q.notify('Notifications coming soon')">
          <q-badge color="red-6" floating class="font-orbitron" style="font-size: 0.5rem;">3</q-badge>
        </q-btn>
        <q-btn flat round icon="settings" class="top-btn q-mr-sm" @click="tab = 'profile'" />
        <q-btn flat round icon="logout" class="top-btn" @click="logout" />
      </div>
    </div>

    <!-- ══ QUICK ACTIONS BAR ═════════════════════════════════════════ -->
    <div class="quick-actions-bar">
      <div class="quick-actions-inner">
        <div class="action-card" @click="goToSymptoms">
          <div class="action-icon-wrapper">
            <q-icon name="medical_services" size="2rem" color="cyan-4" />
            <div class="action-icon-glow"></div>
          </div>
          <div class="action-content">
            <div class="action-title font-orbitron text-white">SYMPTOMS</div>
            <div class="action-subtitle text-cyan-8">AI Checker</div>
          </div>
          <div class="action-arrow">
            <q-icon name="arrow_forward_ios" color="cyan-6" size="0.8rem" />
          </div>
        </div>

        <div class="action-card" @click="goToVideoConsultation">
          <div class="action-icon-wrapper">
            <q-icon name="videocam" size="2rem" color="green-4" />
            <div class="action-icon-glow green-glow"></div>
          </div>
          <div class="action-content">
            <div class="action-title font-orbitron text-white">VIDEO</div>
            <div class="action-subtitle text-green-8">Consultation</div>
          </div>
          <div class="action-arrow">
            <q-icon name="arrow_forward_ios" color="green-6" size="0.8rem" />
          </div>
        </div>

        <div class="action-card" @click="$q.notify('Appointments coming soon')">
          <div class="action-icon-wrapper">
            <q-icon name="event" size="2rem" color="purple-4" />
            <div class="action-icon-glow purple-glow"></div>
          </div>
          <div class="action-content">
            <div class="action-title font-orbitron text-white">BOOK</div>
            <div class="action-subtitle text-purple-8">Appointment</div>
          </div>
          <div class="action-arrow">
            <q-icon name="arrow_forward_ios" color="purple-6" size="0.8rem" />
          </div>
        </div>
      </div>
    </div>

    <!-- ══ METRICS SECTION ═══════════════════════════════════════════ -->
    <div class="metrics-section">
      <div class="metrics-grid">
        <div v-for="(card, i) in statCards" :key="i" class="metric-card-pro">
          <div class="metric-header">
            <div class="metric-icon-wrapper">
              <q-icon :name="card.icon" :color="card.color" size="1.5rem" />
              <div class="metric-icon-pulse"></div>
            </div>
            <div class="metric-label font-orbitron text-cyan-8">{{ card.label }}</div>
          </div>
          <div class="metric-value font-orbitron text-white">{{ card.value }}</div>
          <div class="metric-progress">
            <div class="metric-track"></div>
            <div class="metric-fill-pro" :style="{ width: card.fill, background: `linear-gradient(90deg, ${getGradientColor(card.color)}, transparent)` }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ TABS ═════════════════════════════════════════════════════ -->
    <div class="tabs-wrapper">
      <q-tabs v-model="tab" dense class="nexus-tabs-pro" indicator-color="cyan-4" active-color="cyan-4" inactive-color="grey-7">
        <q-tab name="profile" icon="person" label="PROFILE" class="font-orbitron" />
        <q-tab name="reports" icon="folder" label="REPORTS" class="font-orbitron" />
        <q-tab name="prescriptions" icon="medication" label="PRESCRIPTIONS" class="font-orbitron" />
      </q-tabs>
    </div>

    <q-tab-panels v-model="tab" animated class="tab-panels-pro">
      <!-- ══ PROFILE TAB ═══════════════════════════════════════════════ -->
      <q-tab-panel name="profile" class="q-pa-none">
        <div class="profile-container">
          <!-- Left: Avatar & info -->
          <div class="profile-left">
            <div class="profile-card-pro">
              <div class="profile-header">
                <div class="avatar-section">
                  <div class="avatar-wrapper-pro">
                    <q-avatar size="120px" class="patient-avatar-pro">
                      <img v-if="profileData.profileImage?.url" :src="profileData.profileImage.url" />
                      <q-icon v-else name="person" color="cyan-4" size="3.5rem" />
                    </q-avatar>
                    <div class="avatar-ring"></div>
                    <q-btn
                      round flat icon="photo_camera" color="cyan-4" size="sm"
                      class="avatar-cam-btn-pro"
                      @click="$refs.imgFile.click()"
                    />
                    <input ref="imgFile" type="file" accept="image/*" class="hidden" @change="doUploadImage" />
                  </div>
                </div>
                <div class="profile-name-section">
                  <div class="profile-name font-orbitron text-white">{{ profileData.name }}</div>
                  <div class="profile-email text-cyan-8">{{ profileData.email }}</div>
                  <div class="profile-phone text-grey-6">{{ profileData.phone || '—' }}</div>
                </div>
              </div>

              <div class="profile-divider"></div>

              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label font-orbitron text-cyan-8">GENDER</div>
                  <div class="info-value font-orbitron text-white capitalize">{{ profileData.gender || '—' }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label font-orbitron text-cyan-8">BLOOD</div>
                  <div class="info-value font-orbitron text-white">{{ profileData.bloodGroup || '—' }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label font-orbitron text-cyan-8">AGE</div>
                  <div class="info-value font-orbitron text-white">{{ calculateAge(profileData.dateOfBirth) || '—' }}</div>
                </div>
              </div>

              <div class="profile-divider"></div>

              <div class="medical-tags">
                <div class="tags-section">
                  <div class="tags-title font-orbitron text-cyan-8">ALLERGIES</div>
                  <div v-if="profileData.allergies?.length" class="tags-container">
                    <q-chip
                      v-for="a in profileData.allergies" :key="a"
                      dense dark color="red-10" class="font-orbitron tag-chip"
                    >{{ a }}</q-chip>
                  </div>
                  <div v-else class="no-tags text-grey-7">None recorded</div>
                </div>

                <div class="tags-section">
                  <div class="tags-title font-orbitron text-cyan-8">CHRONIC CONDITIONS</div>
                  <div v-if="profileData.chronicConditions?.length" class="tags-container">
                    <q-chip
                      v-for="c in profileData.chronicConditions" :key="c"
                      dense dark color="orange-10" class="font-orbitron tag-chip"
                    >{{ c }}</q-chip>
                  </div>
                  <div v-else class="no-tags text-grey-7">None recorded</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Edit form -->
          <div class="profile-right">
            <div class="form-card-pro">
              <div class="form-header-pro">
                <q-icon name="edit_note" color="cyan-4" size="1.5rem" />
                <span class="font-orbitron text-white">UPDATE PROFILE</span>
              </div>

              <q-form @submit="doSaveProfile" class="profile-form">
                <div class="form-section">
                  <div class="section-title-pro font-orbitron text-cyan-8">PERSONAL DETAILS</div>
                  <div class="form-grid">
                    <div class="form-field-pro">
                      <div class="field-label-pro">FULL NAME</div>
                      <q-input v-model="editForm.name" dark outlined color="cyan-4" class="nexus-field-pro" />
                    </div>
                    <div class="form-field-pro">
                      <div class="field-label-pro">PHONE</div>
                      <q-input v-model="editForm.phone" dark outlined color="cyan-4" class="nexus-field-pro" />
                    </div>
                  </div>
                </div>

                <div class="form-section">
                  <div class="section-title-pro font-orbitron text-cyan-8">MEDICAL INFORMATION</div>
                  <div class="form-grid">
                    <div class="form-field-pro">
                      <div class="field-label-pro">DATE OF BIRTH</div>
                      <q-input v-model="editForm.dateOfBirth" type="date" dark outlined color="cyan-4" class="nexus-field-pro" />
                    </div>
                    <div class="form-field-pro">
                      <div class="field-label-pro">GENDER</div>
                      <q-select v-model="editForm.gender" :options="['male','female','other']" dark outlined color="cyan-4" class="nexus-field-pro" />
                    </div>
                    <div class="form-field-pro">
                      <div class="field-label-pro">BLOOD GROUP</div>
                      <q-select v-model="editForm.bloodGroup" :options="bloodGroups" dark outlined color="cyan-4" class="nexus-field-pro" />
                    </div>
                  </div>
                </div>

                <div class="form-section">
                  <div class="section-title-pro font-orbitron text-cyan-8">HEALTH CONDITIONS</div>
                  <div class="form-grid">
                    <div class="form-field-pro full-width">
                      <div class="field-label-pro">ALLERGIES</div>
                      <q-select
                        v-model="editForm.allergies" multiple use-chips use-input new-value-mode="add-unique"
                        placeholder="Type and press Enter"
                        dark outlined color="cyan-4" class="nexus-field-pro"
                      />
                    </div>
                    <div class="form-field-pro full-width">
                      <div class="field-label-pro">CHRONIC CONDITIONS</div>
                      <q-select
                        v-model="editForm.chronicConditions" multiple use-chips use-input new-value-mode="add-unique"
                        placeholder="Type and press Enter"
                        dark outlined color="cyan-4" class="nexus-field-pro"
                      />
                    </div>
                  </div>
                </div>

                <div class="form-actions">
                  <q-btn type="submit" :loading="savingProfile" class="save-btn-pro font-orbitron" label="SAVE CHANGES" icon-right="save" />
                </div>
              </q-form>
            </div>
          </div>
        </div>
      </q-tab-panel>

      <!-- ══ REPORTS TAB ═══════════════════════════════════════════════ -->
      <q-tab-panel name="reports" class="q-pa-none">
        <div class="reports-container">
          <div class="reports-header-pro">
            <div class="reports-title-section">
              <q-icon name="folder_open" color="cyan-4" size="1.8rem" />
              <div>
                <div class="reports-title font-orbitron text-white">MEDICAL REPORTS</div>
                <div class="reports-subtitle text-cyan-8">{{ reports.length }} documents</div>
              </div>
            </div>
            <q-btn
              icon="upload_file" label="UPLOAD REPORT"
              class="upload-btn-pro font-orbitron"
              @click="uploadDialog = true"
            />
          </div>

          <div v-if="reports.length === 0" class="empty-state-pro">
            <div class="empty-icon-wrapper">
              <q-icon name="description" size="5rem" color="grey-8" />
            </div>
            <div class="empty-title font-orbitron text-grey-7">NO REPORTS UPLOADED</div>
            <div class="empty-subtitle text-grey-8">Upload your medical reports to keep them organized</div>
          </div>

          <div v-else class="reports-grid-pro">
            <div v-for="r in reports" :key="r.reportId" class="report-card-pro">
              <div class="report-icon-section">
                <div class="report-icon-wrapper">
                  <q-icon
                    :name="r.fileType === 'pdf' ? 'picture_as_pdf' : 'image'"
                    :color="r.fileType === 'pdf' ? 'red-4' : 'cyan-4'"
                    size="2.5rem"
                  />
                </div>
              </div>
              <div class="report-content">
                <div class="report-title font-orbitron text-white">{{ r.title }}</div>
                <div class="report-description text-grey-6">{{ r.description || 'No description' }}</div>
                <div class="report-meta">
                  <q-chip dense dark :color="r.fileType === 'pdf' ? 'red-10' : 'cyan-10'" class="font-orbitron meta-chip">
                    {{ r.fileType?.toUpperCase() }}
                  </q-chip>
                  <span class="report-date text-grey-7 font-orbitron">{{ formatDate(r.uploadedAt) }}</span>
                </div>
              </div>
              <div class="report-actions">
                <q-btn flat round icon="visibility" color="cyan-6" size="sm" @click="window.open(r.fileUrl, '_blank')">
                  <q-tooltip class="font-orbitron">View</q-tooltip>
                </q-btn>
                <q-btn flat round icon="delete_outline" color="red-5" size="sm" @click="doDeleteReport(r.reportId)">
                  <q-tooltip class="font-orbitron">Delete</q-tooltip>
                </q-btn>
              </div>
            </div>
          </div>
        </div>
      </q-tab-panel>

      <!-- ══ PRESCRIPTIONS TAB ══════════════════════════════════════════ -->
      <q-tab-panel name="prescriptions" class="q-pa-none">
        <div class="prescriptions-container">
          <div class="prescriptions-header-pro">
            <div class="prescriptions-title-section">
              <q-icon name="medication_liquid" color="cyan-4" size="1.8rem" />
              <div>
                <div class="prescriptions-title font-orbitron text-white">PRESCRIPTIONS</div>
                <div class="prescriptions-subtitle text-cyan-8">{{ prescriptions.length }} prescriptions</div>
              </div>
            </div>
          </div>

          <div v-if="prescriptions.length === 0" class="empty-state-pro">
            <div class="empty-icon-wrapper">
              <q-icon name="medication" size="5rem" color="grey-8" />
            </div>
            <div class="empty-title font-orbitron text-grey-7">NO PRESCRIPTIONS YET</div>
            <div class="empty-subtitle text-grey-8">Prescriptions issued by your doctors will appear here</div>
          </div>

          <div v-else class="prescriptions-list-pro">
            <q-expansion-item
              v-for="rx in prescriptions" :key="rx.prescriptionId"
              class="prescription-item-pro"
              header-class="prescription-header-pro"
              expand-icon-class="text-cyan-4"
              dark
            >
              <template #header>
                <q-item-section avatar>
                  <div class="prescription-avatar-pro">
                    <q-icon name="medical_services" color="cyan-4" size="1.5rem" />
                  </div>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="prescription-diagnosis font-orbitron text-white">{{ rx.diagnosis || 'Prescription' }}</q-item-label>
                  <q-item-label caption class="prescription-doctor text-cyan-8">
                    Dr. {{ rx.doctorName }} · {{ formatDate(rx.issuedAt) }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-chip dense dark color="cyan-10" class="font-orbitron med-count-chip">
                    {{ rx.medications?.length || 0 }} MEDS
                  </q-chip>
                </q-item-section>
              </template>

              <div class="prescription-body-pro">
                <div class="medications-section">
                  <div class="medications-title font-orbitron text-cyan-8">PRESCRIBED MEDICATIONS</div>
                  <div v-for="(med, i) in rx.medications" :key="i" class="medication-item-pro">
                    <div class="medication-icon">
                      <q-icon name="medication" color="cyan-6" size="1.2rem" />
                    </div>
                    <div class="medication-info">
                      <div class="medication-name font-orbitron text-white">{{ med.name }}</div>
                      <div class="medication-details">
                        <q-chip dense dark color="grey-9" class="font-orbitron med-detail-chip">{{ med.dosage }}</q-chip>
                        <q-chip dense dark color="grey-9" class="font-orbitron med-detail-chip">{{ med.frequency }}</q-chip>
                        <q-chip dense dark color="grey-9" class="font-orbitron med-detail-chip">{{ med.duration }}</q-chip>
                      </div>
                      <div v-if="med.notes" class="medication-notes text-grey-6">{{ med.notes }}</div>
                    </div>
                  </div>
                </div>

                <div v-if="rx.notes" class="doctor-notes-section">
                  <div class="notes-title font-orbitron text-cyan-8">DOCTOR'S NOTES</div>
                  <div class="notes-content-pro">
                    <div class="notes-text text-grey-5">{{ rx.notes }}</div>
                  </div>
                </div>
              </div>
            </q-expansion-item>
          </div>
        </div>
      </q-tab-panel>
    </q-tab-panels>

    <!-- Upload Dialog -->
    <q-dialog v-model="uploadDialog" persistent>
      <q-card class="upload-dialog-pro">
        <div class="dialog-header-pro">
          <q-icon name="upload_file" color="cyan-4" size="1.5rem" />
          <span class="font-orbitron text-white">UPLOAD MEDICAL REPORT</span>
        </div>

        <q-form @submit="doUploadReport" class="upload-form-pro">
          <div class="form-field-pro">
            <div class="field-label-pro">REPORT TITLE *</div>
            <q-input v-model="rForm.title" placeholder="e.g. Blood Test Results" dark outlined color="cyan-4" class="nexus-field-pro" />
          </div>

          <div class="form-field-pro">
            <div class="field-label-pro">DESCRIPTION</div>
            <q-input v-model="rForm.description" placeholder="Optional details..." dark outlined color="cyan-4" class="nexus-field-pro" type="textarea" rows="3" />
          </div>

          <div class="form-field-pro">
            <div class="field-label-pro">FILE (PDF or Image) *</div>
            <q-file v-model="rForm.file" dark outlined color="cyan-4" class="nexus-field-pro" accept=".pdf,.jpg,.jpeg,.png">
              <template #prepend><q-icon name="attach_file" color="cyan-8" /></template>
            </q-file>
          </div>

          <div class="dialog-actions-pro">
            <q-btn flat label="CANCEL" color="grey-6" class="font-orbitron" v-close-popup @click="resetRForm" />
            <q-btn type="submit" label="UPLOAD" class="upload-submit-btn-pro font-orbitron" :loading="uploadingReport" />
          </div>
        </q-form>
      </q-card>
    </q-dialog>
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
const storedUser = JSON.parse(localStorage.getItem('nexus_user') || '{}')

const tab = ref('profile')
const profileData = ref({})
const reports = ref([])
const prescriptions = ref([])
const savingProfile = ref(false)
const uploadDialog = ref(false)
const uploadingReport = ref(false)

const bloodGroups = ['A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown']

const editForm = reactive({
  name: '', phone: '', dateOfBirth: '', gender: '', bloodGroup: '',
  allergies: [], chronicConditions: [],
  address: { city: '', district: '', postalCode: '', street: '' },
  emergencyContact: { name: '', phone: '', relationship: '' }
})

const rForm = reactive({ title: '', description: '', file: null })
const resetRForm = () => { rForm.title = ''; rForm.description = ''; rForm.file = null }

// Navigation functions
const goToSymptoms = () => {
  window.location.href = 'http://localhost:9000/symptoms'
}

const goToVideoConsultation = () => {
  const pId = profileData.value.patientId || profileData.value.id;
  const pName = profileData.value.name;
  window.location.href = `http://localhost:9000/patientVideo?patientId=${pId}&patientName=${pName}`;
}

// API client
const api = axios.create({
  baseURL: 'http://localhost:5001',
  headers: { Authorization: `Bearer ${token}` }
})

// Computed stat cards
const statCards = computed(() => [
  { label: 'REPORTS', value: reports.value.length, icon: 'description', color: 'cyan-4', fill: `${Math.min(reports.value.length * 10, 100)}%` },
  { label: 'PRESCRIPTIONS', value: prescriptions.value.length, icon: 'medication', color: 'green-4', fill: `${Math.min(prescriptions.value.length * 15, 100)}%` },
  { label: 'BLOOD GROUP', value: profileData.value.bloodGroup || '—', icon: 'bloodtype', color: 'red-4', fill: '70%' },
  { label: 'ALLERGIES', value: profileData.value.allergies?.length || 0, icon: 'warning_amber', color: 'orange-4', fill: `${Math.min((profileData.value.allergies?.length || 0) * 20, 100)}%` }
])

// Helper functions
const getGradientColor = (color) => {
  const colors = {
    'cyan-4': '#00e5ff',
    'green-4': '#69f0ae',
    'red-4': '#ff5252',
    'orange-4': '#ff9100'
  }
  return colors[color] || '#00e5ff'
}

const calculateAge = (dob) => {
  if (!dob) return null
  const birthDate = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

// Load all data
const loadAll = async () => {
  await Promise.all([loadProfile(), loadReports(), loadPrescriptions()])
}

const loadProfile = async () => {
  try {
    const { data } = await api.get('/api/patient/profile')
    profileData.value = data.data

    // Fill edit form
    const d = data.data
    editForm.name = d.name || ''
    editForm.phone = d.phone || ''
    editForm.dateOfBirth = d.dateOfBirth ? new Date(d.dateOfBirth).toISOString().split('T')[0] : ''
    editForm.gender = d.gender || ''
    editForm.bloodGroup = d.bloodGroup || ''
    editForm.allergies = d.allergies || []
    editForm.chronicConditions = d.chronicConditions || []
    editForm.address = { city: '', district: '', postalCode: '', street: '', ...(d.address || {}) }
    editForm.emergencyContact = { name: '', phone: '', relationship: '', ...(d.emergencyContact || {}) }
  } catch (e) {
    if (e.response?.status === 401) router.push('/login')
  }
}

const loadReports = async () => {
  try {
    const { data } = await api.get('/api/patient/reports')
    reports.value = data.data
  } catch (err) {
    console.error('Reports load error:', err)
  }
}

const loadPrescriptions = async () => {
  try {
    const { data } = await api.get('/api/patient/prescriptions')
    prescriptions.value = data.data
  } catch (err) {
    console.error('Prescriptions load error:', err)
  }
}

const doSaveProfile = async () => {
  savingProfile.value = true
  try {
    await api.put('/api/patient/profile', editForm)
    await loadProfile()
    $q.notify({ icon: 'check_circle', color: 'cyan-9', message: 'Profile updated successfully', position: 'top-right', timeout: 2000 })
  } catch (e) {
    $q.notify({ type: 'negative', message: e.response?.data?.message || 'Update failed', position: 'top-right' })
  } finally {
    savingProfile.value = false
  }
}

const doUploadImage = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  const fd = new FormData()
  fd.append('image', file)
  try {
    await api.post('/api/patient/profile/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    await loadProfile()
    $q.notify({ icon: 'check_circle', color: 'cyan-9', message: 'Photo updated', position: 'top-right' })
  } catch {
    $q.notify({ type: 'negative', message: 'Image upload failed', position: 'top-right' })
  }
}

const doUploadReport = async () => {
  if (!rForm.title || !rForm.file) {
    $q.notify({ type: 'warning', message: 'Title and file are required', position: 'top-right' })
    return
  }
  uploadingReport.value = true
  const fd = new FormData()
  fd.append('report', rForm.file)
  fd.append('title', rForm.title)
  fd.append('description', rForm.description)
  try {
    await api.post('/api/patient/reports', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    uploadDialog.value = false
    resetRForm()
    await loadReports()
    $q.notify({ icon: 'check_circle', color: 'cyan-9', message: 'Report uploaded', position: 'top-right' })
  } catch {
    $q.notify({ type: 'negative', message: 'Upload failed', position: 'top-right' })
  } finally {
    uploadingReport.value = false
  }
}

const doDeleteReport = (reportId) => {
  $q.dialog({
    title: 'Delete Report',
    message: 'This action cannot be undone. Continue?',
    ok: { label: 'DELETE', color: 'red', flat: true },
    cancel: { label: 'CANCEL', flat: true },
    dark: true
  }).onOk(async () => {
    try {
      await api.delete(`/api/patient/reports/${reportId}`)
      await loadReports()
      $q.notify({ icon: 'delete', color: 'grey-7', message: 'Report deleted', position: 'top-right' })
    } catch {
      $q.notify({ type: 'negative', message: 'Delete failed', position: 'top-right' })
    }
  })
}

const logout = () => {
  localStorage.removeItem('nexus_token')
  localStorage.removeItem('nexus_user')
  router.push('/login')
}

onMounted(() => {
  if (!token) { router.push('/login'); return }
  if (storedUser.role !== 'patient') { router.push('/'); return }
  loadAll()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&display=swap');
.font-orbitron { font-family: 'Orbitron', sans-serif; }
.capitalize { text-transform: capitalize; }
.hidden { display: none; }

/* Background */
.patient-dashboard-bg {
  background: linear-gradient(135deg, #0a1416 0%, #060e10 50%, #04080a 100%);
  min-height: 100vh;
  position: relative;
}

.patient-dashboard-bg::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background:
    radial-gradient(circle at 20% 80%, rgba(0,229,255,0.05) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(0,188,212,0.03) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(0,150,136,0.02) 0%, transparent 50%);
  pointer-events: none;
}

/* Top Bar */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background: rgba(6,14,16,0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0,229,255,0.1);
  position: relative;
  z-index: 10;
}

.top-left {
  display: flex;
  align-items: center;
  gap: 30px;
}

.logo-wrapper {
  position: relative;
}

.logo-inner {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 3px;
}

.logo-glow {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 100px; height: 100px;
  background: radial-gradient(circle, rgba(0,229,255,0.2), transparent);
  filter: blur(20px);
  z-index: -1;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-avatar {
  width: 45px; height: 45px;
  border-radius: 50%;
  background: rgba(0,229,255,0.1);
  border: 2px solid rgba(0,229,255,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.user-avatar img {
  width: 100%; height: 100%;
  object-fit: cover;
}

.user-name {
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 1px;
}

.user-role {
  font-size: 0.7rem;
  letter-spacing: 2px;
  margin-top: 2px;
}

.top-right {
  display: flex;
  align-items: center;
}

.top-btn {
  width: 40px; height: 40px;
  background: rgba(0,229,255,0.05);
  border: 1px solid rgba(0,229,255,0.1);
  transition: all 0.3s;
}

.top-btn:hover {
  background: rgba(0,229,255,0.1);
  border-color: rgba(0,229,255,0.3);
  transform: scale(1.1);
}

/* Quick Actions Bar */
.quick-actions-bar {
  padding: 20px 40px;
  background: rgba(6,14,16,0.6);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0,229,255,0.05);
}

.quick-actions-inner {
  display: flex;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.action-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 25px;
  background: linear-gradient(135deg, rgba(0,229,255,0.05), rgba(0,188,212,0.02));
  border: 1px solid rgba(0,229,255,0.15);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.action-card::before {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(0,229,255,0.1), transparent);
  transition: left 0.6s;
}

.action-card:hover::before {
  left: 100%;
}

.action-card:hover {
  transform: translateY(-3px);
  border-color: rgba(0,229,255,0.3);
  box-shadow: 0 10px 30px rgba(0,229,255,0.15);
}

.action-icon-wrapper {
  position: relative;
  width: 60px; height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.3);
  border-radius: 12px;
  border: 1px solid rgba(0,229,255,0.2);
}

.action-icon-glow {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 40px; height: 40px;
  background: radial-gradient(circle, rgba(0,229,255,0.3), transparent);
  filter: blur(10px);
  animation: pulse 2s infinite;
}

.green-glow { background: radial-gradient(circle, rgba(76,175,80,0.3), transparent); }
.purple-glow { background: radial-gradient(circle, rgba(156,39,176,0.3), transparent); }

@keyframes pulse {
  0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
}

.action-content {
  flex: 1;
}

.action-title {
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 2px;
  margin-bottom: 4px;
}

.action-subtitle {
  font-size: 0.7rem;
  letter-spacing: 1px;
}

.action-arrow {
  opacity: 0.6;
  transition: all 0.3s;
}

.action-card:hover .action-arrow {
  opacity: 1;
  transform: translateX(3px);
}

/* Metrics Section */
.metrics-section {
  padding: 30px 40px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.metric-card-pro {
  padding: 25px;
  background: linear-gradient(135deg, rgba(0,229,255,0.03), rgba(0,188,212,0.01));
  border: 1px solid rgba(0,229,255,0.1);
  border-radius: 16px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}

.metric-card-pro::after {
  content: '';
  position: absolute;
  top: -50%; right: -50%;
  width: 200%; height: 200%;
  background: radial-gradient(circle, rgba(0,229,255,0.05), transparent);
  animation: rotate 20s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.metric-card-pro:hover {
  border-color: rgba(0,229,255,0.2);
  transform: translateY(-2px);
}

.metric-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.metric-icon-wrapper {
  position: relative;
  width: 45px; height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.3);
  border-radius: 10px;
  border: 1px solid rgba(0,229,255,0.2);
}

.metric-icon-pulse {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 30px; height: 30px;
  background: radial-gradient(circle, rgba(0,229,255,0.2), transparent);
  filter: blur(8px);
  animation: pulse 2s infinite;
}

.metric-label {
  font-size: 0.65rem;
  letter-spacing: 2px;
}

.metric-value {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 15px;
  position: relative;
  z-index: 1;
}

.metric-progress {
  position: relative;
  height: 4px;
  background: rgba(255,255,255,0.05);
  border-radius: 2px;
  overflow: hidden;
}

.metric-track {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(255,255,255,0.05);
}

.metric-fill-pro {
  height: 100%;
  border-radius: 2px;
  transition: width 1.5s ease;
  position: relative;
}

.metric-fill-pro::after {
  content: '';
  position: absolute;
  top: 0; right: 0;
  width: 20px; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3));
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  from { transform: translateX(-20px); }
  to { transform: translateX(20px); }
}

/* Tabs */
.tabs-wrapper {
  padding: 0 40px;
  background: rgba(6,14,16,0.8);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(0,229,255,0.05);
}

.nexus-tabs-pro {
  background: transparent;
}

.nexus-tabs-pro :deep(.q-tab) {
  padding: 12px 24px;
  font-size: 0.7rem;
  letter-spacing: 2px;
  font-weight: 600;
  min-height: 60px;
}

.nexus-tabs-pro :deep(.q-tab__content) {
  min-width: auto;
}

.nexus-tabs-pro :deep(.q-tab__indicator) {
  height: 3px;
  border-radius: 3px 3px 0 0;
}

/* Tab Panels */
.tab-panels-pro {
  background: transparent;
  padding: 40px;
}

/* Profile Container */
.profile-container {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 30px;
  max-width: 1400px;
  margin: 0 auto;
}

.profile-left {
  height: fit-content;
}

.profile-card-pro {
  background: linear-gradient(135deg, rgba(6,14,16,0.9), rgba(10,20,22,0.9));
  border: 1px solid rgba(0,229,255,0.15);
  border-radius: 20px;
  padding: 30px;
  backdrop-filter: blur(20px);
  position: relative;
  overflow: hidden;
}

.profile-card-pro::before {
  content: '';
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background:
    radial-gradient(circle at 30% 30%, rgba(0,229,255,0.05), transparent 40%),
    radial-gradient(circle at 70% 70%, rgba(0,188,212,0.03), transparent 40%);
  pointer-events: none;
}

.profile-header {
  text-align: center;
  margin-bottom: 30px;
}

.avatar-wrapper-pro {
  position: relative;
  display: inline-block;
  margin-bottom: 20px;
}

.patient-avatar-pro {
  background: rgba(0,229,255,0.08);
  border: 3px solid rgba(0,229,255,0.3);
  box-shadow: 0 0 30px rgba(0,229,255,0.2);
}

.avatar-ring {
  position: absolute;
  top: -5px; left: -5px;
  right: -5px; bottom: -5px;
  border: 2px solid transparent;
  border-radius: 50%;
  background: linear-gradient(45deg, #00e5ff, #00bcd4, #00e5ff);
  background-clip: padding-box;
  animation: rotate 3s linear infinite;
  z-index: -1;
}

.avatar-cam-btn-pro {
  position: absolute !important;
  bottom: 5px; right: 5px;
  background: rgba(6,14,16,0.95) !important;
  border: 1px solid rgba(0,229,255,0.4);
  width: 36px; height: 36px;
}

.profile-name {
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: 2px;
  margin-bottom: 5px;
}

.profile-email {
  font-size: 0.85rem;
  letter-spacing: 1px;
  margin-bottom: 3px;
}

.profile-phone {
  font-size: 0.8rem;
}

.profile-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0,229,255,0.2), transparent);
  margin: 25px 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 25px;
}

.info-item {
  text-align: center;
  padding: 15px;
  background: rgba(0,229,255,0.02);
  border: 1px solid rgba(0,229,255,0.08);
  border-radius: 12px;
  transition: all 0.3s;
}

.info-item:hover {
  border-color: rgba(0,229,255,0.15);
  background: rgba(0,229,255,0.04);
}

.info-label {
  font-size: 0.55rem;
  letter-spacing: 1.5px;
  margin-bottom: 8px;
}

.info-value {
  font-size: 1.1rem;
  font-weight: 600;
}

.medical-tags {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tags-section {
  padding: 15px;
  background: rgba(0,0,0,0.2);
  border-radius: 12px;
}

.tags-title {
  font-size: 0.6rem;
  letter-spacing: 2px;
  margin-bottom: 10px;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-chip {
  font-size: 0.55rem;
  height: 24px;
}

.no-tags {
  font-size: 0.75rem;
  font-style: italic;
}

/* Profile Right - Form */
.profile-right {
  height: fit-content;
}

.form-card-pro {
  background: linear-gradient(135deg, rgba(6,14,16,0.9), rgba(10,20,22,0.9));
  border: 1px solid rgba(0,229,255,0.15);
  border-radius: 20px;
  padding: 35px;
  backdrop-filter: blur(20px);
}

.form-header-pro {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(0,229,255,0.1);
}

.form-header-pro span {
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 2px;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.section-title-pro {
  font-size: 0.65rem;
  letter-spacing: 2.5px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0,229,255,0.08);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.form-field-pro {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-field-pro.full-width {
  grid-column: 1 / -1;
}

.field-label-pro {
  font-size: 0.6rem;
  letter-spacing: 2px;
  color: rgba(0,229,255,0.5);
}

.nexus-field-pro :deep(.q-field__control) {
  border-radius: 12px;
  background: rgba(0,229,255,0.02);
  border: 1px solid rgba(0,229,255,0.1);
  transition: all 0.3s;
}

.nexus-field-pro :deep(.q-field__control:hover) {
  border-color: rgba(0,229,255,0.2);
  background: rgba(0,229,255,0.04);
}

.form-actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.save-btn-pro {
  background: linear-gradient(135deg, #00494f, #006064, #007c80);
  color: #fff !important;
  border-radius: 12px;
  font-size: 0.75rem;
  letter-spacing: 2px;
  padding: 12px 40px;
  box-shadow: 0 6px 25px rgba(0,188,212,0.2);
  transition: all 0.3s;
}

.save-btn-pro:hover {
  box-shadow: 0 8px 35px rgba(0,188,212,0.3);
  transform: translateY(-2px);
}

/* Reports Container */
.reports-container {
  max-width: 1200px;
  margin: 0 auto;
}

.reports-header-pro {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(0,229,255,0.1);
}

.reports-title-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.reports-title {
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: 2px;
}

.reports-subtitle {
  font-size: 0.8rem;
  letter-spacing: 1px;
  margin-top: 3px;
}

.upload-btn-pro {
  background: linear-gradient(135deg, #00494f, #006064, #007c80);
  color: #fff !important;
  border-radius: 12px;
  font-size: 0.7rem;
  letter-spacing: 2px;
  padding: 10px 25px;
  box-shadow: 0 4px 20px rgba(0,188,212,0.15);
  transition: all 0.3s;
}

.upload-btn-pro:hover {
  box-shadow: 0 6px 30px rgba(0,188,212,0.25);
  transform: translateY(-2px);
}

.empty-state-pro {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  background: rgba(0,229,255,0.01);
  border: 1px solid rgba(0,229,255,0.05);
  border-radius: 20px;
}

.empty-icon-wrapper {
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-title {
  font-size: 1.1rem;
  letter-spacing: 2px;
  margin-bottom: 10px;
}

.empty-subtitle {
  font-size: 0.85rem;
  opacity: 0.7;
}

.reports-grid-pro {
  display: grid;
  gap: 15px;
}

.report-card-pro {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 25px;
  background: linear-gradient(135deg, rgba(0,229,255,0.03), rgba(0,188,212,0.01));
  border: 1px solid rgba(0,229,255,0.1);
  border-radius: 16px;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.report-card-pro::before {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(0,229,255,0.05), transparent);
  transition: left 0.6s;
}

.report-card-pro:hover::before {
  left: 100%;
}

.report-card-pro:hover {
  border-color: rgba(0,229,255,0.2);
  transform: translateX(5px);
  box-shadow: 0 5px 25px rgba(0,229,255,0.1);
}

.report-icon-section {
  flex-shrink: 0;
}

.report-icon-wrapper {
  width: 60px; height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.3);
  border-radius: 12px;
  border: 1px solid rgba(0,229,255,0.15);
}

.report-content {
  flex: 1;
}

.report-title {
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 1px;
  margin-bottom: 5px;
}

.report-description {
  font-size: 0.85rem;
  margin-bottom: 10px;
  line-height: 1.4;
}

.report-meta {
  display: flex;
  align-items: center;
  gap: 15px;
}

.meta-chip {
  font-size: 0.55rem;
  height: 22px;
}

.report-date {
  font-size: 0.7rem;
  letter-spacing: 1px;
}

.report-actions {
  display: flex;
  gap: 8px;
}

/* Prescriptions Container */
.prescriptions-container {
  max-width: 1200px;
  margin: 0 auto;
}

.prescriptions-header-pro {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(0,229,255,0.1);
}

.prescriptions-title-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.prescriptions-title {
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: 2px;
}

.prescriptions-subtitle {
  font-size: 0.8rem;
  letter-spacing: 1px;
  margin-top: 3px;
}

.prescriptions-list-pro {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.prescription-item-pro {
  background: linear-gradient(135deg, rgba(0,229,255,0.03), rgba(0,188,212,0.01));
  border: 1px solid rgba(0,229,255,0.1);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s;
}

.prescription-item-pro:hover {
  border-color: rgba(0,229,255,0.2);
  box-shadow: 0 5px 25px rgba(0,229,255,0.1);
}

.prescription-header-pro {
  background: rgba(0,0,0,0.2);
  padding: 20px 25px;
}

.prescription-avatar-pro {
  width: 50px; height: 50px;
  background: rgba(0,229,255,0.08);
  border: 2px solid rgba(0,229,255,0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.prescription-diagnosis {
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 1px;
}

.prescription-doctor {
  font-size: 0.8rem;
  letter-spacing: 0.5px;
  margin-top: 3px;
}

.med-count-chip {
  font-size: 0.55rem;
  height: 24px;
}

.prescription-body-pro {
  padding: 25px;
  background: rgba(0,0,0,0.1);
}

.medications-section {
  margin-bottom: 25px;
}

.medications-title {
  font-size: 0.65rem;
  letter-spacing: 2px;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0,229,255,0.08);
}

.medication-item-pro {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px;
  background: rgba(0,229,255,0.02);
  border: 1px solid rgba(0,229,255,0.08);
  border-radius: 12px;
  margin-bottom: 12px;
  transition: all 0.3s;
}

.medication-item-pro:hover {
  border-color: rgba(0,229,255,0.15);
  background: rgba(0,229,255,0.04);
}

.medication-icon {
  width: 40px; height: 40px;
  background: rgba(0,0,0,0.3);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.medication-info {
  flex: 1;
}

.medication-name {
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.medication-details {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.med-detail-chip {
  font-size: 0.55rem;
  height: 22px;
}

.medication-notes {
  font-size: 0.75rem;
  font-style: italic;
  line-height: 1.4;
}

.doctor-notes-section {
  padding-top: 20px;
  border-top: 1px solid rgba(0,229,255,0.08);
}

.notes-title {
  font-size: 0.65rem;
  letter-spacing: 2px;
  margin-bottom: 12px;
}

.notes-content-pro {
  padding: 15px;
  background: rgba(0,0,0,0.2);
  border-left: 3px solid rgba(0,229,255,0.3);
  border-radius: 0 12px 12px 0;
}

.notes-text {
  font-size: 0.85rem;
  line-height: 1.5;
  font-style: italic;
}

/* Upload Dialog */
.upload-dialog-pro {
  background: linear-gradient(135deg, #060e10, #0a1416);
  border: 1px solid rgba(0,229,255,0.2);
  border-radius: 20px;
  min-width: 450px;
  padding: 0;
  overflow: hidden;
}

.dialog-header-pro {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 25px 30px;
  background: rgba(0,229,255,0.05);
  border-bottom: 1px solid rgba(0,229,255,0.1);
}

.dialog-header-pro span {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 2px;
}

.upload-form-pro {
  padding: 30px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dialog-actions-pro {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 10px;
  padding-top: 20px;
  border-top: 1px solid rgba(0,229,255,0.1);
}

.upload-submit-btn-pro {
  background: linear-gradient(135deg, #00494f, #006064, #007c80);
  color: #fff !important;
  border-radius: 10px;
  font-size: 0.7rem;
  letter-spacing: 2px;
  padding: 10px 25px;
  box-shadow: 0 4px 20px rgba(0,188,212,0.15);
  transition: all 0.3s;
}

.upload-submit-btn-pro:hover {
  box-shadow: 0 6px 30px rgba(0,188,212,0.25);
  transform: translateY(-1px);
}

/* Responsive */
@media (max-width: 1024px) {
  .profile-container {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .top-bar {
    padding: 15px 20px;
  }

  .quick-actions-inner {
    flex-direction: column;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .tab-panels-pro {
    padding: 20px;
  }
}
</style>
