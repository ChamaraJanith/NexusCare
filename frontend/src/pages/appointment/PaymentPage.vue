<template>
  <q-page class="payment-page">
    <!-- Atmospheric background -->
    <div class="pay-bg-layer"></div>

    <div class="pay-shell q-px-md q-pb-xl">

      <!-- ── PAGE HEADER ─────────────────────────────────────────────── -->
      <div class="pay-header q-pt-xl q-pb-lg">
        <div class="row items-center justify-between">
          <div>
            <div class="pay-eyebrow q-mb-xs">
              <q-icon name="lock" size="12px" class="q-mr-xs" />
              Secure Payment Terminal
            </div>
            <h1 class="pay-title q-ma-none">
              Consultation <span class="title-gradient">Payment</span>
            </h1>
          </div>
          <q-btn
            flat round icon="arrow_back"
            color="grey-5"
            @click="$router.back()"
          >
            <q-tooltip class="bg-dark">Go back</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- ── STATUS BANNERS ──────────────────────────────────────────── -->
      <transition name="slide-down">
        <div v-if="returnStatus === 'success'" class="status-banner success-banner q-mb-xl">
          <div class="banner-icon-wrap success">
            <q-icon name="check_circle" color="green-4" size="2rem" />
          </div>
          <div>
            <div class="banner-title success-text">Payment Successful</div>
            <div class="banner-sub">Your consultation has been confirmed. Check your email for details.</div>
          </div>
          <q-space />
          <q-btn
            unelevated label="View Dashboard"
            color="green-9" text-color="green-3"
            class="banner-action-btn"
            @click="$router.push('/patient/dashboard')"
          />
        </div>
      </transition>

      <transition name="slide-down">
        <div v-if="returnStatus === 'cancel'" class="status-banner cancel-banner q-mb-xl">
          <div class="banner-icon-wrap cancel">
            <q-icon name="cancel" color="orange-4" size="2rem" />
          </div>
          <div>
            <div class="banner-title cancel-text">Payment Cancelled</div>
            <div class="banner-sub">Your payment was not completed. You can try again below.</div>
          </div>
        </div>
      </transition>

      <div class="pay-grid">

        <!-- ── LEFT COLUMN ─────────────────────────────────────────── -->
        <div class="pay-left">

          <!-- Appointment summary card (only shown when coming from booking) -->
          <div v-if="appointmentContext" class="appt-summary-card q-mb-lg">
            <div class="card-accent-top"></div>
            <div class="q-pa-xl">
              <div class="section-eyebrow q-mb-lg">Appointment Summary</div>

              <div class="row items-center q-gutter-md q-mb-xl">
                <div class="col-auto">
                  <div class="doc-icon-box">
                    <q-icon name="medical_services" color="blue-4" size="2rem" />
                  </div>
                </div>
                <div class="col">
                  <div class="doc-name-pay">Dr. {{ appointmentContext.doctorName }}</div>
                  <div class="doc-spec-pay">{{ appointmentContext.specialty }}</div>
                </div>
              </div>

              <!-- Appointment details -->
              <div class="appt-detail-row">
                <div class="detail-icon-wrap">
                  <q-icon name="event" color="blue-5" size="1rem" />
                </div>
                <div>
                  <div class="detail-label">Date & Time</div>
                  <div class="detail-value">{{ appointmentContext.date }} · {{ appointmentContext.time }}</div>
                </div>
              </div>

              <div class="appt-detail-row">
                <div class="detail-icon-wrap">
                  <q-icon name="videocam" color="blue-5" size="1rem" />
                </div>
                <div>
                  <div class="detail-label">Appointment Type</div>
                  <div class="detail-value">
                    <q-chip
                      dense
                      :color="appointmentContext.type === 'ONLINE' ? 'blue-10' : 'indigo-10'"
                      :text-color="appointmentContext.type === 'ONLINE' ? 'blue-3' : 'indigo-3'"
                      class="text-caption font-weight-bold"
                    >
                      {{ appointmentContext.type || 'CONSULTATION' }}
                    </q-chip>
                  </div>
                </div>
              </div>

              <div class="appt-detail-row">
                <div class="detail-icon-wrap">
                  <q-icon name="confirmation_number" color="blue-5" size="1rem" />
                </div>
                <div>
                  <div class="detail-label">Appointment ID</div>
                  <div class="detail-value appt-id-text">{{ appointmentContext.appointmentId }}</div>
                </div>
              </div>

              <div class="fee-breakdown q-mt-lg">
                <div class="fee-row">
                  <span class="fee-item-label">Doctor Fee</span>
                  <span class="fee-item-val">
                    LKR {{ formatAmount(appointmentContext.doctorFee) }}
                  </span>

                </div>
                <div v-if="appointmentContext.type === 'PHYSICAL'" class="fee-row">
                  <span class="fee-item-label">Hospital Fee</span>
                  <span class="fee-item-val">
                    LKR {{ formatAmount(appointmentContext.hospitalFee) }}
                  </span>
                </div>
                <div class="fee-row">
                  <span class="fee-item-label">Service Fee</span>
                  <span class="fee-item-val">
                    LKR {{ formatAmount(appointmentContext.serviceFee) }}
                  </span>
                </div>
                <div class="fee-divider"></div>
                <div class="fee-row total-fee-row">
                  <span class="fee-total-label">Total</span>
                  <span class="fee-total-val">LKR {{ formatAmount(appointmentContext.fee) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- PayHere info box -->
          <div v-if="appointmentContext" class="payhere-info-box q-mb-lg">
            <div class="row items-start q-gutter-md">
              <div class="col-auto q-pt-xs">
                <q-icon name="shield" color="blue-4" size="1.3rem" />
              </div>
              <div class="col">
                <div class="info-box-title">Secure Payment via PayHere</div>
                <div class="info-box-sub q-mt-xs">
                  You will be redirected to PayHere's secure checkout.
                  Supports Visa, Mastercard, and local bank cards.
                </div>
                <div class="test-card-note q-mt-sm">
                  Test card:
                  <span class="test-card-num">4916 2175 0161 1292</span>
                  · Exp: any · CVV: any
                </div>
              </div>
            </div>
          </div>

          <!-- Pay Now button -->
          <div v-if="appointmentContext" class="row justify-center q-mb-xl">
            <q-btn
              class="pay-now-btn"
              icon="lock"
              label="Pay Now — Secure Checkout"
              :loading="initiatingPayment"
              @click="doInitiatePayment"
            />
          </div>
        </div>

        <!-- ── RIGHT COLUMN: Payment History ──────────────────────── -->
        <div class="pay-right">
          <div class="history-card">
            <div class="card-accent-top"></div>
            <div class="q-pa-xl">
              <div class="row items-center q-mb-xl">
                <q-icon name="receipt_long" color="blue-4" size="1.3rem" class="q-mr-sm" />
                <span class="section-eyebrow">Payment History</span>
                <q-space />
                <q-chip dark color="grey-9" class="text-caption">
                  {{ payments.length }} records
                </q-chip>
              </div>

              <!-- Loading skeletons -->
              <div v-if="loadingPayments" class="q-gutter-y-sm">
                <q-skeleton
                  v-for="i in 4" :key="i"
                  type="rect" dark height="68px"
                  class="rounded-hist"
                />
              </div>

              <!-- Empty state -->
              <div v-else-if="payments.length === 0" class="hist-empty">
                <q-icon name="payments" size="3rem" color="grey-9" class="q-mb-md" />
                <div class="hist-empty-title">No payment records</div>
                <div class="hist-empty-sub">Your payment history will appear here after a consultation booking</div>
              </div>

              <!-- Payment rows -->
              <div v-else class="q-gutter-y-sm">
                <div
                  v-for="p in payments"
                  :key="p._id"
                  class="payment-row"
                  @click="openDetail(p)"
                >
                  <div class="row items-center q-gutter-sm no-wrap">
                    <!-- Status icon -->
                    <div class="col-auto">
                      <div class="status-circle" :class="`status-${p.status}`">
                        <q-icon :name="statusIcon(p.status)" size="1.1rem" :color="statusColor(p.status)" />
                      </div>
                    </div>
                    <!-- Info -->
                    <div class="col">
                      <div class="prow-doctor">Dr. {{ p.doctorName || 'Doctor' }}</div>
                      <div class="prow-order">{{ p.orderId }}</div>
                    </div>
                    <!-- Amount -->
                    <div class="col-auto text-right">
                      <div class="prow-amount" :class="`text-${statusColor(p.status)}`">
                        LKR {{ formatAmount(p.amount) }}
                      </div>
                      <q-badge
                        :color="statusBadgeColor(p.status)"
                        class="prow-badge"
                      >
                        {{ p.status.toUpperCase() }}
                      </q-badge>
                    </div>
                  </div>
                  <div class="prow-date">{{ formatDate(p.createdAt) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div><!-- /pay-grid -->
    </div><!-- /pay-shell -->

    <!-- ── PAYMENT DETAIL DIALOG ────────────────────────────────────── -->
    <q-dialog v-model="detailDlg.show">
      <q-card class="detail-dialog-card q-pa-xl">
        <div class="detail-accent-bar q-mb-lg"></div>
        <div class="detail-dlg-title q-mb-xl">Payment Details</div>

        <div v-if="detailDlg.payment" class="q-gutter-y-xs">
          <div class="detail-item">
            <span class="di-label">Order ID</span>
            <span class="di-val blue-text">{{ detailDlg.payment.orderId }}</span>
          </div>
          <div class="detail-item">
            <span class="di-label">Doctor</span>
            <span class="di-val">Dr. {{ detailDlg.payment.doctorName || '—' }}</span>
          </div>
          <div class="detail-item">
            <span class="di-label">Amount</span>
            <span class="di-val white-text">LKR {{ formatAmount(detailDlg.payment.amount) }}</span>
          </div>
          <div class="detail-item">
            <span class="di-label">Status</span>
            <q-badge :color="statusBadgeColor(detailDlg.payment.status)" class="text-caption">
              {{ detailDlg.payment.status.toUpperCase() }}
            </q-badge>
          </div>
          <div v-if="detailDlg.payment.payherePaymentId" class="detail-item">
            <span class="di-label">PayHere ID</span>
            <span class="di-val grey-text">{{ detailDlg.payment.payherePaymentId }}</span>
          </div>
          <div class="detail-item">
            <span class="di-label">Date</span>
            <span class="di-val">{{ formatDate(detailDlg.payment.createdAt) }}</span>
          </div>
        </div>

        <div class="row justify-end q-mt-xl">
          <q-btn flat label="Close" color="grey-5" v-close-popup />
        </div>
      </q-card>
    </q-dialog>

    <!-- Hidden PayHere form — submitted programmatically on pay -->
    <form
      ref="payhereForm"
      method="POST"
      action="https://sandbox.payhere.lk/pay/checkout"
      style="display:none"
    >
      <input
        v-for="(val, key) in checkoutData"
        :key="key"
        type="hidden"
        :name="key"
        :value="val"
      />
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

// ── Auth ────────────────────────────────────────────────────────────────────
const token      = localStorage.getItem('nexus_token')
const storedUser = JSON.parse(localStorage.getItem('nexus_user') || '{}')

// ── API clients ─────────────────────────────────────────────────────────────
// MS1 — user/patient service (to get patient profile for payment initiation)
const ms1Api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  headers: { Authorization: `Bearer ${token}` }
})

// MS5 — payment service
const paymentApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  headers: { Authorization: `Bearer ${token}` }
})

// ── State ────────────────────────────────────────────────────────────────────
const payments          = ref([])
const loadingPayments   = ref(false)
const initiatingPayment = ref(false)
const returnStatus      = ref(null)   // 'success' | 'cancel' | null
const checkoutData      = ref({})
const payhereForm       = ref(null)
const detailDlg         = reactive({ show: false, payment: null })

// ── Appointment context (passed via query params from AppointmentPage.vue) ──
// Query params expected:
//   doctorId, doctorName, specialty, fee, date, time, type, appointmentId
const appointmentContext = computed(() => {
  const q = route.query
  // If a return status is present (PayHere redirect) → don't show new payment form
  if (q.status) return null
  // Must have doctorId to show payment form
  if (!q.doctorId) return null
  return {
    doctorId:      q.doctorId,
    doctorName:    q.doctorName  || 'Doctor',
    specialty:     q.specialty   || '',
    doctorFee: parseFloat(q.doctorFee) || 0,
    hospitalFee: parseFloat(q.hospitalFee) || 0,
    serviceFee: parseFloat(q.serviceFee) || 0,

    fee:
      (parseFloat(q.doctorFee) || 0) +
      (parseFloat(q.hospitalFee) || 0) +
      (parseFloat(q.serviceFee) || 0),
    date:          q.date || '',
    time:          q.time || '',
    type:          q.type || 'ONLINE',
    appointmentId: q.appointmentId || ''
  }
})

// ── Helper functions ─────────────────────────────────────────────────────────
const formatAmount = (amt) =>
  parseFloat(amt || 0).toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

// Map payment status to icon name
const statusIcon = (s) => ({
  success:     'check_circle',
  pending:     'hourglass_empty',
  failed:      'cancel',
  cancelled:   'do_not_disturb',
  chargedback: 'warning'
}[s] || 'help')

// Map payment status to color class
const statusColor = (s) => ({
  success:     'green-4',
  pending:     'amber-4',
  failed:      'red-4',
  cancelled:   'grey-5',
  chargedback: 'orange-4'
}[s] || 'grey-5')

// Map payment status to Quasar badge color
const statusBadgeColor = (s) => ({
  success:     'green-9',
  pending:     'amber-9',
  failed:      'red-9',
  cancelled:   'grey-8',
  chargedback: 'orange-9'
}[s] || 'grey-8')

// ── Load payment history ─────────────────────────────────────────────────────
const loadPayments = async () => {
  loadingPayments.value = true
  try {
    const { data } = await paymentApi.get('/api/payments/my')
    payments.value = data.data || []
  } catch (err) {
    console.error('Payment history load failed:', err)
    $q.notify({ type: 'negative', message: 'Failed to load payment history', position: 'top-right' })
  } finally {
    loadingPayments.value = false
  }
}

// ── Handle PayHere return_url redirect ───────────────────────────────────────
// PayHere redirects to /payment?status=success&order_id=PAY-xxx (on success)
// or to /payment?status=cancel&order_id=PAY-xxx (on cancel)
const handleReturn = async () => {
  const status  = route.query.status
  const orderId = route.query.order_id

  if (!status) return

  returnStatus.value = status

  if (status === 'success' && orderId) {
    // Confirm the payment with the backend so it marks the record as 'success'
    // even if the webhook hasn't fired yet.
    try {
      await paymentApi.post('/api/payments/confirm', { orderId })
      $q.notify({
        icon: 'check_circle',
        color: 'green-9',
        message: 'Payment confirmed successfully!',
        position: 'top-right',
        timeout: 4000
      })
    } catch (err) {
      // If webhook already updated it, this just returns current status — not an error.
      console.error('Confirm error (non-critical):', err?.response?.data || err.message)
    }
  } else if (status === 'cancel') {
    $q.notify({
      icon: 'cancel',
      color: 'orange-9',
      message: 'Payment was cancelled.',
      position: 'top-right'
    })
  }

  // Reload history to reflect latest status
  await loadPayments()
}

// ── Initiate PayHere payment ─────────────────────────────────────────────────
// 1. Fetch patient profile from MS1 to get name/email
// 2. POST to payment-service /api/payments/initiate
// 3. Get checkout data back
// 4. Submit hidden form to PayHere sandbox
const doInitiatePayment = async () => {
  if (!appointmentContext.value) return
  if (!token) {
    router.push('/login')
    return
  }

  initiatingPayment.value = true

  try {
    // Step 1: Get patient profile for name/email/phone
    const { data: profileData } = await ms1Api.get('/api/patient/profile')
    const profile = profileData.data

    // Step 2: Initiate payment on MS5
    const { data } = await paymentApi.post('/api/payments/initiate', {
      appointmentId: appointmentContext.value.appointmentId,
      doctorId:      appointmentContext.value.doctorId,
      doctorName:    appointmentContext.value.doctorName,
      amount:        appointmentContext.value.fee,
      patientName:   profile.name,
      patientEmail:  profile.email,
      patientPhone:  profile.phone || '0771234567'
    })

    // Step 3: Set hidden form fields
    checkoutData.value = data.data.checkout

    $q.notify({
      icon: 'lock',
      color: 'blue-9',
      message: 'Redirecting to PayHere secure checkout...',
      position: 'top-right',
      timeout: 2000
    })

    // Step 4: Submit form after a short delay so the user sees the notification
    setTimeout(() => {
      payhereForm.value?.submit()
    }, 900)

  } catch (err) {
    console.error('Payment initiation failed:', err)
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Payment initiation failed. Please try again.',
      position: 'top-right'
    })
  } finally {
    initiatingPayment.value = false
  }
}

// ── Open payment detail dialog ───────────────────────────────────────────────
const openDetail = (p) => {
  detailDlg.payment = p
  detailDlg.show = true
}

// ── Mount ────────────────────────────────────────────────────────────────────
onMounted(async () => {
  // Guard: redirect if not logged in or not a patient
  if (!token) { router.push('/login'); return }
  if (storedUser.role !== 'patient') { router.push('/'); return }

  // Handle PayHere return if status param is present
  await handleReturn()

  // Load history regardless (fresh load or after return)
  if (!route.query.status) {
    loadPayments()
  }
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* ── BASE ─────────────────────────────────────────────────────────────────── */
.payment-page {
  font-family: 'Plus Jakarta Sans', sans-serif;
  min-height: 100vh;
  position: relative;
  color: #e2e8f0;
}

.pay-bg-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse at 55% 8%, rgba(37,99,235,0.14) 0%, transparent 52%),
    radial-gradient(ellipse at 8% 85%, rgba(56,189,248,0.06) 0%, transparent 48%),
    radial-gradient(ellipse at 92% 65%, rgba(99,102,241,0.08) 0%, transparent 50%),
    #040812;
  z-index: 0;
}

.pay-shell {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
}

/* ── HEADER ──────────────────────────────────────────────────────────────── */
.pay-header { padding-top: 100px; }

.pay-eyebrow {
  display: inline-flex;
  align-items: center;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #3b82f6;
  margin-bottom: 6px;
}

.pay-title {
  font-size: clamp(1.8rem, 3.5vw, 3rem);
  font-weight: 800;
  letter-spacing: -1px;
  line-height: 1.1;
  color: #f1f5f9;
  margin: 0;
}

.title-gradient {
  background: linear-gradient(135deg, #38bdf8, #818cf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ── STATUS BANNERS ───────────────────────────────────────────────────────── */
.status-banner {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 28px;
  border-radius: 16px;
  flex-wrap: wrap;
}
.success-banner {
  background: rgba(34,197,94,0.07);
  border: 1px solid rgba(34,197,94,0.25);
  border-left: 4px solid #22c55e;
}
.cancel-banner {
  background: rgba(249,115,22,0.07);
  border: 1px solid rgba(249,115,22,0.25);
  border-left: 4px solid #f97316;
}
.banner-icon-wrap {
  width: 52px; height: 52px;
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.banner-icon-wrap.success { background: rgba(34,197,94,0.12); }
.banner-icon-wrap.cancel  { background: rgba(249,115,22,0.12); }
.banner-title {
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.3px;
}
.success-text { color: #4ade80; }
.cancel-text  { color: #fb923c; }
.banner-sub {
  font-size: 0.82rem;
  color: #64748b;
  margin-top: 3px;
}
.banner-action-btn {
  border-radius: 12px !important;
  font-size: 0.78rem !important;
  font-weight: 700 !important;
  letter-spacing: 0.5px;
  padding: 8px 20px !important;
}

/* Transition */
.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.4s ease;
}
.slide-down-enter-from, .slide-down-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

/* ── LAYOUT GRID ──────────────────────────────────────────────────────────── */
.pay-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
  align-items: start;
}
@media (max-width: 860px) {
  .pay-grid { grid-template-columns: 1fr; }
}

/* ── CARD BASE ────────────────────────────────────────────────────────────── */
.appt-summary-card,
.history-card {
  background: linear-gradient(145deg, rgba(10,18,38,0.88), rgba(8,22,52,0.78));
  border: 1px solid rgba(59,130,246,0.18);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05);
  backdrop-filter: blur(22px);
}

.card-accent-top {
  height: 3px;
  background: linear-gradient(90deg, transparent 5%, #2563eb 40%, #38bdf8 70%, transparent 95%);
}

.section-eyebrow {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 1.8px;
  text-transform: uppercase;
  color: #3b82f6;
}

/* ── APPOINTMENT SUMMARY ─────────────────────────────────────────────────── */
.doc-icon-box {
  width: 60px; height: 60px;
  border-radius: 16px;
  background: rgba(59,130,246,0.1);
  border: 1px solid rgba(59,130,246,0.22);
  display: flex; align-items: center; justify-content: center;
}
.doc-name-pay {
  font-size: 1.1rem;
  font-weight: 800;
  color: #f1f5f9;
  letter-spacing: -0.3px;
}
.doc-spec-pay {
  font-size: 0.82rem;
  color: #38bdf8;
  font-weight: 600;
  margin-top: 3px;
}

.appt-detail-row {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.appt-detail-row:last-of-type { border-bottom: none; }
.detail-icon-wrap {
  width: 32px; height: 32px;
  border-radius: 8px;
  background: rgba(59,130,246,0.08);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}
.detail-label {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #475569;
  margin-bottom: 3px;
}
.detail-value {
  font-size: 0.88rem;
  color: #cbd5e1;
  font-weight: 600;
}
.appt-id-text {
  font-family: monospace;
  color: #38bdf8;
  font-size: 0.82rem;
}

/* ── FEE BREAKDOWN ────────────────────────────────────────────────────────── */
.fee-breakdown {
  background: rgba(37,99,235,0.06);
  border: 1px solid rgba(59,130,246,0.14);
  border-radius: 14px;
  padding: 18px 20px;
}
.fee-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 7px 0;
}
.fee-item-label {
  font-size: 0.82rem;
  color: #64748b;
}
.fee-item-val {
  font-size: 0.85rem;
  color: #94a3b8;
  font-weight: 600;
}
.fee-divider {
  height: 1px;
  background: rgba(255,255,255,0.06);
  margin: 8px 0;
}
.total-fee-row .fee-total-label {
  font-size: 0.95rem;
  font-weight: 800;
  color: #94a3b8;
}
.fee-total-val {
  font-size: 1.3rem;
  font-weight: 800;
  color: #60a5fa;
  letter-spacing: -0.5px;
}

/* ── PAYHERE INFO BOX ─────────────────────────────────────────────────────── */
.payhere-info-box {
  background: rgba(37,99,235,0.05);
  border: 1px solid rgba(59,130,246,0.18);
  border-left: 3px solid rgba(59,130,246,0.6);
  border-radius: 0 14px 14px 0;
  padding: 18px 20px;
}
.info-box-title {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: #60a5fa;
}
.info-box-sub {
  font-size: 0.78rem;
  color: #64748b;
  line-height: 1.5;
}
.test-card-note {
  font-size: 0.72rem;
  color: #475569;
}
.test-card-num {
  color: #60a5fa;
  font-family: monospace;
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* ── PAY NOW BUTTON ───────────────────────────────────────────────────────── */
.pay-now-btn {
  background: linear-gradient(135deg, #1d4ed8, #2563eb, #0ea5e9) !important;
  color: #fff !important;
  border-radius: 16px !important;
  font-size: 0.85rem !important;
  font-weight: 700 !important;
  letter-spacing: 1px !important;
  padding: 16px 36px !important;
  box-shadow: 0 12px 30px rgba(37,99,235,0.4) !important;
  transition: all 0.3s ease !important;
  text-transform: none !important;
  min-width: 280px;
}
.pay-now-btn:hover {
  transform: translateY(-3px) !important;
  box-shadow: 0 18px 40px rgba(37,99,235,0.55) !important;
}

/* ── PAYMENT HISTORY ──────────────────────────────────────────────────────── */
.hist-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  opacity: 0.7;
}
.hist-empty-title {
  font-size: 1rem;
  font-weight: 700;
  color: #475569;
  letter-spacing: 0.3px;
  margin-bottom: 6px;
}
.hist-empty-sub {
  font-size: 0.8rem;
  color: #334155;
  text-align: center;
  line-height: 1.5;
}

.payment-row {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(148,163,184,0.1);
  border-radius: 14px;
  padding: 16px 18px;
  cursor: pointer;
  transition: all 0.25s ease;
}
.payment-row:hover {
  border-color: rgba(96,165,250,0.28);
  background: rgba(59,130,246,0.05);
  transform: translateX(3px);
}

.status-circle {
  width: 40px; height: 40px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
}
.status-success     { background: rgba(34,197,94,0.1);   border: 1px solid rgba(34,197,94,0.2); }
.status-pending     { background: rgba(245,158,11,0.1);  border: 1px solid rgba(245,158,11,0.2); }
.status-failed      { background: rgba(239,68,68,0.1);   border: 1px solid rgba(239,68,68,0.2); }
.status-cancelled   { background: rgba(100,116,139,0.1); border: 1px solid rgba(100,116,139,0.15); }
.status-chargedback { background: rgba(249,115,22,0.1);  border: 1px solid rgba(249,115,22,0.2); }

.prow-doctor {
  font-size: 0.88rem;
  font-weight: 700;
  color: #e2e8f0;
}
.prow-order {
  font-size: 0.65rem;
  color: #475569;
  font-family: monospace;
  letter-spacing: 0.5px;
  margin-top: 2px;
}
.prow-amount {
  font-size: 0.92rem;
  font-weight: 800;
  letter-spacing: -0.3px;
}
.prow-badge {
  font-size: 0.55rem !important;
  letter-spacing: 1px;
  margin-top: 4px;
}
.prow-date {
  font-size: 0.65rem;
  color: #334155;
  margin-top: 8px;
  letter-spacing: 0.3px;
}

.rounded-hist { border-radius: 14px; }

/* ── DETAIL DIALOG ────────────────────────────────────────────────────────── */
.detail-dialog-card {
  background: linear-gradient(145deg, rgba(10,18,38,0.96), rgba(7,15,32,0.92)) !important;
  border: 1px solid rgba(59,130,246,0.22) !important;
  border-radius: 20px !important;
  min-width: 380px;
  max-width: 460px;
  box-shadow: 0 28px 60px rgba(2,6,23,0.7) !important;
}
.detail-accent-bar {
  height: 3px;
  background: linear-gradient(90deg, transparent, #2563eb, #38bdf8, transparent);
  border-radius: 2px;
  margin-bottom: 4px;
}
.detail-dlg-title {
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #f1f5f9;
}
.detail-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(148,163,184,0.07);
}
.detail-item:last-child { border-bottom: none; }
.di-label {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #475569;
}
.di-val {
  font-size: 0.82rem;
  font-weight: 600;
  color: #94a3b8;
}
.di-val.blue-text  { color: #60a5fa; font-family: monospace; }
.di-val.white-text { color: #f1f5f9; font-size: 1rem; font-weight: 800; }
.di-val.grey-text  { color: #64748b; font-family: monospace; font-size: 0.75rem; }
</style>