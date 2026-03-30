<template>
  <q-page class="text-white font-jakarta flex flex-center relative-position page-shell overflow-hidden">
    <!-- Atmospheric Background -->
    <div class="page-bg-gradient"></div>

    <div class="row justify-center full-width z-top max-width-1200 q-px-md">
      <div class="col-12 col-md-10 col-lg-9">

        <!-- Header area -->
        <div class="text-center q-mb-xl mt-120">
          <div class="header-actions row items-center justify-between q-mb-lg">
            <div class="trusted-badge q-py-xs q-px-sm row items-center inline no-wrap">
              <q-icon name="verified_user" color="blue-4" size="14px" class="q-mr-sm" />
              <span class="text-caption text-weight-bolder tracking-wider text-blue-2 uppercase">Patient Dashboard</span>
            </div>
            <div class="header-buttons row items-center q-gutter-sm">
              <q-btn flat round icon="settings" color="blue-4" size="sm" @click="tab = 'profile'" class="hover-glow" />
              <q-btn flat round icon="logout" color="red-5" size="sm" @click="logout" class="hover-glow" />
            </div>
          </div>
          <h1 class="page-title q-ma-none text-weight-bolder">
            Welcome, <span class="text-gradient-primary">{{ profileData.name || 'Patient' }}</span>
          </h1>
          <p class="text-grey-4 text-body1 q-mt-md mx-auto">Your medical profile, reports, and prescriptions in one place</p>
        </div>

        <!-- Quick Actions -->
        <div class="row q-col-gutter-md q-mb-xl">
          <div class="col-12 col-sm-4">
            <div class="quick-action-card" @click="goToSymptoms">
              <div class="action-icon-box">
                <q-icon name="medical_services" size="1.5rem" color="blue-4" />
              </div>
              <div class="action-title font-weight-bold text-white">AI Symptom</div>
              <div class="action-subtitle text-grey-5">Check Now</div>
            </div>
          </div>
          <div class="col-12 col-sm-4">
            <div class="quick-action-card" @click="goToVideoConsultation">
              <div class="action-icon-box">
                <q-icon name="videocam" size="1.5rem" color="green-4" />
              </div>
              <div class="action-title font-weight-bold text-white">Video Call</div>
              <div class="action-subtitle text-grey-5">Consult</div>
            </div>
          </div>
          <div class="col-12 col-sm-4">
            <div class="quick-action-card" @click="$router.push('/appointment')">
              <div class="action-icon-box">
                <q-icon name="event" size="1.5rem" color="purple-4" />
              </div>
              <div class="action-title font-weight-bold text-white">Book</div>
              <div class="action-subtitle text-grey-5">Appointment</div>
            </div>
          </div>
        </div>

        <!-- Tabs ═════════════════════════════════════════════════════ -->
        <div class="glass-card q-pa-none shadow-glow relative-position q-mb-xl">
          <q-tabs v-model="tab" dense class="modernized-tabs" indicator-color="blue-6" active-color="blue-6" inactive-color="grey-6">
            <q-tab name="profile" icon="person" label="PROFILE" class="text-weight-bold" />
            <q-tab name="reports" icon="folder" label="REPORTS" class="text-weight-bold" />
            <q-tab name="prescriptions" icon="medication" label="PRESCRIPTIONS" class="text-weight-bold" />
          </q-tabs>
        </div>

        <q-tab-panels v-model="tab" animated class="q-pa-none">
          <!-- PROFILE TAB ═══════════════════════════════════════════════ -->
          <q-tab-panel name="profile" class="q-pa-none patient-panel">
          <div class="glass-card q-pa-xl shadow-glow profile-main-card">
            <!-- Avatar Section -->
            <div class="text-center q-mb-xl">
              <div class="avatar-wrapper-pro relative-position inline-block q-mb-md">
                <q-avatar size="120px" class="profile-avatar-modern">
                  <img v-if="profileData.profileImage?.url" :src="profileData.profileImage.url" />
                  <q-icon v-else name="person" color="blue-4" size="3.5rem" />
                </q-avatar>
                <q-btn
                  round flat icon="photo_camera" color="blue-4" size="sm"
                  class="avatar-cam-btn-pro"
                  @click="$refs.imgFile.click()"
                />
                <input ref="imgFile" type="file" accept="image/*" class="hidden" @change="doUploadImage" />
              </div>
              <div class="profile-name text-h4 text-weight-bold text-white q-mb-sm">{{ profileData.name }}</div>
              <div class="profile-email text-grey-5">{{ profileData.email }}</div>
              <div class="profile-phone text-grey-6">{{ profileData.phone || '—' }}</div>
            </div>

            <q-separator dark class="q-my-lg" style="opacity: 0.3;" />

            <!-- Info Grid -->
            <div class="row q-col-gutter-lg q-mb-xl">
              <div class="col-12 col-sm-6">
                <div class="info-block">
                  <div class="info-label text-caption text-weight-bold text-grey-5 uppercase letter-spacing-1 q-mb-xs">Gender</div>
                  <div class="text-h6 text-white">{{ profileData.gender ? profileData.gender.charAt(0).toUpperCase() + profileData.gender.slice(1) : '—' }}</div>
                </div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="info-block">
                  <div class="info-label text-caption text-weight-bold text-grey-5 uppercase letter-spacing-1 q-mb-xs">Blood Group</div>
                  <div class="text-h6 text-white">{{ profileData.bloodGroup || '—' }}</div>
                </div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="info-block">
                  <div class="info-label text-caption text-weight-bold text-grey-5 uppercase letter-spacing-1 q-mb-xs">Age</div>
                  <div class="text-h6 text-white">{{ calculateAge(profileData.dateOfBirth) || '—' }} years</div>
                </div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="info-block">
                  <div class="info-label text-caption text-weight-bold text-grey-5 uppercase letter-spacing-1 q-mb-xs">Allergies</div>
                  <div class="text-h6 text-white">{{ profileData.allergies?.length || 0 }}</div>
                </div>
              </div>
            </div>

            <!-- Allergies & Conditions -->
            <div class="row q-col-gutter-lg q-mb-xl">
              <div class="col-12 col-sm-6">
                <div class="tag-section">
                  <div class="tag-title text-caption text-weight-bold text-grey-5 uppercase letter-spacing-1 q-mb-md">Known Allergies</div>
                  <div v-if="profileData.allergies?.length" class="q-gutter-sm">
                    <q-chip v-for="a in profileData.allergies" :key="a" dark color="red-10" text-color="white" dense class="q-pa-md">{{ a }}</q-chip>
                  </div>
                  <div v-else class="text-grey-6">No allergies recorded</div>
                </div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="tag-section">
                  <div class="tag-title text-caption text-weight-bold text-grey-5 uppercase letter-spacing-1 q-mb-md">Chronic Conditions</div>
                  <div v-if="profileData.chronicConditions?.length" class="q-gutter-sm">
                    <q-chip v-for="c in profileData.chronicConditions" :key="c" dark color="orange-10" text-color="white" dense class="q-pa-md">{{ c }}</q-chip>
                  </div>
                  <div v-else class="text-grey-6">No chronic conditions recorded</div>
                </div>
              </div>
            </div>

            <!-- Edit Form -->
            <q-separator dark class="q-my-lg" style="opacity: 0.3;" />

            <div class="text-weight-bold text-h6 text-white q-mb-lg">Edit Profile</div>
            <q-form @submit="doSaveProfile" class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <div class="text-caption text-weight-bold text-grey-5 uppercase letter-spacing-1 q-mb-sm">Full Name</div>
                <q-input v-model="editForm.name" dark outlined color="blue-4" class="modern-input" />
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-weight-bold text-grey-5 uppercase letter-spacing-1 q-mb-sm">Phone</div>
                <q-input v-model="editForm.phone" dark outlined color="blue-4" class="modern-input" />
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-weight-bold text-grey-5 uppercase letter-spacing-1 q-mb-sm">Date of Birth</div>
                <q-input v-model="editForm.dateOfBirth" type="date" dark outlined color="blue-4" class="modern-input" />
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-weight-bold text-grey-5 uppercase letter-spacing-1 q-mb-sm">Gender</div>
                <q-select v-model="editForm.gender" :options="['male', 'female', 'other']" dark outlined color="blue-4" class="modern-input" />
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-caption text-weight-bold text-grey-5 uppercase letter-spacing-1 q-mb-sm">Blood Group</div>
                <q-select v-model="editForm.bloodGroup" :options="bloodGroups" dark outlined color="blue-4" class="modern-input" />
              </div>
              <div class="col-12">
                <div class="text-caption text-weight-bold text-grey-5 uppercase letter-spacing-1 q-mb-sm">Allergies</div>
                <q-select
                  v-model="editForm.allergies" multiple use-chips use-input new-value-mode="add-unique"
                  placeholder="Add allergies..."
                  dark outlined color="blue-4" class="modern-input"
                />
              </div>
              <div class="col-12">
                <div class="text-caption text-weight-bold text-grey-5 uppercase letter-spacing-1 q-mb-sm">Chronic Conditions</div>
                <q-select
                  v-model="editForm.chronicConditions" multiple use-chips use-input new-value-mode="add-unique"
                  placeholder="Add conditions..."
                  dark outlined color="blue-4" class="modern-input"
                />
              </div>
              <div class="col-12 text-right q-mt-md">
                <q-btn type="submit" unelevated label="Save Changes" color="blue-6" icon-right="save" class="btn-primary-glow q-px-lg" :loading="savingProfile" />
              </div>
            </q-form>
          </div>
        </q-tab-panel>

        <!-- REPORTS TAB ═══════════════════════════════════════════════ -->
        <q-tab-panel name="reports" class="q-pa-none">
          <div class="glass-card q-pa-xl shadow-glow">
            <div class="row items-center justify-between q-mb-lg">
              <div>
                <div class="text-h6 text-weight-bold text-white q-mb-xs">Medical Reports</div>
                <div class="text-caption text-grey-5">{{ reports.length }} document{{ reports.length !== 1 ? 's' : '' }} uploaded</div>
              </div>
              <q-btn unelevated label="Upload Report" color="blue-6" icon="upload_file" class="btn-primary-glow" @click="uploadDialog = true" />
            </div>

            <q-separator dark class="q-my-lg" style="opacity: 0.3;" />

            <div v-if="reports.length === 0" class="text-center q-py-xl">
              <q-icon name="description" size="3rem" color="grey-8" class="q-mb-md" />
              <div class="text-h6 text-grey-7">No reports uploaded</div>
              <div class="text-caption text-grey-6">Upload your medical reports to keep them organized</div>
            </div>

            <div v-else class="q-gutter-md">
              <div v-for="r in reports" :key="r.reportId" class="report-item-modern">
                <div class="row items-center q-gutter-md">
                  <div class="col-auto">
                    <div class="report-icon-box">
                      <q-icon :name="r.fileType === 'pdf' ? 'picture_as_pdf' : 'image'" :color="r.fileType === 'pdf' ? 'red-4' : 'blue-4'" size="2rem" />
                    </div>
                  </div>
                  <div class="col">
                    <div class="text-weight-bold text-white">{{ r.title }}</div>
                    <div class="text-caption text-grey-6">{{ r.description || 'No description' }}</div>
                    <div class="q-mt-xs row items-center q-gutter-xs">
                      <q-chip dense dark :color="r.fileType === 'pdf' ? 'red-10' : 'blue-10'" class="text-caption text-weight-bold">
                        {{ r.fileType?.toUpperCase() || 'FILE' }}
                      </q-chip>
                      <span class="text-caption text-grey-7">{{ formatDate(r.uploadedAt) }}</span>
                    </div>
                  </div>
                  <div class="col-auto row q-gutter-xs">
                    <q-btn flat round dense icon="visibility" color="blue-5" size="sm" @click="window.open(r.fileUrl, '_blank')">
                      <q-tooltip class="text-caption">View</q-tooltip>
                    </q-btn>
                    <q-btn flat round dense icon="delete_outline" color="red-5" size="sm" @click="doDeleteReport(r.reportId)">
                      <q-tooltip class="text-caption">Delete</q-tooltip>
                    </q-btn>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </q-tab-panel>

        <!-- PRESCRIPTIONS TAB ══════════════════════════════════════════ -->
        <q-tab-panel name="prescriptions" class="q-pa-none">
          <div class="glass-card q-pa-xl shadow-glow">
            <div class="text-h6 text-weight-bold text-white q-mb-lg">Prescriptions</div>

            <div v-if="prescriptions.length === 0" class="text-center q-py-xl">
              <q-icon name="medication" size="3rem" color="grey-8" class="q-mb-md" />
              <div class="text-h6 text-grey-7">No prescriptions yet</div>
              <div class="text-caption text-grey-6">Prescriptions issued by your doctors will appear here</div>
            </div>

            <div v-else class="q-gutter-md">
              <q-expansion-item
                v-for="rx in prescriptions" :key="rx.prescriptionId"
                :label="rx.diagnosis || 'Prescription'"
                class="prescription-expansion"
                expand-icon-class="text-blue-4"
                dark
                header-class="prescription-header-modern"
              >
                <template #header>
                  <q-item-section avatar>
                    <div class="header-icon-box">
                      <q-icon name="medical_services" color="blue-4" />
                    </div>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-bold text-white">{{ rx.diagnosis || 'Prescription' }}</q-item-label>
                    <q-item-label caption class="text-grey-6">Dr. {{ rx.doctorName }} • {{ formatDate(rx.issuedAt) }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-chip dense dark color="blue-10" class="text-weight-bold text-caption">
                      {{ rx.medications?.length || 0 }} MEDS
                    </q-chip>
                  </q-item-section>
                </template>

                <div class="q-pa-lg">
                  <div class="q-mb-lg">
                    <div class="text-caption text-weight-bold text-grey-5 uppercase letter-spacing-1 q-mb-md">Medications</div>
                    <div class="q-gutter-md">
                      <div v-for="(med, i) in rx.medications" :key="i" class="medication-item-modern">
                        <div class="row items-start q-gutter-md">
                          <div class="col-auto">
                            <q-icon name="medication" color="blue-5" size="1.5rem" />
                          </div>
                          <div class="col">
                            <div class="text-weight-bold text-white q-mb-xs">{{ med.name }}</div>
                            <div class="row items-center q-gutter-xs q-mb-xs">
                              <q-chip dense dark color="grey-9" class="text-caption">{{ med.dosage }}</q-chip>
                              <q-chip dense dark color="grey-9" class="text-caption">{{ med.frequency }}</q-chip>
                              <q-chip dense dark color="grey-9" class="text-caption">{{ med.duration }}</q-chip>
                            </div>
                            <div v-if="med.notes" class="text-caption text-grey-6">{{ med.notes }}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <q-separator dark style="opacity: 0.3;" class="q-my-md" v-if="rx.notes" />

                  <div v-if="rx.notes">
                    <div class="text-caption text-weight-bold text-grey-5 uppercase letter-spacing-1 q-mb-md">Doctor's Notes</div>
                    <div class="system-bubble">
                      <div class="text-body2 text-white">{{ rx.notes }}</div>
                    </div>
                  </div>
                </div>
              </q-expansion-item>
            </div>
          </div>
        </q-tab-panel>
        </q-tab-panels>
      </div>
    </div>

    <!-- Upload Dialog -->
    <q-dialog v-model="uploadDialog" persistent>
      <q-card class="glass-card">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-weight-bold text-white">Upload Medical Report</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-form @submit="doUploadReport" class="q-pa-lg">
          <div class="q-mb-md">
            <div class="text-caption text-weight-bold text-grey-5 uppercase letter-spacing-1 q-mb-sm">Report Title *</div>
            <q-input v-model="rForm.title" placeholder="e.g., Blood Test Results" dark outlined color="blue-4" class="modern-input" />
          </div>

          <div class="q-mb-md">
            <div class="text-caption text-weight-bold text-grey-5 uppercase letter-spacing-1 q-mb-sm">Description</div>
            <q-input v-model="rForm.description" type="textarea" rows="3" placeholder="Optional details..." dark outlined color="blue-4" class="modern-input" />
          </div>

          <div class="q-mb-lg">
            <div class="text-caption text-weight-bold text-grey-5 uppercase letter-spacing-1 q-mb-sm">File (PDF or Image) *</div>
            <q-file v-model="rForm.file" dark outlined color="blue-4" class="modern-input" accept=".pdf,.jpg,.jpeg,.png" max-file-size="10485760">
              <template #prepend>
                <q-icon name="attach_file" color="blue-5" />
              </template>
            </q-file>
          </div>

          <div class="row q-gutter-md justify-end">
            <q-btn flat label="Cancel" color="grey-5" v-close-popup @click="resetRForm" />
            <q-btn type="submit" unelevated label="Upload" color="blue-6" class="btn-primary-glow" :loading="uploadingReport" />
          </div>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
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
  const pId = profileData.value.patientId || profileData.value.id
  const pName = profileData.value.name
  window.location.href = `http://localhost:9000/patientVideo?patientId=${pId}&patientName=${pName}`
}

// API client
const api = axios.create({
  baseURL: 'http://localhost:5001',
  headers: { Authorization: `Bearer ${token}` }
})

// Helper functions
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
    $q.notify({ icon: 'check_circle', color: 'blue-6', message: 'Profile updated successfully', position: 'top-right', timeout: 2000 })
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
    $q.notify({ icon: 'check_circle', color: 'blue-6', message: 'Photo updated', position: 'top-right' })
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
    $q.notify({ icon: 'check_circle', color: 'blue-6', message: 'Report uploaded', position: 'top-right' })
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
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* GLOBAL */
.font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
.max-width-1200 { max-width: 1200px; }
.page-shell { padding-top: 80px; padding-bottom: 80px; }
.mt-120 { margin-top: 30px; }
.mx-auto { margin-left: auto; margin-right: auto; }
.z-top { position: relative; z-index: 1; }
.hidden { display: none; }
.capitalize { text-transform: capitalize; }
.letter-spacing-1 { letter-spacing: 1px; }
.tracking-wider { letter-spacing: 1.5px; }
.hover-glow { transition: all 0.3s ease; }
.hover-glow:hover {
  text-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
  transform: scale(1.1);
}

/* ATMOSPHERIC GRADIENTS */
.page-bg-gradient {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none;
  background:
    radial-gradient(circle at 50% 30%, rgba(37, 99, 235, 0.08), transparent 60%),
    radial-gradient(circle at 10% 80%, rgba(56, 189, 248, 0.04), transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.05), transparent 50%);
  z-index: 0;
}

/* TYPOGRAPHY */
.page-title {
  font-size: clamp(2rem, 4vw, 3.5rem);
  letter-spacing: -1px;
  line-height: 1.1;
  text-shadow: 0 10px 30px rgba(0,0,0,0.5);
}
.text-gradient-primary {
  background: linear-gradient(to right, #38bdf8, #818cf8, #e879f9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* BADGES & ICONS */
.trusted-badge {
  border: 1px solid rgba(125, 211, 252, 0.3);
  background: rgba(14, 165, 233, 0.1);
  backdrop-filter: blur(12px);
  border-radius: 50px;
  box-shadow: 0 0 20px rgba(14, 165, 233, 0.15);
}

.header-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(56, 189, 248, 0.1));
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(59, 130, 246, 0.2);
  flex-shrink: 0;
}

.action-icon-box {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* CARDS & CONTAINERS */
.glass-card {
  background: rgba(10, 15, 30, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  position: relative;
}

.system-bubble {
  background: rgba(37, 99, 235, 0.08);
  border: 1px solid rgba(37, 99, 235, 0.15);
  padding: 16px;
  border-radius: 16px;
}

.shadow-glow {
  box-shadow: 0 20px 60px rgba(59, 130, 246, 0.15);
}

/* QUICK ACTIONS */
.quick-action-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(59, 130, 246, 0.15);
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}
.quick-action-card:hover {
  background: rgba(59, 130, 246, 0.08);
  border-color: rgba(59, 130, 246, 0.3);
  transform: translateY(-4px);
  box-shadow: 0 10px 30px rgba(59, 130, 246, 0.2);
}
.action-title {
  font-size: 0.95rem;
  margin-top: 12px;
}
.action-subtitle {
  font-size: 0.8rem;
  margin-top: 4px;
}

/* TABS */
.modernized-tabs {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding: 0 20px;
  background: transparent;
}
.modernized-tabs :deep(.q-tabs__content) {
  color: rgba(255, 255, 255, 0.6);
}
.modernized-tabs :deep(.q-tab__label) {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* TAB PANELS */
:deep(.q-tab-panels) {
  background: transparent !important;
}
:deep(.q-tab-panel),
.patient-panel {
  background: transparent !important;
  padding: 0 !important;
}

/* PROFILE MAIN CARD */
.profile-main-card {
  background: linear-gradient(145deg, rgba(7, 16, 38, 0.88), rgba(8, 22, 52, 0.78)) !important;
  border: 1px solid rgba(83, 156, 255, 0.22) !important;
  box-shadow: 0 24px 70px rgba(0, 18, 51, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
  backdrop-filter: blur(22px) saturate(130%);
}

/* INPUTS */
.modern-input :deep(.q-field__control) {
  background: rgba(0, 0, 0, 0.2) !important;
  border-radius: 12px;
  padding: 12px 16px !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  transition: all 0.3s ease;
}
.modern-input :deep(.q-field__control:hover) {
  border-color: rgba(59, 130, 246, 0.3) !important;
}
.modern-input :deep(.q-field__control:focus-within) {
  border-color: rgba(59, 130, 246, 0.6) !important;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.1) !important;
}

/* BUTTONS */
.btn-primary-glow {
  border-radius: 12px;
  text-transform: none;
  background: linear-gradient(135deg, #1d4ed8, #2563eb) !important;
  box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.5);
  transition: all 0.3s ease;
  font-weight: 600;
  letter-spacing: 0.5px;
}
.btn-primary-glow:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 35px -5px rgba(37, 99, 235, 0.6);
}

/* PROFILE SECTION */
.profile-avatar-modern {
  border: 3px solid rgba(59, 130, 246, 0.3);
  box-shadow: 0 0 30px rgba(59, 130, 246, 0.2);
}
.avatar-cam-btn-pro {
  position: absolute !important;
  bottom: -8px !important;
  right: -8px !important;
  background: rgba(10, 15, 30, 0.8) !important;
  border: 2px solid rgba(59, 130, 246, 0.3) !important;
  backdrop-filter: blur(10px) !important;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3) !important;
}
.avatar-cam-btn-pro:hover {
  background: rgba(59, 130, 246, 0.2) !important;
  border-color: rgba(59, 130, 246, 0.6) !important;
}

.info-block {
  background: rgba(255, 255, 255, 0.02);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.tag-section {
  background: rgba(255, 255, 255, 0.02);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* REPORT ITEMS */
.report-item-modern {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s ease;
}
.report-item-modern:hover {
  background: rgba(59, 130, 246, 0.08);
  border-color: rgba(59, 130, 246, 0.2);
  transform: translateX(4px);
}

.report-icon-box {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* PRESCRIPTION EXPANSION */
.prescription-expansion :deep(.q-expansion-item__content) {
  background: rgba(255, 255, 255, 0.02);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}
.prescription-header-modern {
  background: rgba(255, 255, 255, 0.03) !important;
  border-radius: 16px !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  transition: all 0.3s ease !important;
}
.prescription-header-modern:hover {
  background: rgba(59, 130, 246, 0.08) !important;
  border-color: rgba(59, 130, 246, 0.2) !important;
}

/* MEDICATION ITEMS */
.medication-item-modern {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
}
.medication-item-modern:hover {
  background: rgba(59, 130, 246, 0.08);
  border-color: rgba(59, 130, 246, 0.2);
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .page-shell { padding-top: 60px; padding-bottom: 60px; }
  .page-title { font-size: 2rem; }
  .glass-card { padding: 20px !important; }
  .header-actions {
    flex-direction: column;
    align-items: flex-start;
  }
  .header-buttons {
    width: 100%;
    justify-content: flex-end;
    margin-top: 12px;
  }
}

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
