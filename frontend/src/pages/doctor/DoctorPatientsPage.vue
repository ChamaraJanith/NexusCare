<template>
  <q-page padding style="background: #f4f6f9;">
    <!-- Header with Stats -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-weight-bold text-grey-10">
          Patient Records
        </div>
        <div class="text-body2 text-grey-7">
          Manage clinical history and consultations
        </div>
      </div>

      <q-chip
        class="patient-count-chip"
        icon="groups"
      >
        {{ filteredPatients.length }} Patients
      </q-chip>
    </div>

    <!-- Controls Row -->
    <q-card flat class="filter-container q-mb-md">
      <div class="row items-center q-col-gutter-sm">
        <!-- Search -->
        <div class="col-12 col-md-6">
          <q-input
            v-model="searchQuery"
            dense outlined
            placeholder="Search patients..."
            class="filter-input modern-search"
          >
            <template v-slot:prepend>
              <q-icon name="search"/>
            </template>
          </q-input>
        </div>

        <!-- Toggle -->
        <div class="col-12 col-md-6 flex justify-end">
          <q-btn-toggle
            v-model="filterStatus"
            unelevated
            :options="[
              {label:'All Patients', value:'All'},
              {label:'Recent Updates', value:'Recent'}
            ]"
            class="modern-toggle"
          />
        </div>
      </div>
    </q-card>

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
      <q-card flat class="shadow-2 bg-white modern-table">
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
            <q-tr :props="props" class="hover-row cursor-pointer transition-generic">
              
              <!-- Patient Info Column -->
              <q-td key="info" :props="props" class="q-py-md">
                <div class="row items-center no-wrap">
                  <q-avatar size="48px" :color="getColor(props.row.patientName)" text-color="white" class="q-mr-md text-weight-bold shadow-1 modern-avatar">
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
                    @click.stop="openPrescriptionsModal(props.row)"
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
                    class="q-px-sm shadow-1 consult-btn"
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

    <!-- ══════════════════════════════════════════════════════════════════
         CLINICAL RECORDS MODAL — Hospital-Grade Prescription Timeline
         ══════════════════════════════════════════════════════════════════ -->
    <q-dialog v-model="modalOpen" maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card class="column" style="background: #f0f2f5;">
        <!-- Modal Header -->
        <q-card-section class="row items-center q-py-md q-px-lg" style="background: #1e293b;">
          <q-avatar icon="folder_shared" color="blue-8" text-color="white" size="42px" class="q-mr-md" />
          <div>
            <div style="color: #ffffff; font-size: 17px; font-weight: 700;">Patient Clinical Prescription History</div>
            <div style="color: #94a3b8; font-size: 12px;">Securely generated and maintained by NexusCare EMR system</div>
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup style="color: #94a3b8;" />
        </q-card-section>

        <!-- Modal Body -->
        <q-card-section class="col scroll q-pa-lg">
          <!-- Loading -->
          <div v-if="loadingModal" class="flex flex-center q-pa-xl column">
            <q-spinner-dots color="primary" size="50px" />
            <div class="q-mt-md" style="color: #6b7280;">Retrieving historical diagnoses...</div>
          </div>
          
          <!-- Empty State -->
          <div v-else-if="modalPrescriptions.length === 0" class="flex flex-center column q-pa-xl" style="background: #ffffff; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);">
             <q-icon name="medication" size="56px" color="grey-4" />
             <div style="font-size: 16px; font-weight: 600; color: #6b7280; margin-top: 12px;">No prescriptions yet</div>
             <div style="font-size: 13px; color: #9ca3af; margin-top: 4px;">Prescriptions will appear here once created for this patient.</div>
          </div>
          
          <!-- Timeline Layout -->
          <div v-else class="row q-col-gutter-lg justify-center">
            <div class="col-12 col-md-10 col-lg-8">
              <div class="crm-timeline">
                <div
                  v-for="(rx, index) in modalPrescriptions"
                  :key="rx._id"
                  class="crm-timeline-entry"
                >
                  <!-- Timeline Rail -->
                  <div class="crm-rail">
                    <div class="crm-dot" :class="{ 'crm-dot-latest': index === 0 }"></div>
                    <div v-if="index < modalPrescriptions.length - 1" class="crm-line"></div>
                  </div>

                  <!-- Prescription Document Card -->
                  <div class="crm-content">
                    <div class="crm-card">

                      <!-- HEADER: Diagnosis + Status + Date -->
                      <div class="crm-card-header">
                        <div class="row items-center" style="gap: 8px; flex-wrap: wrap;">
                          <q-badge v-if="index === 0" color="green-2" text-color="green-9" label="LATEST" class="text-weight-bold" rounded />
                          <div class="crm-diagnosis">{{ rx.diagnosis || 'General Consultation' }}</div>
                        </div>
                        <div class="row items-center" style="gap: 8px; flex-shrink: 0;">
                          <q-badge
                            :color="rx.status === 'completed' ? 'green-1' : (index === 0 ? 'blue-1' : 'grey-3')"
                            :text-color="rx.status === 'completed' ? 'green-9' : (index === 0 ? 'blue-9' : 'grey-8')"
                            :label="rx.status || 'Active'"
                            class="text-weight-bold text-uppercase"
                          />
                          <span class="crm-date-chip">{{ formatDateDetailed(rx.createdAt) }}</span>
                        </div>
                      </div>

                      <!-- BODY -->
                      <div class="crm-card-body">

                        
                        <div class="crm-meta-block">

                        <!-- LEFT COLUMN -->
                        <div class="crm-meta-col">

                          <div class="crm-meta-row">
                            <span class="crm-meta-label">Patient:</span>
                            <span class="crm-meta-value">
                              {{ rx.patientName || 'Unknown Patient' }}
                              <span v-if="rx.patientAge">({{ rx.patientAge }} yrs)</span>
                            </span>
                          </div>

                          <div class="crm-meta-row">
                            <span class="crm-meta-value">
                              {{ rx.doctorName ? 'Dr. ' + rx.doctorName : 'Dr. Not Available' }}
                            </span>
                          </div>

                        </div>

                        <!-- RIGHT COLUMN -->
                        <div class="crm-meta-col">

                          <div class="crm-meta-row">
                            <span class="crm-meta-label">Patient ID:</span>
                            <span class="crm-meta-value">
                              {{ rx.patientId || '—' }}
                            </span>
                          </div>

                          <div class="crm-meta-row">
                            <span class="crm-meta-label">Date:</span>
                            <span class="crm-meta-value">
                              {{ formatDateDetailed(rx.createdAt) }}
                            </span>
                          </div>

                        </div>

                      </div>

                        <!-- Symptoms -->
                        <div v-if="rx.symptoms && rx.symptoms.length > 0" class="crm-section">
                          <div class="crm-section-label">Symptoms</div>
                          <div class="crm-symptom-chips">
                            <span
                              v-for="(s, si) in parseModalSymptoms(rx.symptoms)"
                              :key="si"
                              class="crm-chip"
                            >{{ s }}</span>
                          </div>
                        </div>

                        <!-- Medicines Table -->
                        <div class="crm-section">
                          <div class="crm-section-label">Prescribed Medicines</div>
                          <div class="crm-table-wrap">
                            <table class="crm-med-table">
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
                                  <td class="crm-med-name">{{ typeof med === 'string' ? med : (med.name || '—') }}</td>
                                  <td>{{ typeof med === 'string' ? '—' : (med.dosage || '—') }}</td>
                                  <td>{{ typeof med === 'string' ? '—' : (med.frequency || '—') }}</td>
                                  <td>{{ typeof med === 'string' ? '—' : (med.duration || '—') }}</td>
                                  <td>{{ typeof med === 'string' ? '—' : (med.instructions || '—') }}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <!-- Doctor's Advice -->
                        <div v-if="rx.advice" class="crm-section">
                          <div class="crm-section-label">Doctor's Advice</div>
                          <div class="crm-advice-box">{{ rx.advice }}</div>
                        </div>

                        <!-- Follow-up -->
                        <div v-if="rx.followUpDate" class="crm-section">
                          <div class="crm-section-label">Follow-up</div>
                          <div class="crm-followup-box">
                            <q-icon name="event" size="xs" class="q-mr-xs" style="color: #6b7280;" />
                            {{ formatDateDetailed(rx.followUpDate) }}
                          </div>
                        </div>

                        <!-- Digital Footer -->
                        <div class="crm-footer">
                          Digitally generated prescription — NexusCare EMR
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
            age: pt.age || pt.patientAge || null,
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

const openPrescriptionsModal = async (patient) => {
  if (!patient?.patientId) {
    $q.notify({ type: 'warning', message: 'Invalid patient data.' });
    return;
  }

  modalOpen.value = true;
  loadingModal.value = true;
  modalPrescriptions.value = [];

  try {
    const res = await axios.get(`${API_URL}/api/prescriptions/${patient.patientId}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });

    const data = res.data?.success ? res.data.data : res.data;

    if (Array.isArray(data)) {
      let patientAge = patient.age;

      // 🔥 fallback: fetch from patient service if missing
      if (!patientAge) {
        try {
          const res = await axios.get(`${API_URL}/api/patient/doctor/${patient.patientId}`, {
            headers: { Authorization: `Bearer ${getToken()}` }
          });

          patientAge = res.data?.data?.age || null;

        } catch (err) {
          console.warn("Patient age fetch failed", err);
        }
      }

      modalPrescriptions.value = data.map(rx => ({
        ...rx,
        patientName: patient.patientName,
        patientAge
      }));
    }

  } catch (error) {
    console.error(error);
    $q.notify({ type: 'negative', message: 'Failed to load prescriptions' });
  } finally {
    loadingModal.value = false;
  }
};

// Parse symptoms for chip display
const parseModalSymptoms = (symptoms) => {
  if (!symptoms) return [];
  if (Array.isArray(symptoms)) return symptoms;
  return symptoms.split(',').map(s => s.trim()).filter(Boolean);
};

const formatDateDetailed = (dateString) => {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
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

const getRelativeTime = (timestampMs) => {
  if (!timestampMs) return '';
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const daysDifference = Math.round((timestampMs - Date.now()) / (1000 * 60 * 60 * 24));
  return daysDifference === 0 ? 'Today' : rtf.format(daysDifference, 'day');
};
</script>

<style scoped>
/* ── Table row hover ─────────────────────────────────────────────────────── */
.hover-shadow:hover {
  background: #fdfdfd !important;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05) !important;
  transform: translateY(-1px);
}
.transition-generic {
  transition: all 0.2s ease-in-out;
}

/* ══════════════════════════════════════════════════════════════════════════
   CLINICAL RECORDS MODAL — Hospital-grade prescription timeline
   ══════════════════════════════════════════════════════════════════════════ */

/* ── Timeline scaffold ───────────────────────────────────────────────────── */
.crm-timeline {
  display: flex;
  flex-direction: column;
}
.crm-timeline-entry {
  display: flex;
  gap: 16px;
}
.crm-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 20px;
  flex-shrink: 0;
}
.crm-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #cbd5e1;
  border: 2px solid #e2e8f0;
  margin-top: 20px;
  flex-shrink: 0;
  z-index: 1;
}
.crm-dot-latest {
  background: #1976D2;
  border-color: #bbdefb;
  width: 14px;
  height: 14px;
  box-shadow: 0 0 0 4px rgba(25, 118, 210, 0.15);
}
.crm-line {
  width: 2px;
  flex: 1;
  background: #e2e8f0;
  min-height: 20px;
}
.crm-content {
  flex: 1;
  padding-bottom: 20px;
  min-width: 0;
}

/* ── Prescription card ───────────────────────────────────────────────────── */
.crm-card {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

/* ── Card header ─────────────────────────────────────────────────────────── */
.crm-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
  gap: 12px;
  flex-wrap: wrap;
}
.crm-diagnosis {
  font-size: 17px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.3;
}
.crm-date-chip {
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
}

/* ── Card body ───────────────────────────────────────────────────────────── */
.crm-card-body {
  padding: 16px 20px;
}

/* ── Doctor meta block ───────────────────────────────────────────────────── */
.crm-meta-block {
  background: #f9fafb;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 16px;
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}
.crm-meta-row {
  display: flex;
  gap: 6px;
  align-items: baseline;
}
.crm-meta-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  white-space: nowrap;
}
.crm-meta-value {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
}

/* ── Section labels ──────────────────────────────────────────────────────── */
.crm-section {
  margin-bottom: 16px;
}
.crm-section-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6b7280;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #f0f0f0;
}

/* ── Symptom chips ───────────────────────────────────────────────────────── */
.crm-symptom-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.crm-chip {
  display: inline-block;
  background: #fef3c7;
  color: #92400e;
  font-size: 12px;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 12px;
  border: 1px solid #fde68a;
}

/* ── Medicine table ──────────────────────────────────────────────────────── */
.crm-table-wrap {
  overflow-x: auto;
}
.crm-med-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}
.crm-med-table th {
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
.crm-med-table td {
  padding: 10px 12px;
  color: #1f2937;
  border-bottom: 1px solid #f3f4f6;
}
.crm-med-table tbody tr:nth-child(even) {
  background: #f9fafb;
}
.crm-med-table tbody tr:hover {
  background: #eff6ff;
}
.crm-med-name {
  font-weight: 600;
}

/* ── Advice box ──────────────────────────────────────────────────────────── */
.crm-advice-box {
  background: #eff6ff;
  border-left: 3px solid #1976D2;
  border-radius: 4px;
  padding: 10px 14px;
  font-size: 13px;
  color: #1f2937;
  line-height: 1.5;
}

/* ── Follow-up box ───────────────────────────────────────────────────────── */
.crm-followup-box {
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

/* ── Digital footer ──────────────────────────────────────────────────────── */
.crm-footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed #e5e7eb;
  text-align: center;
  font-size: 11px;
  color: #9ca3af;
  font-style: italic;
}

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 600px) {
  .crm-card-header {
    flex-direction: column;
  }
  .crm-meta-block {
    flex-direction: column;
    gap: 6px;
  }
}

.crm-meta-block {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  flex-wrap: wrap;
}

.crm-meta-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-container {
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(10px);
  border-radius: 14px;
  padding: 10px 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
  border: 1px solid #eef2f7;
  position: sticky;
  top: 10px;
  z-index: 20;
}

.filter-input {
  border-radius: 10px !important;
}

.filter-input :deep(.q-field__control) {
  border-radius: 10px !important;
}

.modern-toggle {
  background: #e5e7eb;
  border-radius: 14px;
  padding: 4px;
}

/* 🔥 VERY IMPORTANT — FIX */
.modern-toggle :deep(.q-btn .q-btn__content) {
  color: #374151 !important;
  font-weight: 600;
}

/* ACTIVE TEXT */
.modern-toggle :deep(.q-btn--active .q-btn__content) {
  color: white !important;
}

/* BUTTON STYLE */
.modern-toggle :deep(.q-btn) {
  border-radius: 10px;
  font-size: 12px;
  background: transparent;
}

/* ACTIVE BACKGROUND */
.modern-toggle :deep(.q-btn--active) {
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* HOVER */
.modern-toggle :deep(.q-btn:hover) {
  background: #d1d5db;
}

.modern-table {
  border-radius: 16px;
  background: white;
  box-shadow: 0 6px 20px rgba(0,0,0,0.06);
}

.hover-row {
  transition: all 0.2s ease;
}

.hover-row:hover {
  background: #f9fafb !important;
  transform: translateY(-1px);
}

.modern-avatar {
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: white;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.consult-btn {
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: white;
  border-radius: 10px;
}

.q-btn {
  transition: all 0.2s ease;
}

.q-btn:hover {
  transform: translateY(-1px);
}

.text-dark {
  color: #111827 !important;
}

.text-grey-6 {
  color: #4b5563 !important;
}

.text-grey-7 {
  color: #374151 !important;
}

.patient-count-chip {
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: white;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 999px;
}

.modern-search {
  background: white;
  border-radius: 12px;
}

.modern-search:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}
</style>