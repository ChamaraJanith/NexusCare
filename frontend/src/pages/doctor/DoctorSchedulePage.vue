<template>
  <q-page padding style="background: #f5f6fa;">
    <div class="text-h5 text-weight-bold text-dark q-mb-lg">My Schedule</div>

    <div v-if="loading" class="flex flex-center" style="min-height: 40vh;">
      <q-spinner-puff color="primary" size="50px" />
    </div>

    <div v-else-if="appointments.length === 0" class="q-pa-xl flex flex-center column" style="min-height: 40vh;">
      <q-icon name="event_busy" size="64px" color="grey-4" class="q-mb-md" />
      <div class="text-grey-5 text-h6">No scheduled appointments.</div>
    </div>

    <div v-else class="column q-gutter-y-sm">
      <q-card v-for="apt in appointments" :key="apt._id" flat bordered style="border-radius: 10px; border-left: 4px solid #4caf50;">
        <q-card-section class="row items-center">
          <q-avatar size="44px" style="background: #edf2f7;" class="q-mr-md">
            <span class="text-primary text-weight-bold">{{ getInitials(apt.patientName) }}</span>
          </q-avatar>
          <div class="col">
            <div class="text-weight-bold text-dark" style="font-size: 15px;">{{ apt.patientName || 'Patient' }}</div>
            <div class="text-grey-6" style="font-size: 12px;">{{ formatDateTime(apt.appointmentDate) }} · {{ apt.reason || 'Consultation' }}</div>
          </div>
          <q-badge :color="statusColor(apt.status)" :label="apt.status || 'pending'" class="text-capitalize" />
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { fetchAppointments } from 'src/services/doctorApi';

const props = defineProps({ doctor: Object });
const appointments = ref([]);
const loading = ref(true);

const parseJwt = (t) => { try { return JSON.parse(atob(t.split('.')[1])); } catch { return null; } };

const formatDateTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? String(iso) : d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getInitials = (n) => n ? n.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : '?';

const statusColor = (s) => {
  const map = { active: 'positive', confirmed: 'positive', scheduled: 'info', waiting: 'warning', completed: 'grey', cancelled: 'negative' };
  return map[s] || 'grey';
};

onMounted(async () => {
  const token = localStorage.getItem('token') || localStorage.getItem('nexus_token');
  const decoded = token ? parseJwt(token) : null;
  if (decoded?.roleId) {
    appointments.value = await fetchAppointments(decoded.roleId);
  }
  loading.value = false;
});
</script>
