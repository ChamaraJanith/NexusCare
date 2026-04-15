<template>
  <q-page padding style="background: #f4f6f9; min-height: 100vh;">
    <!-- Loading State -->
    <div v-if="loading" class="flex flex-center" style="min-height: 60vh;">
      <q-spinner-puff color="primary" size="50px" />
      <div class="text-grey-6 q-mt-sm text-caption">Syncing live dashboard...</div>
    </div>

    <div v-else>
      <!-- Header -->
      <div class="q-mb-lg row justify-between items-end">
        <div>
          <div class="text-grey-7 text-subtitle2">Welcome to,</div>
          <div class="text-h5 text-weight-bolder text-dark">Dr. {{ doctor?.name || 'Doctor' }}</div>
        </div>
        <div class="text-caption text-grey-6">
          <q-icon name="sync" class="q-mr-xs" /> Live updating
        </div>
      </div>

      <!-- Top Summary Cards -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-md-3">
          <q-card flat class="dashboard-card summary-card gradient-blue text-white">
            <q-card-section class="row items-center justify-between q-py-sm q-px-md">
              <div>
                <div class="text-h5 text-weight-bold">{{ todayAppointments.length }}</div>
                <div class="text-caption text-uppercase text-weight-bold summary-label">Today's Visits</div>
              </div>
              <q-icon name="calendar_today" size="36px" style="opacity:0.35;" />
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-3">
          <q-card flat class="dashboard-card summary-card gradient-orange text-white">
            <q-card-section class="row items-center justify-between q-py-sm q-px-md">
              <div>
                <div class="text-h5 text-weight-bold">{{ pendingAppointments.length }}</div>
                <div class="text-caption text-uppercase text-weight-bold summary-label">Pending Req</div>
              </div>
              <q-icon name="hourglass_top" size="36px" style="opacity:0.35;" />
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-3">
          <q-card flat class="dashboard-card summary-card gradient-green text-white">
            <q-card-section class="row items-center justify-between q-py-sm q-px-md">
              <div>
                <div class="text-h5 text-weight-bold">{{ completedAppointments.length }}</div>
                <div class="text-caption text-uppercase text-weight-bold summary-label">Completed</div>
              </div>
              <q-icon name="check_circle" size="36px" style="opacity:0.35;" />
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-3">
          <q-card flat class="dashboard-card summary-card gradient-purple text-white">
            <q-card-section class="row items-center justify-between q-py-sm q-px-md">
              <div>
                <div class="text-h5 text-weight-bold">{{ upcomingAppointments.length }}</div>
                <div class="text-caption text-uppercase text-weight-bold summary-label">Upcoming</div>
              </div>
              <q-icon name="event_upcoming" size="36px" style="opacity:0.35;" />
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="row q-col-gutter-md">
        
        <!-- LEFT: Today's Schedule -->
        <div class="col-12 col-md-8">
          <q-card flat bordered class="dashboard-card bg-white column" style="min-height: 400px;">
            <q-card-section class="row items-center justify-between q-pb-xs">
              <div class="text-subtitle1 text-weight-bold text-dark">Today's Schedule</div>
              <q-badge color="blue-1" text-color="blue-9" rounded class="text-weight-bold q-px-sm">{{ todayAppointments.length }}</q-badge>
            </q-card-section>
            
            <q-card-section class="q-pt-sm col">
              <div v-if="todayAppointments.length === 0" class="flex flex-center column q-pa-xl empty-state">
                <q-icon name="event_available" size="48px" color="blue-3" class="q-mb-sm" />
                <div class="text-dark text-weight-bold">No appointments for today</div>
                <div class="text-grey-5 text-caption">Enjoy your free time.</div>
              </div>

              <div v-else class="column q-gutter-y-sm">
                <div 
                  v-for="apt in todayAppointments" :key="apt._id" 
                  class="row items-center no-wrap q-pa-sm bg-white list-row"
                >
                  <q-avatar size="36px" color="blue-1" class="q-mr-md flex-shrink-0 avatar-radius">
                    <span class="text-blue-8 text-weight-bold" style="font-size:13px;">{{ getInitials(apt.patientName) }}</span>
                  </q-avatar>
                  <div class="col column" style="min-width:0;">
                    <div class="row items-center q-gutter-x-xs">
                      <span class="text-weight-bold text-dark text-subtitle2 ellipsis" style="font-size:14px; line-height:1.2;">{{ apt.patientName || 'Unknown Patient' }}</span>
                      <q-badge v-if="apt.queueNumber" color="indigo-1" text-color="indigo-8" class="text-weight-bold q-px-xs" style="font-size:10px;">Q#{{ apt.queueNumber }}</q-badge>
                    </div>
                    <div class="text-grey-6 text-caption ellipsis" style="font-size:11px;">
                      {{ apt.time || '—' }} • {{ apt.appointmentType || 'Standard' }}
                    </div>
                    <div class="text-grey-5 text-caption ellipsis" style="font-size:11px;">
                      <span v-if="apt.slotType === 'ONLINE' || apt.appointmentType === 'ONLINE'">
                        <q-icon name="videocam" size="12px" class="q-mr-xs" />Online Consultation
                      </span>
                      <span v-else>
                        <q-icon name="local_hospital" size="12px" class="q-mr-xs" />{{ apt.hospital || apt.doctorHospital || 'Unknown Hospital' }}
                      </span>
                    </div>
                  </div>
                  <div class="row items-center q-gutter-x-sm flex-shrink-0 q-ml-sm">
                    <q-badge class="bg-blue-1 text-blue-9 text-weight-bold q-px-sm q-py-xs" style="font-size:10px;">
                      <q-icon name="verified" size="10px" class="q-mr-xs" />CONFIRMED
                    </q-badge>
                    <q-btn dense unelevated size="sm" color="green-8" icon="done_all" label="Complete" class="act-btn"
                      :loading="actionId === apt._id + '_complete'" :disable="actionId !== ''"
                      @click="markComplete(apt._id)" style="height:28px;" />
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- RIGHT: Live Patient Queue -->
        <div class="col-12 col-md-4">
          <q-card flat bordered class="dashboard-card bg-white column" style="min-height: 400px; max-height: 500px;">
            <q-card-section class="row items-center justify-between q-pb-xs">
              <div class="row items-center q-gutter-x-xs">
                <q-icon name="people_alt" color="orange-8" size="20px" />
                <div class="text-subtitle1 text-weight-bold text-dark">Live Queue</div>
              </div>
              <q-spinner-bars v-if="isRefreshing" color="orange" size="1em" />
            </q-card-section>

            <q-card-section class="q-pt-sm col scroll">
              <div v-if="queuePatients.length === 0" class="flex flex-center column q-pa-xl empty-state">
                <q-icon name="check_circle" size="40px" color="grey-4" class="q-mb-sm" />
                <div class="text-grey-6 text-caption text-weight-medium">Queue is empty</div>
              </div>

              <div v-else class="column q-gutter-y-sm">
                <div 
                  v-for="(p, index) in queuePatients" :key="p._id" 
                  class="row items-center no-wrap q-pa-sm list-row"
                  :class="index === 0 ? 'bg-orange-1 q-mb-xs' : 'bg-white'"
                  style="border-radius:8px;"
                >
                  <q-avatar size="32px" :color="index === 0 ? 'orange-3' : 'grey-2'" class="q-mr-sm flex-shrink-0 avatar-radius">
                    <span :class="index === 0 ? 'text-orange-9' : 'text-grey-8'" class="text-weight-bold" style="font-size:12px;">{{ getInitials(p.patientName) }}</span>
                  </q-avatar>
                  <div class="col column" style="min-width:0;">
                    <div class="text-weight-bold text-dark ellipsis" style="font-size:13px;">{{ p.patientName }}</div>
                    <div class="text-grey-6 ellipsis" style="font-size:11px;">{{ p.time || '—' }} • Q#{{ p.queueNumber }}</div>
                  </div>
                  <div class="flex-shrink-0 q-ml-sm">
                    <q-badge v-if="index === 0" color="orange-9" label="NEXT" class="text-weight-bold" style="font-size:10px;" />
                    <q-badge v-else color="grey-4" text-color="grey-8" :label="'WAITING'" style="font-size:9px;" />
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

      </div>

      <!-- Bottom Row: Doctor Profile Summary & Quick Stats -->
      <div class="row q-col-gutter-md q-mt-xs">
        <div class="col-12 col-md-6">
          <q-card flat bordered class="dashboard-card premium-profile-card q-pa-md row items-center no-wrap justify-between">
            <div class="row items-center no-wrap">
              <q-avatar size="64px" class="q-mr-md shadow-2" style="background: linear-gradient(135deg, #4facfe, #00f2fe);">
                <img v-if="doctor?.profileImage" :src="doctor.profileImage" />
                <span v-else class="text-white text-weight-bold text-h6">{{ getInitials(doctor?.name) }}</span>
              </q-avatar>
              <div class="column justify-center">
                <div class="text-weight-bold text-dark text-subtitle1 row items-center q-gutter-x-sm">
                  <span>Dr. {{ doctor?.name || 'Doctor' }}</span>
                  <q-badge class="glow-badge" color="positive" rounded label="Active" style="font-size: 10px; padding: 2px 6px;" />
                </div>
                <div class="text-grey-7 text-caption" style="font-size: 12px;">{{ doctor?.specialization || 'General Practitioner' }}</div>
              </div>
            </div>
            <div class="text-right flex-shrink-0">
              <div class="text-h5 text-weight-bolder text-primary" style="line-height: 1;">{{ doctor?.experience || 0 }}<span class="text-subtitle1 text-weight-medium text-dark"> yrs</span></div>
              <div class="text-grey-5 text-caption text-uppercase text-weight-bold" style="font-size: 10px; letter-spacing: 0.5px;">Experience</div>
            </div>
          </q-card>
        </div>
      </div>

    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useQuasar } from 'quasar';
import axios from 'axios';
import { fetchDoctorProfile } from 'src/services/doctorApi';

const $q = useQuasar();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const doctor = ref({});
const appointments = ref([]);
const loading = ref(true);
const isRefreshing = ref(false);
const actionId = ref('');
let refreshInterval = null;

// Helpers
const getToken = () => localStorage.getItem('token') || localStorage.getItem('nexus_token');
const parseJwt = (t) => { try { return JSON.parse(atob(t.split('.')[1])); } catch { return null; } };

const getInitials = (n) => n ? n.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : '?';

const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const parseAptTime = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

// Data Fetching
const loadDashboardData = async (silent = false) => {
  if (!silent) loading.value = true;
  else isRefreshing.value = true;

  try {
    const token = getToken();
    const decoded = token ? parseJwt(token) : null;
    let fallbackName = decoded?.name || '';
    const doctorId = decoded?.roleId;

    if (!doctorId) throw new Error('Unauthenticated');

    // Fetch profile only on initial load
    if (!silent) {
      try {
        const prof = await fetchDoctorProfile();
        doctor.value = prof.data || prof || {};
        if (!doctor.value.name) doctor.value.name = fallbackName;
      } catch {
        doctor.value = { name: fallbackName };
      }
    }

    // Fetch appointments map
    const { data } = await axios.get(`${API_URL}/api/appointments/doctor/${doctorId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    appointments.value = Array.isArray(data) ? data : [];

  } catch (err) {
    console.warn('Dashboard sync error', err);
  } finally {
    loading.value = false;
    isRefreshing.value = false;
  }
};

onMounted(() => {
  loadDashboardData();
  // Auto refresh live queue every 15s
  refreshInterval = setInterval(() => loadDashboardData(true), 15000);
});

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
});

// Computed
const todayAppointments = computed(() => {
  const t = getTodayString();
  return appointments.value
    .filter(a => a.date === t && a.status === 'CONFIRMED')
    .sort((a, b) => parseAptTime(a.time) - parseAptTime(b.time));
});

const pendingAppointments = computed(() => appointments.value.filter(a => a.status === 'PENDING'));

const completedAppointments = computed(() => appointments.value.filter(a => a.status === 'COMPLETED'));

const upcomingAppointments = computed(() => {
  return appointments.value.filter(a =>
    new Date(a.date) > new Date() &&
    a.status !== "CANCELLED"
  );
});

const queuePatients = computed(() => {
  const t = getTodayString();
  return appointments.value
    .filter(a => a.date === t && a.status === 'CONFIRMED')
    .sort((a, b) => (a.queueNumber || 999) - (b.queueNumber || 999));
});

// Actions
const updateAppointment = (id, updates) => {
  const i = appointments.value.findIndex(a => a._id === id);
  if (i !== -1) appointments.value[i] = { ...appointments.value[i], ...updates };
};

const markComplete = async (id) => {
  actionId.value = id + '_complete';
  try {
    await axios.put(`${API_URL}/api/appointments/doctor/complete/${id}`, {}, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    updateAppointment(id, { status: 'COMPLETED' });
    $q.notify({ type: 'positive', message: 'Marked as completed!', timeout: 2000 });
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to complete appointment' });
  } finally {
    actionId.value = '';
  }
};
</script>

<style scoped>
.dashboard-card {
  border-radius: 12px;
  border-color: #eaeef3;
  box-shadow: 0 4px 18px rgba(0,0,0,0.03);
}

.summary-card {
  border-radius: 14px !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.summary-card:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important;
}

.gradient-blue { background: linear-gradient(135deg, #2196f3, #1976d2); }
.gradient-orange { background: linear-gradient(135deg, #ff9800, #f57c00); }
.gradient-green { background: linear-gradient(135deg, #4caf50, #388e3c); }
.gradient-purple { background: linear-gradient(135deg, #9c27b0, #7b1fa2); }

.premium-profile-card {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.premium-profile-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.12) !important;
}

.glow-badge {
  box-shadow: 0 0 8px rgba(33, 186, 69, 0.5);
  animation: pulse-glow 2s infinite;
}

@keyframes pulse-glow {
  0% { box-shadow: 0 0 0 0 rgba(33, 186, 69, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(33, 186, 69, 0); }
  100% { box-shadow: 0 0 0 0 rgba(33, 186, 69, 0); }
}

.summary-label {
  opacity: 0.85;
  letter-spacing: 0.8px;
  font-size: 11px;
}

.list-row {
  border: 1px solid #f0f2f5;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.list-row:hover {
  background: #fafbfc !important;
  border-color: #e2e8f0;
}

.avatar-radius {
  border-radius: 10px;
}

.act-btn {
  border-radius: 6px;
  font-weight: 600;
  text-transform: none;
}

.empty-state {
  border: 1px dashed #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
}
</style>
