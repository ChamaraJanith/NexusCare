<template>
  <q-page class="payment-page-bg q-pa-lg">

    <div class="row items-center justify-between q-mb-xl">
      <div>
        <div class="font-sora text-blue-6 text-caption uppercase letter-spacing-2 q-mb-xs">
          ◈ SECURE PAYMENT TERMINAL
        </div>
        <h1 class="text-h5 text-white font-sora q-ma-none">
          Consultation <span class="text-blue-4">Payment</span>
        </h1>
      </div>
      <q-btn flat round icon="arrow_back" color="grey-5" @click="$router.back()">
        <q-tooltip class="font-sora bg-dark">Go back</q-tooltip>
      </q-btn>
    </div>

    <!-- SUCCESS BANNER -->
    <div v-if="returnStatus === 'success'" class="success-banner q-pa-lg q-mb-xl row items-center">
      <q-icon name="check_circle" color="green-4" size="2rem" class="q-mr-md" />
      <div>
        <div class="font-sora text-green-4 text-weight-bold" style="letter-spacing:1px">PAYMENT SUCCESSFUL</div>
        <div class="text-grey-5 text-caption">Your consultation payment has been confirmed.</div>
      </div>
    </div>

    <!-- CANCEL BANNER -->
    <div v-if="returnStatus === 'cancel'" class="cancel-banner q-pa-lg q-mb-xl row items-center">
      <q-icon name="cancel" color="orange-4" size="2rem" class="q-mr-md" />
      <div>
        <div class="font-sora text-orange-4 text-weight-bold" style="letter-spacing:1px">PAYMENT CANCELLED</div>
        <div class="text-grey-5 text-caption">Your payment was not completed.</div>
      </div>
    </div>

    <!-- PAYMENT HISTORY -->
    <div class="nexus-panel q-pa-xl q-mb-xl">
      <div class="panel-header q-mb-xl">
        <q-icon name="receipt_long" color="blue-4" size="1.4rem" class="q-mr-sm" />
        <span class="font-sora text-white uppercase" style="letter-spacing:1.5px;font-size:0.9rem">Payment History</span>
        <q-space />
        <q-chip dark color="grey-9" class="font-sora text-caption">{{ payments.length }} RECORDS</q-chip>
      </div>

      <div v-if="loadingPayments" class="q-gutter-y-sm">
        <q-skeleton v-for="i in 4" :key="i" type="rect" dark height="72px" class="rounded-borders" />
      </div>

      <div v-else-if="payments.length === 0" class="empty-state q-pa-xl">
        <q-icon name="payments" size="4rem" color="grey-9" />
        <div class="font-sora text-grey-7 q-mt-md" style="letter-spacing:2px">NO PAYMENT RECORDS</div>
        <div class="text-grey-9 text-caption q-mt-xs">Payment history will appear here after a consultation booking</div>
      </div>

      <div v-else class="q-gutter-y-sm">
        <div v-for="p in payments" :key="p._id" class="payment-row q-pa-md row items-center">
          <div class="col-auto q-mr-md">
            <div class="status-icon-wrap" :class="`status-${p.status}`">
              <q-icon :name="statusIcon(p.status)" size="1.4rem" :color="statusColor(p.status)" />
            </div>
          </div>
          <div class="col-12 col-md-4">
            <div class="text-white font-sora text-subtitle2">Dr. {{ p.doctorName || 'Doctor' }}</div>
            <div class="text-grey-7 text-caption font-sora" style="font-size:0.62rem;letter-spacing:1px">{{ p.orderId }}</div>
          </div>
          <div class="col-12 col-md-2 q-mt-xs q-mt-md-none">
            <div class="amount-display font-sora" :class="`text-${statusColor(p.status)}`">
              LKR {{ formatAmount(p.amount) }}
            </div>
          </div>
          <div class="col-auto q-mx-md">
            <q-badge :color="statusBadgeColor(p.status)" class="font-sora q-pa-xs" style="font-size:0.55rem;letter-spacing:1.5px">
              {{ p.status.toUpperCase() }}
            </q-badge>
          </div>
          <div class="col text-grey-7 text-caption font-sora" style="font-size:0.6rem">
            {{ formatDate(p.createdAt) }}
          </div>
          <div class="col-auto">
            <q-btn flat round dense size="sm" icon="info_outline" color="blue-5" @click="openDetail(p)">
              <q-tooltip class="font-sora bg-dark">View details</q-tooltip>
            </q-btn>
          </div>
        </div>
      </div>
    </div>

    <!-- INITIATE NEW PAYMENT -->
    <div v-if="appointmentContext" class="nexus-panel q-pa-xl">
      <div class="panel-header q-mb-xl">
        <q-icon name="credit_card" color="blue-4" size="1.4rem" class="q-mr-sm" />
        <span class="font-sora text-white uppercase" style="letter-spacing:1.5px;font-size:0.9rem">Complete Payment</span>
      </div>

      <div class="appointment-summary q-pa-lg q-mb-xl">
        <div class="row q-gutter-md items-center">
          <div class="col-auto">
            <div class="doc-icon-wrap">
              <q-icon name="medical_services" color="blue-4" size="2rem" />
            </div>
          </div>
          <div class="col">
            <div class="text-white font-sora text-subtitle1">{{ appointmentContext.doctorName }}</div>
            <div class="text-blue-6 text-caption font-sora">{{ appointmentContext.specialty }}</div>
            <div class="text-grey-6 text-caption q-mt-xs">{{ appointmentContext.date }} · {{ appointmentContext.time }}</div>
          </div>
          <div class="col-auto text-right">
            <div class="text-caption text-grey-6 font-sora" style="letter-spacing:1px">CONSULTATION FEE</div>
            <div class="text-h5 text-white font-sora q-mt-xs">LKR {{ formatAmount(appointmentContext.fee) }}</div>
          </div>
        </div>
      </div>

      <div class="payhere-info q-pa-md q-mb-xl row items-start">
        <q-icon name="shield" color="blue-4" size="1.2rem" class="q-mr-sm q-mt-xs" />
        <div>
          <div class="font-sora text-blue-4 text-caption text-weight-bold q-mb-xs" style="letter-spacing:1px">
            SECURE PAYMENT VIA PAYHERE
          </div>
          <div class="text-grey-5 text-caption">
            You will be redirected to PayHere's secure checkout. Supports Visa, Mastercard, and local bank cards.
            Test card: <span class="text-blue-4 font-sora">4916217501611292</span>
          </div>
        </div>
      </div>

      <div class="row justify-center">
        <q-btn
          class="pay-btn font-sora"
          icon="lock"
          label="PAY NOW — SECURE CHECKOUT"
          :loading="initiatingPayment"
          @click="doInitiatePayment"
          style="min-width:320px"
        />
      </div>
    </div>

    <!-- PAYMENT DETAIL DIALOG -->
    <q-dialog v-model="detailDlg.show">
      <q-card class="dialog-card q-pa-xl" style="min-width:400px;max-width:480px">
        <div class="card-accent-bar q-mb-lg"></div>
        <div class="font-sora text-white uppercase q-mb-lg" style="font-size:0.9rem;letter-spacing:2px">Payment Details</div>
        <div v-if="detailDlg.payment" class="q-gutter-y-sm">
          <div class="detail-row">
            <span class="detail-label">ORDER ID</span>
            <span class="detail-value font-sora text-blue-4">{{ detailDlg.payment.orderId }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">DOCTOR</span>
            <span class="detail-value">Dr. {{ detailDlg.payment.doctorName || '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">AMOUNT</span>
            <span class="detail-value text-white font-sora">LKR {{ formatAmount(detailDlg.payment.amount) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">STATUS</span>
            <q-badge :color="statusBadgeColor(detailDlg.payment.status)" class="font-sora" style="font-size:0.6rem;letter-spacing:1.5px">
              {{ detailDlg.payment.status.toUpperCase() }}
            </q-badge>
          </div>
          <div v-if="detailDlg.payment.payherePaymentId" class="detail-row">
            <span class="detail-label">PAYHERE ID</span>
            <span class="detail-value text-grey-5">{{ detailDlg.payment.payherePaymentId }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">DATE</span>
            <span class="detail-value">{{ formatDate(detailDlg.payment.createdAt) }}</span>
          </div>
        </div>
        <div class="row justify-end q-mt-xl">
          <q-btn flat label="CLOSE" color="grey-5" class="font-sora" v-close-popup />
        </div>
      </q-card>
    </q-dialog>

    <!-- Hidden PayHere form — submitted programmatically -->
    <form ref="payhereForm" method="POST" action="https://sandbox.payhere.lk/pay/checkout" style="display:none">
      <input v-for="(val, key) in checkoutData" :key="key" type="hidden" :name="key" :value="val" />
    </form>

  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import axios from 'axios'

const route  = useRoute()
const router = useRouter()
const $q     = useQuasar()

const token      = localStorage.getItem('nexus_token')
const storedUser = JSON.parse(localStorage.getItem('nexus_user') || '{}')

const payments          = ref([])
const loadingPayments   = ref(false)
const initiatingPayment = ref(false)
const returnStatus      = ref(null)
const checkoutData      = ref({})
const payhereForm       = ref(null)
const detailDlg         = reactive({ show: false, payment: null })

const ms1Api = axios.create({
  baseURL: 'http://localhost:5001',
  headers: { Authorization: `Bearer ${token}` },
})
const paymentApi = axios.create({
  baseURL: 'http://localhost:5005',
  headers: { Authorization: `Bearer ${token}` },
})

// ── Appointment context ────────────────────────────────────────────────────
const appointmentContext = computed(() => {
  const q = route.query
  if (!q.doctorId || q.status) return null
  return {
    doctorId:      q.doctorId,
    doctorName:    q.doctorName || 'Doctor',
    specialty:     q.specialty  || '',
    fee:           parseFloat(q.fee) || 0,
    date:          q.date || '',
    time:          q.time || '',
    appointmentId: q.appointmentId || '',
  }
})

// ── Helpers ────────────────────────────────────────────────────────────────
const formatAmount = (amt) =>
  parseFloat(amt || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

const statusIcon       = (s) => ({ success: 'check_circle', pending: 'hourglass_empty', failed: 'cancel', cancelled: 'do_not_disturb', chargedback: 'warning' }[s] || 'help')
const statusColor      = (s) => ({ success: 'green-4', pending: 'amber-4', failed: 'red-4', cancelled: 'grey-5', chargedback: 'orange-4' }[s] || 'grey-5')
const statusBadgeColor = (s) => ({ success: 'green-9', pending: 'amber-9', failed: 'red-9', cancelled: 'grey-8', chargedback: 'orange-9' }[s] || 'grey-8')

// ── Load payments ──────────────────────────────────────────────────────────
const loadPayments = async () => {
  loadingPayments.value = true
  try {
    const { data } = await paymentApi.get('/api/payments/my')
    payments.value = data.data
  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'Failed to load payment history', position: 'top-right' })
  } finally {
    loadingPayments.value = false
  }
}

// ── Handle PayHere return_url redirect ─────────────────────────────────────
// PayHere redirects here after payment:
//   Success → /payment?status=success&order_id=PAY-xxx
//   Cancel  → /payment?status=cancel&order_id=PAY-xxx
const handleReturn = async () => {
  const status  = route.query.status
  const orderId = route.query.order_id

  if (!status) return
  returnStatus.value = status

  if (status === 'success' && orderId) {
    try {
      await paymentApi.post('/api/payments/confirm', { orderId })
      $q.notify({
        icon: 'check_circle',
        color: 'green-9',
        message: 'Payment confirmed! 🎉',
        position: 'top-right',
        timeout: 4000,
      })
    } catch (err) {
      console.error('Confirm error:', err)
    }
  } else if (status === 'cancel') {
    $q.notify({
      icon: 'cancel',
      color: 'orange-9',
      message: 'Payment was cancelled.',
      position: 'top-right',
    })
  }

  await loadPayments()
}

// ── Initiate payment ───────────────────────────────────────────────────────
const doInitiatePayment = async () => {
  if (!appointmentContext.value) return
  initiatingPayment.value = true

  try {
    const { data: profileData } = await ms1Api.get('/api/patient/profile')
    const profile = profileData.data

    const { data } = await paymentApi.post('/api/payments/initiate', {
      appointmentId: appointmentContext.value.appointmentId,
      doctorId:      appointmentContext.value.doctorId,
      doctorName:    appointmentContext.value.doctorName,
      amount:        appointmentContext.value.fee,
      patientName:   profile.name,
      patientEmail:  profile.email,
      patientPhone:  profile.phone || '0771234567',
    })

    // Set hidden form data and submit to PayHere
    // This does a full page redirect to PayHere checkout
    // On success → PayHere redirects to return_url (/payment?status=success&order_id=...)
    // On cancel  → PayHere redirects to cancel_url (/payment?status=cancel&order_id=...)
    checkoutData.value = data.data.checkout

    $q.notify({
      icon: 'lock',
      color: 'blue-9',
      message: 'Redirecting to PayHere secure checkout...',
      position: 'top-right',
      timeout: 2000,
    })

    setTimeout(() => {
      payhereForm.value?.submit()
    }, 800)

  } catch (err) {
    console.error(err)
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Payment initiation failed',
      position: 'top-right',
    })
  } finally {
    initiatingPayment.value = false
  }
}

const openDetail = (p) => { detailDlg.payment = p; detailDlg.show = true }

// ── Mount ──────────────────────────────────────────────────────────────────
onMounted(async () => {
  if (!token) { router.push('/login'); return }
  if (storedUser.role !== 'patient') { router.push('/'); return }
  await handleReturn()
  if (!route.query.status) loadPayments()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');
.font-sora { font-family: 'Sora', sans-serif; }
.letter-spacing-2 { letter-spacing: 2px; }
.payment-page-bg {
  min-height: 100vh;
  background:
    radial-gradient(circle at 50% 10%, rgba(37,99,235,0.14), transparent 54%),
    radial-gradient(circle at 12% 80%, rgba(56,189,248,0.07), transparent 48%),
    radial-gradient(circle at 88% 72%, rgba(29,78,216,0.09), transparent 46%),
    #040812;
}
.nexus-panel {
  background: linear-gradient(160deg, rgba(10,18,38,0.88), rgba(7,15,32,0.76));
  border: 1px solid rgba(59,130,246,0.2);
  border-radius: 20px;
  backdrop-filter: blur(22px) saturate(130%);
  box-shadow: 0 26px 60px rgba(2,6,23,0.62), inset 0 1px 0 rgba(255,255,255,0.06);
}
.panel-header { display: flex; align-items: center; }
.success-banner {
  background: rgba(34,197,94,0.08);
  border: 1px solid rgba(34,197,94,0.3);
  border-left: 4px solid #22c55e;
  border-radius: 14px;
}
.cancel-banner {
  background: rgba(249,115,22,0.08);
  border: 1px solid rgba(249,115,22,0.3);
  border-left: 4px solid #f97316;
  border-radius: 14px;
}
.payment-row {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(148,163,184,0.14);
  border-radius: 14px;
  transition: all 0.25s;
}
.payment-row:hover {
  border-color: rgba(96,165,250,0.32);
  background: rgba(59,130,246,0.06);
}
.status-icon-wrap {
  width: 42px; height: 42px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
}
.status-success     { background: rgba(34,197,94,0.12);   border: 1px solid rgba(34,197,94,0.25); }
.status-pending     { background: rgba(245,158,11,0.12);  border: 1px solid rgba(245,158,11,0.25); }
.status-failed      { background: rgba(239,68,68,0.12);   border: 1px solid rgba(239,68,68,0.25); }
.status-cancelled   { background: rgba(100,116,139,0.12); border: 1px solid rgba(100,116,139,0.2); }
.status-chargedback { background: rgba(249,115,22,0.12);  border: 1px solid rgba(249,115,22,0.25); }
.amount-display { font-size: 1rem; font-weight: 700; letter-spacing: 0.5px; }
.appointment-summary {
  background: rgba(59,130,246,0.06);
  border: 1px solid rgba(59,130,246,0.22);
  border-radius: 16px;
}
.doc-icon-wrap {
  width: 56px; height: 56px;
  background: rgba(59,130,246,0.1);
  border: 1px solid rgba(59,130,246,0.25);
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
}
.payhere-info {
  background: rgba(59,130,246,0.05);
  border: 1px solid rgba(59,130,246,0.2);
  border-left: 3px solid rgba(59,130,246,0.7);
  border-radius: 0 12px 12px 0;
}
.pay-btn {
  background: linear-gradient(135deg, #1d4ed8, #2563eb, #0ea5e9) !important;
  color: #fff !important;
  border-radius: 14px !important;
  font-size: 0.8rem !important;
  letter-spacing: 2px !important;
  padding: 14px 32px !important;
  box-shadow: 0 10px 28px rgba(37,99,235,0.4) !important;
  transition: all 0.3s !important;
}
.pay-btn:hover {
  box-shadow: 0 14px 36px rgba(37,99,235,0.6) !important;
  transform: translateY(-2px) !important;
}
.dialog-card {
  background: linear-gradient(160deg, rgba(10,18,38,0.96), rgba(7,15,32,0.92)) !important;
  border: 1px solid rgba(59,130,246,0.22) !important;
  border-radius: 18px !important;
  box-shadow: 0 24px 56px rgba(2,6,23,0.7) !important;
}
.card-accent-bar {
  height: 3px;
  background: linear-gradient(90deg, transparent, #2563eb, #38bdf8, transparent);
  border-radius: 2px;
}
.detail-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(148,163,184,0.08);
}
.detail-label { font-family: 'Sora', sans-serif; font-size: 0.58rem; letter-spacing: 1.8px; color: rgba(148,163,184,0.7); }
.detail-value  { font-family: 'Sora', sans-serif; font-size: 0.8rem; color: rgba(226,232,240,0.9); }
.empty-state { display: flex; flex-direction: column; align-items: center; opacity: 0.7; }
</style>