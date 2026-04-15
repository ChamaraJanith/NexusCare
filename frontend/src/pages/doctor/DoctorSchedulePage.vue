<template>
  <q-page padding style="background: #f4f6f9; min-height: 100vh;">
    <!-- Header -->
    <div class="q-mb-md">
      <div class="text-h5 text-weight-bolder text-dark">Schedule & Queue</div>
      <div class="text-caption text-grey-6">Manage appointments, queues, and clinical visits.</div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="q-pa-xl flex flex-center column">
      <q-spinner-puff color="primary" size="50px" />
      <div class="text-grey-6 q-mt-sm text-caption">Syncing schedule...</div>
    </div>

    <template v-else>
      <!-- Stats Row -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-md-4">
          <q-card flat class="bg-primary text-white stat-card">
            <q-card-section class="row items-center justify-between q-py-sm q-px-md">
              <div>
                <div class="text-h5 text-weight-bold">{{ totalTodayCount }}</div>
                <div class="text-caption text-uppercase text-weight-bold" style="opacity:.85; letter-spacing:.8px;">Total Today</div>
              </div>
              <q-icon name="today" size="36px" style="opacity:.35;" />
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-4">
          <q-card flat class="bg-orange-8 text-white stat-card">
            <q-card-section class="row items-center justify-between q-py-sm q-px-md">
              <div>
                <div class="text-h5 text-weight-bold">{{ pendingCount }}</div>
                <div class="text-caption text-uppercase text-weight-bold" style="opacity:.85; letter-spacing:.8px;">Pending</div>
              </div>
              <q-icon name="hourglass_empty" size="36px" style="opacity:.35;" />
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-4">
          <q-card flat class="bg-green-7 text-white stat-card">
            <q-card-section class="row items-center justify-between q-py-sm q-px-md">
              <div>
                <div class="text-h5 text-weight-bold">{{ completedCount }}</div>
                <div class="text-caption text-uppercase text-weight-bold" style="opacity:.85; letter-spacing:.8px;">Completed</div>
              </div>
              <q-icon name="check_circle_outline" size="36px" style="opacity:.35;" />
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Filter Bar -->
      <q-card flat bordered class="q-mb-lg bg-white filter-bar">
        <q-card-section class="row q-col-gutter-sm items-center q-py-sm">
          <div class="col-12 col-md-4">
            <q-input v-model="searchQuery" outlined dense placeholder="Search patient..." class="bg-white">
              <template v-slot:prepend><q-icon name="search" color="grey-5" size="xs" /></template>
              <template v-slot:append>
                <q-icon v-if="searchQuery" name="close" @click="searchQuery = ''" class="cursor-pointer" size="xs" />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-md-4">
            <q-input v-model="selectedDate" outlined dense type="date" label="Date" />
          </div>
          <div class="col-12 col-md-4">
            <q-select v-model="selectedHospital" :options="hospitalOptions" outlined dense label="Hospital" :loading="hospitalsLoading" />
          </div>
        </q-card-section>
      </q-card>

      <!-- Empty Global -->
      <div v-if="filteredAppointments.length === 0" class="q-pa-xl flex flex-center column bg-white shadow-1" style="border-radius:12px;">
        <q-icon name="event_busy" size="56px" color="grey-3" class="q-mb-sm" />
        <div class="text-dark text-subtitle1 text-weight-bold">No appointments found</div>
        <div class="text-grey-6 text-caption">Try adjusting your filters.</div>
      </div>

      <!-- Sections -->
      <div v-else class="column q-gutter-y-lg">

        <!-- ═══ PENDING (TOP PRIORITY) ═══ -->
        <div>
          <div class="row items-center q-mb-sm q-gutter-x-xs">
            <q-icon name="warning_amber" size="20px" color="orange-8" />
            <div class="text-subtitle1 text-weight-bold text-dark">Pending Appointments</div>
            <q-badge color="orange-2" text-color="orange-9" rounded class="text-weight-bold q-px-xs" style="font-size:11px;">{{ pendingAppointments.length }}</q-badge>
          </div>

          <div v-if="pendingAppointments.length === 0" class="q-pa-md flex flex-center column bg-white shadow-1" style="border-radius:10px;">
            <q-icon name="check_circle" size="32px" color="green-4" class="q-mb-xs" />
            <div class="text-grey-6 text-body2">All caught up — nothing pending.</div>
          </div>

          <div v-else class="column q-gutter-y-sm">
            <q-card v-for="apt in pendingAppointments" :key="apt._id" flat bordered class="apt-card card-pending">
              <q-card-section class="row items-center no-wrap q-px-md q-py-sm">
                <q-avatar size="44px" color="orange-1" class="q-mr-md flex-shrink-0 card-avatar">
                  <span class="text-orange-8 text-weight-bold text-body1">{{ getInitials(apt.patientName) }}</span>
                </q-avatar>
                <div class="col column" style="min-width:0;">
                  <div class="row items-center q-gutter-x-xs">
                    <span class="text-weight-bold text-dark text-subtitle2 ellipsis">{{ apt.patientName || 'Unknown Patient' }}</span>
                    <q-badge v-if="apt.queueNumber" color="indigo-1" text-color="indigo-8" class="text-weight-bold q-px-xs" style="font-size:10px;">Q#{{ apt.queueNumber }}</q-badge>
                  </div>
                  <div class="text-grey-7 text-caption ellipsis">
                    {{ apt.date || '—' }} • {{ apt.time || '—' }} • {{ apt.appointmentType || 'Standard' }}
                  </div>
                  <div class="text-grey-5 text-caption ellipsis">
                    <span v-if="apt.slotType === 'ONLINE' || apt.appointmentType === 'ONLINE'">
                      <q-icon name="videocam" size="12px" class="q-mr-xs" />Online Consultation
                    </span>
                    <span v-else>
                      <q-icon name="local_hospital" size="12px" class="q-mr-xs" />{{ apt.hospital || apt.doctorHospital || 'Unknown Hospital' }}
                    </span>
                  </div>
                </div>
                <div class="row items-center q-gutter-x-sm flex-shrink-0 q-ml-md">
                  <q-badge class="bg-orange-1 text-orange-9 text-weight-bold q-px-sm q-py-xs" style="font-size:11px;">
                    <q-icon name="pending_actions" size="12px" class="q-mr-xs" />PENDING
                  </q-badge>
                  <q-btn dense unelevated size="sm" color="green" icon="check" label="Approve" class="act-btn"
                    :loading="actionId === apt._id + '_approve'" :disable="actionId !== ''"
                    @click="approveAppointment(apt._id)" />
                  <q-btn dense unelevated size="sm" color="red" icon="close" label="Reject" class="act-btn"
                    :loading="actionId === apt._id + '_reject'" :disable="actionId !== ''"
                    @click="openRejectDialog(apt)" />
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- ═══ TODAY'S CONFIRMED ═══ -->
        <div>
          <div class="row items-center q-mb-sm q-gutter-x-xs">
            <q-icon name="verified" size="20px" color="blue-8" />
            <div class="text-subtitle1 text-weight-bold text-dark">Today's Confirmed</div>
            <q-badge color="blue-2" text-color="blue-9" rounded class="text-weight-bold q-px-xs" style="font-size:11px;">{{ todayConfirmed.length }}</q-badge>
          </div>

          <div v-if="todayConfirmed.length === 0" class="q-pa-md flex flex-center column bg-white shadow-1" style="border-radius:10px;">
            <q-icon name="event_available" size="32px" color="blue-3" class="q-mb-xs" />
            <div class="text-grey-6 text-body2">No confirmed visits for today.</div>
          </div>

          <div v-else class="column q-gutter-y-sm">
            <q-card v-for="apt in todayConfirmed" :key="apt._id" flat bordered class="apt-card card-today">
              <q-card-section class="row items-center no-wrap q-px-md q-py-sm">
                <q-avatar size="44px" color="blue-1" class="q-mr-md flex-shrink-0 card-avatar">
                  <span class="text-blue-8 text-weight-bold text-body1">{{ getInitials(apt.patientName) }}</span>
                </q-avatar>
                <div class="col column" style="min-width:0;">
                  <div class="row items-center q-gutter-x-xs">
                    <span class="text-weight-bold text-dark text-subtitle2 ellipsis">{{ apt.patientName || 'Unknown Patient' }}</span>
                    <q-badge v-if="apt.queueNumber" color="indigo-1" text-color="indigo-8" class="text-weight-bold q-px-xs" style="font-size:10px;">Q#{{ apt.queueNumber }}</q-badge>
                  </div>
                  <div class="text-grey-7 text-caption ellipsis">
                    {{ apt.date || '—' }} • {{ apt.time || '—' }} • {{ apt.appointmentType || 'Standard' }}
                  </div>
                  <div class="text-grey-5 text-caption ellipsis">
                    <span v-if="apt.slotType === 'ONLINE' || apt.appointmentType === 'ONLINE'">
                      <q-icon name="videocam" size="12px" class="q-mr-xs" />Online Consultation
                    </span>
                    <span v-else>
                      <q-icon name="local_hospital" size="12px" class="q-mr-xs" />{{ apt.hospital || apt.doctorHospital || 'Unknown Hospital' }}
                    </span>
                  </div>
                </div>
                <div class="row items-center q-gutter-x-sm flex-shrink-0 q-ml-md">
                  <q-badge class="bg-blue-1 text-blue-9 text-weight-bold q-px-sm q-py-xs" style="font-size:11px;">
                    <q-icon name="verified" size="12px" class="q-mr-xs" />CONFIRMED
                  </q-badge>
                  <q-btn dense unelevated size="sm" color="green-8" icon="done_all" label="Complete" class="act-btn"
                    :loading="actionId === apt._id + '_complete'" :disable="actionId !== ''"
                    @click="markComplete(apt._id)" />
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- ═══ PAST RECORDS ═══ -->
        <div>
          <div class="row items-center q-mb-sm q-gutter-x-xs">
            <q-icon name="history" size="20px" color="grey-6" />
            <div class="text-subtitle1 text-weight-bold text-dark">Past Records</div>
            <q-badge color="grey-3" text-color="grey-8" rounded class="text-weight-bold q-px-xs" style="font-size:11px;">{{ pastRecords.length }}</q-badge>
          </div>

          <div v-if="pastRecords.length === 0" class="q-pa-md flex flex-center column bg-white shadow-1" style="border-radius:10px;">
            <q-icon name="history" size="32px" color="grey-4" class="q-mb-xs" />
            <div class="text-grey-6 text-body2">No past history found.</div>
          </div>

          <div v-else class="column q-gutter-y-sm">
            <q-card v-for="apt in pastRecords" :key="apt._id" flat bordered class="apt-card card-past">
              <q-card-section class="row items-center no-wrap q-px-md q-py-sm">
                <q-avatar size="44px" color="grey-2" class="q-mr-md flex-shrink-0 card-avatar">
                  <span :class="`text-${badgeColor(apt.status)}-8 text-weight-bold text-body1`">{{ getInitials(apt.patientName) }}</span>
                </q-avatar>
                <div class="col column" style="min-width:0;">
                  <div class="row items-center q-gutter-x-xs">
                    <span class="text-weight-bold text-dark text-subtitle2 ellipsis">{{ apt.patientName || 'Unknown Patient' }}</span>
                    <q-badge v-if="apt.queueNumber" color="indigo-1" text-color="indigo-8" class="text-weight-bold q-px-xs" style="font-size:10px;">Q#{{ apt.queueNumber }}</q-badge>
                  </div>
                  <div class="text-grey-7 text-caption ellipsis">
                    {{ apt.date || '—' }} • {{ apt.time || '—' }} • {{ apt.appointmentType || 'Standard' }}
                  </div>
                  <div class="text-grey-5 text-caption ellipsis">
                    <span v-if="apt.slotType === 'ONLINE' || apt.appointmentType === 'ONLINE'">
                      <q-icon name="videocam" size="12px" class="q-mr-xs" />Online Consultation
                    </span>
                    <span v-else>
                      <q-icon name="local_hospital" size="12px" class="q-mr-xs" />{{ apt.hospital || apt.doctorHospital || 'Unknown Hospital' }}
                    </span>
                  </div>
                  <div v-if="apt.rejectionReason" class="text-red-5 text-caption ellipsis q-mt-xs">
                    Rejected: {{ apt.rejectionReason }}
                  </div>
                </div>
                <div class="row items-center flex-shrink-0 q-ml-md">
                  <q-badge :class="`bg-${badgeColor(apt.status)}-1 text-${badgeColor(apt.status)}-9`" class="text-weight-bold q-px-sm q-py-xs" style="font-size:11px;">
                    <q-icon :name="badgeIcon(apt.status)" size="12px" class="q-mr-xs" />{{ apt.status }}
                  </q-badge>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>

      </div>
    </template>

    <!-- Reject Dialog -->
    <q-dialog v-model="rejectDlg.show" persistent>
      <q-card style="min-width:360px; border-radius:12px;" class="q-pa-md shadow-3">
        <q-card-section class="q-pb-xs">
          <div class="text-subtitle1 text-weight-bolder text-red-7">Reject Appointment</div>
          <div class="text-caption text-dark q-mt-xs">
            Patient: <span class="text-weight-bold">{{ rejectDlg.appointment?.patientName }}</span>
          </div>
        </q-card-section>
        <q-card-section>
          <q-input v-model="rejectDlg.reason" type="textarea" rows="3"
            label="Reason for rejection..." outlined dense autofocus
            :rules="[val => !!val || 'Required']" />
        </q-card-section>
        <q-card-actions align="right" class="q-pt-none">
          <q-btn flat label="Cancel" color="grey-7" v-close-popup size="sm" />
          <q-btn unelevated label="Reject" color="negative" size="sm"
            :loading="rejectDlg.loading" :disable="!rejectDlg.reason"
            @click="submitReject" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import { useQuasar } from 'quasar';
import axios from 'axios';

defineProps({ doctor: Object });

const $q = useQuasar();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const appointments = ref([]);
const loading = ref(true);
const actionId = ref('');

const searchQuery = ref('');
const selectedDate = ref('');
const selectedHospital = ref('All');

const hospitalList = ref([]);
const hospitalsLoading = ref(false);

const rejectDlg = reactive({ show: false, appointment: null, reason: '', loading: false });

const getToken = () => localStorage.getItem('token') || localStorage.getItem('nexus_token');
const parseJwt = (t) => { try { return JSON.parse(atob(t.split('.')[1])); } catch { return null; } };

const parseAptDate = (dateStr, timeStr) => {
  if (!dateStr) return new Date(0);
  try {
    const dt = new Date(`${dateStr} ${timeStr || '00:00'}`);
    return isNaN(dt.getTime()) ? new Date(dateStr) : dt;
  } catch { return new Date(0); }
};

const getInitials = (n) => n ? n.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : '?';

const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Hospital resolution — ONLY for PHYSICAL appointments
// Filters out fake/invalid hospital names; returns null for ONLINE
const INVALID_HOSPITALS = ['colombo general hospital', 'main hospital', ''];
const resolveHospital = (apt) => {
  if (apt.appointmentType === 'ONLINE') return null;
  const raw = apt.hospitalName || apt.slot?.hospitalName || apt.doctorHospital || apt.hospital || apt.slot?.hospital || null;
  if (!raw || INVALID_HOSPITALS.includes(raw.trim().toLowerCase())) return 'Unknown Hospital';
  return raw;
};

const badgeColor = (s) => ({ PENDING: 'orange', CONFIRMED: 'blue', COMPLETED: 'green', CANCELLED: 'red', VERIFIED: 'purple' }[s] || 'grey');
const badgeIcon = (s) => ({ PENDING: 'pending_actions', CONFIRMED: 'verified', COMPLETED: 'done_all', CANCELLED: 'cancel', VERIFIED: 'check_circle' }[s] || 'info');

// Immutable update → triggers Vue reactivity & all computed reflows
const updateAppointment = (id, updates) => {
  const i = appointments.value.findIndex(a => a._id === id);
  if (i !== -1) appointments.value[i] = { ...appointments.value[i], ...updates };
};

// ── Data Fetch ──────────────────────────────────────────────────────
onMounted(async () => {
  const token = getToken();
  const decoded = token ? parseJwt(token) : null;
  const doctorId = decoded?.roleId;

  // Fetch hospitals from backend registry
  hospitalsLoading.value = true;
  try {
    const r = await axios.get(`${API_URL}/api/hospitals?active=true`, { headers: { Authorization: `Bearer ${token}` } });
    const d = r.data?.data || r.data;
    if (Array.isArray(d)) hospitalList.value = d.map(h => h.name).filter(Boolean);
  } catch { /* fallback to appointment-derived */ }
  hospitalsLoading.value = false;

  // Fetch appointments
  if (doctorId) {
    try {
      const { data } = await axios.get(`${API_URL}/api/appointments/doctor/${doctorId}`, { headers: { Authorization: `Bearer ${token}` } });
      const raw = Array.isArray(data) ? data : [];
      appointments.value = raw.map(a => ({ ...a, parsedDate: parseAptDate(a.date, a.time) })).sort((a, b) => b.parsedDate - a.parsedDate);
    } catch (e) {
      console.error('Failed to fetch appointments', e);
      $q.notify({ type: 'negative', message: 'Failed to load schedule.' });
    }
  }
  loading.value = false;
});

// ── Hospital dropdown (backend-first, appointment-fallback) ─────────
const hospitalOptions = computed(() => {
  if (hospitalList.value.length > 0) return ['All', ...hospitalList.value];
  const s = new Set(appointments.value.map(a => resolveHospital(a)).filter(h => h !== 'Unknown Hospital'));
  return ['All', ...Array.from(s)];
});

// ── Filtered (BEFORE segmentation) ──────────────────────────────────
const filteredAppointments = computed(() => {
  let r = appointments.value;
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    r = r.filter(a => a.patientName?.toLowerCase().includes(q) || a.patientId?.toLowerCase().includes(q) || a._id?.toLowerCase().includes(q));
  }
  if (selectedDate.value) r = r.filter(a => a.date === selectedDate.value);
  if (selectedHospital.value && selectedHospital.value !== 'All') r = r.filter(a => resolveHospital(a) === selectedHospital.value);
  return r;
});

// ── Segmentation (AFTER filtering) ──────────────────────────────────
const pendingAppointments = computed(() => filteredAppointments.value.filter(a => a.status === 'PENDING'));

const todayConfirmed = computed(() => {
  const t = getTodayString();
  return filteredAppointments.value.filter(a => a.status === 'CONFIRMED' && a.date === t);
});

const pastRecords = computed(() => {
  const t = getTodayString();
  return filteredAppointments.value.filter(a =>
    a.status === 'COMPLETED' || a.status === 'CANCELLED' || (a.status === 'CONFIRMED' && a.date !== t)
  );
});

// ── Counts (from ALL appointments, not filtered) ────────────────────
const totalTodayCount = computed(() => { const t = getTodayString(); return appointments.value.filter(a => a.date === t).length; });
const pendingCount = computed(() => appointments.value.filter(a => a.status === 'PENDING').length);
const completedCount = computed(() => appointments.value.filter(a => a.status === 'COMPLETED').length);

// ── Actions ─────────────────────────────────────────────────────────
const approveAppointment = async (id) => {
  actionId.value = id + '_approve';
  try {
    await axios.put(`${API_URL}/api/appointments/doctor/confirm/${id}`, {}, { headers: { Authorization: `Bearer ${getToken()}` } });
    updateAppointment(id, { status: 'CONFIRMED' });
    $q.notify({ type: 'positive', message: 'Approved!', timeout: 2500 });
  } catch (e) {
    $q.notify({ type: 'negative', message: e.response?.data?.error || 'Failed' });
  } finally { actionId.value = ''; }
};

const openRejectDialog = (apt) => { rejectDlg.appointment = apt; rejectDlg.reason = ''; rejectDlg.show = true; };

const submitReject = async () => {
  if (!rejectDlg.reason.trim()) return;
  rejectDlg.loading = true;
  const id = rejectDlg.appointment._id;
  actionId.value = id + '_reject';
  try {
    await axios.put(`${API_URL}/api/appointments/doctor/reject/${id}`, { reason: rejectDlg.reason }, { headers: { Authorization: `Bearer ${getToken()}` } });
    updateAppointment(id, { status: 'CANCELLED', rejectionReason: rejectDlg.reason });
    rejectDlg.show = false;
    $q.notify({ type: 'positive', message: 'Rejected.' });
  } catch (e) {
    $q.notify({ type: 'negative', message: e.response?.data?.error || 'Failed' });
  } finally { rejectDlg.loading = false; actionId.value = ''; }
};

const markComplete = async (id) => {
  actionId.value = id + '_complete';
  try {
    await axios.put(`${API_URL}/api/appointments/doctor/complete/${id}`, {}, { headers: { Authorization: `Bearer ${getToken()}` } });
    updateAppointment(id, { status: 'COMPLETED' });
    $q.notify({ type: 'positive', message: 'Completed!' });
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to update' });
  } finally { actionId.value = ''; }
};
</script>

<style scoped>
.stat-card { border-radius: 10px; }

.filter-bar {
  border-radius: 10px;
  position: sticky;
  top: 8px;
  z-index: 10;
}

.apt-card {
  border-radius: 12px !important;
  background: #fff;
  transition: all .25s cubic-bezier(.25,.8,.25,1);
  overflow: hidden;
  border-left: 5px solid #e5e7eb !important;
}
.apt-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,.06) !important;
}

.card-pending { border-left-color: #f97316 !important; }
.card-today   { border-left-color: #3b82f6 !important; }
.card-past    { border-left-color: #9ca3af !important; opacity: .8; filter: grayscale(70%); }
.card-past:hover { opacity: 1; filter: grayscale(0%); }

.card-avatar { border-radius: 12px; }

.act-btn {
  border-radius: 6px;
  font-weight: 600;
  font-size: 12px;
  text-transform: none;
}
</style>