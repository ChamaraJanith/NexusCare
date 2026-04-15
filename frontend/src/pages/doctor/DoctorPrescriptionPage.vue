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

        <!-- Prescription History Display -->
        <q-card v-if="prescriptionHistory.length > 0" flat bordered style="border-radius: 12px;">
          <q-card-section class="bg-deep-purple text-white">
            <div class="text-h6 text-weight-bold">Prescription Layout (Doctor View Only)</div>
            <div class="text-caption">{{ prescriptionHistory.length }} past record(s) directly from doctor-service</div>
          </q-card-section>
          
          <q-card-section>
             <div v-for="rx in prescriptionHistory" :key="rx._id" class="q-mb-md">
                <q-card flat bordered style="border-radius: 10px;">
                  <q-card-section>
                    <div class="row items-center q-mb-sm">
                      <q-icon name="medication" color="primary" size="sm" class="q-mr-sm" />
                       <div class="text-weight-bold text-dark text-subtitle1">{{ rx.diagnosis || 'Prescription' }}</div>
                       <q-space />
                       <q-badge :color="rx.status === 'completed' ? 'green' : 'blue'" :label="rx.status || 'active'" />
                       <span class="text-caption text-grey-6 q-ml-sm">{{ formatDate(rx.createdAt) }}</span>
                    </div>

                    <div v-if="rx.symptoms" class="text-caption text-grey-7 q-mb-sm">
                      <span class="text-weight-bold">Symptoms: </span>{{ Array.isArray(rx.symptoms) ? rx.symptoms.join(', ') : rx.symptoms }}
                    </div>

                    <div class="q-mb-sm">
                      <div class="text-weight-medium text-grey-8 q-mb-xs">Medicines:</div>
                      <q-markup-table flat bordered dense separator="cell" class="text-caption bg-white" style="border-radius: 8px;">
                        <thead class="bg-grey-2">
                          <tr>
                            <th class="text-left">Medicine</th>
                            <th class="text-left">Dosage</th>
                            <th class="text-left text-dark">Frequency</th>
                            <th class="text-left text-dark">Duration</th>
                            <th class="text-left text-dark">Instructions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(med, i) in rx.medicines" :key="i">
                            <td class="text-weight-bold text-dark">{{ typeof med === 'string' ? med : (med.name || '—') }}</td>
                            <td class="text-dark">{{ typeof med === 'string' ? '—' : (med.dosage || '—') }}</td>
                            <td class="text-dark">{{ typeof med === 'string' ? '—' : (med.frequency || '—') }}</td>
                            <td class="text-dark">{{ typeof med === 'string' ? '—' : (med.duration || '—') }}</td>
                            <td class="text-dark">{{ typeof med === 'string' ? '—' : (med.instructions || '—') }}</td>
                          </tr>
                        </tbody>
                      </q-markup-table>
                    </div>

                    <div v-if="rx.advice" class="q-mb-xs">
                      <span class="text-weight-medium text-grey-8">Advice: </span>
                      <span class="text-dark">{{ rx.advice }}</span>
                    </div>
                    
                    <div v-if="rx.followUpDate" class="q-mb-xs">
                      <span class="text-weight-medium text-grey-8">Follow-up: </span>
                      <span class="text-dark">{{ formatDate(rx.followUpDate) }}</span>
                    </div>

                  </q-card-section>
                </q-card>
             </div>
          </q-card-section>
        </q-card>

      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
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
    const [patientRes, reportsRes] = await Promise.allSettled([
      axios.get(`${API_URL}/api/patient/doctor/${patientId}`, { headers: getHeaders() }),
      axios.get(`${API_URL}/api/patient/reports`, { params: { patientId }, headers: getHeaders() })
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
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
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
    // Suppress warning if strictly empty vs actually down natively
  }
};

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString();
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

const submitPrescription = async () => {
  // Validate medicines
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
    const payload = {
      patientId,
      appointmentId,
      diagnosis: form.diagnosis?.trim(),
      symptoms: form.symptoms?.trim(),
      advice: form.advice?.trim(),
      followUpDate: form.followUpDate || null,
      notes: form.notes?.trim(),
      medicines: validMedications
    };

    // 🔐 Send request with token
    await axios.post(`${API_URL}/api/prescriptions`, payload, {
      headers: getHeaders()
    });

    // ✅ Success
    $q.notify({
      type: 'positive',
      message: 'Prescription created successfully!'
    });

    // 🔄 Reset form
    form.diagnosis = '';
    form.symptoms = '';
    form.advice = '';
    form.followUpDate = '';
    form.notes = '';
    form.medicines = [
      { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ];

    // 🔁 Reload prescriptions
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