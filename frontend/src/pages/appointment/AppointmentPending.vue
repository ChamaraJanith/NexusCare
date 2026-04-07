<template>
  <q-page class="search-page-bg text-white font-jakarta flex flex-center q-pt-xl">
    <div class="max-width-600 w-full q-px-md">
      <q-card class="nexus-card q-pa-xl text-center">

        <div class="pending-icon-wrap q-mx-auto q-mb-lg flex flex-center">
          <q-icon name="pending_actions" size="48px" color="amber-4" />
        </div>

        <h2 class="text-h5 text-weight-bolder text-white q-mb-sm q-mt-none">
          Appointment Requested!
        </h2>
        <p class="text-grey-4 q-mb-xl">
          Your request has been sent to
          <strong class="text-blue-4">Dr. {{ route.query.doctorName }}</strong>.
          You will be notified once the doctor confirms.
        </p>

        <div class="detail-box q-pa-lg q-mb-lg text-left">
          <div class="flex justify-between q-mb-sm">
            <span class="text-grey-5 text-caption">Appointment ID</span>
            <span class="text-blue-4 text-caption" style="font-family:monospace; word-break:break-all;">
              {{ route.query.appointmentId }}
            </span>
          </div>
          <div class="flex justify-between q-mb-sm">
            <span class="text-grey-5 text-caption">Date</span>
            <span class="text-white text-caption">{{ route.query.date }}</span>
          </div>
          <div class="flex justify-between q-mb-sm">
            <span class="text-grey-5 text-caption">Time</span>
            <span class="text-white text-caption">{{ route.query.time }}</span>
          </div>
          <div class="flex justify-between q-mb-sm">
            <span class="text-grey-5 text-caption">Queue Number</span>
            <span class="text-blue-4 text-caption text-weight-bold">
              #{{ route.query.queueNumber }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-grey-5 text-caption">Status</span>
            <q-badge color="orange-9" label="PENDING DOCTOR CONFIRMATION" class="text-caption" />
          </div>
        </div>

        <div class="info-note q-pa-sm q-mb-xl">
          <q-icon name="info" color="blue-4" size="xs" class="q-mr-sm" />
          <span class="text-caption text-grey-4">
            Payment is only required after the doctor confirms your appointment.
            No charges have been made yet.
          </span>
        </div>

        <div class="column q-gutter-sm">
          <q-btn
            unelevated rounded color="primary"
            label="View My Appointments"
            class="full-width text-weight-bold"
            @click="router.push('/patient/appointments')"
          />
          <q-btn
            flat rounded color="grey-5"
            label="Back to Home"
            class="full-width"
            @click="router.push('/patient/dashboard')"
          />
        </div>

      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
const route = useRoute();
const router = useRouter();
</script>

<style scoped>
.search-page-bg {
  background: radial-gradient(circle at top right, #0a1128 0%, #030612 100%);
  min-height: 100vh;
}
.max-width-600 { max-width: 600px; width: 100%; }
.nexus-card {
  border: 1px solid rgba(30,58,138,0.4);
  border-radius: 16px;
  background: rgba(15,23,42,0.6) !important;
}
.pending-icon-wrap {
  width: 80px; height: 80px;
  border-radius: 50%;
  background: rgba(245,158,11,0.1);
  border: 2px solid rgba(245,158,11,0.3);
}
.detail-box {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
}
.info-note {
  background: rgba(59,130,246,0.08);
  border: 1px solid rgba(59,130,246,0.2);
  border-radius: 10px;
  display: flex;
  align-items: flex-start;
  text-align: left;
}
</style>