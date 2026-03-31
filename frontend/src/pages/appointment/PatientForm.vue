<template>
  <q-page class="search-page-bg text-white font-jakarta flex column items-center q-pt-xl">
    <div class="max-width-800 w-full q-px-md">
      
      <div class="flex items-center justify-between q-mb-xl">
        <div class="flex items-center cursor-pointer text-grey-4 back-link" @click="router.push(`/appointment/book/${store.selectedDoctor?.id}`)">
          <q-icon name="arrow_back" size="sm" class="q-mr-sm" />
          <span class="text-weight-bold">Back to Slots</span>
        </div>
        
        <div class="timer-badge flex items-center text-red-4 text-weight-bold q-px-md q-py-sm rounded-borders" v-if="store.timeLeft > 0">
          <q-icon name="timer" class="q-mr-sm" size="xs" /> Session expires in: {{ store.formattedTimeLeft }}
        </div>
      </div>

      <h2 class="text-h4 text-weight-bolder text-white q-mb-lg q-mt-none tracking-tight">Patient Details</h2>

      <q-card class="nexus-search-card shadow-none">
        <q-card-section class="q-pa-xl">
          <q-form @submit.prevent="proceedToSummary" class="q-gutter-y-lg">
            
            <div class="row q-col-gutter-lg">
              <!-- Title -->
              <div class="col-12 col-md-3">
                <div class="text-caption text-uppercase text-weight-bold text-grey-5 tracking-wider q-mb-xs">Title</div>
                <q-select
                  v-model="form.title"
                  :options="titleOptions"
                  outlined
                  dark
                  color="blue-5"
                  class="nexus-input"
                  lazy-rules
                  :rules="[val => !!val || 'Title required']"
                />
              </div>

              <!-- Name -->
              <div class="col-12 col-md-9">
                <div class="text-caption text-uppercase text-weight-bold text-grey-5 tracking-wider q-mb-xs">Patient Name</div>
                <q-input
                  v-model="form.name"
                  outlined
                  dark
                  color="blue-5"
                  class="nexus-input"
                  placeholder="John Doe"
                  lazy-rules
                  :rules="[val => !!val || 'Patient Name is required']"
                />
              </div>

              <!-- Mobile -->
              <div class="col-12 col-md-6">
                <div class="text-caption text-uppercase text-weight-bold text-grey-5 tracking-wider q-mb-xs">Mobile Number</div>
                <q-input
                  v-model="form.mobile"
                  type="tel"
                  outlined
                  dark
                  color="blue-5"
                  class="nexus-input"
                  placeholder="+94 77 XXXXXXX"
                  lazy-rules
                  :rules="[val => !!val || 'Valid Mobile Number required']"
                />
              </div>

              <!-- Email -->
              <div class="col-12 col-md-6">
                <div class="text-caption text-uppercase text-weight-bold text-grey-5 tracking-wider q-mb-xs">Email</div>
                <q-input
                  v-model="form.email"
                  type="email"
                  outlined
                  dark
                  color="blue-5"
                  class="nexus-input"
                  placeholder="example@mail.com"
                  lazy-rules
                  :rules="[val => !!val || 'Email is required', val => /^[^@]+@[^@]+\.[^@]+$/.test(val) || 'Invalid email']"
                />
              </div>

              <!-- Nationality Radio -->
              <div class="col-12">
                <div class="text-caption text-uppercase text-weight-bold text-grey-5 tracking-wider q-mb-sm">Nationality</div>
                <div class="flex items-center q-gutter-x-lg q-mb-md">
                  <q-radio v-model="form.nationality" val="Local" label="Local" color="blue-5" dark />
                  <q-radio v-model="form.nationality" val="Foreign" label="Foreign" color="blue-5" dark />
                </div>
              </div>

              <!-- NIC / Passport -->
              <div class="col-12 col-md-6">
                <div class="text-caption text-uppercase text-weight-bold text-grey-5 tracking-wider q-mb-xs">NIC / Passport Number</div>
                <q-input
                  v-model="form.nic"
                  outlined
                  dark
                  color="blue-5"
                  class="nexus-input"
                  placeholder="123456789V"
                  lazy-rules
                  :rules="[val => !!val || 'NIC/Passport is required']"
                />
              </div>
            </div>

            <div class="q-mt-lg text-caption text-red-3 flex items-start">
              <q-icon name="error_outline" size="14px" class="q-mr-sm q-mt-xs" />
              <div>Please ensure all details match the patient's ID. Incorrect or falsified detals will result in appointment cancellation at the hospital.</div>
            </div>

            <div class="flex justify-end q-mt-xl">
              <q-btn type="submit" unelevated rounded color="primary" class="next-btn q-px-xl q-py-sm text-weight-bold">
                <span>Proceed to Summary</span> <q-icon name="arrow_forward" size="xs" class="q-ml-sm" />
              </q-btn>
            </div>
          </q-form>
        </q-card-section>
      </q-card>

    </div>
  </q-page>
</template>

<script setup>
import { reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAppointmentStore } from '../../stores/appointmentStore';

const store = useAppointmentStore();
const router = useRouter();

const titleOptions = ['Mr', 'Mrs', 'Miss', 'Rev', 'Dr'];

const form = reactive({
  title: store.patientDetails.title || 'Mr',
  name: store.patientDetails.name || '',
  mobile: store.patientDetails.mobile || '',
  email: store.patientDetails.email || '',
  nationality: store.patientDetails.nationality || 'Local',
  nic: store.patientDetails.nic || ''
});

onMounted(() => {
  if (!store.selectedSlot) {
    router.push('/search');
    return;
  }
  // User explicitly wants the timer to start right after selecting a slot -> when we land on Patient Details
  if (store.timeLeft <= 0 && !store.timer) {
    store.startTimer();
  }
});

const proceedToSummary = () => {
  if (store.timeLeft <= 0) return;
  store.patientDetails = { ...form };
  router.push('/appointment/summary');
};
</script>

<style scoped>
.search-page-bg { background: radial-gradient(circle at top right, #0a1128 0%, #030612 100%); min-height: 100vh; }
.max-width-800 { max-width: 800px; width: 100%; }
.back-link { transition: color 0.2s; }
.back-link:hover { color: #60a5fa !important; }
.nexus-search-card { border: 1px solid rgba(30, 58, 138, 0.4); border-radius: 16px; background: rgba(15, 23, 42, 0.6) !important; }
.nexus-input :deep(.q-field__control) { border-radius: 8px; background: transparent !important; transition: all 0.3s; }
.nexus-input :deep(.q-field__control:before) { border: 1px solid rgba(255, 255, 255, 0.2) !important; }
.nexus-input :deep(.q-field__control:hover:before) { border-color: rgba(59, 130, 246, 0.5) !important; }
.nexus-input :deep(.q-field--focused .q-field__control:before) { border-color: #3b82f6 !important; border-width: 2px !important; }
.next-btn { background: #2563eb !important; font-size: 15px; }
.timer-badge { border: 1px solid rgba(248, 113, 113, 0.3); background: rgba(220, 38, 38, 0.1); }
</style>
