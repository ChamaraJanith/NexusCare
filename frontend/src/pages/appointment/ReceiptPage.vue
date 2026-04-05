<template>
  <q-page class="search-page-bg text-white font-jakarta flex flex-center">
    <div class="max-width-700 w-full q-mx-auto q-px-md">
      
      <q-card class="nexus-receipt-card bg-transparent q-pa-lg">
        <q-btn flat icon="close" color="grey-5" class="absolute-top-right q-ma-sm" @click="resetAndGoHome"/>

        <q-card-section class="text-center">
          <div class="success-icon-container q-mx-auto q-mb-md flex flex-center">
            <q-icon name="check" size="40px" color="white" />
          </div>
          <h2 class="text-h4 text-weight-bolder tracking-tight q-mb-xs text-white q-mt-none">Appointment Confirmed!</h2>
          <p class="text-grey-4 text-subtitle1">Your booking was successfully secured.</p>
        </q-card-section>

        <q-separator dark class="q-my-md opacity-20 mx-xl" />

        <q-card-section class="q-px-xl q-pt-none text-left">
          <div class="row q-col-gutter-lg">
            <div class="col-12 col-md-6">
              <div class="text-caption text-grey-5 text-uppercase text-weight-bold tracking-wider q-mb-xs">Order ID</div>
              <div class="text-caption text-blue-4" style="word-break: break-all;">
                {{ route.params.orderId }}
              </div>
            </div>
            <div class="col-12 col-md-6">
              <div class="text-caption text-grey-5 text-uppercase text-weight-bold tracking-wider q-mb-xs">Date & Time</div>
              <div class="text-subtitle1 text-white text-weight-medium">{{ date }} at {{ time }}</div>
            </div>
          </div>

          <div class="q-mt-md">
            <div class="text-caption text-grey-5 text-uppercase text-weight-bold tracking-wider q-mb-xs">Doctor Details</div>
            <div class="text-weight-bold text-white text-subtitle1">{{ doctorName }}</div>
          </div>

          <div class="q-mt-lg">
            <div class="text-caption text-grey-5 text-uppercase text-weight-bold tracking-wider q-mb-xs">Patient Details</div>
            <div class="text-white text-weight-medium">
              {{ patientName }}
            </div>
          </div>

          <div class="q-mt-md">
            <div class="text-caption text-grey-5 text-uppercase text-weight-bold tracking-wider q-mb-xs">Queue Number</div>
            <div class="text-white text-h6 text-blue-4">{{ queueNumber }}</div>
          </div>

          <div class="q-mt-lg q-pa-md bg-slate-900 rounded-borders flex justify-between items-center border-dark">
            <span class="text-grey-4 text-weight-medium">Payment Status</span>
            <span class="text-green-4 text-weight-bold flex items-center">
              <q-icon name="check_circle" class="q-mr-xs"/> PAID (LKR {{ amount }})
            </span>
          </div>
        </q-card-section>

        <q-card-actions class="q-px-xl q-pb-xl flex-center q-gutter-md q-pt-lg">
          <q-btn outline rounded color="blue-4" class="action-btn q-px-lg font-jakarta text-weight-bold" @click="downloadReceipt">
            <q-icon name="picture_as_pdf" size="xs" class="q-mr-sm" /> Download PDF
          </q-btn>
          <q-btn unelevated rounded color="primary" class="action-btn-primary q-px-lg font-jakarta text-weight-bold" @click="router.push('/patient/dashboard')">
            Back to Dashboard <q-icon name="arrow_forward" size="xs" class="q-ml-sm" />
          </q-btn>
        </q-card-actions>
      </q-card>

    </div>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

const doctorName = ref('')
const amount = ref(0)
const queueNumber = ref('N/A')
const date = ref('-')
const time = ref('-')
const patientName = ref('')

onMounted(async () => {
  try {
    const orderId = route.params.orderId

    const paymentRes = await axios.get(`http://localhost:5005/api/payments/${orderId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    })

    const payment = paymentRes.data.data || paymentRes.data

    const patientId = localStorage.getItem("patientId")

    const apptRes = await axios.get(`http://localhost:5003/api/appointments/patient/${patientId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    })

    const appointments = Array.isArray(apptRes.data)
      ? apptRes.data
      : apptRes.data.data || []

    const matched = appointments.find(
      a => a._id === payment.appointmentId || a.appointmentId === payment.appointmentId
    )

    // ✅ API success values
    doctorName.value = payment?.doctorName || localStorage.getItem("doctorName") || "Unknown Doctor"
    amount.value = payment?.amount || localStorage.getItem("amount") || 0
    queueNumber.value = matched?.queueNumber || localStorage.getItem("queueNumber") || "N/A"
    date.value = matched?.date || localStorage.getItem("date") || "-"
    time.value = matched?.time || localStorage.getItem("time") || "-"
    patientName.value = localStorage.getItem("patientName") || "Patient"

  } catch (err) {
    console.error("API failed, using fallback:", err)

    // ✅ FALLBACK (IMPORTANT 🔥)
    doctorName.value = localStorage.getItem("doctorName") || "Unknown Doctor"
    amount.value = localStorage.getItem("amount") || 0
    date.value = localStorage.getItem("date") || "-"
    time.value = localStorage.getItem("time") || "-"
    queueNumber.value = localStorage.getItem("queueNumber") || "N/A"
  }
})

const resetAndGoHome = () => {
  localStorage.removeItem("doctorName")
  localStorage.removeItem("amount")
  localStorage.removeItem("date")
  localStorage.removeItem("time")
  localStorage.removeItem("queueNumber")

  router.push('/patient/dashboard')
}

const downloadReceipt = () => {
  window.print();
};
</script>

<style scoped>
.search-page-bg { background: radial-gradient(circle at top right, #0a1128 0%, #030612 100%); min-height: 100vh; }
.max-width-700 { max-width: 700px; }
.nexus-receipt-card { 
  border: 1px solid rgba(30, 58, 138, 0.4); 
  border-radius: 16px; 
  background: rgba(15, 23, 42, 0.6) !important; 
  position: relative; 
  overflow: hidden; 
}
.nexus-receipt-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 6px; background: #2563eb; }
.success-icon-container { width: 70px; height: 70px; border-radius: 50%; background: #2563eb; box-shadow: 0 0 30px rgba(37, 99, 235, 0.4); border: 2px solid #0f172a; }
.opacity-20 { opacity: 0.2; }
.mx-xl { margin-left: 48px; margin-right: 48px; }
.w-full { width: 100%; }
.action-btn { border: 1px solid rgba(96, 165, 250, 0.4); }
.action-btn-primary { background: #2563eb !important; transition: background 0.2s; }
.action-btn-primary:hover { background: #1d4ed8 !important; }
.bg-slate-900 { background: #0f172a; }
.border-dark { border: 1px solid rgba(255, 255, 255, 0.05); }

@media print {
  .search-page-bg { background: white !important; color: black !important; }
  .nexus-receipt-card { border: none !important; box-shadow: none !important; }
  .action-btn, .action-btn-primary, .absolute-top-right { display: none !important; }
}
</style>