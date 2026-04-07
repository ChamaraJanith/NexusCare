<template>
  <q-page class="search-page-bg text-white font-jakarta">
    <div class="max-width-1000 q-mx-auto q-pt-xl q-px-md">

      <div class="flex items-center justify-between q-mb-xl">
        <h1 class="text-h3 text-weight-bolder tracking-tight q-ma-none text-white">
          My Appointments
        </h1>
        <q-btn unelevated rounded color="primary"
          class="font-jakarta text-weight-bold book-btn"
          @click="router.push('/search')">
          <q-icon name="add" size="xs" class="q-mr-sm" /> Book New
        </q-btn>
      </div>

      <div v-if="loading" class="flex flex-center q-py-xl column">
        <q-spinner-dots color="blue-5" size="4em" />
        <div class="q-mt-md text-grey-4 text-weight-bold">Loading appointments...</div>
      </div>

      <div v-else-if="appointments.length === 0"
        class="text-center q-py-xl border-dark q-px-md rounded-borders">
        <q-icon name="event_busy" size="64px" color="grey-7" class="q-mb-md" />
        <div class="text-h5 text-weight-bold text-grey-3 q-mb-sm">No Appointments Yet</div>
        <q-btn unelevated color="primary" label="Book Now"
          class="q-mt-md rounded book-btn font-jakarta text-weight-bold"
          @click="router.push('/search')" />
      </div>

      <div v-else class="column q-gutter-md pb-12">
        <q-card v-for="appt in appointments" :key="appt._id"
          class="appt-card bg-transparent row items-center no-wrap q-pa-md shadow-none">

          <!-- Date/Time -->
          <div class="col-12 col-md-3 q-pr-md border-right-dark mobile-hide flex column justify-center">
            <div class="text-h6 text-weight-bold text-blue-4">{{ appt.date }}</div>
            <div class="text-subtitle1 text-grey-4 flex items-center">
              <q-icon name="schedule" size="xs" class="q-mr-xs" /> {{ appt.time }}
            </div>
            <div class="text-caption text-grey-6">Queue #{{ appt.queueNumber || '-' }}</div>
          </div>

          <!-- Info -->
          <div class="col-12 col-md-4 q-pl-md">
            <div class="text-subtitle1 text-weight-bold text-white">
              {{ appt.patientName || 'Your Appointment' }}
            </div>
            <div class="text-caption text-grey-5">ID: {{ appt._id }}</div>
            <div class="text-caption text-blue-4">{{ appt.appointmentType }}</div>
            <div class="text-caption"
              :class="appt.paymentStatus === 'PAID' ? 'text-green-4' : 'text-orange-4'">
              Payment: {{ appt.paymentStatus || 'PENDING' }}
            </div>
          </div>

          <!-- Status -->
          <div class="col-12 col-md-2 flex flex-center">
            <q-chip dense
              :color="statusChipColor(appt.status)"
              text-color="white"
              class="status-chip shadow-none">
              {{ appt.status || 'PENDING' }}
            </q-chip>
          </div>

          <!-- Actions -->
          <div class="col-12 col-md-3 flex justify-end items-center q-gutter-x-sm flex-wrap">

            <!-- PENDING: waiting for doctor -->
            <div v-if="appt.status === 'PENDING'" class="flex items-center q-gutter-x-sm">
              <q-chip dense color="orange-10" text-color="orange-3"
                icon="hourglass_empty" label="Awaiting Doctor" class="text-caption" />
              <q-btn flat round dense icon="cancel" color="red-4"
                @click="confirmCancel(appt)">
                <q-tooltip>Cancel Request</q-tooltip>
              </q-btn>
            </div>

            <!-- CONFIRMED: show Pay Now -->
            <div v-else-if="appt.status === 'CONFIRMED' && appt.paymentStatus !== 'PAID'"
              class="flex items-center q-gutter-x-sm">
              <q-btn unelevated dense color="green-7"
                icon="payment" label="Pay Now"
                @click="goToPayment(appt)" />
            </div>

            <!-- PAID: show receipt -->
            <div v-else-if="appt.paymentStatus === 'PAID'" class="flex items-center q-gutter-x-sm">
              <q-btn outline dense color="blue-4" label="View Receipt"
                @click="router.push(`/receipt/${appt.orderId || appt._id}`)" />
            </div>

            <!-- CANCELLED -->
            <q-chip v-else-if="appt.status === 'CANCELLED'"
              dense color="red-10" text-color="red-3"
              icon="cancel" label="Cancelled / Rejected" class="text-caption" />

            <!-- COMPLETED -->
            <q-chip v-else-if="appt.status === 'COMPLETED'"
              dense color="grey-9" text-color="grey-4"
              icon="done_all" label="Completed" class="text-caption" />
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
import axios from 'axios';

const router = useRouter();
const $q = useQuasar();

const appointments = ref([]);
const loading = ref(true);

const getToken = () =>
  localStorage.getItem('nexus_token') || localStorage.getItem('token');

const statusChipColor = (s) => ({
  PENDING: 'orange-9',
  CONFIRMED: 'blue-9',
  COMPLETED: 'grey-9',
  CANCELLED: 'red-9',
  VERIFIED: 'teal-9'
}[s] || 'grey-9');

onMounted(async () => {
  try {
    const user = JSON.parse(localStorage.getItem('nexus_user') || '{}');
    const patientId = user.roleId;
    if (!patientId) { loading.value = false; return; }

    const { data } = await axios.get(
      `http://localhost:5003/api/appointments/patient/${patientId}`,
      { headers: { Authorization: `Bearer ${getToken()}` } }
    );
    appointments.value = Array.isArray(data) ? data : (data.appointments || []);
  } catch (error) {
    console.error(error);
    $q.notify({ type: 'negative', message: 'Failed to load appointments' });
  } finally {
    loading.value = false;
  }
});

// Go to payment with real appointment data
const goToPayment = (appt) => {
  localStorage.setItem("doctorName", appt.doctorId || "");
  localStorage.setItem("amount", appt.charges?.total || 0);
  localStorage.setItem("date", appt.date || "");
  localStorage.setItem("time", appt.time || "");
  localStorage.setItem("queueNumber", appt.queueNumber || "-");
  localStorage.setItem("appointmentId", appt._id || "");

  router.push({
    path: '/appointment/payment',
    query: {
      doctorId: appt.doctorId,
      doctorName: localStorage.getItem('doctorName') || appt.doctorId,
      doctorFee: appt.charges?.doctorFee || 0,
      hospitalFee: appt.charges?.hospitalFee || 0,
      serviceFee: appt.charges?.serviceFee || 0,
      date: appt.date,
      time: appt.time,
      type: appt.appointmentType,
      appointmentId: appt._id
    }
  });
};

const confirmCancel = (appt) => {
  $q.dialog({
    title: 'Cancel Appointment',
    message: 'Are you sure you want to cancel this appointment request?',
    cancel: { label: 'Keep', color: 'grey-4', flat: true },
    ok: { label: 'Yes, Cancel', color: 'red-5', unelevated: true }
  }).onOk(async () => {
    try {
      $q.loading.show();
      await axios.delete(
        `http://localhost:5003/api/appointments/${appt._id}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      const idx = appointments.value.findIndex(a => a._id === appt._id);
      if (idx !== -1) appointments.value[idx].status = 'CANCELLED';
      $q.notify({ type: 'positive', message: 'Appointment cancelled.' });
    } catch {
      $q.notify({ type: 'negative', message: 'Cancel failed.' });
    } finally {
      $q.loading.hide();
    }
  });
};
</script>

<style scoped>
.search-page-bg {
  background: radial-gradient(circle at top right, #0a1128 0%, #030612 100%);
  min-height: 100vh;
}
.max-width-1000 { max-width: 1000px; width: 100%; }
.appt-card {
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  transition: transform 0.2s;
}
.appt-card:hover {
  transform: translateY(-2px);
  border-color: rgba(59,130,246,0.4);
}
.border-right-dark { border-right: 1px solid rgba(255,255,255,0.1); }
.status-chip { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
.border-dark { border: 1px solid rgba(255,255,255,0.08); }
.book-btn { background: #2563eb !important; }
.pb-12 { padding-bottom: 3rem; }
@media (max-width: 768px) {
  .mobile-hide { display: none; }
}
</style>