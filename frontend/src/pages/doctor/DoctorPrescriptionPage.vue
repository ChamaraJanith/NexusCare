<template>
  <q-page padding style="background: #f5f6fa;">
    <!-- Header -->
    <div class="row items-center q-mb-lg">
      <q-btn icon="arrow_back" flat round color="dark" @click="$router.back()" class="q-mr-sm" />
      <div class="text-h5 text-weight-bold text-dark">Consultation & Prescription</div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-center" style="min-height: 40vh;">
      <q-spinner-puff color="primary" size="50px" />
    </div>

    <div v-else class="row q-col-gutter-md">
      <!-- Left Column: Patient Context -->
      <div class="col-12 col-md-4 column q-gutter-y-md">
        
        <!-- Patient Details Card -->
        <q-card flat bordered style="border-radius: 12px;">
          <q-card-section class="bg-primary text-white">
            <div class="text-h6 text-weight-bold">Patient Details</div>
          </q-card-section>
          
          <q-card-section v-if="patient">
            <div class="row items-center q-mb-md">
              <q-avatar size="50px" color="blue-1" text-color="primary" class="q-mr-md text-weight-bold">
                {{ patient.name ? patient.name.charAt(0).toUpperCase() : '?' }}
              </q-avatar>
              <div>
                <div class="text-weight-bold text-dark text-h6">{{ patient.name }}</div>
                <div class="text-grey-7">{{ patient.patientId }}</div>
              </div>
            </div>

            <q-list dense>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="cake" color="grey" />
                </q-item-section>
                <q-item-section class="text-dark">
                  <span class="text-grey-7 text-weight-medium">Age:</span>
                  <span class="text-weight-bold text-dark"> {{ patient.age ? patient.age + ' yrs' : 'N/A' }}</span>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon name="wc" color="grey" />
                </q-item-section>
                <q-item-section class="text-dark">
                  <span class="text-grey-7 text-weight-medium">Gender:</span>
                  <span class="text-weight-bold text-dark"> {{ patient.gender || 'N/A' }}</span>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon name="bloodtype" color="red" />
                </q-item-section>
                <q-item-section class="text-dark">
                  <span class="text-grey-7 text-weight-medium">Blood Group:</span>
                  <span class="text-weight-bold text-dark"> {{ patient.bloodGroup || 'N/A' }}</span>
                </q-item-section>
              </q-item>

              <!-- Phone -->
              <q-item>
                <q-item-section avatar>
                  <q-icon name="phone" color="grey" />
                </q-item-section>
                <q-item-section class="text-dark">
                  <span class="text-grey-7 text-weight-medium">Phone:</span>
                  <span class="text-weight-bold text-dark">
                    {{ patient.phone || 'N/A' }}
                  </span>
                </q-item-section>
              </q-item>

              <!-- Email -->
              <q-item>
                <q-item-section avatar>
                  <q-icon name="email" color="grey" />
                </q-item-section>
                <q-item-section class="text-dark">
                  <span class="text-grey-7 text-weight-medium">Email:</span>
                  <span class="text-weight-bold text-dark">
                    {{ patient.email || 'N/A' }}
                  </span>
                </q-item-section>
              </q-item>

              <!-- City -->
              <q-item>
                <q-item-section avatar>
                  <q-icon name="location_on" color="grey" />
                </q-item-section>
                <q-item-section class="text-dark">
                  <span class="text-grey-7 text-weight-medium">City:</span>
                  <span class="text-weight-bold text-dark">
                    {{ patient.address?.city || 'N/A' }}
                  </span>
                </q-item-section>
              </q-item>

              <!-- Emergency Contact -->
              <q-item>
                <q-item-section avatar>
                  <q-icon name="warning" color="red" />
                </q-item-section>
                <q-item-section class="text-dark">
                  <span class="text-grey-7 text-weight-medium">Emergency:</span>
                  <span class="text-weight-bold text-dark">
                    {{ patient.emergencyContact?.name || 'N/A' }}
                  </span>
                </q-item-section>
              </q-item>
            </q-list>

            <q-separator class="q-my-md" />

            <div class="text-weight-bold text-dark q-mb-xs">Allergies</div>
            <div v-if="patient.allergies && patient.allergies.length > 0">
              <q-chip v-for="allergy in patient.allergies" :key="allergy" color="orange-1" text-color="orange-9" size="sm" dense>
                {{ allergy }}
              </q-chip>
            </div>
            <div v-else class="text-grey-7 text-caption">No known allergies.</div>

            <div class="text-weight-bold text-dark q-mt-md q-mb-xs">Chronic Conditions</div>
            <div v-if="patient.chronicConditions && patient.chronicConditions.length > 0">
              <q-chip v-for="cond in patient.chronicConditions" :key="cond" color="red-1" text-color="red-9" size="sm" dense>
                {{ cond }}
              </q-chip>
            </div>
            <div v-else class="text-grey-7 text-caption">None reported.</div>
          </q-card-section>
          
          <q-card-section v-else class="text-center text-grey-7 py-lg">
            Could not load patient details.
          </q-card-section>
        </q-card>

        <!-- Medical Reports Card -->
        <q-card flat bordered style="border-radius: 12px;">
          <q-card-section class="bg-teal text-white">
            <div class="text-h6 text-weight-bold">Medical Reports</div>
          </q-card-section>
          
          <q-card-section>
            <div v-if="reports.length === 0" class="text-grey-7 text-center q-py-md">
              No reports available for this patient.
            </div>
            <q-list v-else separator>
              <q-item v-for="report in reports" :key="report.reportId" clickable v-ripple @click="openReport(report)" class="cursor-pointer">
                <q-tooltip>View Report</q-tooltip>
                <q-item-section avatar>
                  <q-icon :name="report.fileType === 'pdf' ? 'picture_as_pdf' : 'image'" :color="report.fileType === 'pdf' ? 'red' : 'blue'" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-bold text-dark">{{ report.title }}</q-item-label>
                  <q-item-label caption lines="1" class="text-grey-7">{{ report.description || 'No description' }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn flat round dense icon="download" color="primary" @click.stop="downloadReport(report)">
                     <q-tooltip>Download</q-tooltip>
                  </q-btn>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <q-btn
          v-if="appointmentType === 'ONLINE'"
          unelevated
          color="primary"
          icon="video_call"
          label="Join Now"
          class="full-width join-btn q-mt-md"
          @click="handleJoinFromPrescription"
        />

        <!-- Preview Modal -->
        <q-dialog v-model="previewOpen" maximized transition-show="slide-up" transition-hide="slide-down">
          <q-card class="bg-dark text-white column">
            <q-card-section class="row items-center q-pb-none">
              <div class="text-h6">Report Preview</div>
              <q-space />
              <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>

            <q-card-section class="col flex flex-center q-pa-none bg-grey-10">
              <iframe v-if="previewType === 'pdf'" :src="previewUrl" class="full-width full-height" style="border: none;"></iframe>
              <img v-else-if="previewType === 'image'" :src="previewUrl" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
              <div v-else class="text-h6 text-grey-5">Preview not available</div>
            </q-card-section>
          </q-card>
        </q-dialog>

      </div>

      <!-- Right Column: Prescription Form and History -->
      <div class="col-12 col-md-8 column q-gutter-y-md">
        
        <!-- Prescription Form -->
        <q-card flat bordered style="border-radius: 12px;">
          <q-card-section>
            <div class="text-h5 text-weight-bold text-dark q-mb-md">Create Prescription</div>
            
            <q-form @submit="submitPrescription" class="q-gutter-md">
              
              <!-- Diagnosis -->
              <div>
                <div class="text-weight-bold q-mb-xs text-grey-7">Diagnosis <span class="text-red">*</span></div>
                <q-input
                  v-model="form.diagnosis"
                  outlined
                  dense
                  placeholder="E.g. Viral Pharyngitis"
                  :rules="[val => !!val || 'Diagnosis is required']"
                />
              </div>

              <!-- Symptoms -->
              <div>
                <div class="text-weight-bold q-mb-xs text-grey-7">Symptoms</div>
                <q-input
                  v-model="form.symptoms"
                  outlined
                  type="textarea"
                  rows="2"
                  placeholder="E.g. Sore throat, mild fever"
                />
              </div>

              <!-- Structured Medicines Array -->
              <div>
                <div class="text-weight-bold q-mb-xs text-grey-7">Medicines <span class="text-red">*</span></div>
                
                <q-card v-for="(med, index) in form.medicines" :key="index" flat bordered class="q-mb-md" style="background: #fafbfc; border-radius: 8px;">
                  <q-card-section>
                    <div class="row items-center q-mb-sm">
                      <div class="text-weight-bold text-dark">Medicine {{ index + 1 }}</div>
                      <q-space />
                      <q-btn icon="remove_circle" color="negative" flat round dense @click="removeMedication(index)" v-if="form.medicines.length > 1" />
                    </div>
                    <div class="row q-col-gutter-sm">
                      <div class="col-12 col-md-6">
                        <q-input v-model="med.name" outlined dense placeholder="Medicine name" :rules="[val => !!val || 'Required']" />
                      </div>
                      <div class="col-12 col-md-6">
                        <q-input v-model="med.dosage" outlined dense placeholder="Dosage (e.g. 500mg)" />
                      </div>
                      <div class="col-12 col-md-4">
                         <q-select v-model="med.frequency" outlined dense :options="frequencyOptions" placeholder="Frequency" emit-value map-options popup-content-class="dropdown-fix"/>
                      </div>
                      <div class="col-12 col-md-4">
                        <q-input v-model="med.duration" outlined dense placeholder="Duration (e.g. 5 days)" />
                      </div>
                      <div class="col-12 col-md-4">
                        <q-input v-model="med.instructions" outlined dense placeholder="Instructions" />
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
                
                <q-btn flat color="primary" icon="add" label="Add Medication" @click="addMedication" size="sm" />
              </div>

              <!-- Advice -->
              <div>
                <div class="text-weight-bold q-mb-xs text-grey-7">Advice</div>
                <q-input
                  v-model="form.advice"
                  outlined
                  type="textarea"
                  rows="2"
                  placeholder="General wellness advice"
                />
              </div>

              <!-- Follow Up Date -->
              <div>
                <div class="text-weight-bold q-mb-xs text-grey-7">Follow-up Date</div>
                <q-input
                  v-model="form.followUpDate"
                  outlined
                  dense
                  type="date"
                />
              </div>

              <!-- Notes -->
              <div>
                <div class="text-weight-bold q-mb-xs text-grey-7">Internal Notes</div>
                <q-input
                  v-model="form.notes"
                  outlined
                  type="textarea"
                  rows="2"
                  placeholder="Private notes (not visible to patient)"
                />
              </div>

              <div class="row justify-end q-mt-lg">
                <q-btn label="Cancel" flat color="grey" class="q-mr-sm" @click="$router.back()" />
                <q-btn type="submit" label="Submit Prescription" unelevated color="primary" :loading="submitting" />
              </div>
            </q-form>

          </q-card-section>
        </q-card>

        <!-- ══════════════════════════════════════════════════════════════════════
             PRESCRIPTION HISTORY — Real Clinical Document Layout
             Parts 2, 3, 6, 7, 8, 9
             ══════════════════════════════════════════════════════════════════════ -->
        <q-card flat bordered class="rx-history-card">
          <q-card-section class="rx-history-header">
            <div class="rx-header-title">Patient Clinical Prescription History</div>
            <div class="rx-header-sub">Securely generated and maintained by NexusCare EMR system</div>
          </q-card-section>
          
          <q-card-section>
            <!-- Empty State (Part 9) -->
            <div v-if="prescriptionHistory.length === 0" class="rx-empty-state">
              <q-icon name="medication" size="56px" color="grey-4" />
              <div class="rx-empty-title">No prescriptions yet</div>
              <div class="rx-empty-sub">Prescriptions will appear here once created for this patient.</div>
            </div>

            <!-- Timeline Layout (Part 8) -->
            <div v-else class="rx-timeline">
              <div
                v-for="(rx, index) in prescriptionHistory"
                :key="rx._id"
                class="rx-timeline-entry"
              >
                <!-- Timeline dot + line -->
                <div class="rx-timeline-rail">
                  <div class="rx-timeline-dot" :class="{ 'rx-dot-latest': index === 0 }"></div>
                  <div v-if="index < prescriptionHistory.length - 1" class="rx-timeline-line"></div>
                </div>

                <!-- Prescription Card -->
                <div class="rx-timeline-content">
                  <q-card flat class="rx-card">

                    <!-- SECTION 1: Diagnosis Header + Status + Date -->
                    <div class="rx-card-header">
                      <div class="row items-center" style="gap: 8px; flex-wrap: wrap;">
                        <q-badge v-if="index === 0" color="green-2" text-color="green-9" label="LATEST" class="text-weight-bold" rounded />
                        <div class="rx-diagnosis">{{ rx.diagnosis || 'General Prescription' }}</div>
                      </div>
                      <div class="row items-center" style="gap: 8px; flex-shrink: 0;">
                        <q-badge
                          :color="rx.status === 'completed' ? 'green-1' : (index === 0 ? 'blue-1' : 'grey-3')"
                          :text-color="rx.status === 'completed' ? 'green-9' : (index === 0 ? 'blue-9' : 'grey-8')"
                          :label="rx.status || 'Active'"
                          class="text-weight-bold text-uppercase"
                        />
                        <span class="rx-date-chip">{{ formatDateFull(rx.createdAt) }}</span>
                      </div>
                    </div>

                    <q-card-section class="q-pa-md q-pt-none">

                      <!-- SECTION 2: Patient + Doctor Info Block (Part 2) -->
                      <div class="rx-meta-block">
                        <div class="rx-meta-row">
                          <span class="rx-meta-label">Patient:</span>
                          <span class="rx-meta-value">{{ patient?.name || '—' }} ({{ patient?.age ? patient.age + ' yrs' : 'N/A' }})</span>
                        </div>
                        <div class="rx-meta-row">
                          <span class="rx-meta-label">Patient ID:</span>
                          <span class="rx-meta-value">{{ patient?.patientId || '—' }}</span>
                        </div>
                        <div class="rx-meta-row">
                          <span class="rx-meta-value">{{ rx.doctorName || 'Dr. Unknown' }}</span>
                        </div>
                        <div class="rx-meta-row">
                          <span class="rx-meta-label">Date:</span>
                          <span class="rx-meta-value">{{ formatDateFull(rx.createdAt) }}</span>
                        </div>
                      </div>

                      <!-- SECTION 3: Symptoms (Part 3) -->
                      <div v-if="rx.symptoms && rx.symptoms.length > 0" class="rx-section">
                        <div class="rx-section-label">Symptoms</div>
                        <ul class="rx-symptom-list">
                          <li v-for="(s, si) in parseSymptoms(rx.symptoms)" :key="si">{{ s }}</li>
                        </ul>
                      </div>

                      <!-- SECTION 4: Medicines Table (Parts 3 + 4) -->
                      <div class="rx-section">
                        <div class="rx-section-label">Prescribed Medicines</div>
                        <div class="rx-table-wrap">
                          <table class="rx-med-table">
                            <thead>
                              <tr>
                                <th>Medicine</th>
                                <th>Dosage</th>
                                <th>Frequency</th>
                                <th>Duration</th>
                                <th>Instructions</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="(med, i) in rx.medicines" :key="i">
                                <td class="rx-med-name">{{ typeof med === 'string' ? med : (med.name || '—') }}</td>
                                <td>{{ typeof med === 'string' ? '—' : (med.dosage || '—') }}</td>
                                <td>{{ typeof med === 'string' ? '—' : (med.frequency || '—') }}</td>
                                <td>{{ typeof med === 'string' ? '—' : (med.duration || '—') }}</td>
                                <td>{{ typeof med === 'string' ? '—' : (med.instructions || '—') }}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <!-- SECTION 5: Advice (Part 3) -->
                      <div v-if="rx.advice" class="rx-section">
                        <div class="rx-section-label">Doctor's Advice</div>
                        <div class="rx-advice-box">{{ rx.advice }}</div>
                      </div>

                      <!-- SECTION 6: Follow-up (Part 3) -->
                      <div v-if="rx.followUpDate" class="rx-section">
                        <div class="rx-section-label">Follow-up</div>
                        <div class="rx-followup-box">
                          <q-icon name="event" size="xs" class="q-mr-xs" style="color: #6b7280;" />
                          {{ formatDateFull(rx.followUpDate) }}
                        </div>
                      </div>

                      <!-- SECTION 7: Footer (Part 3) -->
                      <div class="rx-footer">
                        Digitally generated prescription — NexusCare EMR
                      </div>

                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </div>

          </q-card-section>
        </q-card>

      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted, inject } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import axios from 'axios';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();

const patientId = route.query.patientId;
const appointmentId = route.query.appointmentId;

const loading = ref(true);
const submitting = ref(false);
const patient = ref(null);
const reports = ref([]);
const prescriptionHistory = ref([]);
const appointmentType = ref('');

// Injected from DoctorLayout.vue — provides full doctor profile
const doctor = inject('doctor', ref({}));

const previewOpen = ref(false);
const previewUrl = ref('');
const previewType = ref('');

const frequencyOptions = [
  { label: 'Once daily', value: 'Once daily' },
  { label: 'Twice daily', value: 'Twice daily' },
  { label: '3 times daily', value: '3 times daily' },
  { label: 'Every 8 hours', value: 'Every 8 hours' },
  { label: 'As needed (PRN)', value: 'As needed (PRN)' },
  { label: 'At bedtime', value: 'At bedtime' },
];

const form = reactive({
  diagnosis: '',
  symptoms: '',
  advice: '',
  followUpDate: '',
  notes: '',
  medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
});

const getToken = () => localStorage.getItem('token') || localStorage.getItem('nexus_token');
const getHeaders = () => ({ Authorization: `Bearer ${getToken()}` });
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const parseJwt = (t) => { try { return JSON.parse(atob(t.split('.')[1])); } catch { return null; } };

// Doctor name resolution: inject > JWT > fallback
const getDoctorName = () => {
  // 1. From injected doctor profile (DoctorLayout provide)
  if (doctor.value?.name) return doctor.value.name;
  // 2. From JWT token
  const token = getToken();
  if (token) {
    const decoded = parseJwt(token);
    if (decoded?.name) return decoded.name;
  }
  // 3. Fallback
  return 'Dr. Unknown';
};

onMounted(async () => {
  if (!patientId || !appointmentId) {
    $q.notify({ type: 'negative', message: 'Missing patient or appointment context.' });
    router.back();
    return;
  }
  await fetchPatientData();
  await loadPrescriptions();
});

const fetchPatientData = async () => {
  loading.value = true;
  try {
    const [patientRes, reportsRes, aptRes] = await Promise.allSettled([
      axios.get(`${API_URL}/api/patient/doctor/${patientId}`, { headers: getHeaders() }),
      axios.get(`${API_URL}/api/patient/reports`, { params: { patientId }, headers: getHeaders() }),
      axios.get(`${API_URL}/api/appointments/details/${appointmentId}`, { headers: getHeaders() })
    ]);

    if (patientRes.status === 'fulfilled') {
      patient.value = patientRes.value.data.data;
    } else {
      console.error('Failed to fetch patient details', patientRes.reason);
      $q.notify({ type: 'negative', message: 'Failed to load patient profile.' });
    }

    if (reportsRes.status === 'fulfilled') {
      reports.value = reportsRes.value.data.data || [];
    }
    
    if (aptRes.status === 'fulfilled') {
      appointmentType.value = aptRes.value.data.appointment?.appointmentType || '';
    }
    
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const handleJoinFromPrescription = () => {
  router.push({
    path: '/doctorVideo',
    query: {
      appointmentId,
      doctorId: doctor.value?.doctorId || parseJwt(getToken())?.roleId
    }
  });
};

const loadPrescriptions = async () => {
  try {
    const res = await axios.get(`${API_URL}/api/prescriptions/${patientId}`, { headers: getHeaders() });
    if (res.data?.success) {
      prescriptionHistory.value = res.data.data || [];
    } else if (Array.isArray(res.data)) {
      prescriptionHistory.value = res.data;
    }
  } catch (err) {
    console.error("Prescriptions fetch fail:", err);
  }
};

// Part 10 — Proper date formatting with safe fallback (Part 9)
const formatDateFull = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '—';
  }
};

// Part 3 — Parse symptoms into array for bullet display
const parseSymptoms = (symptoms) => {
  if (!symptoms) return [];
  if (Array.isArray(symptoms)) return symptoms;
  return symptoms.split(',').map(s => s.trim()).filter(Boolean);
};

const openReport = (report) => {
  if (!report?.fileUrl) {
    $q.notify({ type: 'warning', message: 'File URL is missing.' });
    return;
  }

  // 🔥 FIX HERE
  if (report.fileType === 'pdf') {
    previewUrl.value = `https://docs.google.com/gview?url=${encodeURIComponent(report.fileUrl)}&embedded=true`;
    previewType.value = 'pdf';
  } else {
    previewUrl.value = report.fileUrl;
    previewType.value = 'image';
  }

  previewOpen.value = true;
};

const downloadReport = async (report) => {
  if (!report?.fileUrl) {
     $q.notify({ type: 'warning', message: 'No file available to download.' });
     return;
  }
  try {
    const res = await fetch(report.fileUrl);
    if (!res.ok) throw new Error('Network response was not ok');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const ext = report.fileType === 'pdf' ? 'pdf' : (report.fileType || 'png');
    const safeTitle = (report.title || 'Medical_Report').replace(/\s+/g, '_');
    link.download = `${safeTitle}.${ext}`;
    
    document.body.appendChild(link);
    link.click();
    
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
    
    $q.notify({ type: 'positive', message: 'Download started successfully.' });
  } catch (error) {
    console.error('Download failed', error);
    $q.notify({ type: 'negative', message: 'Failed to securely download report.' });
  }
};

const addMedication = () => {
  form.medicines.push({ name: '', dosage: '', frequency: '', duration: '', instructions: '' });
};

const removeMedication = (index) => {
  form.medicines.splice(index, 1);
};

// Part 5 — Submit with doctorName + createdAt injected immediately
const submitPrescription = async () => {
  const validMedications = form.medicines.filter(
    m => m.name && m.name.trim().length > 0
  );

  if (validMedications.length === 0) {
    $q.notify({
      type: 'warning',
      message: 'Please add at least one medication.'
    });
    return;
  }

  submitting.value = true;

  try {
    const doctorName = doctor.value?.name || localStorage.getItem('doctor_name') || getDoctorName();
    const doctorId = doctor.value?.doctorId || doctor.value?._id || null;
    const now = new Date().toISOString();

    const payload = {
      patientId,
      appointmentId,
      diagnosis: form.diagnosis?.trim(),
      symptoms: form.symptoms?.trim(),
      advice: form.advice?.trim(),
      followUpDate: form.followUpDate || null,
      notes: form.notes?.trim(),
      medicines: validMedications,
      doctorName,
      doctorId
    };

    await axios.post(`${API_URL}/api/prescriptions`, payload, {
      headers: getHeaders()
    });

    // Notify backend that consultation via prescription is now underway/started (per Part 6 requirement)
    try {
      await axios.put(`${API_URL}/api/appointments/consultation/update/${appointmentId}`, 
        { consultationStarted: true },
        { headers: getHeaders() }
      );
    } catch (e) {
      console.warn("Failed to update consultation lifecycle state:", e);
    }

    $q.notify({
      type: 'positive',
      message: 'Prescription created successfully!'
    });

    // Immediately reflect in UI before reload completes (Part 5)
    const newEntry = {
      _id: 'temp-' + Date.now(),
      ...payload,
      createdAt: now,
      status: 'active'
    };
    prescriptionHistory.value.unshift(newEntry);

    // Reset form
    form.diagnosis = '';
    form.symptoms = '';
    form.advice = '';
    form.followUpDate = '';
    form.notes = '';
    form.medicines = [
      { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ];

    // Reload from server to sync real _id / status
    await loadPrescriptions();

  } catch (error) {
    console.error('Prescription submission failed:', error);

    const msg =
      error.response?.data?.message ||
      (error.response?.status === 502
        ? 'Bad Gateway (Service Down)'
        : 'Failed to submit prescription.');

    $q.notify({
      type: 'negative',
      message: msg
    });

  } finally {
    submitting.value = false;
  }
};

</script>

<!-- Dropdown fix — must be unscoped because popup portals outside component -->
<style>
.dropdown-fix {
  background: #ffffff !important;
}
.dropdown-fix .q-item {
  color: #000000 !important;
}
.dropdown-fix .q-item__label {
  color: #000000 !important;
}
.dropdown-fix .q-item__section {
  color: #000000 !important;
}
</style>

<!-- All visual styles scoped to this component only (Part 1 rule) -->
<style scoped>
/* ── Part 1: Text visibility — all titles use dark readable color ────────── */
::selection {
  background: #cce5ff;
  color: #000000;
}

/* ── Part 6: History card header ─────────────────────────────────────────── */
.rx-history-card {
  border-radius: 12px;
}
.rx-history-header {
  background: #1e293b;
  padding: 16px 20px;
}
.rx-header-title {
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
}
.rx-header-sub {
  color: #94a3b8;
  font-size: 12px;
  margin-top: 2px;
}

/* ── Part 9: Empty state ─────────────────────────────────────────────────── */
.rx-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 16px;
  gap: 8px;
}
.rx-empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #6b7280;
}
.rx-empty-sub {
  font-size: 13px;
  color: #9ca3af;
}

/* ── Part 8: Timeline layout ─────────────────────────────────────────────── */
.rx-timeline {
  display: flex;
  flex-direction: column;
}
.rx-timeline-entry {
  display: flex;
  gap: 16px;
}
.rx-timeline-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 20px;
  flex-shrink: 0;
}
.rx-timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #cbd5e1;
  border: 2px solid #e2e8f0;
  margin-top: 20px;
  flex-shrink: 0;
  z-index: 1;
}
.rx-dot-latest {
  background: #1976D2;
  border-color: #bbdefb;
  width: 14px;
  height: 14px;
  box-shadow: 0 0 0 4px rgba(25, 118, 210, 0.15);
}
.rx-timeline-line {
  width: 2px;
  flex: 1;
  background: #e2e8f0;
  min-height: 20px;
}
.rx-timeline-content {
  flex: 1;
  padding-bottom: 20px;
  min-width: 0;
}

/* ── Part 7: Prescription card visual upgrade ────────────────────────────── */
.rx-card {
  border-radius: 12px !important;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}
.rx-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
  gap: 12px;
  flex-wrap: wrap;
}
.rx-diagnosis {
  font-size: 17px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.3;
}
.rx-date-chip {
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
}

/* ── Part 2: Patient + Doctor metadata block ─────────────────────────────── */
.rx-meta-block {
  background: #f9fafb;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 16px;
  margin-top: 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 24px;
}
.rx-meta-row {
  display: flex;
  gap: 6px;
  align-items: baseline;
}
.rx-meta-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  white-space: nowrap;
}
.rx-meta-value {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
}

/* ── Parts 3 & 4: Section styling ────────────────────────────────────────── */
.rx-section {
  margin-bottom: 16px;
}
.rx-section-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6b7280;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #f0f0f0;
}

/* Symptoms bullet list */
.rx-symptom-list {
  margin: 0;
  padding-left: 18px;
  list-style: disc;
}
.rx-symptom-list li {
  font-size: 13px;
  color: #374151;
  line-height: 1.6;
}

/* ── Part 4: Medicine table ──────────────────────────────────────────────── */
.rx-table-wrap {
  overflow-x: auto;
}
.rx-med-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}
.rx-med-table th {
  background: #f1f5f9;
  color: #374151;
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  padding: 10px 12px;
  text-align: left;
  border-bottom: 2px solid #e5e7eb;
}
.rx-med-table td {
  padding: 10px 12px;
  color: #1f2937;
  border-bottom: 1px solid #f3f4f6;
}
.rx-med-table tbody tr:nth-child(even) {
  background: #f9fafb;
}
.rx-med-table tbody tr:hover {
  background: #eff6ff;
}
.rx-med-name {
  font-weight: 600;
}

/* ── Part 3: Advice box ──────────────────────────────────────────────────── */
.rx-advice-box {
  background: #eff6ff;
  border-left: 3px solid #1976D2;
  border-radius: 4px;
  padding: 10px 14px;
  font-size: 13px;
  color: #1f2937;
  line-height: 1.5;
}

/* ── Follow-up box ───────────────────────────────────────────────────────── */
.rx-followup-box {
  display: inline-flex;
  align-items: center;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 13px;
  color: #374151;
  font-weight: 500;
}

/* ── Part 3: Footer ──────────────────────────────────────────────────────── */
.rx-footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed #e5e7eb;
  text-align: center;
  font-size: 11px;
  color: #9ca3af;
  font-style: italic;
}

/* ── Responsive: stack meta grid on mobile ────────────────────────────────── */
@media (max-width: 600px) {
  .rx-meta-block {
    grid-template-columns: 1fr;
  }
  .rx-card-header {
    flex-direction: column;
  }
}

.join-btn {
  height: 48px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  box-shadow: 0 6px 18px rgba(37, 99, 235, 0.35);
  transition: all 0.2s ease;
}

.join-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.45);
}
</style>