<template>
  <q-page padding style="background: #f5f6fa;">
    <div class="text-h5 text-weight-bold text-dark q-mb-lg">Consultations</div>

    <div v-if="loading" class="flex flex-center" style="min-height: 40vh;">
      <q-spinner-puff color="primary" size="50px" />
    </div>

    <div v-else-if="consultations.length === 0" class="q-pa-xl flex flex-center column" style="min-height: 40vh;">
      <q-icon name="chat_bubble_outline" size="64px" color="grey-4" class="q-mb-md" />
      <div class="text-grey-5 text-h6">No consultations found.</div>
    </div>

    <div v-else class="column q-gutter-y-sm">
      <q-card v-for="c in consultations" :key="c._id" flat bordered style="border-radius: 10px;">
        <q-card-section class="row items-center">
          <q-avatar size="44px" style="background: #edf2f7;" class="q-mr-md">
            <span class="text-primary text-weight-bold">{{ getInitials(c.patientName) }}</span>
          </q-avatar>
          <div class="col">
            <div class="text-weight-bold text-dark" style="font-size: 15px;">{{ c.patientName }}</div>
            <div class="text-grey-6" style="font-size: 12px;">{{ c.reason || 'General Consultation' }} · {{ formatDate(c.appointmentDate) }}</div>
          </div>
          <q-badge :color="c.status === 'completed' ? 'positive' : 'orange'" :label="c.status" class="text-capitalize" />
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { fetchAppointments } from 'src/services/doctorApi';

const props = defineProps({ doctor: Object });
const consultations = ref([]);
const loading = ref(true);

const parseJwt = (t) => { try { return JSON.parse(atob(t.split('.')[1])); } catch { return null; } };
const getInitials = (n) => n ? n.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : '?';
const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString() : '';

onMounted(async () => {
  const token = localStorage.getItem('token') || localStorage.getItem('nexus_token');
  const decoded = token ? parseJwt(token) : null;
  if (decoded?.roleId) {
    consultations.value = await fetchAppointments(decoded.roleId);
  }
  loading.value = false;
});
</script>
