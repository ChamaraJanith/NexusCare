<template>
  <q-page padding style="background: #f5f6fa;">
    <div class="text-h5 text-weight-bold text-dark q-mb-lg">Consultations</div>

    <div v-if="loading" class="flex flex-center" style="min-height: 40vh;">
      <q-spinner-puff color="primary" size="50px" />
    </div>

    <div v-else-if="consultations.length === 0"
      class="q-pa-xl flex flex-center column" style="min-height: 40vh;">
      <q-icon name="video_call" size="64px" color="grey-4" class="q-mb-md" />
      <div class="text-grey-5 text-h6">No ready consultations.</div>
      <div class="text-grey-4 text-caption q-mt-sm">
        Consultations appear here once a patient confirms and pays.
      </div>
    </div>

    <div v-else class="column q-gutter-y-sm">
      <q-card
        v-for="apt in consultations"
        :key="apt._id"
        flat bordered
        style="border-radius: 10px; border-left: 4px solid #3b82f6;"
      >
        <q-card-section class="row items-center no-wrap">

          <!-- Avatar -->
          <q-avatar size="44px" style="background: #edf2f7;" class="q-mr-md flex-shrink-0">
            <span class="text-primary text-weight-bold">
              {{ getInitials(apt.patientName) }}
            </span>
          </q-avatar>

          <!-- Info -->
          <div class="col">
            <div class="text-weight-bold text-dark" style="font-size: 15px;">
              {{ apt.patientName || 'Patient' }}
            </div>
            <div class="text-grey-6" style="font-size: 12px;">
              {{ apt.date }} · {{ apt.time }} · {{ apt.appointmentType }}
            </div>
            <div class="row q-gutter-x-sm q-mt-xs">
              <q-badge color="blue" label="CONFIRMED" />
              <q-badge color="green" label="PAID" />
              <q-badge color="grey" :label="'Queue #' + apt.queueNumber" />
            </div>
          </div>

          <!-- Actions -->
          <div class="row q-gutter-xs flex-shrink-0">
            <!-- Join video (ONLINE only) -->
            <q-btn
              v-if="apt.appointmentType === 'ONLINE'"
              unelevated dense size="sm"
              color="primary" icon="video_call" label="Join"
              @click="joinVideo(apt)"
            />

            <!-- Write prescription / Start Consultation -->
            <q-btn
              unelevated dense size="sm"
              color="teal" icon="edit_note" label="Start Consultation"
              @click="startConsultation(apt)"
            />

            <!-- Mark complete -->
            <q-btn
              unelevated dense size="sm"
              color="positive" icon="done_all" label="Complete"
              :loading="completingId === apt._id"
              @click="markComplete(apt)"
            />
          </div>

        </q-card-section>
      </q-card>
    </div>

  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import axios from 'axios';

defineProps({ doctor: Object });

const router = useRouter();
const $q = useQuasar();
const consultations = ref([]);
const loading = ref(true);
const completingId = ref('');



const getToken = () =>
  localStorage.getItem('token') || localStorage.getItem('nexus_token');

const parseJwt = (t) => {
  try { return JSON.parse(atob(t.split('.')[1])); } catch { return null; }
};

const getInitials = (n) =>
  n ? n.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : '?';

// ── Fetch only CONFIRMED + PAID appointments ──────────────────────────────────
onMounted(async () => {
  const token = getToken();
  const decoded = token ? parseJwt(token) : null;
  const doctorId = decoded?.roleId;

  if (!doctorId) { loading.value = false; return; }

  try {
    const { data } = await axios.get(
      `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/appointments/doctor/${doctorId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const all = Array.isArray(data) ? data : [];

    // Only show appointments that are CONFIRMED AND fully paid
    consultations.value = all.filter(
      a => a.status === 'CONFIRMED' && a.paymentStatus === 'PAID'
    );
  } catch (err) {
    console.error('Failed to fetch consultations', err);
    $q.notify({ type: 'negative', message: 'Could not load consultations.' });
  } finally {
    loading.value = false;
  }
});

// ── Join video session ────────────────────────────────────────────────────────
const joinVideo = (apt) => {
  router.push({
    path: '/doctorVideo',
    query: {
      appointmentId: apt._id,
      doctorId: apt.doctorId,
    }
  });
};

// ── Start Consultation ────────────────────────────────────────────────────────
const startConsultation = (apt) => {
  router.push({
    path: '/doctor/prescription',
    query: {
      patientId: apt.patientId,
      appointmentId: apt._id
    }
  });
};

// ── Mark complete ─────────────────────────────────────────────────────────────
const markComplete = async (apt) => {
  completingId.value = apt._id;
  const token = getToken();

  try {
    await axios.put(
      `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/appointments/doctor/complete/${apt._id}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Remove from consultations list once completed
    consultations.value = consultations.value.filter(a => a._id !== apt._id);
    $q.notify({ type: 'positive', message: 'Consultation marked as completed!' });
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.response?.data?.error || 'Failed to update.'
    });
  } finally {
    completingId.value = '';
  }
};
</script>
