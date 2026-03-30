<template>
  <q-page padding style="background: #f5f6fa;">
    <!-- Loading -->
    <div v-if="loading" class="flex flex-center" style="min-height: 60vh;">
      <q-spinner-puff color="primary" size="60px" />
    </div>

    <div v-else>
      <!-- Welcome -->
      <div class="q-mb-lg">
        <div class="text-grey-7" style="font-size: 16px;">Welcome to,</div>
        <div class="text-weight-bolder" style="font-size: 28px; color: #1c2b36;">
          Dr. {{ doctor.name }}
        </div>
      </div>

      <!-- Schedule + Queue -->
      <div class="row q-col-gutter-lg">
        <!-- Today's Schedule -->
        <div class="col-12 col-md-7">
          <q-card flat bordered style="border-radius: 12px;">
            <q-card-section class="row items-center justify-between q-pb-sm">
              <div class="text-weight-bold text-dark" style="font-size: 17px;">Today's Schedule</div>
              <q-btn outline dense size="sm" color="grey-5" text-color="dark" label="Today" class="text-capitalize" style="border-radius: 8px;" />
            </q-card-section>
            <q-card-section class="q-pt-none">
              <div v-if="appointments.length > 0" class="column q-gutter-y-sm">
                <div v-for="apt in appointments.slice(0, 4)" :key="apt._id" class="row items-center q-pa-md bg-white rounded-borders" style="border: 1px solid #e8e8e8; border-left: 4px solid #4caf50; border-radius: 10px;">
                  <q-avatar size="44px" style="background: #edf2f7;" class="q-mr-md">
                    <span class="text-primary text-weight-bold" style="font-size: 14px;">{{ getInitials(apt.patientName) }}</span>
                  </q-avatar>
                  <div class="col">
                    <div class="text-weight-bold text-dark" style="font-size: 14px;">{{ apt.patientName || 'Patient' }}</div>
                    <div class="text-grey-6" style="font-size: 12px;">{{ formatTime(apt.appointmentDate) }} · {{ apt.reason || 'Consultation' }}</div>
                  </div>
                  <q-icon name="chevron_right" color="grey-4" size="20px" />
                </div>
              </div>
              <div v-else class="q-pa-xl flex flex-center column" style="border: 1px dashed #ccc; border-radius: 10px;">
                <q-icon name="event_busy" size="48px" color="grey-4" class="q-mb-sm" />
                <div class="text-grey-5">No appointments for today.</div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Patient Queue -->
        <div class="col-12 col-md-5">
          <q-card flat bordered style="border-radius: 12px; height: 100%;" class="column">
            <q-card-section class="q-pb-sm">
              <div class="text-weight-bold text-dark" style="font-size: 17px;">Patient Queue</div>
            </q-card-section>
            <q-card-section class="q-pt-none col" style="overflow-y: auto;">
              <q-list v-if="queuePatients.length > 0">
                <q-item v-for="p in queuePatients" :key="p._id" class="q-px-none" style="border-bottom: 1px solid #f3f3f3;">
                  <q-item-section avatar style="min-width: 40px;">
                    <q-avatar size="36px" style="background: #edf2f7;">
                      <span class="text-primary text-weight-bold" style="font-size: 11px;">{{ getInitials(p.patientName) }}</span>
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-bold" style="font-size: 13px;">{{ p.patientName }}</q-item-label>
                    <q-item-label caption>{{ formatTime(p.appointmentDate) }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-badge :color="p.status === 'active' ? 'positive' : 'orange'" :label="p.status || 'waiting'" />
                  </q-item-section>
                </q-item>
              </q-list>
              <div v-else class="q-pa-lg text-center text-grey-5">Queue is empty.</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="row q-col-gutter-lg q-mt-md">
        <div class="col-12 col-md-4">
          <q-card flat bordered style="border-radius: 12px;" class="q-pa-md">
            <div class="text-weight-bold text-dark q-mb-xs" style="font-size: 13px;">Total Appointments</div>
            <div class="text-weight-bolder" style="font-size: 36px; color: #1c2b36;">{{ appointments.length }}</div>
            <q-linear-progress :value="appointments.length > 0 ? 0.65 : 0" color="positive" track-color="grey-2" size="6px" class="q-mt-sm rounded-borders" style="width: 80%;" />
          </q-card>
        </div>
        <div class="col-12 col-md-4">
          <q-card flat bordered style="border-radius: 12px;" class="q-pa-md">
            <div class="text-weight-bold text-dark q-mb-xs" style="font-size: 13px;">Specialization</div>
            <div class="text-weight-bolder text-primary" style="font-size: 20px;">{{ doctor.specialization }}</div>
          </q-card>
        </div>
        <div class="col-12 col-md-4">
          <q-card flat bordered style="border-radius: 12px;" class="q-pa-md">
            <div class="text-weight-bold text-dark q-mb-xs" style="font-size: 13px;">Experience</div>
            <div class="text-weight-bolder" style="font-size: 36px; color: #1c2b36;">{{ doctor.experience }}<span style="font-size: 14px; color: #999;"> years</span></div>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { fetchAppointments, fetchDoctorProfile } from 'src/services/doctorApi';

const doctor = ref({});
const loading = ref(true);
const appointments = ref([]);
const dataLoading = ref(true);

const queuePatients = computed(() => {
  return appointments.value
    .filter(a => ['active', 'waiting', 'confirmed', 'scheduled'].includes(a.status))
    .slice(0, 5);
});

const formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? String(iso) : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch { return null; }
};

onMounted(async () => {
  try {
    const profileRes = await fetchDoctorProfile();
    doctor.value = profileRes.data || profileRes || {};
  } catch (err) {
    console.error("Failed to fetch doctor profile", err);
  } finally {
    loading.value = false;
  }

  const token = localStorage.getItem('token') || localStorage.getItem('nexus_token');
  const decoded = token ? parseJwt(token) : null;
  const doctorId = decoded?.roleId || doctor.value?.doctorId;
  if (doctorId) {
    try {
      appointments.value = await fetchAppointments(doctorId);
    } catch (err) {
      console.error("Failed to fetch appointments", err);
    }
  }
  dataLoading.value = false;
});
</script>
