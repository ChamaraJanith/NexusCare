<template>
  <q-page class="search-page-bg text-white font-jakarta flex column items-center q-pt-xl">
    <div class="max-width-600 w-full q-px-md">
      
      <div class="flex items-center justify-between q-mb-xl">
        <div class="flex items-center cursor-pointer text-grey-4 back-link" @click="router.push('/appointment/summary')">
          <q-icon name="arrow_back" size="sm" class="q-mr-sm" />
          <span class="text-weight-bold">Back to Summary</span>
        </div>
        <div class="timer-badge flex items-center text-red-4 text-weight-bold q-px-md q-py-sm rounded-borders" v-if="store.timeLeft > 0">
          <q-icon name="timer" class="q-mr-sm" size="xs" /> Session expires in: {{ store.formattedTimeLeft }}
        </div>
      </div>

      <div class="text-center q-mb-xl">
        <h2 class="text-h4 text-weight-bolder tracking-tight q-mb-xs q-mt-none text-white">Payment Portal</h2>
        <p class="text-grey-5">Securely complete your booking on the live NexusCare server</p>
      </div>

      <q-card class="nexus-payment-card shadow-lg q-mb-xl">
        <q-card-section class="q-pa-xl">
          <div class="flex justify-between items-center q-mb-lg bg-slate-900 q-pa-md rounded-borders border-dark">
            <span class="text-grey-4 text-weight-medium">Total Amount</span>
            <span class="text-h5 text-blue-4 text-weight-bolder">LKR {{ store.totalFee.toLocaleString() }}</span>
          </div>

          <q-form @submit.prevent="executePayment" class="q-gutter-lg">
            
            <q-input v-model="card.number" label="Card Number" mask="#### #### #### ####" outlined dark color="blue-5" class="nexus-input" lazy-rules :rules="[val => val && val.length === 19 || 'Incomplete']">
              <template v-slot:prepend><q-icon name="credit_card" color="blue-5" size="xs"/></template>
            </q-input>

            <div class="row q-col-gutter-md">
              <div class="col-6">
                <q-input v-model="card.expiry" label="MM/YY" mask="##/##" outlined dark color="blue-5" class="nexus-input" lazy-rules :rules="[val => !!val || 'Required']" />
              </div>
              <div class="col-6">
                <q-input v-model="card.cvv" label="CVV" mask="###" outlined dark color="blue-5" type="password" class="nexus-input" lazy-rules :rules="[val => !!val || 'Required']" />
              </div>
            </div>

            <div class="flex q-mt-xl">
              <q-btn type="submit" unelevated rounded color="primary" class="full-width pay-btn q-py-md text-weight-bold text-subtitle2" :loading="processing">
                <span>Confirm & Pay LKR {{ store.totalFee.toLocaleString() }}</span> <q-icon name="lock" size="xs" class="q-ml-sm" />
                <template v-slot:loading><q-spinner-ios class="on-left" /> Processing request...</template>
              </q-btn>
            </div>
          </q-form>
        </q-card-section>
      </q-card>

    </div>
  </q-page>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAppointmentStore } from '../../stores/appointmentStore';
import { useQuasar } from 'quasar';

const store = useAppointmentStore();
const router = useRouter();
const $q = useQuasar();

const processing = ref(false);
const card = reactive({ number: '', expiry: '', cvv: '' });

onMounted(() => { if (!store.selectedSlot) router.push('/search'); });

const executePayment = async () => {
  if (store.timeLeft <= 0) return;
  processing.value = true;
  try {
    // Hits the real backend http://localhost:5003/api/appointments
    await store.submitBooking();
    $q.notify({ type: 'positive', message: 'Booking confirmed securely!', position: 'top' });
    router.push('/appointment/receipt');
  } catch (err) {
    console.error("Payment submission err", err);
    $q.notify({ type: 'negative', message: 'Failed to contact backend API. Check if your Node servers are running on 5003.', position: 'top', timeout: 5000 });
  } finally {
    processing.value = false;
  }
};
</script>

<style scoped>
.search-page-bg { background: radial-gradient(circle at top right, #0a1128 0%, #030612 100%); min-height: 100vh; }
.max-width-600 { max-width: 600px; width: 100%; }
.back-link { transition: color 0.2s; }
.back-link:hover { color: #60a5fa !important; }
.nexus-payment-card { border: 1px solid rgba(30, 58, 138, 0.4); border-radius: 16px; background: rgba(15, 23, 42, 0.6) !important; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
.nexus-input :deep(.q-field__control) { border-radius: 8px; background: transparent !important; transition: all 0.3s; }
.nexus-input :deep(.q-field__control:before) { border: 1px solid rgba(255, 255, 255, 0.2) !important; }
.nexus-input :deep(.q-field__control:hover:before) { border-color: rgba(59, 130, 246, 0.5) !important; }
.nexus-input :deep(.q-field--focused .q-field__control:before) { border-color: #3b82f6 !important; border-width: 2px !important; }
.pay-btn { background: #2563eb !important; transition: background 0.2s; }
.pay-btn:hover { background: #1d4ed8 !important; }
.timer-badge { border: 1px solid rgba(248, 113, 113, 0.3); background: rgba(220, 38, 38, 0.1); }
.bg-slate-900 { background: #0f172a; }
.border-dark { border: 1px solid rgba(255, 255, 255, 0.05); }
</style>
