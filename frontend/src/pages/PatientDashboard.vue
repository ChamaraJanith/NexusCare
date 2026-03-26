<template>
  <q-page class="bg-black q-pa-lg patient-dash">

    <!-- Header -->
    <div class="row items-start justify-between q-mb-xl">
      <div>
        <div class="font-orbitron text-cyan-8 text-caption uppercase letter-spacing-3 q-mb-xs">
          ◈ PATIENT CONTROL NODE
        </div>
        <h1 class="text-h4 text-white font-orbitron q-ma-none q-mb-xs">
          {{ profileData.name || 'Loading...' }}
        </h1>
        <div class="row items-center q-gutter-sm">
          <q-chip dense dark color="cyan-10" class="font-orbitron text-caption">
            {{ profileData.userId }}
          </q-chip>
          <q-chip dense dark color="blue-10" class="font-orbitron text-caption">
            {{ profileData.patientId || profileData.roleId }}
          </q-chip>
          <q-chip dense dark :color="profileData.bloodGroup && profileData.bloodGroup !== 'Unknown' ? 'red-10' : 'grey-9'" class="font-orbitron text-caption">
            <q-icon name="bloodtype" size="xs" class="q-mr-xs" />
            {{ profileData.bloodGroup || 'Unknown' }}
          </q-chip>
        </div>
      </div>

      <div class="row q-gutter-sm items-center">
        <q-btn flat round icon="refresh" color="cyan-8" size="sm" @click="loadAll">
          <q-tooltip class="font-orbitron bg-dark">Refresh</q-tooltip>
        </q-btn>
        <q-btn flat round icon="logout" color="red-4" size="sm" @click="logout">
          <q-tooltip class="font-orbitron bg-dark text-red-4">Logout</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- Stats row -->
    <div class="row q-col-gutter-md q-mb-xl">
      <div v-for="s in statCards" :key="s.label" class="col-6 col-md-3">
        <div class="metric-card q-pa-md">
          <div class="row items-center justify-between q-mb-sm">
            <div class="font-orbitron text-caption" :class="`text-${s.color}`" style="font-size:0.6rem;letter-spacing:2px">{{ s.label }}</div>
            <q-icon :name="s.icon" :color="s.color" size="sm" />
          </div>
          <div class="text-h4 text-white font-orbitron">{{ s.value }}</div>
          <div class="metric-bar q-mt-sm"><div class="metric-fill" :style="{ width: s.fill, background: `var(--q-${s.color})` }"></div></div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <q-tabs
      v-model="tab" dense align="left"
      class="nexus-tabs font-orbitron q-mb-lg"
      active-color="cyan-4" indicator-color="cyan-4"
    >
      <q-tab name="profile" label="PROFILE" icon="person_outline" />
      <q-tab name="reports" label="REPORTS" icon="folder_open" />
      <q-tab name="prescriptions" label="PRESCRIPTIONS" icon="medication_liquid" />
    </q-tabs>

    <q-tab-panels v-model="tab" animated transition-prev="fade" transition-next="fade" class="bg-transparent">

      <!-- ══ PROFILE TAB ══════════════════════════════════════════════ -->
      <q-tab-panel name="profile" class="q-pa-none">
        <div class="row q-col-gutter-lg">

          <!-- Left: Avatar & info -->
          <div class="col-12 col-md-4">
            <div class="nexus-panel q-pa-xl text-center">
              <!-- Avatar -->
              <div class="avatar-wrap q-mb-lg" style="position:relative;display:inline-block">
                <q-avatar size="110px" class="patient-avatar">
                  <img v-if="profileData.profileImage?.url" :src="profileData.profileImage.url" />
                  <q-icon v-else name="person" color="cyan-4" size="3rem" />
                </q-avatar>
                <q-btn
                  round flat icon="photo_camera" color="cyan-4" size="xs"
                  class="avatar-cam-btn"
                  @click="$refs.imgFile.click()"
                />
                <input ref="imgFile" type="file" accept="image/*" class="hidden" @change="doUploadImage" />
              </div>

              <div class="text-h6 text-white font-orbitron">{{ profileData.name }}</div>
              <div class="text-cyan-7 text-caption q-mt-xs">{{ profileData.email }}</div>
              <div class="text-grey-6 text-caption">{{ profileData.phone || '—' }}</div>

              <q-separator dark class="q-my-lg opacity-20" />

              <div class="row justify-around text-center">
                <div>
                  <div class="text-caption font-orbitron text-cyan-8" style="font-size:0.6rem;letter-spacing:2px">GENDER</div>
                  <div class="text-white font-orbitron q-mt-xs capitalize">{{ profileData.gender || '—' }}</div>
                </div>
                <div>
                  <div class="text-caption font-orbitron text-cyan-8" style="font-size:0.6rem;letter-spacing:2px">BLOOD</div>
                  <div class="text-white font-orbitron q-mt-xs">{{ profileData.bloodGroup || '—' }}</div>
                </div>
              </div>

              <q-separator dark class="q-my-lg opacity-20" />

              <!-- Allergies -->
              <div class="text-left">
                <div class="section-micro-label q-mb-sm">ALLERGIES</div>
                <div v-if="profileData.allergies?.length" class="row q-gutter-xs flex-wrap">
                  <q-chip
                    v-for="a in profileData.allergies" :key="a"
                    dense dark color="red-10" class="font-orbitron text-caption"
                  >{{ a }}</q-chip>
                </div>
                <div v-else class="text-grey-8 text-caption">None recorded</div>
              </div>

              <div class="text-left q-mt-md">
                <div class="section-micro-label q-mb-sm">CHRONIC CONDITIONS</div>
                <div v-if="profileData.chronicConditions?.length" class="row q-gutter-xs flex-wrap">
                  <q-chip
                    v-for="c in profileData.chronicConditions" :key="c"
                    dense dark color="orange-10" class="font-orbitron text-caption"
                  >{{ c }}</q-chip>
                </div>
                <div v-else class="text-grey-8 text-caption">None recorded</div>
              </div>
            </div>
          </div>

          <!-- Right: Edit form -->
          <div class="col-12 col-md-8">
            <div class="nexus-panel q-pa-xl">
              <div class="panel-header q-mb-xl">
                <q-icon name="edit_note" color="cyan-4" class="q-mr-sm" />
                <span class="font-orbitron text-white uppercase">Update Profile</span>
              </div>

              <q-form @submit="doSaveProfile">
                <div class="form-section-label q-mb-md">PERSONAL DETAILS</div>
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-sm-6">
                    <div class="field-label q-mb-xs">FULL NAME</div>
                    <q-input v-model="editForm.name" dark outlined color="cyan-4" class="nexus-field" />
                  </div>
                  <div class="col-12 col-sm-6">
                    <div class="field-label q-mb-xs">PHONE</div>
                    <q-input v-model="editForm.phone" dark outlined color="cyan-4" class="nexus-field" />
                  </div>
                </div>

                <div class="row q-col-gutter-md q-mt-sm">
                  <div class="col-12 col-sm-4">
                    <div class="field-label q-mb-xs">DATE OF BIRTH</div>
                    <q-input v-model="editForm.dateOfBirth" type="date" dark outlined color="cyan-4" class="nexus-field" />
                  </div>
                  <div class="col-12 col-sm-4">
                    <div class="field-label q-mb-xs">GENDER</div>
                    <q-select v-model="editForm.gender" :options="['male','female','other']" dark outlined color="cyan-4" class="nexus-field" behavior="menu" :popup-content-style="ddStyle" />
                  </div>
                  <div class="col-12 col-sm-4">
                    <div class="field-label q-mb-xs">BLOOD GROUP</div>
                    <q-select v-model="editForm.bloodGroup" :options="bloodGroups" dark outlined color="cyan-4" class="nexus-field" behavior="menu" :popup-content-style="ddStyle" />
                  </div>
                </div>

                <div class="form-section-label q-mt-xl q-mb-md">MEDICAL INFO</div>
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-sm-6">
                    <div class="field-label q-mb-xs">ALLERGIES</div>
                    <q-select
                      v-model="editForm.allergies" multiple use-chips use-input new-value-mode="add-unique"
                      placeholder="Type and press Enter"
                      dark outlined color="cyan-4" class="nexus-field"
                    />
                  </div>
                  <div class="col-12 col-sm-6">
                    <div class="field-label q-mb-xs">CHRONIC CONDITIONS</div>
                    <q-select
                      v-model="editForm.chronicConditions" multiple use-chips use-input new-value-mode="add-unique"
                      placeholder="Type and press Enter"
                      dark outlined color="cyan-4" class="nexus-field"
                    />
                  </div>
                </div>

                <div class="form-section-label q-mt-xl q-mb-md">ADDRESS</div>
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-sm-4">
                    <div class="field-label q-mb-xs">CITY</div>
                    <q-input v-model="editForm.address.city" dark outlined color="cyan-4" class="nexus-field" />
                  </div>
                  <div class="col-12 col-sm-4">
                    <div class="field-label q-mb-xs">DISTRICT</div>
                    <q-input v-model="editForm.address.district" dark outlined color="cyan-4" class="nexus-field" />
                  </div>
                  <div class="col-12 col-sm-4">
                    <div class="field-label q-mb-xs">POSTAL CODE</div>
                    <q-input v-model="editForm.address.postalCode" dark outlined color="cyan-4" class="nexus-field" />
                  </div>
                </div>

                <div class="form-section-label q-mt-xl q-mb-md">EMERGENCY CONTACT</div>
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-sm-4">
                    <div class="field-label q-mb-xs">NAME</div>
                    <q-input v-model="editForm.emergencyContact.name" dark outlined color="cyan-4" class="nexus-field" />
                  </div>
                  <div class="col-12 col-sm-4">
                    <div class="field-label q-mb-xs">PHONE</div>
                    <q-input v-model="editForm.emergencyContact.phone" dark outlined color="cyan-4" class="nexus-field" />
                  </div>
                  <div class="col-12 col-sm-4">
                    <div class="field-label q-mb-xs">RELATIONSHIP</div>
                    <q-input v-model="editForm.emergencyContact.relationship" dark outlined color="cyan-4" class="nexus-field" />
                  </div>
                </div>

                <div class="q-mt-xl">
                  <q-btn type="submit" :loading="savingProfile" class="nexus-btn font-orbitron q-px-xl" label="SAVE PROFILE" icon-right="save" />
                </div>
              </q-form>
            </div>
          </div>
        </div>
      </q-tab-panel>

      <!-- ══ REPORTS TAB ═══════════════════════════════════════════════ -->
      <q-tab-panel name="reports" class="q-pa-none">
        <div class="nexus-panel q-pa-xl">
          <div class="panel-header row items-center justify-between q-mb-xl">
            <div>
              <q-icon name="folder_open" color="cyan-4" class="q-mr-sm" />
              <span class="font-orbitron text-white uppercase">Medical Reports</span>
              <q-badge color="cyan-10" class="q-ml-sm font-orbitron">{{ reports.length }}</q-badge>
            </div>
            <q-btn
              icon="upload_file" label="UPLOAD REPORT"
              class="nexus-btn font-orbitron" size="sm"
              @click="uploadDialog = true"
            />
          </div>

          <div v-if="reports.length === 0" class="empty-state q-pa-xl">
            <q-icon name="description" size="4rem" color="grey-9" />
            <div class="font-orbitron text-grey-8 q-mt-md">NO REPORTS UPLOADED</div>
            <div class="text-grey-9 text-caption q-mt-xs">Upload your medical reports to keep them organized</div>
          </div>

          <div v-else class="reports-grid">
            <div v-for="r in reports" :key="r.reportId" class="report-card q-pa-lg">
              <div class="row items-start">
                <div class="report-icon-wrap q-mr-md">
                  <q-icon
                    :name="r.fileType === 'pdf' ? 'picture_as_pdf' : 'image'"
                    :color="r.fileType === 'pdf' ? 'red-4' : 'cyan-4'"
                    size="2rem"
                  />
                </div>
                <div class="col">
                  <div class="text-white font-orbitron text-subtitle2 q-mb-xs">{{ r.title }}</div>
                  <div class="text-grey-6 text-caption q-mb-xs">{{ r.description || 'No description' }}</div>
                  <div class="row items-center q-gutter-xs">
                    <q-chip dense dark :color="r.fileType === 'pdf' ? 'red-10' : 'cyan-10'" class="font-orbitron" style="font-size:0.55rem">
                      {{ r.fileType?.toUpperCase() }}
                    </q-chip>
                    <span class="text-grey-8 text-caption font-orbitron">{{ new Date(r.uploadedAt).toLocaleDateString('en-GB') }}</span>
                  </div>
                </div>
                <div class="column q-gutter-xs">
                  <q-btn flat round icon="open_in_new" color="cyan-7" size="sm" @click="window.open(r.fileUrl, '_blank')">
                    <q-tooltip class="font-orbitron bg-dark">View</q-tooltip>
                  </q-btn>
                  <q-btn flat round icon="delete_outline" color="red-4" size="sm" @click="doDeleteReport(r.reportId)">
                    <q-tooltip class="font-orbitron bg-dark">Delete</q-tooltip>
                  </q-btn>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Upload dialog -->
        <q-dialog v-model="uploadDialog" persistent>
          <q-card class="dialog-card q-pa-xl" style="min-width:380px">
            <div class="card-accent-bar q-mb-lg"></div>
            <div class="font-orbitron text-white uppercase q-mb-lg">Upload Medical Report</div>

            <div class="field-label q-mb-xs">REPORT TITLE *</div>
            <q-input v-model="rForm.title" placeholder="e.g. Blood Test Results" dark outlined color="cyan-4" class="nexus-field q-mb-md" />

            <div class="field-label q-mb-xs">DESCRIPTION</div>
            <q-input v-model="rForm.description" placeholder="Optional details..." dark outlined color="cyan-4" class="nexus-field q-mb-md" type="textarea" rows="2" />

            <div class="field-label q-mb-xs">FILE (PDF or Image) *</div>
            <q-file v-model="rForm.file" dark outlined color="cyan-4" class="nexus-field q-mb-lg" accept=".pdf,.jpg,.jpeg,.png">
              <template #prepend><q-icon name="attach_file" color="cyan-8" /></template>
            </q-file>

            <div class="row q-gutter-sm justify-end">
              <q-btn flat label="CANCEL" color="grey-6" class="font-orbitron" v-close-popup @click="resetRForm" />
              <q-btn label="UPLOAD" class="nexus-btn font-orbitron" :loading="uploadingReport" @click="doUploadReport" />
            </div>
          </q-card>
        </q-dialog>
      </q-tab-panel>

      <!-- ══ PRESCRIPTIONS TAB ══════════════════════════════════════════ -->
      <q-tab-panel name="prescriptions" class="q-pa-none">
        <div class="nexus-panel q-pa-xl">
          <div class="panel-header q-mb-xl">
            <q-icon name="medication_liquid" color="cyan-4" class="q-mr-sm" />
            <span class="font-orbitron text-white uppercase">Prescriptions</span>
            <q-badge color="cyan-10" class="q-ml-sm font-orbitron">{{ prescriptions.length }}</q-badge>
          </div>

          <div v-if="prescriptions.length === 0" class="empty-state q-pa-xl">
            <q-icon name="medication" size="4rem" color="grey-9" />
            <div class="font-orbitron text-grey-8 q-mt-md">NO PRESCRIPTIONS YET</div>
            <div class="text-grey-9 text-caption q-mt-xs">Prescriptions issued by your doctors will appear here</div>
          </div>

          <div v-else class="q-gutter-y-md">
            <q-expansion-item
              v-for="rx in prescriptions" :key="rx.prescriptionId"
              class="rx-item"
              header-class="rx-header"
              expand-icon-class="text-cyan-4"
              dark
            >
              <template #header>
                <q-item-section avatar>
                  <q-avatar size="40px" class="rx-avatar">
                    <q-icon name="medical_services" color="cyan-4" size="1.4rem" />
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-white font-orbitron">{{ rx.diagnosis || 'Prescription' }}</q-item-label>
                  <q-item-label caption class="text-grey-5">
                    Dr. {{ rx.doctorName }} · {{ new Date(rx.issuedAt).toLocaleDateString('en-GB') }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-chip dense dark color="cyan-10" class="font-orbitron" style="font-size:0.55rem">
                    {{ rx.medications?.length || 0 }} MEDS
                  </q-chip>
                </q-item-section>
              </template>

              <div class="rx-body q-pa-lg">
                <div class="section-micro-label q-mb-md">PRESCRIBED MEDICATIONS</div>
                <div v-for="(med, i) in rx.medications" :key="i" class="med-row q-pa-md q-mb-sm">
                  <div class="row items-start">
                    <q-icon name="medication" color="cyan-6" class="q-mr-md q-mt-xs" />
                    <div class="col">
                      <div class="text-white font-orbitron text-subtitle2">{{ med.name }}</div>
                      <div class="row q-gutter-sm q-mt-xs">
                        <q-chip dense dark color="grey-9" class="font-orbitron text-caption">{{ med.dosage }}</q-chip>
                        <q-chip dense dark color="grey-9" class="font-orbitron text-caption">{{ med.frequency }}</q-chip>
                        <q-chip dense dark color="grey-9" class="font-orbitron text-caption">{{ med.duration }}</q-chip>
                      </div>
                      <div v-if="med.notes" class="text-grey-6 text-caption q-mt-xs italic">{{ med.notes }}</div>
                    </div>
                  </div>
                </div>

                <div v-if="rx.notes" class="q-mt-md">
                  <div class="section-micro-label q-mb-xs">DOCTOR'S NOTES</div>
                  <div class="notes-box q-pa-md">
                    <div class="text-grey-4 text-caption italic">{{ rx.notes }}</div>
                  </div>
                </div>
              </div>
            </q-expansion-item>
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
const storedUser = JSON.parse(localStorage.getItem('nexus_user') || '{}')

const tab = ref('profile')
const profileData = ref({})
const reports = ref([])
const prescriptions = ref([])
const savingProfile = ref(false)
const uploadDialog = ref(false)
const uploadingReport = ref(false)

const bloodGroups = ['A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown']

const ddStyle = {
  backgroundColor: '#020d0f',
  border: '1px solid rgba(0,229,255,0.25)',
  boxShadow: '0 0 20px rgba(0,229,255,0.1)',
  zIndex: 9999
}

const editForm = reactive({
  name: '', phone: '', dateOfBirth: '', gender: '', bloodGroup: '',
  allergies: [], chronicConditions: [],
  address: { city: '', district: '', postalCode: '', street: '' },
  emergencyContact: { name: '', phone: '', relationship: '' }
})

const rForm = reactive({ title: '', description: '', file: null })
const resetRForm = () => { rForm.title = ''; rForm.description = ''; rForm.file = null }

// API client with token
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

    $q.notify({
      type: 'negative',
      message: 'Failed to load reports'
    })
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
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700&display=swap');
.font-orbitron { font-family: 'Orbitron', sans-serif; }
.letter-spacing-3 { letter-spacing: 3px; }
.capitalize { text-transform: capitalize; }
.hidden { display: none; }

/* Metric cards */
.metric-card {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(0,229,255,0.08);
  border-radius: 14px;
  transition: all 0.3s;
}
.metric-card:hover { border-color: rgba(0,229,255,0.2); transform: translateY(-2px); }
.metric-bar { height: 2px; background: rgba(255,255,255,0.06); border-radius: 2px; }
.metric-fill { height: 100%; border-radius: 2px; transition: width 1s ease; }

/* Tabs */
.nexus-tabs {
  border-bottom: 1px solid rgba(0,229,255,0.1);
  font-size: 0.7rem; letter-spacing: 1.5px;
}

/* Panel */
.nexus-panel {
  background: rgba(6,14,16,0.7);
  border: 1px solid rgba(0,229,255,0.1);
  border-radius: 18px;
  backdrop-filter: blur(12px);
}
.panel-header { display: flex; align-items: center; font-size: 0.85rem; }

/* Form labels */
.field-label { font-family: 'Orbitron', sans-serif; font-size: 0.58rem; letter-spacing: 2px; color: rgba(0,229,255,0.4); }
.form-section-label {
  font-family: 'Orbitron', sans-serif; font-size: 0.6rem; letter-spacing: 3px;
  color: rgba(0,229,255,0.35); padding-bottom: 8px;
  border-bottom: 1px solid rgba(0,229,255,0.06);
}
.section-micro-label { font-family: 'Orbitron', sans-serif; font-size: 0.58rem; letter-spacing: 2px; color: rgba(0,229,255,0.4); }

/* Input */
.nexus-field :deep(.q-field__control) {
  border-radius: 10px;
  background: rgba(0,229,255,0.02);
}

/* Button */
.nexus-btn {
  background: linear-gradient(135deg, #00494f, #006064, #007c80);
  color: #fff !important; border-radius: 10px;
  font-size: 0.7rem; letter-spacing: 2px;
  box-shadow: 0 4px 20px rgba(0,188,212,0.15);
  transition: all 0.3s;
  padding: 10px 20px;
}
.nexus-btn:hover { box-shadow: 0 4px 30px rgba(0,188,212,0.3); transform: translateY(-1px); }

/* Avatar */
.patient-avatar {
  background: rgba(0,229,255,0.06);
  border: 2px solid rgba(0,229,255,0.2);
  box-shadow: 0 0 20px rgba(0,229,255,0.15);
}
.avatar-cam-btn {
  position: absolute !important;
  bottom: 2px; right: 2px;
  background: rgba(6,14,16,0.9) !important;
  border: 1px solid rgba(0,229,255,0.3);
}

/* Reports grid */
.reports-grid { display: grid; gap: 12px; }
.report-card {
  background: rgba(0,229,255,0.02);
  border: 1px solid rgba(0,229,255,0.08);
  border-radius: 12px;
  transition: all 0.25s;
}
.report-card:hover { border-color: rgba(0,229,255,0.2); background: rgba(0,229,255,0.04); }
.report-icon-wrap { display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: rgba(0,0,0,0.3); border-radius: 10px; }

/* Prescriptions */
.rx-item {
  border: 1px solid rgba(0,229,255,0.1);
  border-radius: 12px;
  overflow: hidden;
  background: rgba(0,229,255,0.02);
}
.rx-header { background: rgba(0,0,0,0.2) !important; }
.rx-avatar { background: rgba(0,229,255,0.06); border: 1px solid rgba(0,229,255,0.2); }
.rx-body { border-top: 1px solid rgba(0,229,255,0.06); }
.med-row { background: rgba(0,229,255,0.03); border: 1px solid rgba(0,229,255,0.08); border-radius: 10px; }
.notes-box { background: rgba(255,255,255,0.02); border-left: 3px solid rgba(0,229,255,0.3); border-radius: 0 8px 8px 0; }

/* Dialog card */
.dialog-card {
  background: #060e10 !important;
  border: 1px solid rgba(0,229,255,0.2) !important;
  border-radius: 18px !important;
}
.card-accent-bar { height: 3px; background: linear-gradient(90deg, transparent, #00e5ff, #00bcd4, transparent); border-radius: 2px; }

/* Empty state */
.empty-state { display: flex; flex-direction: column; align-items: center; opacity: 0.6; }
</style>