<template>
  <q-page padding style="background: #f5f6fa;">
    <div class="text-h5 text-weight-bold text-dark q-mb-lg">My Schedule</div>

    <div v-if="loading" class="flex flex-center" style="min-height: 40vh;">
      <q-spinner-puff color="primary" size="50px" />
    </div>

    <div v-else-if="appointments.length === 0"
      class="q-pa-xl flex flex-center column" style="min-height: 40vh;">
      <q-icon name="event_busy" size="64px" color="grey-4" class="q-mb-md" />
      <div class="text-grey-5 text-h6">No scheduled appointments.</div>
    </div>

    <div v-else class="column q-gutter-y-sm">
      <q-card v-for="apt in appointments" :key="apt._id"
        flat bordered style="border-radius: 10px;"
        :style="cardBorder(apt.status)">
        <q-card-section class="row items-center no-wrap">

          <!-- Avatar -->
          <q-avatar size="44px" style="background: #edf2f7;" class="q-mr-md flex-shrink-0">
            <span class="text-primary text-weight-bold">{{ getInitials(apt.patientName) }}</span>
          </q-avatar>

          <!-- Info -->
          <div class="col">
            <div class="text-weight-bold text-dark" style="font-size: 15px;">
              {{ apt.patientName || 'Patient' }}
            </div>
            <div class="text-grey-6" style="font-size: 12px;">
              {{ apt.date }} · {{ apt.time }} · {{ apt.appointmentType }}
            </div>
            <div class="text-caption text-blue-6">Queue #{{ apt.queueNumber }}</div>
            <div v-if="apt.rejectionReason" class="text-caption text-red-5">
              Reason: {{ apt.rejectionReason }}
            </div>
          </div>

          <!-- Status badge -->
          <q-badge :color="statusBadgeColor(apt.status)"
            :label="apt.status" class="text-capitalize q-mr-md" />

          <!-- Action buttons -->
          <div class="row q-gutter-xs flex-shrink-0">
            <!-- PENDING: confirm or reject -->
            <template v-if="apt.status === 'PENDING'">
              <q-btn unelevated dense size="sm" color="positive"
                icon="check_circle" label="Confirm"
                :loading="actionId === apt._id + '_confirm'"
                @click="confirmAppointment(apt)" />
              <q-btn flat dense size="sm" color="negative"
                icon="cancel" label="Reject"
                :loading="actionId === apt._id + '_reject'"
                @click="openRejectDialog(apt)" />
            </template>

            <!-- CONFIRMED: mark complete -->
            <q-btn v-if="apt.status === 'CONFIRMED'"
              unelevated dense size="sm" color="teal"
              icon="done_all" label="Mark Complete"
              :loading="actionId === apt._id + '_complete'"
              @click="markComplete(apt)" />
          </div>

        </q-card-section>
      </q-card>
    </div>

    <!-- Reject Dialog -->
    <q-dialog v-model="rejectDlg.show" persistent>
      <q-card style="min-width: 360px; border-radius: 14px;" class="q-pa-md">
        <q-card-section>
          <div class="text-h6 text-weight-bold">Reject Appointment</div>
          <div class="text-grey-6 text-caption q-mt-xs">
            Patient: {{ rejectDlg.appointment?.patientName }}
          </div>
        </q-card-section>
        <q-card-section>
          <q-input v-model="rejectDlg.reason" type="textarea" rows="3"
            label="Reason for rejection" outlined
            :rules="[val => !!val || 'Reason is required']" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey" v-close-popup />
          <q-btn unelevated label="Confirm Reject" color="negative"
            :loading="rejectDlg.loading"
            :disable="!rejectDlg.reason"
            @click="submitReject" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useQuasar } from 'quasar';
import axios from 'axios';

defineProps({ doctor: Object });

const $q = useQuasar();
const appointments = ref([]);
const loading = ref(true);
const actionId = ref('');

const rejectDlg = reactive({
  show: false,
  appointment: null,
  reason: '',
  loading: false
});

const getToken = () =>
  localStorage.getItem('token') || localStorage.getItem('nexus_token');

const parseJwt = (t) => {
  try { return JSON.parse(atob(t.split('.')[1])); } catch { return null; }
};

const getInitials = (n) =>
  n ? n.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : '?';

const cardBorder = (status) => {
  const colors = {
    PENDING: '#f59e0b',
    CONFIRMED: '#3b82f6',
    COMPLETED: '#9ca3af',
    CANCELLED: '#ef4444'
  };
  return `border-left: 4px solid ${colors[status] || '#e5e7eb'}`;
};

const statusBadgeColor = (s) => ({
  PENDING: 'orange',
  CONFIRMED: 'positive',
  COMPLETED: 'grey',
  CANCELLED: 'negative',
  VERIFIED: 'blue'
}[s] || 'grey');

const confirmAppointment = async (apt) => {
  actionId.value = apt._id + '_confirm';
  try {
    await axios.put(
      `http://localhost:5003/api/appointments/doctor/confirm/${apt._id}`,
      {},
      { headers: { Authorization: `Bearer ${getToken()}` } }
    );
    apt.status = 'CONFIRMED';
    $q.notify({ type: 'positive', message: 'Appointment confirmed! Patient will be notified to pay.' });
  } catch (err) {
    $q.notify({ type: 'negative', message: err.response?.data?.error || 'Failed to confirm' });
  } finally {
    actionId.value = '';
  }
};

const openRejectDialog = (apt) => {
  rejectDlg.appointment = apt;
  rejectDlg.reason = '';
  rejectDlg.show = true;
};

const submitReject = async () => {
  if (!rejectDlg.reason.trim()) return;
  rejectDlg.loading = true;
  actionId.value = rejectDlg.appointment._id + '_reject';
  try {
    await axios.put(
      `http://localhost:5003/api/appointments/doctor/reject/${rejectDlg.appointment._id}`,
      { reason: rejectDlg.reason },
      { headers: { Authorization: `Bearer ${getToken()}` } }
    );
    rejectDlg.appointment.status = 'CANCELLED';
    rejectDlg.appointment.rejectionReason = rejectDlg.reason;
    rejectDlg.show = false;
    $q.notify({ type: 'positive', message: 'Appointment rejected.' });
  } catch (err) {
    $q.notify({ type: 'negative', message: err.response?.data?.error || 'Failed to reject' });
  } finally {
    rejectDlg.loading = false;
    actionId.value = '';
  }
};

const markComplete = async (apt) => {
  actionId.value = apt._id + '_complete';
  try {
    await axios.put(
      `http://localhost:5003/api/appointments/doctor/complete/${apt._id}`,
      {},
      { headers: { Authorization: `Bearer ${getToken()}` } }
    );
    apt.status = 'COMPLETED';
    $q.notify({ type: 'positive', message: 'Marked as completed!' });
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to update' });
  } finally {
    actionId.value = '';
  }
};

onMounted(async () => {
  const token = getToken();
  const decoded = token ? parseJwt(token) : null;
  const doctorId = decoded?.roleId;
  if (doctorId) {
    try {
      const { data } = await axios.get(
        `http://localhost:5003/api/appointments/doctor/${doctorId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      appointments.value = Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("Failed to fetch appointments", err);
    }
  }
  loading.value = false;
});
</script>