<template>
  <q-page class="search-page-bg text-white font-jakarta flex column items-center q-pt-xl">
    <div class="max-width-1000 w-full q-px-md">

      <div class="flex items-center q-mb-xl cursor-pointer text-grey-4 back-link" @click="router.push('/search')">
        <q-icon name="arrow_back" size="sm" class="q-mr-sm" />
        <span class="text-weight-bold">Back to Search</span>
      </div>

      <!-- EXACT IMAGE 2 HEADER -->
      <div class="q-mb-md">
        <div class="text-subtitle1 text-grey-4">
          Found <span class="text-weight-bold text-white">{{ store.doctors.length }}</span> doctors for <span class="text-blue-4">{{ store.searchFilters.specialization || 'all specialties' }}</span>
        </div>
      </div>

      <div v-if="store.loading" class="flex flex-center q-py-xl column">
        <q-spinner-dots color="blue-5" size="3em" />
        <div class="q-mt-md text-grey-4 text-weight-bold">Loading real-time API data...</div>
      </div>

      <!-- DOCTOR LOOP (USING STORE ONLY - NO MOCKS) -->
      <div v-else class="row q-col-gutter-lg pb-12">
        <div v-for="doc in store.doctors" :key="doc._id || doc.id" class="col-12 col-md-6">
          <DoctorCard :doctor="doc" @book="handleBook"/>
        </div>

        <div v-if="store.doctors.length === 0" class="col-12 q-mt-lg">
          <div class="text-center q-py-xl glass-card q-px-md rounded-borders full-width">
            <q-icon name="search_off" size="64px" color="grey-7" class="q-mb-md" />
            <div class="text-h5 text-weight-bold text-grey-3 q-mb-sm">No doctors found matching filters</div>
          </div>
        </div>
      </div>

    </div>
  </q-page>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAppointmentStore } from '../../stores/appointmentStore';
import { useAuthStore } from '../../stores/authStore';
import DoctorCard from '../../components/DoctorCard.vue';

const store = useAppointmentStore();
const authStore = useAuthStore();
const router = useRouter();

onMounted(() => {
  // Always respect data stored in Pinia
  if (store.doctors.length === 0 && !store.loading) {
    store.fetchDoctors(store.searchFilters);
  }
});

const handleBook = (doctor) => {
  // 🔒 AUTH CHECK — unregistered users cannot book
  if (!authStore.isLoggedIn) {
    const doctorId = doctor.doctorId || doctor._id || doctor.id;
    const redirectPath = `/appointment/book/${doctorId}`;
    router.push({ path: '/login', query: { redirect: redirectPath } });
    return;
  }

  // 🧠 Save to store — SlotSelection reads from here
  store.selectDoctor(doctor);

  // Clean URL, doctor data lives in the store
  router.push({
    name: 'SlotSelection',
    params: { doctorId: doctor.doctorId || doctor._id || doctor.id }
  });
};

</script>

<style scoped>
.search-page-bg { background: radial-gradient(circle at top right, #0a1128 0%, #030612 100%); min-height: 100vh; }
.max-width-1000 { max-width: 1000px; }
.back-link:hover { color: #60a5fa !important; }
.glass-card { border: 1px solid rgba(255, 255, 255, 0.05); background: rgba(15, 23, 42, 0.5); }
.pb-12 { padding-bottom: 3rem; }
.w-full { width: 100%; }
</style>
