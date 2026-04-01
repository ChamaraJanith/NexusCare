<template>
  <q-layout view="lHh Lpr lFf">

    <!-- ========== LEFT SIDEBAR ========== -->
    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :width="260"
      :breakpoint="1024"
      style="background: linear-gradient(180deg, #1a2a3a 0%, #0f1f2e 100%);"
      class="text-white"
    >
      <!-- Brand -->
      <div style="padding: 28px 20px 20px 20px;" class="flex items-center">
        <q-icon name="health_and_safety" size="28px" color="teal-3" class="q-mr-sm" />
        <span class="text-h6 text-weight-bold text-white" style="letter-spacing: 0.5px;">NexusCare</span>
      </div>

      <!-- Navigation -->
      <q-list padding style="padding: 0 12px;">
        <q-item
          v-for="item in sidebarItems"
          :key="item.path"
          clickable
          v-ripple
          :to="item.path"
          exact
          active-class="sidebar-active-item"
          class="sidebar-nav-item q-mb-xs text-grey-4"
          style="border-radius: 8px; min-height: 44px;"
        >
          <q-item-section avatar style="min-width: 36px;">
            <q-icon :name="item.icon" size="20px" />
          </q-item-section>
          <q-item-section class="text-weight-medium" style="font-size: 14px;">
            {{ item.label }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <!-- ========== TOP HEADER ========== -->
    <q-header elevated style="background: #ffffff; border-bottom: 1px solid #eee;">
      <q-toolbar class="text-dark" style="min-height: 56px;">
        <q-btn
          flat
          dense
          round
          icon="menu"
          color="dark"
          class="lt-lg q-mr-sm"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title class="text-weight-medium text-dark" style="font-size: 16px;">
          Dashboard
        </q-toolbar-title>

        <q-space />

        <!-- Notification -->
        <q-btn flat round dense icon="notifications_none" color="grey-7" class="q-mr-md" />

        <!-- Doctor Profile -->
        <div class="row items-center no-wrap">
          <q-avatar size="36px" class="q-mr-sm" style="background: #e8e8e8;">
            <img v-if="resolvedProfileImage" :src="resolvedProfileImage" />
            <img v-else src="https://cdn.quasar.dev/img/avatar.png" />
          </q-avatar>
          <div class="column gt-xs">
            <div class="text-weight-bold text-dark" style="font-size: 13px; line-height: 1.2;">
              Dr. {{ doctorDisplayName }}
              <q-icon name="keyboard_arrow_down" size="14px" color="grey-6" />
            </div>
            <div class="row items-center" style="font-size: 11px; color: #4caf50; line-height: 1;">
              <div style="width: 7px; height: 7px; border-radius: 50%; background: #4caf50; margin-right: 4px;"></div>
              Active
            </div>
          </div>
        </div>
      </q-toolbar>
    </q-header>

    <!-- ========== MAIN CONTENT ========== -->
    <q-page-container>
      <q-page padding style="background: #f5f6fa;">

        <!-- Loading -->
        <div v-if="loading" class="flex flex-center" style="min-height: 60vh;">
          <div class="column items-center">
            <q-spinner-puff color="primary" size="60px" />
            <div class="text-grey-6 q-mt-md">Loading dashboard data...</div>
          </div>
        </div>

        <!-- Error -->
        <div v-else-if="error">
          <q-banner class="bg-red-1 text-negative q-mb-lg" rounded>
            <template v-slot:avatar><q-icon name="error" color="negative" /></template>
            <div class="text-weight-bold q-mb-xs">Dashboard Error</div>
            {{ error }}
            <template v-slot:action>
              <q-btn flat color="primary" label="Login Again" @click="router.push('/login')" />
              <q-btn flat color="primary" label="Retry" @click="loadDashboardData" />
            </template>
          </q-banner>

          <!-- Debug Info -->
          <q-expansion-item label="Debug Info" icon="bug_report" class="q-mt-md bg-white rounded-borders">
            <div class="q-pa-md text-caption" style="white-space: pre-wrap; font-family: monospace;">{{ debugInfo }}</div>
          </q-expansion-item>
        </div>

        <!-- Dashboard Content -->
        <div v-else>

          <!-- Welcome -->
          <div class="q-mb-lg">
            <div class="text-grey-7" style="font-size: 16px; font-weight: 400;">Welcome to,</div>
            <div class="text-weight-bolder" style="font-size: 28px; color: #1c2b36; letter-spacing: -0.5px;">
              Dr. {{ doctorDisplayName }}
            </div>
          </div>

          <!-- Schedule + Queue Row -->
          <div class="row q-col-gutter-lg">

            <!-- Today's Schedule -->
            <div class="col-12 col-md-7">
              <q-card flat bordered class="rounded-borders" style="border-radius: 12px;">
                <q-card-section class="row items-center justify-between q-pb-sm">
                  <div class="text-weight-bold text-dark" style="font-size: 17px;">Today's Schedule</div>
                  <q-btn outline dense size="sm" color="grey-5" text-color="dark" icon-right="keyboard_arrow_down" label="Today" class="text-capitalize" style="border-radius: 8px;" />
                </q-card-section>

                <q-card-section class="q-pt-none">
                  <!-- Appointments List -->
                  <div v-if="filteredAppointments.length > 0" class="column q-gutter-y-sm">
                    <div
                      v-for="apt in filteredAppointments"
                      :key="apt._id || apt.id"
                      class="row items-center q-pa-md bg-white rounded-borders"
                      style="border: 1px solid #e8e8e8; border-left: 4px solid #4caf50; border-radius: 10px; cursor: pointer;"
                    >
                      <q-avatar size="44px" style="background: #edf2f7;" class="q-mr-md">
                        <img v-if="apt.patientImage" :src="apt.patientImage" />
                        <span v-else class="text-primary text-weight-bold" style="font-size: 14px;">
                          {{ getInitials(apt.patientName) }}
                        </span>
                      </q-avatar>
                      <div class="col">
                        <div class="text-weight-bold text-dark" style="font-size: 14px;">
                          {{ apt.patientName || 'Unknown Patient' }}
                        </div>
                        <div class="text-grey-6" style="font-size: 12px;">
                          {{ formatTime(apt.appointmentDate) }} · {{ apt.type || 'In-person Consultation' }} · {{ apt.reason || 'Check-up' }}
                        </div>
                      </div>
                      <q-icon name="chevron_right" color="grey-4" size="20px" />
                    </div>
                  </div>

                  <!-- Empty State -->
                  <div v-else class="q-pa-xl flex flex-center column" style="border: 1px dashed #ccc; border-radius: 10px;">
                    <q-icon name="event_busy" size="48px" color="grey-4" class="q-mb-sm" />
                    <div class="text-grey-5">No appointments scheduled for today.</div>
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <!-- Patient Queue -->
            <div class="col-12 col-md-5">
              <q-card flat bordered class="rounded-borders column" style="border-radius: 12px; height: 100%; overflow: hidden;">
                <q-tabs v-model="queueTab" dense active-color="dark" indicator-color="positive" align="justify" :breakpoint="0" class="q-pt-xs text-grey-6">
                  <q-tab name="queue" label="Patient Queue" class="text-capitalize text-weight-bold" style="font-size: 13px;" />
                  <q-tab name="status" label="Availability Status" class="text-capitalize text-weight-bold" style="font-size: 13px;" />
                </q-tabs>
                <q-separator />

                <q-tab-panels v-model="queueTab" animated class="col bg-white">
                  <!-- Queue Panel -->
                  <q-tab-panel name="queue" class="q-pa-none column" style="position: relative; padding-bottom: 76px;">
                    <q-list class="q-px-md q-pt-sm col" style="overflow-y: auto;">
                      <q-item v-for="patient in activeQueue" :key="patient.id" class="q-px-none q-py-sm" style="border-bottom: 1px solid #f3f3f3;">
                        <q-item-section avatar style="min-width: 44px;">
                          <q-avatar size="38px" style="background: #edf2f7;">
                            <img v-if="patient.image" :src="patient.image" />
                            <span v-else class="text-primary text-weight-bold" style="font-size: 12px;">{{ getInitials(patient.name) }}</span>
                          </q-avatar>
                        </q-item-section>
                        <q-item-section>
                          <q-item-label class="text-weight-bold text-dark" style="font-size: 13px;">{{ patient.name }}</q-item-label>
                          <q-item-label caption class="text-grey-6" style="font-size: 11px;">{{ patient.time }}</q-item-label>
                        </q-item-section>
                        <q-item-section side>
                          <div class="row items-center">
                            <div style="background: #e8f5e9; color: #4caf50; font-size: 11px; font-weight: 700; padding: 2px 10px; border-radius: 6px;" class="q-mr-xs">Active</div>
                            <q-icon name="chevron_right" size="16px" color="grey-4" />
                          </div>
                        </q-item-section>
                      </q-item>

                      <div v-if="activeQueue.length === 0" class="q-pa-lg flex flex-center">
                        <div class="text-grey-5 text-center" style="font-size: 13px;">Queue is currently empty.</div>
                      </div>
                    </q-list>

                    <!-- Bottom bar -->
                    <div style="position: absolute; bottom: 12px; left: 12px; right: 12px; background: #37475a; border-radius: 12px; padding: 14px 16px;" class="row items-center justify-between text-white">
                      <div class="row items-center">
                        <q-icon name="people_outline" size="28px" color="grey-5" class="q-mr-md" />
                        <div>
                          <div class="text-weight-bold" style="font-size: 20px; line-height: 1;">{{ activeQueue.length }}</div>
                          <div class="text-grey-5" style="font-size: 11px; line-height: 1;">Appointments</div>
                        </div>
                      </div>
                      <q-btn unelevated color="positive" text-color="white" label="Patient Queue" class="text-capitalize text-weight-bold" style="border-radius: 8px; font-size: 12px;" />
                    </div>
                  </q-tab-panel>

                  <!-- Status Panel -->
                  <q-tab-panel name="status">
                    <div class="q-pa-lg text-center flex flex-center column" style="min-height: 200px;">
                      <q-icon name="event_available" size="56px" color="positive" class="q-mb-md" style="opacity: 0.6;" />
                      <div class="text-weight-bold text-dark" style="font-size: 15px;">Availability Status</div>
                      <div class="text-grey-6 q-mt-sm" style="font-size: 13px;">{{ availability.length }} open slots in upcoming days.</div>
                    </div>
                  </q-tab-panel>
                </q-tab-panels>
              </q-card>
            </div>
          </div>

          <!-- Stats Row -->
          <div class="row q-col-gutter-lg q-mt-md">
            <div class="col-12 col-md-4">
              <q-card flat bordered style="border-radius: 12px;" class="q-pa-md">
                <div class="text-weight-bold text-dark q-mb-xs" style="font-size: 13px;">Total Consultations (Month)</div>
                <div class="text-weight-bolder" style="font-size: 36px; color: #1c2b36;">{{ stats.totalConsultations }}</div>
                <q-linear-progress :value="stats.totalConsultations > 0 ? 0.67 : 0" color="positive" track-color="grey-2" size="6px" class="q-mt-sm rounded-borders" style="width: 80%;" />
              </q-card>
            </div>
            <div class="col-12 col-md-4">
              <q-card flat bordered style="border-radius: 12px;" class="q-pa-md">
                <div class="text-weight-bold text-dark q-mb-xs" style="font-size: 13px;">Pending Lab Reports</div>
                <div class="text-weight-bolder" style="font-size: 36px; color: #1c2b36;">{{ stats.pendingReports }}</div>
                <q-linear-progress :value="stats.pendingReports > 0 ? 0.3 : 0.05" color="negative" track-color="grey-2" size="6px" class="q-mt-sm rounded-borders" style="width: 80%;" />
              </q-card>
            </div>
            <div class="col-12 col-md-4">
              <q-card flat bordered style="border-radius: 12px;" class="q-pa-md">
                <div class="text-weight-bold text-dark q-mb-xs" style="font-size: 13px;">Patient Rating</div>
                <div class="row items-center q-mt-xs">
                  <span class="text-weight-bolder q-mr-md" style="font-size: 36px; color: #1c2b36;">{{ stats.rating }}</span>
                  <q-rating :model-value="stats.rating" max="5" size="20px" color="amber" readonly icon="star" />
                </div>
              </q-card>
            </div>
          </div>

          <!-- Debug Panel (collapsible) -->
          <q-expansion-item label="Debug Info" icon="bug_report" class="q-mt-xl bg-white rounded-borders" header-class="text-grey-7" style="border: 1px solid #eee; border-radius: 12px;">
            <div class="q-pa-md text-caption" style="white-space: pre-wrap; font-family: monospace; max-height: 300px; overflow-y: auto;">{{ debugInfo }}</div>
          </q-expansion-item>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { fetchDoctorDashboardData } from 'src/services/doctorDashboardApi';

const router = useRouter();

// ─── Sidebar ─────────────────────────────────────────────────────
const leftDrawerOpen = ref(true);
const toggleLeftDrawer = () => { leftDrawerOpen.value = !leftDrawerOpen.value; };

const sidebarItems = [
  { label: 'My Schedule',     icon: 'calendar_today',  path: '/doctor/dashboard' },
  { label: 'Patient Records', icon: 'group',           path: '/doctor/patients' },
  { label: 'Consultations',   icon: 'chat',            path: '/doctor/consultations' },
  { label: 'Availability',    icon: 'event_available',  path: '/doctor/availability' },
  { label: 'Reports',         icon: 'description',      path: '/doctor/reports' },
];

// ─── State ───────────────────────────────────────────────────────
const loading = ref(true);
const error = ref('');
const queueTab = ref('queue');
const debugInfo = ref('');

const identity = ref({});
const professional = ref({});
const appointments = ref([]);
const availability = ref([]);

const stats = reactive({
  totalConsultations: 0,
  pendingReports: 0,
  rating: 4.5,
});

// ─── Helpers ─────────────────────────────────────────────────────
const doctorDisplayName = computed(() => {
  return identity.value.name
    || identity.value.fullName
    || identity.value.firstName
    || professional.value.name
    || 'Doctor';
});

const DOCTOR_SERVICE_URL =
  import.meta.env?.VITE_DOCTOR_SERVICE_URL || 'http://localhost:5002';

const resolvedProfileImage = computed(() => {
  const img = identity.value.profileImage;
  if (!img) return null;
  const url = typeof img === 'string' ? img : img.url;
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${DOCTOR_SERVICE_URL}${url}`;
});

const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('[JWT] Parse failed:', e);
    return null;
  }
};

// ─── Data Fetching ───────────────────────────────────────────────
const loadDashboardData = async () => {
  loading.value = true;
  error.value = '';
  debugInfo.value = '';

  const log = (msg) => {
    console.log(msg);
    debugInfo.value += msg + '\n';
  };

  try {
    // Try both token keys (MainLayout uses nexus_token, login may use token)
    const token = localStorage.getItem('token')
      || sessionStorage.getItem('token')
      || localStorage.getItem('nexus_token')
      || sessionStorage.getItem('nexus_token');

    log('[1] Token found: ' + (token ? 'YES (' + token.substring(0, 20) + '...)' : 'NO'));

    if (!token) {
      error.value = 'No authentication token found. Please log in.';
      loading.value = false;
      return;
    }

    const decoded = parseJwt(token);
    log('[2] Decoded token: ' + JSON.stringify(decoded, null, 2));

    if (!decoded) {
      error.value = 'Failed to decode token. Please log in again.';
      loading.value = false;
      return;
    }

    if (decoded.role !== 'doctor') {
      error.value = `Unauthorized: Your role is "${decoded.role}", but doctor role is required.`;
      loading.value = false;
      return;
    }

    const doctorId = decoded.roleId || decoded.doctorId || decoded.id;
    log('[3] Doctor ID: ' + doctorId);

    if (!doctorId) {
      error.value = 'Could not extract doctor ID from token.';
      loading.value = false;
      return;
    }

    log('[4] Calling fetchDoctorDashboardData...');
    const data = await fetchDoctorDashboardData(doctorId);
    log('[5] API Response: ' + JSON.stringify({
      success: data.success,
      identityKeys: Object.keys(data.identity || {}),
      identity: data.identity,
      professionalKeys: Object.keys(data.professional || {}),
      appointmentsCount: (data.appointments || []).length,
      availabilityCount: (data.availability || []).length,
    }, null, 2));

    if (data.success) {
      identity.value = data.identity || {};
      professional.value = data.professional || {};
      appointments.value = Array.isArray(data.appointments) ? data.appointments : [];
      availability.value = Array.isArray(data.availability) ? data.availability : [];

      stats.totalConsultations = appointments.value.length;
      stats.pendingReports = 0;

      log('[6] Data mapped successfully. Doctor name: ' + doctorDisplayName.value);
      log('[7] Appointments loaded: ' + appointments.value.length);
    } else {
      error.value = 'Failed to aggregate data from microservices.';
    }
  } catch (err) {
    console.error('[Dashboard] Critical error:', err);
    error.value = 'Failed to load dashboard: ' + (err.message || err);
    debugInfo.value += '\n[ERROR] ' + (err.stack || err.message || err);
  } finally {
    loading.value = false;
  }
};

// ─── Computed ────────────────────────────────────────────────────
const filteredAppointments = computed(() => {
  if (!Array.isArray(appointments.value)) return [];
  return appointments.value.slice(0, 3);
});

const activeQueue = computed(() => {
  if (!Array.isArray(appointments.value)) return [];
  return appointments.value
    .filter(a => a.status === 'active' || a.status === 'waiting' || a.status === 'confirmed' || a.status === 'scheduled')
    .slice(0, 5)
    .map(a => ({
      id: a._id || a.id || Math.random(),
      name: a.patientName || 'Unknown Patient',
      time: formatTime(a.appointmentDate),
      image: a.patientImage || null,
    }));
});

const formatTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return String(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

// ─── Lifecycle ───────────────────────────────────────────────────
onMounted(() => {
  loadDashboardData();
});
</script>

<style>
/* UNSCOPED: Quasar renders q-drawer outside scoped boundary */
.sidebar-nav-item {
  transition: background 0.2s ease, color 0.2s ease;
}
.sidebar-active-item {
  background: rgba(255, 255, 255, 0.12) !important;
  color: #ffffff !important;
}
.sidebar-active-item .q-icon {
  color: #ffffff !important;
}
</style>
