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
                  <span class="text-weight-bold"> {{ patient.age ? patient.age + ' yrs' : 'N/A' }}</span>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon name="wc" color="grey" />
                </q-item-section>
                <q-item-section class="text-dark">
                  <span class="text-grey-7 text-weight-medium">Gender:</span>
                  <span class="text-weight-bold"> {{ patient.gender || 'N/A' }}</span>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon name="bloodtype" color="red" />
                </q-item-section>
                <q-item-section class="text-dark">
                  <span class="text-grey-7 text-weight-medium">Blood Group:</span>
                  <span class="text-weight-bold"> {{ patient.bloodGroup || 'N/A' }}</span>
                </q-item-section>
              </q-item>

              <!-- Phone -->
              <q-item>
                <q-item-section avatar>
                  <q-icon name="phone" color="grey" />
                </q-item-section>
                <q-item-section class="text-dark">
                  <span class="text-grey-7 text-weight-medium">Phone:</span>
                  <span class="text-weight-bold">
                    {{ patient.phone || 'N/A' }}
                  </span>
                </q-item-section>
              </q-item>

              <!-- Email (NEW) -->
              <q-item>
                <q-item-section avatar>
                  <q-icon name="email" color="grey" />
                </q-item-section>
                <q-item-section class="text-dark">
                  <span class="text-grey-7 text-weight-medium">Email:</span>
                  <span class="text-weight-bold">
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
                  <span class="text-weight-bold">
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
                  <span class="text-weight-bold">
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
            <div v-else class="text-grey-5 text-caption">No known allergies.</div>

            <div class="text-weight-bold text-dark q-mt-md q-mb-xs">Chronic Conditions</div>
            <div v-if="patient.chronicConditions && patient.chronicConditions.length > 0">
              <q-chip v-for="cond in patient.chronicConditions" :key="cond" color="red-1" text-color="red-9" size="sm" dense>
                {{ cond }}
              </q-chip>
            </div>
            <div v-else class="text-grey-5 text-caption">None reported.</div>
          </q-card-section>
          
          <q-card-section v-else class="text-center text-grey-6 py-lg">
            Could not load patient details.
          </q-card-section>
        </q-card>

        <!-- Medical Reports Card -->
        <q-card flat bordered style="border-radius: 12px;">
          <q-card-section class="bg-teal text-white">
            <div class="text-h6 text-weight-bold">Medical Reports</div>
          </q-card-section>
          
          <q-card-section>
            <div v-if="reports.length === 0" class="text-grey-6 text-center q-py-md">
              No reports available for this patient.
            </div>
            <q-list v-else separator>
              <q-item v-for="report in reports" :key="report.reportId" clickable v-ripple @click="openReport(report.fileUrl)">
                <q-item-section avatar>
                  <q-icon :name="report.fileType === 'pdf' ? 'picture_as_pdf' : 'image'" :color="report.fileType === 'pdf' ? 'red' : 'blue'" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-bold">{{ report.title }}</q-item-label>
                  <q-item-label caption lines="1">{{ report.description || 'No description' }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon name="open_in_new" color="grey" size="xs" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

      </div>

      <!-- Right Column: Prescription Form -->
      <div class="col-12 col-md-8">
        <q-card flat bordered style="border-radius: 12px;" class="full-height">
          <q-card-section>
            <div class="text-h5 text-weight-bold text-dark q-mb-md">Create Prescription</div>
            
            <q-form @submit="submitPrescription" class="q-gutter-md">
              <!-- Diagnosis -->
              <div>
                <div class="text-weight-bold q-mb-xs">Diagnosis</div>
                <q-input
                  v-model="form.diagnosis"
                  outlined
                  dense
                  placeholder="E.g. Viral Pharyngitis"
                />
              </div>

              <!-- Medications Array -->
              <div>
                <div class="text-weight-bold q-mb-xs">Medications <span class="text-red">*</span></div>
                <div v-for="(med, index) in form.medications" :key="index" class="row q-col-gutter-sm q-mb-sm items-center">
                  <div class="col">
                    <q-input v-model="form.medications[index]" outlined dense placeholder="E.g. Amoxicillin 500mg - 1 tab 3x day" />
                  </div>
                  <div class="col-auto">
                    <q-btn icon="remove_circle" color="negative" flat round dense @click="removeMedication(index)" v-if="form.medications.length > 1" />
                  </div>
                </div>
                <q-btn flat color="primary" icon="add" label="Add Medication" @click="addMedication" size="sm" class="q-mt-xs" />
              </div>

              <!-- Notes -->
              <div>
                <div class="text-weight-bold q-mb-xs">Additional Notes / Instructions</div>
                <q-input
                  v-model="form.notes"
                  outlined
                  type="textarea"
                  rows="4"
                  placeholder="E.g. Drink plenty of water and rest."
                />
              </div>

              <div class="row justify-end q-mt-lg">
                <q-btn label="Cancel" flat color="grey" class="q-mr-sm" @click="$router.back()" />
                <q-btn type="submit" label="Submit Prescription" unelevated color="primary" :loading="submitting" />
              </div>
            </q-form>

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

const form = reactive({
  diagnosis: '',
  notes: '',
  medications: ['']
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
});

const fetchPatientData = async () => {
  loading.value = true;
  try {
    // Parallel fetch for speed
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
    } else {
      console.error('Failed to fetch patient reports', reportsRes.reason);
    }

  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const openReport = (url) => {
  if (url) window.open(url, '_blank');
};

const addMedication = () => {
  form.medications.push('');
};

const removeMedication = (index) => {
  form.medications.splice(index, 1);
};

const submitPrescription = async () => {
  // Validate
  const validMedications = form.medications.filter(m => m.trim().length > 0);
  if (validMedications.length === 0) {
    $q.notify({ type: 'warning', message: 'Please add at least one medication.' });
    return;
  }

  submitting.value = true;

  try {
    await axios.post(
      `${API_URL}/api/prescriptions`,
      {
        patientId,
        appointmentId,
        diagnosis: form.diagnosis.trim(),
        notes: form.notes.trim(),
        medications: validMedications
      },
      { headers: getHeaders() }
    );

    $q.notify({ type: 'positive', message: 'Prescription created successfully!' });
    router.push('/doctor/consultations');
  } catch (error) {
    console.error('Prescription submission failed:', error);
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Failed to submit prescription.'
    });
  } finally {
    submitting.value = false;
  }
};
</script>
