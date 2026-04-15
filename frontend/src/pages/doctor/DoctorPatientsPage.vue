<template>
  <q-page padding style="background: #f4f6f9;">
    <!-- Header with Stats -->
    <div class="row items-center q-mb-xl">
      <div>
        <div class="text-h4 text-weight-bolder text-dark">Patient Records</div>
        <div class="text-subtitle1 text-grey-6 q-mt-xs">Manage and review your clinical patient history.</div>
      </div>
    </div>

    <!-- Controls Row -->
    <div class="row q-col-gutter-md q-mb-md justify-between items-center">
      <div class="col-12 col-md-4">
        <q-input 
          v-model="searchQuery" 
          outlined 
          dense 
          placeholder="Search by name or ID..."
          class="bg-white q-pr-sm"
          style="border-radius: 8px;"
        >
          <template v-slot:prepend>
            <q-icon name="search" color="grey-6" />
          </template>
        </q-input>
      </div>
      <div class="col-12 col-md-4 flex justify-end">
         <q-btn-toggle
            v-model="filterStatus"
            flat
            toggle-color="primary"
            color="grey-6"
            :options="[
              {label: 'All Patients', value: 'All'},
              {label: 'Recent Updates', value: 'Recent'}
            ]"
            style="border: 1px solid #e0e0e0; border-radius: 8px; background: white;"
          />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="q-pa-xl flex flex-center column">
      <q-spinner-puff color="primary" size="60px" />
      <div class="text-grey-6 q-mt-md text-weight-medium">Synchronizing EMR data globally...</div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredPatients.length === 0" class="q-pa-xl flex flex-center column bg-white shadow-1" style="border-radius: 12px; min-height: 40vh;">
      <q-icon name="folder_off" size="80px" color="grey-4" class="q-mb-md" />
      <div class="text-dark text-h5 text-weight-bold">No Clinical Records Found</div>
      <div class="text-grey-6 q-mt-sm">You haven't scheduled any patients mapping this criteria recently.</div>
    </div>

    <!-- Hybrid EMR Data Table -->
    <div v-else>
      <q-card flat class="shadow-2 bg-white" style="border-radius: 12px; overflow: hidden;">
        <q-table 
          :rows="filteredPatients" 
          :columns="columns" 
          row-key="patientId" 
          flat 
          :filter="searchQuery"
          :pagination="{ rowsPerPage: 10, sortBy: 'rawLastVisit', descending: true }"
          table-header-class="bg-grey-1 text-grey-8 text-weight-bold uppercase"
        >
          <!-- Custom Body Slot for Hybrid Card Feel -->
          <template v-slot:body="props">
            <q-tr :props="props" class="hover-shadow cursor-pointer transition-generic">
              
              <!-- Patient Info Column -->
              <q-td key="info" :props="props" class="q-py-md">
                <div class="row items-center no-wrap">
                  <q-avatar size="48px" :color="getColor(props.row.patientName)" text-color="white" class="q-mr-md text-weight-bold shadow-1">
                    {{ props.row.patientName ? props.row.patientName.charAt(0).toUpperCase() : '?' }}
                  </q-avatar>
                  <div class="column">
                    <span class="text-weight-bold text-dark text-subtitle1">{{ props.row.patientName }}</span>
                    <span class="text-caption text-grey-6">{{ props.row.patientId }}</span>
                  </div>
                </div>
              </q-td>

              <!-- Last Visit Column -->
              <q-td key="lastVisit" :props="props">
                <div class="column">
                  <span class="text-weight-bold text-dark">{{ props.row.lastVisit }}</span>
                  <span v-if="props.row.lastVisit !== 'No visits yet'" class="text-caption text-grey-5">{{ getRelativeTime(props.row.rawLastVisit) }}</span>
                </div>
              </q-td>

              <!-- Diagnosis Column -->
              <q-td key="diagnosis" :props="props">
                <div class="text-dark text-weight-medium ellipsis" style="max-width: 250px;">
                  {{ props.row.reason }}
                  <q-tooltip v-if="props.row.reason !== '—'" class="bg-dark text-body2 shadow-4" transition-show="scale" transition-hide="scale">
                    {{ props.row.reason }}
                  </q-tooltip>
                </div>
              </q-td>

              <!-- Status Badge Column -->
              <q-td key="status" :props="props" class="text-center">
                <q-badge 
                  rounded
                  :color="props.row.status === 'completed' ? 'green-2' : (props.row.status === 'confirmed' ? 'blue-2' : 'grey-2')"
                  :text-color="props.row.status === 'completed' ? 'green-9' : (props.row.status === 'confirmed' ? 'blue-9' : 'grey-9')"
                  class="q-px-sm q-py-xs text-weight-bold"
                  style="text-transform: capitalize;"
                >
                  {{ props.row.status || 'Active' }}
                </q-badge>
              </q-td>

              <!-- Actions Column -->
              <q-td key="actions" :props="props" class="text-right">
                <div class="row q-gutter-x-sm justify-end no-wrap">
                  
                  <q-btn 
                    outline 
                    rounded 
                    no-caps
                    color="primary" 
                    icon="receipt_long" 
                    label="Records"
                    size="sm"
                    class="q-px-sm bg-white"
                    @click.stop="openPrescriptionsModal(props.row.patientId)"
                  >
                    <q-tooltip>Past Prescriptions</q-tooltip>
                  </q-btn>
                  
                  <q-btn 
                    unelevated 
                    rounded 
                    no-caps
                    color="primary" 
                    icon="medical_services" 
                    label="Consult"
                    size="sm"
                    class="q-px-sm shadow-1"
                    @click.stop="$router.push({ path: '/doctor/prescription', query: { patientId: props.row.patientId, appointmentId: props.row.appointmentId }})"
                  >
                     <q-tooltip>Start Formal Consultation</q-tooltip>
                  </q-btn>

                </div>
              </q-td>

            </q-tr>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- Prescriptions Deep Dive Modal -->
    <q-dialog v-model="modalOpen" maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card class="column bg-grey-1">
        <q-card-section class="row items-center q-pb-sm bg-white shadow-1 z-top">
          <q-avatar icon="folder_shared" color="primary" text-color="white" class="q-mr-md" />
          <div class="text-h6 text-weight-bold text-dark">Clinical Records Overview</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup color="grey-8" />
        </q-card-section>

        <q-separator />

        <q-card-section class="col scroll q-pa-lg clinical-records-container">
          <div v-if="loadingModal" class="flex flex-center q-pa-xl column">
            <q-spinner-dots color="primary" size="50px" />
            <div class="q-mt-md text-grey-6">Retrieving historical diagnoses...</div>
          </div>
          
          <div v-else-if="modalPrescriptions.length === 0" class="flex flex-center column q-pa-xl bg-white shadow-1" style="border-radius: 12px;">
             <q-icon name="history" size="64px" color="grey-4" class="q-mb-md" />
             <div class="text-h6 text-dark text-weight-bold">No clinical history</div>
             <div class="text-grey-6 text-center">There are no documented prescriptions or clinical visits for this internal ID.</div>
          </div>
          
          <div v-else class="row q-col-gutter-lg justify-center">
            <div class="col-12 col-md-10 col-lg-8">
              <q-timeline color="primary" layout="dense">
                <q-timeline-entry 
                  v-for="(rx, index) in modalPrescriptions" 
                  :key="rx._id"
                  :title="rx.diagnosis || 'General Consultation'"
                  :subtitle="formatDateDetailed(rx.createdAt)"
                  icon="medical_information"
                  :color="index === 0 ? 'primary' : 'grey-5'"
                >
                  <q-card flat bordered class="q-mt-sm shadow-1 bg-white" style="border-radius: 8px;">
                    <q-card-section>
                      <q-badge v-if="index === 0" color="red-2" text-color="red-9" class="q-mb-sm rounded-borders text-caption text-weight-bold">LATEST RECORD</q-badge>
                      
                      <div class="text-body2 text-grey-8 q-mb-md" v-if="rx.symptoms">
                         <span class="text-weight-bold text-dark">Symptoms reported:</span> 
                         {{ Array.isArray(rx.symptoms) ? rx.symptoms.join(', ') : rx.symptoms }}
                      </div>

                      <q-markup-table flat bordered dense separator="cell" class="text-caption shadow-0">
                        <thead class="bg-grey-2">
                          <tr>
                            <th class="text-left text-dark">Medicine</th>
                            <th class="text-left text-dark">Dosage</th>
                            <th class="text-left text-dark">Freq</th>
                            <th class="text-left text-dark">Dur</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(med, i) in rx.medicines" :key="i">
                            <td class="text-dark text-weight-medium">{{ typeof med === 'string' ? med : (med.name || '—') }}</td>
                            <td class="text-dark">{{ typeof med === 'string' ? '—' : (med.dosage || '—') }}</td>
                            <td class="text-dark">{{ typeof med === 'string' ? '—' : (med.frequency || '—') }}</td>
                            <td class="text-dark">{{ typeof med === 'string' ? '—' : (med.duration || '—') }}</td>
                          </tr>
                        </tbody>
                      </q-markup-table>

                       <div class="text-body2 text-grey-8 q-mt-md" v-if="rx.advice">
                         <span class="text-weight-bold text-dark">Doctor's Advice:</span> {{ rx.advice }}
                      </div>
                    </q-card-section>
                  </q-card>
                </q-timeline-entry>
              </q-timeline>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import axios from 'axios';
import { fetchAppointments } from 'src/services/doctorApi';

const $q = useQuasar();

const mappedPatients = ref([]);
const loading = ref(true);

const searchQuery = ref('');
const filterStatus = ref('All'); 

const modalOpen = ref(false);
const loadingModal = ref(false);
const modalPrescriptions = ref([]);

const columns = [
  { name: 'info', label: 'Patient Profile', field: 'patientName', align: 'left', sortable: true },
  { name: 'lastVisit', label: 'Last Clinical Visit', field: 'rawLastVisit', align: 'left', sortable: true },
  { name: 'diagnosis', label: 'Latest Diagnosis', field: 'reason', align: 'left' },
  { name: 'status', label: 'Current Status', field: 'status', align: 'center', sortable: true },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' }
];

const parseJwt = (t) => { try { return JSON.parse(atob(t.split('.')[1])); } catch { return null; } };
const getToken = () => localStorage.getItem('token') || localStorage.getItem('nexus_token');
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Global unique color mapping based entirely on characters natively
const getColor = (name) => {
  if (!name) return 'grey-5';
  const colors = ['teal', 'blue', 'indigo', 'purple', 'deep-orange', 'green-7', 'red-5', 'cyan-8'];
  let sum = 0;
  for(let i=0; i<name.length; i++) sum += name.charCodeAt(i);
  return colors[sum % colors.length];
};

onMounted(async () => {
  const token = getToken();
  const decoded = token ? parseJwt(token) : null;
  
  if (decoded?.roleId) {
    try {
      const apts = await fetchAppointments(decoded.roleId);
      
      // Deduplicate locally mapping base fields
      const seen = new Set();
      const uniquePatients = apts.filter(a => {
        if (seen.has(a.patientId || a.patientName)) return false;
        seen.add(a.patientId || a.patientName);
        return true;
      });

      // Part 6: Promise.all parallel executions natively isolated fetching /api/prescriptions
      // We safely extend the iteration map capturing actual EMR data securely
      const patientPromises = uniquePatients.map(async (pt) => {
         const pid = pt.patientId || pt._id; // Provide fallback depending on exact gateway map
         
         const baseProfile = {
            patientName: pt.patientName || 'Unknown Patient',
            patientId: pid,
            appointmentId: pt._id,
            status: pt.status,
            rawLastVisit: 0,
            lastVisit: 'No visits yet',
            reason: '—'
         };

         try {
            const rxRes = await axios.get(`${API_URL}/api/prescriptions/${pid}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const data = rxRes.data?.success ? rxRes.data.data : rxRes.data;
            
            // Assuming array ordered DESC organically (first is latest)
            if (Array.isArray(data) && data.length > 0) {
               const latest = data[0];
               baseProfile.rawLastVisit = new Date(latest.createdAt).getTime();
               baseProfile.lastVisit = new Date(latest.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
               baseProfile.reason = latest.diagnosis || '—';
            }
         } catch (err) {
            // Fails cleanly keeping base profile isolated natively
            console.error(`Missing rx details safely caught for ${pid}`, err);
         }
         return baseProfile;
      });

      mappedPatients.value = await Promise.all(patientPromises);

    } catch (e) {
      console.error('Fatal extraction fail building patient map', e);
      $q.notify({ type: 'negative', message: 'Failed to synchronize complete records map from Gateway' });
    }
  }
  loading.value = false;
});

const filteredPatients = computed(() => {
  let res = mappedPatients.value;
  if(filterStatus.value === 'Recent') {
     res = res.filter(p => p.rawLastVisit > 0);
  }
  return res;
});

const openPrescriptionsModal = async (targetPatientId) => {
  if (!targetPatientId) {
    $q.notify({ type: 'warning', message: 'Unable to identify clinical profile ID strictly.' });
    return;
  }
  
  modalOpen.value = true;
  loadingModal.value = true;
  modalPrescriptions.value = [];

  try {
    const res = await axios.get(`${API_URL}/api/prescriptions/${targetPatientId}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    
    const data = res.data?.success ? res.data.data : res.data;
    if (Array.isArray(data)) {
       modalPrescriptions.value = data;
    }
  } catch (error) {
    console.error("Gateway load failed isolated", error);
    $q.notify({ type: 'negative', message: error.response?.status === 502 ? 'Bad Gateway (Service Down)' : 'Could not fetch prescriptions reliably.' });
  } finally {
    loadingModal.value = false;
  }
};

const formatDateDetailed = (dateString) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) + ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit' });
};

const getRelativeTime = (timestampMs) => {
  if (!timestampMs) return '';
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const daysDifference = Math.round((timestampMs - Date.now()) / (1000 * 60 * 60 * 24));
  return daysDifference === 0 ? 'Today' : rtf.format(daysDifference, 'day');
};
</script>

<style scoped>
.hover-shadow:hover {
  background: #fdfdfd !important;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05) !important;
  transform: translateY(-1px);
}
.transition-generic {
  transition: all 0.2s ease-in-out;
}

/* 🔥 FIX CLINICAL RECORD TEXT VISIBILITY */
.clinical-records-container {
  color: #1f2937 !important; /* dark readable */
}

/* timeline title */
.clinical-records-container .record-title {
  color: #111827 !important;
  font-weight: 700;
}

/* date text */
.clinical-records-container .record-date {
  color: #374151 !important;
}

/* body text */
.clinical-records-container .record-text {
  color: #4b5563 !important;
}

/* table text fix */
.clinical-records-container table,
.clinical-records-container td,
.clinical-records-container th {
  color: #1f2937 !important;
}

</style>
