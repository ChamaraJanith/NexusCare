<template>
  <q-page class="receipt-bg text-white font-jakarta flex flex-center q-py-xl">
    <div class="receipt-wrapper q-mx-auto q-px-md">

      <!-- ── CONFIRMATION CARD ── -->
      <q-card class="receipt-card q-pa-none" flat>
        <div class="card-accent-bar" />

        <q-btn flat round dense icon="close" color="grey-5"
          class="absolute-top-right q-ma-sm close-btn" @click="resetAndGoHome" />

        <!-- HEADER -->
        <div class="card-header q-pt-xl q-pb-lg q-px-xl text-center">
          <div class="success-ring q-mx-auto q-mb-lg">
            <div class="success-circle flex flex-center">
              <q-icon name="check" size="36px" color="white" />
            </div>
          </div>
          <div class="text-h4 text-weight-bolder text-white q-mb-xs" style="letter-spacing:-0.5px">
            Appointment Confirmed!
          </div>
          <div class="text-grey-4 text-body1">Your booking has been successfully secured.</div>
          <div class="status-badge q-mx-auto q-mt-md">
            <q-icon name="verified" size="14px" class="q-mr-xs" />Booking Active
          </div>
        </div>

        <q-separator color="blue-grey-9" class="opacity-30" />

        <!-- REFERENCE BANNER -->
        <div class="ref-banner q-px-xl q-py-md flex items-center justify-between">
          <div>
            <div class="field-label q-mb-xs">Booking Reference</div>
            <div class="ref-id text-blue-3">{{ route.params.orderId }}</div>
          </div>
          <div class="text-right">
            <div class="field-label q-mb-xs">Issued On</div>
            <div class="text-white text-weight-medium text-body2">{{ issuedDate }}</div>
          </div>
        </div>

        <q-separator color="blue-grey-9" class="opacity-30" />

        <!-- DETAILS -->
        <div class="q-px-xl q-py-lg">
          <div class="row q-col-gutter-lg q-mb-lg">
            <div class="col-12 col-sm-6">
              <div class="detail-card">
                <div class="detail-icon-wrap"><q-icon name="event" size="18px" color="blue-4" /></div>
                <div>
                  <div class="field-label q-mb-xs">Appointment Date & Time</div>
                  <div class="text-white text-weight-bold text-body1">{{ date }}</div>
                  <div class="text-blue-3 text-body2">{{ time }}</div>
                </div>
              </div>
            </div>
            <div class="col-12 col-sm-6">
              <div class="detail-card">
                <div class="detail-icon-wrap"><q-icon name="confirmation_number" size="18px" color="blue-4" /></div>
                <div>
                  <div class="field-label q-mb-xs">Queue Number</div>
                  <div class="queue-number text-blue-3">#{{ queueNumber }}</div>
                  <div class="text-grey-5 text-caption">Arrive 10 min early</div>
                </div>
              </div>
            </div>
          </div>

          <div class="detail-card q-mb-lg">
            <div class="detail-icon-wrap"><q-icon name="medical_services" size="18px" color="blue-4" /></div>
            <div class="full-width">
              <div class="field-label q-mb-xs">Attending Physician</div>
              <div class="text-white text-weight-bold text-body1">Dr. {{ doctorName }}</div>
              <div class="text-grey-5 text-caption q-mt-xs" v-if="doctorSpecialty">{{ doctorSpecialty }}</div>
            </div>
          </div>

          <div class="detail-card q-mb-lg">
            <div class="detail-icon-wrap"><q-icon name="person" size="18px" color="blue-4" /></div>
            <div>
              <div class="field-label q-mb-xs">Patient</div>
              <div class="text-white text-weight-bold text-body1">{{ patientName }}</div>
            </div>
          </div>

          <!-- Payment Summary -->
          <div class="payment-summary-card q-pa-lg q-mb-lg">
            <div class="text-caption text-grey-4 text-uppercase text-weight-bold q-mb-md" style="letter-spacing:1px">
              Payment Summary
            </div>
            <!-- Broken-down fees (when breakdown is available) -->
            <template v-if="hasBreakdown">
              <div class="flex justify-between items-center q-mb-sm">
                <span class="text-grey-4 text-body2">Doctor Fee</span>
                <span class="text-white text-body2">LKR {{ fmt(doctorFee) }}</span>
              </div>
              <div v-if="isPhysical && hospitalFee > 0" class="flex justify-between items-center q-mb-sm">
                <span class="text-grey-4 text-body2">Hospital Fee</span>
                <span class="text-white text-body2">LKR {{ fmt(hospitalFee) }}</span>
              </div>
              <div v-if="serviceFee > 0" class="flex justify-between items-center q-mb-sm">
                <span class="text-grey-4 text-body2">Service Fee</span>
                <span class="text-white text-body2">LKR {{ fmt(serviceFee) }}</span>
              </div>
            </template>
            <!-- Legacy / no breakdown — show single consultation fee line -->
            <template v-else>
              <div class="flex justify-between items-center q-mb-sm">
                <span class="text-grey-4 text-body2">Consultation Fee</span>
                <span class="text-white text-body2">LKR {{ formattedAmount }}</span>
              </div>
            </template>
            <q-separator color="blue-grey-8" class="q-my-md" />
            <div class="flex justify-between items-center">
              <span class="text-white text-weight-bold text-body1">Total Paid</span>
              <div class="paid-badge">
                <q-icon name="check_circle" size="14px" class="q-mr-xs" />LKR {{ formattedAmount }}
              </div>
            </div>
          </div>

          <div class="info-note q-pa-md q-mb-lg flex items-start">
            <q-icon name="info_outline" size="16px" color="blue-4" class="q-mt-xs q-mr-sm" />
            <div class="text-grey-4 text-caption">
              Please bring a valid ID and this receipt to your appointment.
              For cancellations, contact support at least 24 hours in advance.
            </div>
          </div>
        </div>

        <q-separator color="blue-grey-9" class="opacity-30" />

        <!-- ACTIONS -->
        <div class="q-px-xl q-py-lg flex flex-center q-gutter-md">
          <q-btn outline rounded color="blue-4" class="action-btn text-weight-bold" @click="downloadReceipt">
            <q-icon name="picture_as_pdf" size="xs" class="q-mr-sm" />Download PDF
          </q-btn>
          <q-btn unelevated rounded color="primary" class="action-btn-primary text-weight-bold"
            @click="router.push('/patient/dashboard')">
            Back to Dashboard<q-icon name="arrow_forward" size="xs" class="q-ml-sm" />
          </q-btn>
        </div>

        <div class="card-footer q-py-md text-center">
          <span class="text-grey-7 text-caption">Nexus Care · Secure Medical Booking Platform</span>
        </div>
      </q-card>
    </div>

    <!-- ══════════════════════════════════════════
         PRINT-ONLY — A4 PROFESSIONAL RECEIPT
    ══════════════════════════════════════════ -->
    <div class="print-receipt">

      <!-- Letterhead -->
      <div class="pr-letterhead">
        <div class="pr-letterhead-left">
          <div class="pr-brand">NEXUS CARE</div>
          <div class="pr-brand-sub">Medical Services Platform</div>
          <div class="pr-brand-contact">support@nexuscare.health &nbsp;|&nbsp; +94 11 000 0000</div>
          <div class="pr-brand-contact">www.nexuscare.health</div>
        </div>
        <div class="pr-letterhead-right">
          <div class="pr-receipt-title">OFFICIAL RECEIPT</div>
          <div class="pr-receipt-subtitle">Medical Appointment Confirmation</div>
        </div>
      </div>

      <div class="pr-header-rule"></div>

      <!-- Receipt meta row -->
      <div class="pr-meta-header">
        <div class="pr-meta-block">
          <div class="pr-meta-label">Receipt Number</div>
          <div class="pr-meta-value pr-mono">{{ route.params.orderId }}</div>
        </div>
        <div class="pr-meta-block">
          <div class="pr-meta-label">Issue Date</div>
          <div class="pr-meta-value">{{ issuedDate }}</div>
        </div>
        <div class="pr-meta-block">
          <div class="pr-meta-label">Payment Status</div>
          <div class="pr-meta-value pr-paid-stamp">&#10003; PAID IN FULL</div>
        </div>
      </div>

      <div class="pr-section-rule"></div>

      <!-- Parties -->
      <div class="pr-parties">
        <div class="pr-party-block">
          <div class="pr-party-label">BILLED TO</div>
          <div class="pr-party-name">{{ patientName }}</div>
          <div class="pr-party-detail">Patient</div>
        </div>
        <div class="pr-party-block">
          <div class="pr-party-label">SERVICE PROVIDER</div>
          <div class="pr-party-name">Dr. {{ doctorName }}</div>
          <div class="pr-party-detail" v-if="doctorSpecialty">{{ doctorSpecialty }}</div>
          <div class="pr-party-detail">Nexus Care Network</div>
        </div>
      </div>

      <div class="pr-section-rule"></div>

      <!-- Appointment details table -->
      <div class="pr-section-heading">APPOINTMENT DETAILS</div>
      <table class="pr-table">
        <thead>
          <tr>
            <th class="pr-th pr-th-wide">Description</th>
            <th class="pr-th">Date</th>
            <th class="pr-th">Time</th>
            <th class="pr-th">Queue</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="pr-td">Medical Consultation — Dr. {{ doctorName }}</td>
            <td class="pr-td">{{ date }}</td>
            <td class="pr-td">{{ time }}</td>
            <td class="pr-td pr-center">#{{ queueNumber }}</td>
          </tr>
        </tbody>
      </table>

      <div class="pr-section-rule"></div>

      <!-- Payment breakdown table -->
      <div class="pr-section-heading">PAYMENT BREAKDOWN</div>
      <table class="pr-table">
        <thead>
          <tr>
            <th class="pr-th pr-th-wide">Item</th>
            <th class="pr-th pr-th-right">Amount (LKR)</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="hasBreakdown">
            <tr>
              <td class="pr-td">Doctor Consultation Fee — Dr. {{ doctorName }}</td>
              <td class="pr-td pr-right">{{ fmt(doctorFee) }}</td>
            </tr>
            <tr v-if="isPhysical && hospitalFee > 0">
              <td class="pr-td">Hospital Fee</td>
              <td class="pr-td pr-right">{{ fmt(hospitalFee) }}</td>
            </tr>
            <tr v-if="serviceFee > 0">
              <td class="pr-td">Service Fee</td>
              <td class="pr-td pr-right">{{ fmt(serviceFee) }}</td>
            </tr>
          </template>
          <template v-else>
            <tr>
              <td class="pr-td">Consultation Fee — Dr. {{ doctorName }}</td>
              <td class="pr-td pr-right">{{ formattedAmount }}</td>
            </tr>
          </template>
        </tbody>
        <tfoot>
          <tr class="pr-total-row">
            <td class="pr-total-label">TOTAL PAID</td>
            <td class="pr-total-value">LKR {{ formattedAmount }}</td>
          </tr>
        </tfoot>
      </table>

      <div class="pr-section-rule"></div>

      <!-- Notes -->
      <div class="pr-notes">
        <div class="pr-notes-title">IMPORTANT NOTES</div>
        <ul class="pr-notes-list">
          <li>Please present this receipt at the reception desk upon arrival.</li>
          <li>Bring a valid government-issued photo ID to your appointment.</li>
          <li>Arrive at least 10 minutes before your scheduled time.</li>
          <li>For cancellations or rescheduling, contact us at least 24 hours in advance.</li>
        </ul>
      </div>

      <!-- Footer -->
      <div class="pr-footer-rule"></div>
      <div class="pr-footer">
        <div class="pr-footer-left">
          <div class="pr-footer-brand">NEXUS CARE</div>
          <div class="pr-footer-tagline">Trusted Medical Booking Platform</div>
        </div>
        <div class="pr-footer-right">
          <div class="pr-footer-text">This is a computer-generated receipt.</div>
          <div class="pr-footer-text">No signature required.</div>
        </div>
      </div>

    </div>
  </q-page>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

const doctorName = ref('')
const doctorSpecialty = ref('')
const amount = ref(0)
const doctorFee = ref(0)
const hospitalFee = ref(0)
const serviceFee = ref(0)
const appointmentType = ref('PHYSICAL')
const queueNumber = ref('N/A')
const date = ref('-')
const time = ref('-')
const patientName = ref('')

const isPhysical = computed(() => appointmentType.value === 'PHYSICAL')

// True only when we have real sub-fee data (not legacy total-only records)
const hasBreakdown = computed(() =>
  doctorFee.value > 0 || hospitalFee.value > 0 || serviceFee.value > 0
)

const issuedDate = computed(() =>
  new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
)

const fmt = (n) => {
  const v = parseFloat(n)
  return isNaN(v) ? '0.00' : v.toFixed(2)
}

const formattedAmount = computed(() => fmt(amount.value))

// Returns true if value looks like a raw doctor ID rather than a real name
const isIdLike = (s) => !s || /^DOC-/i.test((s || '').trim()) || (s || '').trim().length < 2

const cleanName = (raw) => (raw || '').replace(/^Dr\.?\s*/i, '').trim()

// Fetch real doctor name from public API when payment record has ID instead of name
const resolveDoctorNameFromApi = async (doctorId, token) => {
  try {
    const res = await axios.get(
      `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/doctors/public/${doctorId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const d = res.data?.data || res.data
    return cleanName(d?.name || d?.doctorName || '')
  } catch {
    return ''
  }
}

// Load fee breakdown with smart fallback
const loadFees = (appt) => {
  const charges = appt?.charges
  const hasBreakdown = charges &&
    (Number(charges.doctorFee) > 0 || Number(charges.hospitalFee) > 0 || Number(charges.serviceFee) > 0)

  if (hasBreakdown) {
    doctorFee.value   = Number(charges.doctorFee)   || 0
    hospitalFee.value = Number(charges.hospitalFee) || 0
    serviceFee.value  = Number(charges.serviceFee)  || 0
    appointmentType.value = appt.appointmentType || 'PHYSICAL'
    return
  }

  // Try localStorage breakdown
  const lsDf = parseFloat(localStorage.getItem('doctorFee'))   || 0
  const lsHf = parseFloat(localStorage.getItem('hospitalFee')) || 0
  const lsSf = parseFloat(localStorage.getItem('serviceFee'))  || 0
  appointmentType.value = (appt?.appointmentType) || localStorage.getItem('appointmentType') || 'PHYSICAL'

  if (lsDf > 0 || lsHf > 0 || lsSf > 0) {
    doctorFee.value   = lsDf
    hospitalFee.value = lsHf
    serviceFee.value  = lsSf
    return
  }

  // No breakdown at all — leave fees at 0 so hasBreakdown stays false
  // The template will show a single "Consultation Fee" line using formattedAmount
  doctorFee.value   = 0
  hospitalFee.value = 0
  serviceFee.value  = 0
}

onMounted(async () => {
  try {
    const orderId = route.params.orderId
    const token = localStorage.getItem('nexus_token') || localStorage.getItem('token')

    const paymentRes = await axios.get(
      `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/payments/${orderId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const payment = paymentRes.data.data || paymentRes.data

    amount.value      = payment?.amount ?? parseFloat(localStorage.getItem('amount')) ?? 0
    patientName.value = payment?.patientName || localStorage.getItem('patientName') || 'Patient'
    doctorSpecialty.value = payment?.doctorSpecialty || localStorage.getItem('doctorSpecialty') || ''

    // ── Resolve doctor name (multi-source with ID detection) ─────────────────
    let name = cleanName(payment?.doctorName || '')

    // If payment record has an ID instead of name, fetch from doctor public API
    if (isIdLike(name) && payment?.doctorId) {
      name = await resolveDoctorNameFromApi(payment.doctorId, token)
    }

    // ── Fetch appointment for queue/date/time/charges ────────────────────────
    const patientId = localStorage.getItem('patientId')
    let matched = null
    if (patientId && payment?.appointmentId) {
      try {
        const apptRes = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/appointments/patient/${patientId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        const appointments = Array.isArray(apptRes.data) ? apptRes.data : apptRes.data.data || []
        matched = appointments.find(
          a => a._id === payment.appointmentId || a.appointmentId === payment.appointmentId
        )
        // Appointment record also has doctorName — use it if still unresolved
        if (isIdLike(name) && matched?.doctorName) {
          name = cleanName(matched.doctorName)
        }
      } catch { /* use localStorage */ }
    }

    // Final localStorage fallback — only if not an ID
    if (isIdLike(name)) {
      const lsName = localStorage.getItem('doctorName') || ''
      name = isIdLike(lsName) ? '' : cleanName(lsName)
    }

    doctorName.value  = name || 'Unknown Physician'
    queueNumber.value = matched?.queueNumber || localStorage.getItem('queueNumber') || 'N/A'
    date.value        = matched?.date        || localStorage.getItem('date')        || '-'
    time.value        = matched?.time        || localStorage.getItem('time')        || '-'
    loadFees(matched)

  } catch (err) {
    console.error('Receipt load failed, using localStorage fallback:', err)
    const lsName = localStorage.getItem('doctorName') || ''
    doctorName.value      = isIdLike(lsName) ? 'Unknown Physician' : (cleanName(lsName) || 'Unknown Physician')
    doctorSpecialty.value = localStorage.getItem('doctorSpecialty') || ''
    amount.value          = parseFloat(localStorage.getItem('amount')) || 0
    date.value            = localStorage.getItem('date')        || '-'
    time.value            = localStorage.getItem('time')        || '-'
    queueNumber.value     = localStorage.getItem('queueNumber') || 'N/A'
    patientName.value     = localStorage.getItem('patientName') || 'Patient'
    loadFees(null)
  }
})

const resetAndGoHome = () => {
  ['doctorName', 'doctorSpecialty', 'amount', 'doctorFee', 'hospitalFee', 'serviceFee',
   'appointmentType', 'date', 'time', 'queueNumber', 'patientName'].forEach(k =>
    localStorage.removeItem(k)
  )
  router.push('/patient/dashboard')
}

const downloadReceipt = () => window.print()
</script>

<style scoped>
/* ── Screen styles ── */
.font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
.receipt-bg {
  background: radial-gradient(ellipse at 20% 0%, #0d1b3e 0%, #030612 60%);
  min-height: 100vh;
}
.receipt-wrapper { max-width: 680px; width: 100%; }
.receipt-card {
  background: rgba(10, 17, 40, 0.85) !important;
  border: 1px solid rgba(37, 99, 235, 0.25);
  border-radius: 20px;
  overflow: hidden;
  backdrop-filter: blur(12px);
  box-shadow: 0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);
  position: relative;
}
.card-accent-bar {
  height: 4px;
  background: linear-gradient(90deg, #1d4ed8, #3b82f6, #60a5fa);
}
.close-btn { z-index: 10; }
.card-header { background: rgba(15, 23, 42, 0.4); }
.success-ring {
  width: 88px; height: 88px; border-radius: 50%;
  background: rgba(37, 99, 235, 0.15);
  border: 2px solid rgba(59, 130, 246, 0.4);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 40px rgba(37, 99, 235, 0.3);
}
.success-circle {
  width: 68px; height: 68px; border-radius: 50%;
  background: linear-gradient(135deg, #1d4ed8, #3b82f6);
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
}
.status-badge {
  display: inline-flex; align-items: center;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #34d399; font-size: 12px; font-weight: 700;
  padding: 4px 14px; border-radius: 20px; letter-spacing: 0.5px;
}
.ref-banner { background: rgba(15, 23, 42, 0.5); }
.ref-id { font-family: 'Courier New', monospace; font-size: 13px; font-weight: 600; word-break: break-all; }
.field-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #64748b; }
.detail-card {
  display: flex; align-items: flex-start; gap: 14px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 12px; padding: 16px;
}
.detail-icon-wrap {
  width: 36px; height: 36px; min-width: 36px; border-radius: 8px;
  background: rgba(37, 99, 235, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.2);
  display: flex; align-items: center; justify-content: center;
}
.queue-number { font-size: 28px; font-weight: 800; line-height: 1; letter-spacing: -1px; }
.payment-summary-card {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(37, 99, 235, 0.2);
  border-radius: 14px;
}
.paid-badge {
  display: inline-flex; align-items: center;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.35);
  color: #34d399; font-weight: 700; font-size: 14px;
  padding: 6px 16px; border-radius: 20px;
}
.info-note {
  background: rgba(37, 99, 235, 0.07);
  border: 1px solid rgba(59, 130, 246, 0.15);
  border-radius: 10px;
}
.action-btn { border: 1px solid rgba(96, 165, 250, 0.4); padding: 10px 28px; font-size: 14px; }
.action-btn-primary {
  background: linear-gradient(135deg, #1d4ed8, #3b82f6) !important;
  padding: 10px 28px; font-size: 14px;
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.35);
}
.card-footer { background: rgba(5, 10, 25, 0.5); border-top: 1px solid rgba(255,255,255,0.04); }
.opacity-30 { opacity: 0.3; }

/* ── Print receipt hidden on screen ── */
.print-receipt { display: none; }

/* ════════════════════════════════════════════════════════
   PRINT — A4 PROFESSIONAL RECEIPT (single page)
════════════════════════════════════════════════════════ */
@media print {
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

  /* Hide screen card */
  .receipt-bg > .receipt-wrapper { display: none !important; }

  /* Show print receipt */
  .print-receipt {
    display: block !important;
    font-family: 'Segoe UI', Arial, sans-serif;
    color: #1a1a2e;
    background: #ffffff;
    width: 210mm;
    min-height: 297mm;
    margin: 0;
    padding: 10mm 14mm 8mm;
    font-size: 9pt;
    line-height: 1.4;
    box-sizing: border-box;
    page-break-after: avoid;
    page-break-inside: avoid;
  }

  /* ── Letterhead ── */
  .pr-letterhead {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 4mm;
  }
  .pr-brand { font-size: 20pt; font-weight: 900; letter-spacing: 3px; color: #1e3a8a; }
  .pr-brand-sub { font-size: 8pt; color: #475569; letter-spacing: 1px; margin-top: 0.5mm; }
  .pr-brand-contact { font-size: 7.5pt; color: #64748b; margin-top: 0.5mm; }
  .pr-receipt-title { font-size: 15pt; font-weight: 800; color: #1e3a8a; text-align: right; letter-spacing: 1px; }
  .pr-receipt-subtitle { font-size: 8pt; color: #64748b; text-align: right; margin-top: 0.5mm; }

  /* ── Rules ── */
  .pr-header-rule { border: none; border-top: 3px solid #1e3a8a; margin-bottom: 0.5mm; }
  .pr-header-rule + * { border-top: 1px solid #cbd5e1; margin-bottom: 4mm; }
  .pr-section-rule { border: none; border-top: 1px solid #e2e8f0; margin: 3mm 0; }
  .pr-footer-rule { border: none; border-top: 2px solid #1e3a8a; margin-top: 4mm; margin-bottom: 3mm; }

  /* ── Receipt meta header ── */
  .pr-meta-header {
    display: flex;
    justify-content: space-between;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 3px;
    padding: 3mm 4mm;
    margin-bottom: 4mm;
  }
  .pr-meta-block { flex: 1; }
  .pr-meta-label { font-size: 7pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 0.8mm; }
  .pr-meta-value { font-size: 9pt; font-weight: 700; color: #1e293b; }
  .pr-mono { font-family: 'Courier New', monospace; font-size: 8pt; word-break: break-all; }
  .pr-paid-stamp { color: #15803d; font-size: 9.5pt; font-weight: 900; letter-spacing: 0.5px; }

  /* ── Parties ── */
  .pr-parties { display: flex; gap: 8mm; margin-bottom: 1mm; }
  .pr-party-block { flex: 1; }
  .pr-party-label { font-size: 7pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 1mm; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.8mm; }
  .pr-party-name { font-size: 10.5pt; font-weight: 700; color: #1e293b; margin-bottom: 0.5mm; }
  .pr-party-detail { font-size: 8pt; color: #475569; }

  /* ── Section heading ── */
  .pr-section-heading { font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #1e3a8a; margin-bottom: 1.5mm; }

  /* ── Tables ── */
  .pr-table { width: 100%; border-collapse: collapse; margin-bottom: 1.5mm; }
  .pr-th { background: #1e3a8a; color: #fff; font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 2mm 2.5mm; text-align: left; }
  .pr-th-wide { width: 55%; }
  .pr-th-right { text-align: right; }
  .pr-td { padding: 2mm 2.5mm; font-size: 9pt; color: #1e293b; border-bottom: 1px solid #f1f5f9; }
  .pr-center { text-align: center; font-weight: 700; }
  .pr-right { text-align: right; }
  .pr-table tbody tr:nth-child(even) td { background: #f8fafc; }

  /* ── Total row ── */
  .pr-total-row { background: #1e3a8a !important; }
  .pr-total-label { padding: 2.5mm 2.5mm; font-size: 10.5pt; font-weight: 900; color: #fff; letter-spacing: 0.5px; }
  .pr-total-value { padding: 2.5mm 2.5mm; font-size: 11pt; font-weight: 900; color: #86efac; text-align: right; }

  /* ── Notes ── */
  .pr-notes { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 3px solid #1e3a8a; border-radius: 2px; padding: 2.5mm 3.5mm; }
  .pr-notes-title { font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #1e3a8a; margin-bottom: 1.5mm; }
  .pr-notes-list { margin: 0; padding-left: 3.5mm; font-size: 8pt; color: #475569; }
  .pr-notes-list li { margin-bottom: 0.8mm; }

  /* ── Footer ── */
  .pr-footer { display: flex; justify-content: space-between; align-items: flex-end; }
  .pr-footer-brand { font-size: 11pt; font-weight: 900; color: #1e3a8a; letter-spacing: 2px; }
  .pr-footer-tagline { font-size: 7.5pt; color: #64748b; margin-top: 0.5mm; }
  .pr-footer-text { font-size: 7pt; color: #94a3b8; text-align: right; }
}
</style>
