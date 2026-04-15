<template>
  <q-page padding style="background: #f5f6fa;">
    <div class="text-h5 text-weight-bold text-dark q-mb-lg">Patient Records</div>

    <div v-if="loading" class="flex flex-center" style="min-height: 40vh;">
      <q-spinner-puff color="primary" size="50px" />
    </div>

    <div v-else-if="patients.length === 0" class="q-pa-xl flex flex-center column" style="min-height: 40vh;">
      <q-icon name="group_off" size="64px" color="grey-4" class="q-mb-md" />
      <div class="text-grey-5 text-h6">No patient records found.</div>
      <div class="text-grey-6 q-mt-sm">Patient records will appear once appointments are confirmed.</div>
    </div>

    <div v-else>
      <q-card flat bordered style="border-radius: 12px;">
        <q-table :rows="patients" :columns="columns" row-key="_id" flat bordered :pagination="{ rowsPerPage: 10 }">
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                flat dense rounded
                color="primary"
                icon="receipt_long"
                label="View Prescriptions"
                @click="openPrescriptionsModal(props.row.patientId || props.row._id)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- Prescriptions Modal -->
    <q-dialog v-model="modalOpen">
      <q-card style="width: 700px; max-width: 90vw; border-radius: 12px;">
        <q-card-section class="bg-primary text-white row items-center">
          <div class="text-h6">Patient Prescriptions</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-md">
          <div v-if="loadingModal" class="flex flex-center q-pa-xl">
            <q-spinner-puff color="primary" size="40px" />
          </div>
          <div v-else-if="modalPrescriptions.length === 0" class="text-center text-grey-6 q-pa-xl">
            No prescriptions found for this patient.
          </div>
          <div v-else>
            <q-list separator>
              <q-item v-for="rx in modalPrescriptions" :key="rx._id" class="q-py-md column">
                <div class="row items-center q-mb-sm full-width">
                  <div class="text-subtitle1 text-weight-bold text-dark">{{ rx.diagnosis || 'Prescription' }}</div>
                  <q-space />
                  <q-badge :color="rx.status === 'completed' ? 'green' : 'blue'" :label="rx.status || 'active'" class="q-mr-sm" />
                  <div class="text-caption text-grey-6">{{ formatDate(rx.createdAt) }}</div>
                </div>
                
                <div class="q-my-sm full-width">
                  <q-markup-table flat bordered dense separator="cell" class="text-caption">
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
                         <td class="text-dark">{{ typeof med === 'string' ? med : (med.name || '—') }}</td>
                         <td class="text-dark">{{ typeof med === 'string' ? '—' : (med.dosage || '—') }}</td>
                         <td class="text-dark">{{ typeof med === 'string' ? '—' : (med.frequency || '—') }}</td>
                         <td class="text-dark">{{ typeof med === 'string' ? '—' : (med.duration || '—') }}</td>
                      </tr>
                    </tbody>
                  </q-markup-table>
                </div>
              </q-item>
            </q-list>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import axios from 'axios';
import { fetchAppointments } from 'src/services/doctorApi';

const $q = useQuasar();
defineProps({ doctor: Object });

const patients = ref([]);
const loading = ref(true);

const modalOpen = ref(false);
const loadingModal = ref(false);
const modalPrescriptions = ref([]);

const columns = [
  { name: 'name', label: 'Patient Name', field: 'patientName', align: 'left', sortable: true },
  { name: 'date', label: 'Last Visit', field: row => new Date(row.appointmentDate).toLocaleDateString(), align: 'left' },
  { name: 'reason', label: 'Reason', field: 'reason', align: 'left' },
  { name: 'status', label: 'Status', field: 'status', align: 'center' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' }
];

const parseJwt = (t) => { try { return JSON.parse(atob(t.split('.')[1])); } catch { return null; } };
const getToken = () => localStorage.getItem('token') || localStorage.getItem('nexus_token');
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

onMounted(async () => {
  const token = getToken();
  const decoded = token ? parseJwt(token) : null;
  if (decoded?.roleId) {
    const apts = await fetchAppointments(decoded.roleId);
    // Deduplicate by patient name for a "records" view
    const seen = new Set();
    patients.value = apts.filter(a => {
      if (seen.has(a.patientName)) return false;
      seen.add(a.patientName);
      return true;
    });
  }
  loading.value = false;
});

const openPrescriptionsModal = async (targetPatientId) => {
  if (!targetPatientId) {
    $q.notify({ type: 'warning', message: 'Unable to identify patient ID.' });
    return;
  }
  
  modalOpen.value = true;
  loadingModal.value = true;
  modalPrescriptions.value = [];

  try {
    const res = await axios.get(`${API_URL}/api/prescriptions/${targetPatientId}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    
    if (res.data?.success) {
      modalPrescriptions.value = res.data.data || [];
    } else if (Array.isArray(res.data)) {
      modalPrescriptions.value = res.data;
    }
  } catch (error) {
    console.error("Failed to load prescriptions via gateway", error);
    $q.notify({ type: 'negative', message: error.response?.status === 502 ? 'Bad Gateway (Service Down)' : 'Could not fetch prescriptions.' });
  } finally {
    loadingModal.value = false;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};
</script>
