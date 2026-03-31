<template>
  <q-page class="search-page-bg text-white font-jakarta flex column items-center q-pt-xl">
    <div class="max-width-800 w-full q-px-md">
      
      <div class="flex items-center justify-between q-mb-xl">
        <div class="flex items-center cursor-pointer text-grey-4 back-link" @click="router.push('/appointment/form')">
          <q-icon name="arrow_back" size="sm" class="q-mr-sm" />
          <span class="text-weight-bold">Back to Details</span>
        </div>
        <div class="timer-badge flex items-center text-red-4 text-weight-bold q-px-md q-py-sm rounded-borders" v-if="store.timeLeft > 0">
          <q-icon name="timer" class="q-mr-sm" size="xs" /> Session expires in: {{ store.formattedTimeLeft }}
        </div>
      </div>

      <h2 class="text-h4 text-weight-bolder text-white q-mb-lg q-mt-none tracking-tight">Booking Summary</h2>

      <div class="row q-col-gutter-lg pb-12">
        <div class="col-12 col-md-7">
          <q-card class="nexus-search-card shadow-none q-mb-md">
            <q-card-section>
              <div class="text-subtitle1 text-weight-bolder q-mb-md text-blue-4 border-bottom-dark q-pb-sm">Doctor Details</div>
              <div class="flex items-center q-mb-sm"><q-icon name="account_circle" color="grey-5" class="q-mr-sm" /> <span class="text-weight-bold text-white">{{ store.selectedDoctor?.name }}</span></div>
              <div class="flex items-center q-mb-sm"><q-icon name="medical_services" color="grey-5" class="q-mr-sm" /> <span class="text-grey-4">{{ store.selectedDoctor?.specialty }} • {{ store.selectedDoctor?.hospital }}</span></div>
              <div class="flex items-center"><q-icon name="event" color="grey-5" class="q-mr-sm" /> <span class="text-grey-4">{{ store.selectedDate }} at {{ store.selectedSlot?.time }} ({{ store.consultationType }})</span></div>
            </q-card-section>
          </q-card>

          <q-card class="nexus-search-card shadow-none">
            <q-card-section>
              <div class="text-subtitle1 text-weight-bolder q-mb-md text-blue-4 border-bottom-dark q-pb-sm">Patient Details</div>
              <div class="flex items-center q-mb-sm"><q-icon name="person" color="grey-5" class="q-mr-sm" /> <span class="text-weight-bold text-white">{{ store.patientDetails.title }}. {{ store.patientDetails.name }}</span></div>
              <div class="flex items-center q-mb-sm"><q-icon name="assignment_ind" color="grey-5" class="q-mr-sm" /> <span class="text-grey-4">{{ store.patientDetails.nationality }} (NIC: {{ store.patientDetails.nic }})</span></div>
              <div class="flex items-center q-mb-sm"><q-icon name="phone" color="grey-5" class="q-mr-sm" /> <span class="text-grey-4">{{ store.patientDetails.mobile }}</span></div>
              <div class="flex items-center"><q-icon name="email" color="grey-5" class="q-mr-sm" /> <span class="text-grey-4">{{ store.patientDetails.email }}</span></div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-5">
          <q-card class="nexus-search-card shadow-none h-full column">
            <q-card-section class="col">
              <div class="text-subtitle1 text-weight-bolder q-mb-lg text-blue-4 border-bottom-dark q-pb-sm">Payment Breakdown</div>
              <div class="flex justify-between items-center q-mb-md"><span class="text-grey-4">Doctor Fee</span><span class="text-weight-bold text-white">LKR {{ store.fees.doctorFee.toLocaleString() }}</span></div>
              <div class="flex justify-between items-center q-mb-md"><span class="text-grey-4">Booking Fee</span><span class="text-weight-bold text-white">LKR {{ store.fees.bookingFee.toLocaleString() }}</span></div>
              <div class="flex justify-between items-center q-mb-md" v-if="store.consultationType === 'Physical'">
                <span class="text-grey-4">Hospital Fee</span><span class="text-weight-bold text-white">LKR {{ store.fees.hospitalFee.toLocaleString() }}</span>
              </div>
              <q-separator dark class="q-my-md opacity-20" />
              <div class="flex justify-between items-center text-h6 text-white text-weight-bolder q-mt-lg">
                <span>Total</span><span class="text-blue-4">LKR {{ store.totalFee.toLocaleString() }}</span>
              </div>
            </q-card-section>
            <q-card-section class="q-pt-none">
              <q-btn unelevated rounded color="primary" class="full-width next-btn q-py-sm text-weight-bold text-subtitle2" @click="proceedToPayment">
                <span>Proceed to Pay</span> <q-icon name="payment" size="xs" class="q-ml-sm" />
              </q-btn>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAppointmentStore } from '../../stores/appointmentStore';

const store = useAppointmentStore();
const router = useRouter();

onMounted(() => { 
  if (!store.selectedSlot) router.push('/search'); 
});

const proceedToPayment = () => { 
  if (store.timeLeft > 0) router.push('/appointment/payment'); 
};
</script>

<style scoped>
.search-page-bg { background: radial-gradient(circle at top right, #0a1128 0%, #030612 100%); min-height: 100vh; }
.max-width-800 { max-width: 800px; width: 100%; }
.back-link { transition: color 0.2s; }
.back-link:hover { color: #60a5fa !important; }
.nexus-search-card { border: 1px solid rgba(30, 58, 138, 0.4); border-radius: 16px; background: rgba(15, 23, 42, 0.6) !important; }
.border-bottom-dark { border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
.opacity-20 { opacity: 0.2; }
.next-btn { background: #2563eb !important; transition: background 0.2s; }
.next-btn:hover { background: #1d4ed8 !important; }
.timer-badge { border: 1px solid rgba(248, 113, 113, 0.3); background: rgba(220, 38, 38, 0.1); }
.pb-12 { padding-bottom: 3rem; }
</style>
