<template>
  <q-page class="search-page-bg text-white font-jakarta flex column items-center q-pt-xl">
    <div class="max-width-1000 w-full q-px-md">
      
      <!-- Top Tag -->
      <div class="q-mb-lg flex items-center">
        <div class="nexus-tag border-blue text-blue-2 q-px-md q-py-xs rounded-borders text-caption text-weight-bold flex items-center">
          <q-icon name="event" size="xs" class="q-mr-xs" /> NexusCare Appointments
        </div>
      </div>

      <!-- Headers -->
      <div class="q-mb-xl">
        <h1 class="text-h2 text-weight-bolder tracking-tight q-mb-sm q-mt-none">
          Book a <span class="text-primary-blue">Doctor</span>
        </h1>
        <p class="text-grey-5 text-subtitle1 tracking-wider">
          Search across our network of specialists in top Sri Lankan hospitals
        </p>
      </div>

      <!-- Search Card -->
      <q-card class="nexus-search-card bg-transparent shadow-none q-mb-xl">
        <q-card-section class="q-pa-xl">
          <form @submit.prevent="handleSearch" class="q-gutter-y-lg">
            
            <div class="row q-col-gutter-lg">
              <!-- Name -->
              <div class="col-12 col-md-3">
                <div class="text-caption text-uppercase text-weight-bold text-grey-5 tracking-wider q-mb-sm custom-label">DOCTOR NAME</div>
                <q-input
                  v-model="filters.name"
                  outlined
                  dark
                  color="blue-5"
                  class="nexus-input"
                  placeholder="e.g. Dr. Priya"
                >
                  <template v-slot:prepend>
                    <q-icon name="person_search" color="blue-5" size="xs"/>
                  </template>
                </q-input>
              </div>
              
              <!-- Specialization -->
              <div class="col-12 col-md-3">
                <div class="text-caption text-uppercase text-weight-bold text-grey-5 tracking-wider q-mb-sm custom-label">SPECIALIZATION</div>
                <q-select
                  v-model="filters.specialization"
                  :options="specialtyOptions"
                  outlined
                  dark
                  color="blue-5"
                  class="nexus-input"
                  emit-value
                  map-options
                  clearable
                >
                  <template v-slot:prepend>
                    <q-icon name="medical_services" color="blue-5" size="xs"/>
                  </template>
                </q-select>
              </div>

              <!-- Hospital -->
              <div class="col-12 col-md-3">
                <div class="text-caption text-uppercase text-weight-bold text-grey-5 tracking-wider q-mb-sm custom-label">HOSPITAL</div>
                <q-select
                  v-model="filters.hospital"
                  :options="hospitalOptions"
                  option-label="label"
                  option-value="value"
                  emit-value
                  map-options
                  outlined
                  dark
                  color="blue-5"
                  class="nexus-input"
                  clearable
                >
                  <template v-slot:prepend>
                    <q-icon name="local_hospital" color="blue-5" size="xs"/>
                  </template>
                </q-select>
              </div>

              <!-- Date -->
              <div class="col-12 col-md-3">
                <div class="text-caption text-uppercase text-weight-bold text-grey-5 tracking-wider q-mb-sm custom-label">APPOINTMENT DATE</div>
                <q-input
                  v-model="filters.date"
                  type="date"
                  outlined
                  dark
                  color="blue-5"
                  class="nexus-input"
                  :min="today"
                >
                  <template v-slot:prepend>
                    <q-icon name="event" color="blue-5" size="xs"/>
                  </template>
                </q-input>
              </div>
            </div>

            <!-- Buttons Grid matching center placement -->
            <div class="row justify-center items-center q-mt-xl q-gutter-x-lg">
              <q-btn
                type="submit"
                unelevated
                rounded
                color="primary"
                class="search-btn q-px-xl q-py-sm text-weight-bold"
                :loading="store.loading"
              >
                <q-icon name="search" size="xs" class="q-mr-sm" />
                <span>Search Doctors</span>
                <template v-slot:loading>
                  <q-spinner-dots class="on-left" /> Searching...
                </template>
              </q-btn>

              <q-btn flat dense label="Clear" color="white" class="text-weight-bold text-caption clear-btn" @click="clearFilters" />
            </div>
            
          </form>
        </q-card-section>
      </q-card>

      <!-- Stats Features row based exactly on screenshot 1 -->
      <div class="row q-col-gutter-lg justify-start">
        <div class="col-12 col-md-4">
          <div class="stat-card flex items-center q-pa-md">
            <div class="stat-icon-wrapper bg-blue-9 text-blue-2 flex flex-center q-mr-md rounded-borders">
              <q-icon name="people" size="sm" />
            </div>
            <div>
              <div class="text-h6 text-weight-bolder text-white">50+</div>
              <div class="text-caption text-grey-5 text-weight-medium">Specialist Doctors</div>
            </div>
          </div>
        </div>

        <div class="col-12 col-md-4">
          <div class="stat-card flex items-center q-pa-md">
            <div class="stat-icon-wrapper bg-teal-9 text-teal-2 flex flex-center q-mr-md rounded-borders">
              <q-icon name="local_hospital" size="sm" />
            </div>
            <div>
              <div class="text-h6 text-weight-bolder text-white">6</div>
              <div class="text-caption text-grey-5 text-weight-medium">Partner Hospitals</div>
            </div>
          </div>
        </div>

        <div class="col-12 col-md-4">
          <div class="stat-card flex items-center q-pa-md">
            <div class="stat-icon-wrapper bg-green-9 text-green-2 flex flex-center q-mr-md rounded-borders">
              <q-icon name="event_available" size="sm" />
            </div>
            <div>
              <div class="text-h6 text-weight-bolder text-white">24/7</div>
              <div class="text-caption text-grey-5 text-weight-medium">Online Booking</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAppointmentStore } from '../../stores/appointmentStore';
import { fetchHospitals } from 'src/services/doctorApi';

const store = useAppointmentStore();
const router = useRouter();

const filters = reactive({
  name: store.searchFilters.name || '',
  specialization: store.searchFilters.specialization || null,
  hospital: store.searchFilters.hospital || null,
  date: store.searchFilters.date || ''
});

const today = new Date().toISOString().split('T')[0];

const specialtyOptions = [
  'Cardiology', 'Neurology', 'Pediatrics', 'Dermatology', 'Psychiatry', 'Orthopedics'
];

const hospitalOptions = ref([]);

const loadHospitals = async () => {
  try {
    const hospitals = await fetchHospitals();
    hospitalOptions.value = hospitals.map(h => ({
      label: h.name,
      value: h.name
    }));
  } catch (err) {
    console.error("Failed to load hospitals", err);
  }
};

onMounted(() => {
  loadHospitals();
});

const handleSearch = async () => {
  store.setSearchFilters({ ...filters });
  const activeFilters = {};
  if (filters.name) activeFilters.name = filters.name;
  if (filters.specialization) activeFilters.specialization = filters.specialization;
  if (filters.hospital) activeFilters.hospital = filters.hospital;
  if (filters.date) activeFilters.date = filters.date;
  
  await store.fetchDoctors(activeFilters);
  router.push('/appointment/results');
};

const clearFilters = () => {
  filters.name = '';
  filters.specialization = null;
  filters.hospital = null;
  filters.date = '';
  store.clearFilters();
};
</script>

<style scoped>
.search-page-bg {
  background: radial-gradient(circle at top right, #0a1128 0%, #030612 100%);
  min-height: 100vh;
}
.max-width-1000 { max-width: 1000px; }
.w-full { width: 100%; }
.text-primary-blue { color: #3b82f6; }
.nexus-tag { border: 1px solid rgba(59, 130, 246, 0.4); background: rgba(59, 130, 246, 0.1); border-radius: 20px; }

.nexus-search-card {
  border: 1px solid rgba(30, 58, 138, 0.5);
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.5) !important;
  backdrop-filter: blur(8px);
}
.custom-label { font-size: 10px; }
.nexus-input :deep(.q-field__control) {
  border-radius: 8px;
  background: transparent !important;
  transition: all 0.3s ease;
}
.nexus-input :deep(.q-field__control:before) { border: 1px solid rgba(255, 255, 255, 0.1) !important; }
.nexus-input :deep(.q-field__control:hover:before) { border-color: rgba(59, 130, 246, 0.5) !important; }
.nexus-input :deep(.q-field--focused .q-field__control:before) { border-color: #3b82f6 !important; border-width: 2px !important; }
.search-btn {
  background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
  font-size: 15px;
  box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4);
}
.search-btn:hover { background: #1d4ed8 !important; }
.clear-btn { transition: color 0.2s; opacity: 0.8; }
.clear-btn:hover { opacity: 1; color: #fff; }
.stat-card {
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(15, 23, 42, 0.6);
  border-radius: 12px;
}
.stat-icon-wrapper { width: 44px; height: 44px; }
</style>