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

      <!-- Filter Bar -->
      <q-card flat class="filter-container q-mb-md">
        <div class="row items-center q-col-gutter-sm">
          <!-- Search -->
          <div class="col-12 col-md-4">
            <q-input
              v-model="search"
              dense outlined
              placeholder="Search patient..."
              class="filter-input"
            >
              <template v-slot:prepend>
                <q-icon name="search" size="16px" color="grey-6"/>
              </template>
            </q-input>
          </div>

          <!-- Date -->
          <div class="col-6 col-md-3">
            <q-input
              v-model="selectedDate"
              dense outlined type="date"
              class="filter-input"
            >
              <template v-slot:prepend>
                <q-icon name="event" size="16px"/>
              </template>
            </q-input>
          </div>

          <!-- Type -->
          <div class="col-6 col-md-3">
            <q-select
              v-model="typeFilter"
              dense outlined
              :options="['ALL','ONLINE','PHYSICAL']"
              class="filter-input"
            >
              <template v-slot:prepend>
                <q-icon name="tune" size="16px"/>
              </template>
            </q-select>
          </div>

          <!-- Reset -->
          <div class="col-12 col-md-2">
            <q-btn
              unelevated
              color="grey-2"
              text-color="dark"
              icon="restart_alt"
              label="Reset"
              class="full-width"
              @click="resetFilters"
            />
          </div>
        </div>
      </q-card>

      <!-- Empty Filter State -->
      <div v-if="filteredConsultations.length === 0" class="q-pa-xl flex flex-center column text-grey-5" style="min-height: 20vh;">
        <q-icon name="search_off" size="48px" class="q-mb-sm" />
        <div>No consultations match your filters.</div>
      </div>

      <q-card
        v-for="apt in filteredConsultations"
        :key="apt._id"
        flat bordered
        style="border-radius: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);"
        class="consultation-card"
      >
        <q-card-section class="row items-center no-wrap q-py-sm q-px-md">

          <!-- Avatar -->
          <q-avatar size="40px" style="background: linear-gradient(135deg, #4facfe, #00f2fe);" class="q-mr-md flex-shrink-0">
            <span class="text-white text-weight-bold" style="font-size: 14px;">
              {{ getInitials(apt.patientName) }}
            </span>
          </q-avatar>

          <!-- Info -->
          <div class="col column justify-center" style="min-width: 0;">
            <div class="text-weight-bold text-dark ellipsis" style="font-size: 14px;">
              {{ apt.patientName || 'Patient' }}
            </div>
            <div class="text-grey-6 ellipsis" style="font-size: 12px; margin-top: 2px;">
              {{ apt.date }} · {{ apt.time }} · {{ apt.appointmentType }}
            </div>
            <div class="row q-gutter-x-sm q-mt-xs">
              <q-badge color="blue-1" text-color="blue-8" label="CONFIRMED" rounded style="font-size: 10px;" />
              <q-badge color="green-1" text-color="green-8" label="PAID" rounded style="font-size: 10px;" />
              <q-badge color="grey-2" text-color="grey-8" :label="'Queue #' + apt.queueNumber" rounded style="font-size: 10px;" />
              <q-badge v-if="apt.consultationCompleted" color="green" label="COMPLETED" rounded style="font-size: 10px;" />
              <q-badge v-else-if="apt.consultationStarted" color="orange" label="IN PROGRESS" rounded style="font-size: 10px;" />
            </div>
          </div>

          <!-- Actions -->
          <div class="row q-gutter-x-sm flex-shrink-0">
            <!-- Join video (ONLINE only) -->
            <q-btn
              v-if="apt.appointmentType === 'ONLINE'"
              unelevated dense size="sm"
              color="blue" icon="video_call" label="Join"
              @click="handleJoin(apt)"
              style="border-radius: 8px;"
            />

            <!-- Write prescription / Start Consultation -->
            <q-btn
              unelevated dense size="sm"
              :color="apt.consultationStarted ? 'purple' : 'teal'"
              icon="edit_note"
              :label="apt.consultationStarted ? 'View Consultation' : 'Start Consultation'"
              @click="openConsultation(apt)"
              style="border-radius: 8px;"
            />
          </div>

        </q-card-section>
      </q-card>
    </div>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import axios from 'axios';

defineProps({ doctor: Object });

const router = useRouter();
const $q = useQuasar();
const consultations = ref([]);
const loading = ref(true);

const search = ref('');
const selectedDate = ref('');
const typeFilter = ref('ALL');

const filteredConsultations = computed(() => {
  return consultations.value.filter(a => {
    const matchName = a.patientName
      ?.toLowerCase()
      .includes(search.value.toLowerCase());

    const matchDate = selectedDate.value
      ? a.date?.startsWith(selectedDate.value)
      : true;

    const matchType = typeFilter.value === 'ALL'
      ? true
      : a.appointmentType === typeFilter.value;

    return matchName && matchDate && matchType;
  });
});

const resetFilters = () => {
  search.value = '';
  selectedDate.value = '';
  typeFilter.value = 'ALL';
};



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

    // Only show appointments that are CONFIRMED AND fully paid, latest on top
    consultations.value = all
      .filter(a => a.status === 'CONFIRMED' && a.paymentStatus === 'PAID')
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (err) {
    console.error('Failed to fetch consultations', err);
    $q.notify({ type: 'negative', message: 'Could not load consultations.' });
  } finally {
    loading.value = false;
  }
});

// ── Reusable Join Video ──────────────────────────────────────────────────
const handleJoin = (apt) => {
  router.push({
    path: '/doctorVideo',
    query: {
      appointmentId: apt._id,
      doctorId: apt.doctorId
    }
  });
};

// ── Open / Start Consultation ─────────────────────────────────────────────────
const openConsultation = async (apt) => {
  try {
    if (!apt.consultationStarted) {
      // mark it started in backend
      const token = getToken();
      await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/appointments/consultation/start/${apt._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      apt.consultationStarted = true;
    }
    
    router.push({
      path: '/doctor/prescription',
      query: {
        patientId: apt.patientId,
        appointmentId: apt._id
      }
    });
  } catch (err) {
    console.error('Failed to start consultation', err);
    $q.notify({ type: 'negative', message: 'Could not communicate with the server to start consultation' });
  }
};

</script>

<style scoped>
.consultation-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.consultation-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
}

/* Global Premium Filter UI */
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
  font-size: 13px;
}

.filter-input :deep(.q-field__control) {
  border-radius: 10px !important;
}

.filter-chip {
  background: #f1f5f9;
  border-radius: 8px;
  font-size: 11px;
  padding: 2px 8px;
}

.q-input:hover,
.q-select:hover {
  transform: translateY(-1px);
  transition: 0.2s;
}
</style>