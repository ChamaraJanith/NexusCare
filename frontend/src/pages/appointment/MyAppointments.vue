<template>
  <q-page class="search-page-bg text-white font-jakarta">
    <div class="max-width-1000 q-mx-auto q-pt-xl q-px-md">
      
      <div class="flex items-center justify-between q-mb-xl">
        <h1 class="text-h3 text-weight-bolder tracking-tight q-ma-none text-white">My Appointments</h1>
        <q-btn unelevated rounded color="primary" class="font-jakarta text-weight-bold book-btn" @click="router.push('/search')">
          <q-icon name="add" size="xs" class="q-mr-sm" /> Book New
        </q-btn>
      </div>

      <div v-if="loading" class="flex flex-center q-py-xl column">
        <q-spinner-dots color="blue-5" size="4em" />
        <div class="q-mt-md text-grey-4 text-weight-bold">Fetching from server...</div>
      </div>

      <div v-else-if="appointments.length === 0" class="text-center q-py-xl border-dark q-px-md rounded-borders bg-transparent">
        <q-icon name="event_busy" size="64px" color="grey-7" class="q-mb-md" />
        <div class="text-h5 text-weight-bold text-grey-3 q-mb-sm">No Appointments Yet</div>
        <p class="text-grey-5">Visit the search portal to find a doctor.</p>
        <q-btn unelevated color="primary" label="Book Now" class="q-mt-md rounded book-btn font-jakarta text-weight-bold" @click="router.push('/search')" />
      </div>

      <div v-else class="column q-gutter-md pb-12">
        <q-card v-for="appt in appointments" :key="appt._id || appt.id" class="appt-card bg-transparent row items-center no-wrap q-pa-md shadow-none">
          <div class="col-12 col-md-3 q-pr-md border-right-dark mobile-hide flex column justify-center">
            <div class="text-h6 text-weight-bold text-blue-4">{{ appt.date }}</div>
            <div class="text-subtitle1 text-grey-4 flex items-center">
              <q-icon name="schedule" size="xs" class="q-mr-xs" /> {{ appt.time }}
            </div>
          </div>
          
          <div class="col-12 col-md-5 q-pl-md">
            <div class="text-subtitle1 text-weight-bold text-white">{{ typeof appt.doctor === 'object' ? appt.doctor.name : 'Doctor Appointment' }}</div>
            <div class="text-caption text-grey-5">ID: {{ appt._id || appt.id }}</div>
            <div class="text-caption text-blue-4" v-if="appt.queueNumber">Queue: #{{ appt.queueNumber }}</div>
            <div class="text-caption" :class="appt.paymentStatus === 'success' ? 'text-green-4' : 'text-orange-4'">Payment: {{ appt.paymentStatus || 'Pending' }}</div>
          </div>

          <div class="col-12 col-md-2 flex flex-center">
            <q-chip dense :color="appt.status === 'Completed' ? 'green-9' : (appt.status === 'Cancelled' ? 'red-9' : 'blue-9')" text-color="white" class="status-chip shadow-none border-none">
              {{ appt.status || 'Upcoming' }}
            </q-chip>
          </div>

          <div class="col-12 col-md-3 flex justify-end items-center q-gutter-x-sm">
            <q-btn v-if="appt.paymentStatus === 'success' && appt.orderId" outline dense color="blue-4" label="View Receipt" @click="router.push(`/receipt/${appt.orderId}`)" />
            <q-btn v-if="appt.paymentStatus === 'success' && appt.orderId" outline dense color="green-4" label="Download Receipt" @click="downloadReceipt(appt.orderId)" />
            <q-btn v-if="appt.status !== 'Cancelled' && appt.status !== 'Completed'" flat round dense icon="cancel" color="red-4" @click="confirmCancel(appt)" />
          </div>
        </q-card>
      </div>

    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { getMyAppointments, cancelAppointment } from '../../services/appointmentService';

const router = useRouter();
const $q = useQuasar();

const appointments = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const data = await getMyAppointments('PATIENT-123'); // Assume generic linked backend ID for UI example purposes
    appointments.value = Array.isArray(data) ? data : (data.appointments || []);
  } catch (error) { console.error(error); } finally { loading.value = false; }
});

const confirmCancel = (appt) => {
  $q.dialog({
    title: '<span class="text-white">Cancel Appointment</span>',
    message: `<span class="text-grey-4">Are you sure you want to cancel appointment ${appt._id || appt.id}?</span>`,
    html: true,
    class: 'bg-slate-900 border-dark',
    cancel: { label: 'Keep', color: 'grey-4', flat: true },
    ok: { label: 'Yes, Cancel', color: 'red-5', unelevated: true }
  }).onOk(async () => {
    try {
      $q.loading.show();
      await cancelAppointment(appt._id || appt.id);
      const idx = appointments.value.findIndex(a => (a._id || a.id) === (appt._id || appt.id));
      if (idx !== -1) appointments.value[idx].status = 'Cancelled';
      $q.notify({ type: 'positive', message: 'Cancelled via server.' });
    } catch { $q.notify({ type: 'negative', message: 'Server cancel failed.' }); } finally { $q.loading.hide(); }
  });
};

const downloadReceipt = (orderId) => {
  router.push(`/receipt/${orderId}`);
  setTimeout(() => window.print(), 1000);
};
</script>

<style scoped>
.search-page-bg { background: radial-gradient(circle at top right, #0a1128 0%, #030612 100%); min-height: 100vh; }
.max-width-1000 { max-width: 1000px; width: 100%; }
.bg-transparent { background: rgba(15, 23, 42, 0.4) !important; }
.appt-card { border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; transition: transform 0.2s; }
.appt-card:hover { transform: translateY(-2px); border-color: rgba(59, 130, 246, 0.4); }
.border-right-dark { border-right: 1px solid rgba(255, 255, 255, 0.1); }
.status-chip { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
.border-dark { border: 1px solid rgba(255, 255, 255, 0.08); }
.bg-slate-900 { background: #0f172a; }
.book-btn { background: #2563eb !important; }
.pb-12 { padding-bottom: 3rem; }
@media (max-width: 768px) {
  .mobile-hide { display: none; }
  .appt-card { flex-direction: column; align-items: flex-start; }
  .appt-card > div { width: 100%; padding-left: 0; margin-bottom: 12px; }
}
</style>