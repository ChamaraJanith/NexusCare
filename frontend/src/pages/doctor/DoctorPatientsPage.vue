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
        <q-table :rows="patients" :columns="columns" row-key="_id" flat bordered :pagination="{ rowsPerPage: 10 }" />
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { fetchAppointments } from 'src/services/doctorApi';

const props = defineProps({ doctor: Object });
const patients = ref([]);
const loading = ref(true);

const columns = [
  { name: 'name', label: 'Patient Name', field: 'patientName', align: 'left', sortable: true },
  { name: 'date', label: 'Last Visit', field: row => new Date(row.appointmentDate).toLocaleDateString(), align: 'left' },
  { name: 'reason', label: 'Reason', field: 'reason', align: 'left' },
  { name: 'status', label: 'Status', field: 'status', align: 'center' },
];

const parseJwt = (t) => { try { return JSON.parse(atob(t.split('.')[1])); } catch { return null; } };

onMounted(async () => {
  const token = localStorage.getItem('token') || localStorage.getItem('nexus_token');
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
</script>
