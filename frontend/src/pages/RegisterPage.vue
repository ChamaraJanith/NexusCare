<template>
  <q-page class="register-page overflow-hidden">

    <!-- Ambient background -->
    <div class="ambient-bg">
      <div class="ambient-orb orb-top"></div>
      <div class="ambient-orb orb-mid"></div>
      <div class="ambient-orb orb-bottom"></div>
    </div>

    <!-- Grid overlay -->
    <div class="grid-overlay"></div>

    <div class="register-scroll-wrap">
      <div class="register-wrapper z-top">

        <!-- Logo -->
        <div class="text-center q-mb-xl">
          <div class="brand-row row items-center justify-center q-gutter-sm q-mb-sm">
            <div class="logo-circle">
              <span class="logo-letter">N</span>
            </div>
            <span class="brand-name font-jakarta">Nexus Care</span>
          </div>
          <div class="brand-tagline font-jakarta">
            <q-icon name="auto_awesome" color="blue-4" size="12px" class="q-mr-xs" />
            CREATE YOUR ACCOUNT
          </div>
        </div>

        <!-- Card -->
        <div class="register-card">

          <div class="card-top-glow"></div>

          <div class="card-body">

            <!-- Step progress bar -->
            <div class="step-progress q-mb-xl">
              <div class="step-track">
                <div
                  class="step-fill"
                  :style="{ width: `${((currentStep) / (steps.length - 1)) * 100}%` }"
                ></div>
              </div>
              <div class="row justify-between q-mt-sm">
                <div
                  v-for="(step, i) in steps" :key="i"
                  class="step-item column items-center"
                  :class="{
                    'step-item--active': currentStep === i,
                    'step-item--done': currentStep > i,
                    'step-item--pending': currentStep < i
                  }"
                >
                  <div class="step-dot">
                    <q-icon v-if="currentStep > i" name="check" size="11px" />
                    <span v-else>{{ i + 1 }}</span>
                  </div>
                  <div class="step-label font-jakarta q-mt-xs">{{ step }}</div>
                </div>
              </div>
            </div>

            <!-- ─── STEP 0: Role Selection ─────────────────────────── -->
            <div v-show="currentStep === 0" class="step-panel">
              <div class="panel-title font-jakarta q-mb-lg">Who are you?</div>
              <p class="panel-desc font-jakarta q-mb-xl">Choose your role to get started with a personalized experience.</p>

              <div class="row q-col-gutter-md q-mb-xl">
                <div
                  v-for="r in roles" :key="r.value"
                  class="col-12 col-sm-6"
                  @click="form.role = r.value"
                >
                  <div class="role-card cursor-pointer q-pa-lg" :class="form.role === r.value ? 'role-card--active' : ''">
                    <div class="role-icon-wrap q-mb-md" :style="{ background: `${r.color}14`, border: `1px solid ${r.color}30` }">
                      <q-icon :name="r.icon" size="2rem" :style="{ color: r.color }" />
                    </div>
                    <div class="role-title font-jakarta">{{ r.title }}</div>
                    <div class="role-desc font-jakarta q-mt-xs">{{ r.desc }}</div>
                    <div v-if="form.role === r.value" class="role-check row items-center q-mt-md q-gutter-xs">
                      <q-icon name="check_circle" color="blue-4" size="14px" />
                      <span class="font-jakarta text-blue-4" style="font-size: 0.68rem;">Selected</span>
                    </div>
                  </div>
                </div>
              </div>

              <q-btn unelevated class="full-width action-btn font-jakarta" @click="currentStep = 1">
                Continue
                <q-icon name="arrow_forward" size="16px" class="q-ml-sm" />
              </q-btn>
            </div>

            <!-- ─── STEP 1: Basic Information ─────────────────────── -->
            <q-form ref="step1Form" v-show="currentStep === 1" @submit.prevent>
              <div class="panel-title font-jakarta q-mb-xs">Your Information</div>
              <p class="panel-desc font-jakarta q-mb-xl">Fill in your personal details to create your account.</p>

              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-6">
                  <div class="field-label q-mb-xs">FULL NAME *</div>
                  <q-input
                    v-model="form.name"
                    placeholder="John Doe"
                    dark outlined color="blue-4"
                    class="nexus-field"
                    :rules="[v => !!v || 'Name is required']"
                  >
                    <template #prepend><q-icon name="badge" size="xs" color="blue-8" /></template>
                  </q-input>
                </div>
                <div class="col-12 col-sm-6">
                  <div class="field-label q-mb-xs">PHONE NUMBER</div>
                  <q-input
                    v-model="form.phone"
                    placeholder="+94 77 000 0000"
                    dark outlined color="blue-4"
                    class="nexus-field"
                  >
                    <template #prepend><q-icon name="phone" size="xs" color="blue-8" /></template>
                  </q-input>
                </div>
              </div>

              <div class="field-label q-mb-xs q-mt-md">EMAIL ADDRESS *</div>
              <q-input
                v-model="form.email"
                type="email"
                placeholder="you@nexuscare.lk"
                dark outlined color="blue-4"
                class="nexus-field q-mb-md"
                :rules="[v => !!v || 'Required', v => /.+@.+\..+/.test(v) || 'Invalid email']"
              >
                <template #prepend><q-icon name="alternate_email" size="xs" color="blue-8" /></template>
              </q-input>

              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-6">
                  <div class="field-label q-mb-xs">PASSWORD *</div>
                  <q-input
                    v-model="form.password"
                    :type="showPwd ? 'text' : 'password'"
                    placeholder="Min 6 characters"
                    dark outlined color="blue-4"
                    class="nexus-field"
                    :rules="[v => !!v || 'Required', v => v.length >= 6 || 'Min 6 chars']"
                  >
                    <template #prepend><q-icon name="lock_outline" size="xs" color="blue-8" /></template>
                    <template #append>
                      <q-icon :name="showPwd ? 'visibility_off' : 'visibility'" size="xs" color="blue-9" class="cursor-pointer" @click="showPwd = !showPwd" />
                    </template>
                  </q-input>
                </div>
                <div class="col-12 col-sm-6">
                  <div class="field-label q-mb-xs">CONFIRM PASSWORD *</div>
                  <q-input
                    v-model="form.confirmPassword"
                    :type="showPwd ? 'text' : 'password'"
                    placeholder="Re-enter password"
                    dark outlined color="blue-4"
                    class="nexus-field"
                    :rules="[v => v === form.password || 'Passwords do not match']"
                  >
                    <template #prepend><q-icon name="lock_reset" size="xs" color="blue-8" /></template>
                  </q-input>
                </div>
              </div>

              <div class="row q-gutter-sm q-mt-xl">
                <q-btn flat class="back-btn font-jakarta" @click="currentStep = 0">
                  <q-icon name="arrow_back" size="14px" class="q-mr-xs" />
                  Back
                </q-btn>
                <q-btn
                  unelevated
                  class="col action-btn font-jakarta"
                  :label="form.role === 'patient' ? 'Create Account' : 'Continue'"
                  :loading="form.role === 'patient' && loading"
                  @click="handleStep1"
                />
              </div>
            </q-form>

            <!-- ─── STEP 2: Doctor Credentials ─────────────────────── -->
            <q-form ref="step2Form" v-show="currentStep === 2 && form.role === 'doctor'" @submit.prevent>
              <div class="panel-title font-jakarta q-mb-xs">Professional Credentials</div>
              <p class="panel-desc font-jakarta q-mb-lg">These details will be reviewed by our admin team.</p>

              <!-- Verification notice -->
              <div class="notice-box q-pa-md q-mb-xl row items-start">
                <q-icon name="schedule" color="amber-4" class="q-mr-sm" size="sm" style="margin-top: 2px;" />
                <div>
                  <div class="font-jakarta text-amber-4 text-caption text-weight-bold q-mb-xs">Verification Required</div>
                  <div class="font-jakarta text-grey-5 text-caption">Your account will be reviewed before activation. This usually takes 24–48 hours.</div>
                </div>
              </div>

              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-6">
                  <div class="field-label q-mb-xs">SLMC REG. NUMBER *</div>
                  <q-input
                    v-model="form.registrationNumber"
                    placeholder="SLMC/12345"
                    dark outlined color="blue-4"
                    class="nexus-field"
                    :rules="[v => !!v || 'Required']"
                  >
                    <template #prepend><q-icon name="verified" size="xs" color="blue-8" /></template>
                  </q-input>
                </div>
                <div class="col-12 col-sm-6">
                  <div class="field-label q-mb-xs">SPECIALTY *</div>
                  <q-select
                    v-model="form.specialty"
                    :options="filteredSpecialties"
                    use-input input-debounce="0"
                    @filter="filterSpec"
                    placeholder="Select specialty"
                    dark outlined color="blue-4"
                    class="nexus-field"
                    behavior="menu"
                    :popup-content-style="dropdownStyle"
                    :rules="[v => !!v || 'Required']"
                  >
                    <template #prepend><q-icon name="stethoscope" size="xs" color="blue-8" /></template>
                  </q-select>
                </div>
              </div>

              <div class="row q-col-gutter-md q-mt-sm">
                <div class="col-12 col-sm-6">
                  <div class="field-label q-mb-xs">HOSPITAL / CLINIC</div>
                  <q-input
                    v-model="form.hospital"
                    placeholder="e.g. National Hospital Colombo"
                    dark outlined color="blue-4"
                    class="nexus-field"
                  >
                    <template #prepend><q-icon name="local_hospital" size="xs" color="blue-8" /></template>
                  </q-input>
                </div>
                <div class="col-12 col-sm-6">
                  <div class="field-label q-mb-xs">YEARS OF EXPERIENCE</div>
                  <q-input
                    v-model.number="form.experience"
                    type="number"
                    placeholder="e.g. 10"
                    dark outlined color="blue-4"
                    class="nexus-field"
                  >
                    <template #prepend><q-icon name="timeline" size="xs" color="blue-8" /></template>
                  </q-input>
                </div>
              </div>

              <div class="field-label q-mb-xs q-mt-md">QUALIFICATIONS (comma separated)</div>
              <q-input
                v-model="form.qualifications"
                placeholder="MBBS, MD, FRCS"
                dark outlined color="blue-4"
                class="nexus-field q-mb-md"
              >
                <template #prepend><q-icon name="school" size="xs" color="blue-8" /></template>
              </q-input>

              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-6">
                  <div class="field-label q-mb-xs">CONSULTATION FEE (LKR)</div>
                  <q-input
                    v-model.number="form.consultationFee"
                    type="number"
                    placeholder="e.g. 2500"
                    dark outlined color="blue-4"
                    class="nexus-field"
                  >
                    <template #prepend><q-icon name="payments" size="xs" color="blue-8" /></template>
                  </q-input>
                </div>
              </div>

              <div class="field-label q-mb-xs q-mt-md">SHORT BIO (max 500 chars)</div>
              <q-input
                v-model="form.bio"
                type="textarea"
                placeholder="Brief professional description..."
                dark outlined color="blue-4"
                class="nexus-field"
                :maxlength="500"
                counter
              />

              <div v-if="errorMsg" class="err-box q-pa-md q-mt-lg row items-center">
                <q-icon name="error_outline" color="red-4" size="sm" class="q-mr-sm" />
                <span class="text-red-4 font-jakarta text-caption">{{ errorMsg }}</span>
              </div>

              <div class="row q-gutter-sm q-mt-xl">
                <q-btn flat class="back-btn font-jakarta" @click="currentStep = 1">
                  <q-icon name="arrow_back" size="14px" class="q-mr-xs" />
                  Back
                </q-btn>
                <q-btn
                  unelevated
                  class="col action-btn font-jakarta"
                  label="Complete Registration"
                  :loading="loading"
                  @click="handleRegister"
                />
              </div>
            </q-form>

          </div>

          <!-- Card footer -->
          <div class="card-footer row items-center justify-between">
            <div class="row items-center q-gutter-xs">
              <div class="status-pulse"></div>
              <span class="font-jakarta text-caption text-grey-7">Secure Channel</span>
            </div>
            <span
              class="font-jakarta text-caption text-blue-4 cursor-pointer footer-link"
              @click="$router.push('/login')"
            >
              Already registered? Sign in →
            </span>
          </div>

        </div>

      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import axios from 'axios'

const router = useRouter()
const $q = useQuasar()

const currentStep = ref(0)
const loading = ref(false)
const showPwd = ref(false)
const errorMsg = ref('')
const step1Form = ref(null)
const step2Form = ref(null)

const steps = ['Role', 'Info', 'Credentials']

const roles = [
  { value: 'patient', title: 'Patient', icon: 'person_outline', color: '#3b82f6', desc: 'Book appointments, manage records, consult specialists' },
  { value: 'doctor', title: 'Doctor', icon: 'medical_services', color: '#0ea5e9', desc: 'Manage patients, issue prescriptions, set availability' }
]

const allSpecialties = [
  'Cardiologist', 'Dermatologist', 'ENT Specialist', 'General Practitioner',
  'Gastroenterologist', 'Neurologist', 'Obstetrician', 'Oncologist',
  'Ophthalmologist', 'Orthopedic Surgeon', 'Pediatrician', 'Psychiatrist',
  'Pulmonologist', 'Radiologist', 'Urologist', 'Endocrinologist'
]

const filteredSpecialties = ref([...allSpecialties])
const filterSpec = (val, update) => {
  update(() => {
    filteredSpecialties.value = allSpecialties.filter(s =>
      s.toLowerCase().includes(val.toLowerCase())
    )
  })
}

const dropdownStyle = {
  backgroundColor: '#070e1a',
  border: '1px solid rgba(59, 130, 246, 0.2)',
  boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
  zIndex: 9999
}

const form = reactive({
  role: 'patient',
  name: '', email: '', password: '', confirmPassword: '', phone: '',
  registrationNumber: '', specialty: '', hospital: '',
  experience: null, qualifications: '', consultationFee: null, bio: ''
})

const handleStep1 = async () => {
  const valid = await step1Form.value?.validate()
  if (!valid) return
  if (form.role === 'patient') {
    await handleRegister()
  } else {
    currentStep.value = 2
  }
}

const handleRegister = async () => {
  errorMsg.value = ''
  loading.value = true

  try {
    const payload = {
      name: form.name, email: form.email,
      password: form.password, phone: form.phone, role: form.role
    }

    if (form.role === 'doctor') {
      Object.assign(payload, {
        registrationNumber: form.registrationNumber,
        specialty: form.specialty,
        hospital: form.hospital,
        experience: form.experience,
        qualifications: form.qualifications,
        consultationFee: form.consultationFee,
        bio: form.bio
      })
    }

    const { data } = await axios.post('http://localhost:5001/api/auth/register', payload)

    if (data.success) {
      if (form.role === 'patient') {
        localStorage.setItem('nexus_token', data.token)
        localStorage.setItem('nexus_user', JSON.stringify(data.user))
        $q.notify({ icon: 'check_circle', color: 'blue-9', message: `Welcome to Nexus Care, ${data.user.name}!`, position: 'top-right', timeout: 2500 })
        router.push('/patient/dashboard')
      } else {
        $q.notify({ icon: 'schedule', color: 'orange-9', message: 'Registration complete. Awaiting admin verification.', position: 'top-right', timeout: 4000 })
        router.push('/login')
      }
    }
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Registration failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }

/* Page */
.register-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at 50% 20%, rgba(37, 99, 235, 0.14), transparent 55%),
    radial-gradient(circle at 12% 82%, rgba(56, 189, 248, 0.08), transparent 50%),
    radial-gradient(circle at 86% 78%, rgba(29, 78, 216, 0.08), transparent 46%),
    #040812;
}

/* Ambient */
.ambient-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.ambient-orb { position: absolute; border-radius: 50%; filter: blur(130px); pointer-events: none; }
.orb-top {
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.1), transparent 70%);
  top: -25%; left: 50%; transform: translateX(-50%);
}
.orb-mid {
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(37, 99, 235, 0.07), transparent 70%);
  top: 40%; left: -10%;
}
.orb-bottom {
  width: 350px; height: 350px;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.06), transparent 70%);
  bottom: -10%; right: -5%;
}

/* Grid */
.grid-overlay {
  position: fixed; inset: 0;
  background-image:
    linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  mask-image: radial-gradient(ellipse at top center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%);
  -webkit-mask-image: radial-gradient(ellipse at top center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%);
  z-index: 1; pointer-events: none;
}

/* Scroll wrap */
.register-scroll-wrap {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 48px 20px 72px;
  position: relative;
  z-index: 10;
}

.register-wrapper { width: 100%; max-width: 580px; }

/* Brand */
.logo-circle {
  width: 38px; height: 38px;
  background: linear-gradient(135deg, #3b82f6, #0ea5e9);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.5);
  flex-shrink: 0;
}
.logo-letter {
  color: white; font-weight: 800; font-size: 18px;
  font-family: 'Plus Jakarta Sans', sans-serif;
}
.brand-name { font-size: 1.4rem; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
.brand-tagline {
  font-size: 0.65rem; letter-spacing: 2.5px;
  color: rgba(148, 163, 184, 0.7); font-weight: 600; text-transform: uppercase;
}

/* Card */
.register-card {
  background: linear-gradient(160deg, rgba(10, 18, 38, 0.88), rgba(7, 15, 32, 0.78));
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 0 0 1px rgba(255,255,255,0.04), 0 40px 80px rgba(0,0,0,0.62), inset 0 1px 0 rgba(255,255,255,0.08);
  backdrop-filter: blur(24px) saturate(130%);
}

.card-top-glow {
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.78) 30%, rgba(14,165,233,0.88) 50%, rgba(59,130,246,0.78) 70%, transparent 100%);
}

.card-body { padding: 40px 40px 32px; }

/* Step progress */
.step-progress { position: relative; }
.step-track {
  height: 2px;
  background: rgba(255,255,255,0.07);
  border-radius: 4px;
  position: relative;
  overflow: visible;
  margin: 0 14px;
}
.step-fill {
  height: 100%;
  background: linear-gradient(90deg, #2563eb, #0ea5e9);
  border-radius: 4px;
  transition: width 0.5s cubic-bezier(0.65, 0, 0.35, 1);
  box-shadow: 0 0 8px rgba(37, 99, 235, 0.6);
}

.step-item { flex: 1; }
.step-dot {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.65rem; font-weight: 700;
  font-family: 'Plus Jakarta Sans', sans-serif;
  transition: all 0.3s ease;
  margin: 0 auto;
}
.step-item--done .step-dot {
  background: rgba(37,99,235,0.2);
  border: 1.5px solid rgba(59,130,246,0.8);
  color: #60a5fa;
  box-shadow: 0 0 12px rgba(59,130,246,0.3);
}
.step-item--active .step-dot {
  background: rgba(37,99,235,0.25);
  border: 1.5px solid #3b82f6;
  color: #93c5fd;
  box-shadow: 0 0 16px rgba(59,130,246,0.4);
}
.step-item--pending .step-dot {
  background: rgba(255,255,255,0.03);
  border: 1.5px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.25);
}
.step-label {
  font-size: 0.62rem; letter-spacing: 0.5px;
  font-weight: 700; text-transform: uppercase;
}
.step-item--done .step-label,
.step-item--active .step-label { color: #93c5fd; }
.step-item--pending .step-label { color: rgba(255,255,255,0.2); }

/* Panel */
.panel-title { font-size: 1.5rem; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
.panel-desc { font-size: 0.85rem; color: rgba(148,163,184,0.7); line-height: 1.6; }

/* Field label */
.field-label {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.62rem; letter-spacing: 2px;
  color: rgba(148,163,184,0.6); font-weight: 700; text-transform: uppercase;
}

/* Inputs */
.nexus-field :deep(.q-field__control) {
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.56);
  border: 1px solid rgba(148, 163, 184, 0.2);
  transition: all 0.3s ease;
}
.nexus-field :deep(.q-field__control:hover),
.nexus-field :deep(.q-field--focused .q-field__control) {
  background: rgba(59,130,246,0.08);
  border-color: rgba(96, 165, 250, 0.5);
}

.nexus-field :deep(.q-field--focused .q-field__control) {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

/* Role cards */
.role-card {
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 20px;
  background: rgba(255,255,255,0.02);
  transition: all 0.3s ease;
  text-align: center;
}
.role-card:hover {
  border-color: rgba(59,130,246,0.25);
  background: rgba(59,130,246,0.04);
  transform: translateY(-3px);
}
.role-card--active {
  border-color: rgba(59,130,246,0.45) !important;
  background: rgba(59,130,246,0.08) !important;
  box-shadow: 0 0 24px rgba(37,99,235,0.15);
  transform: translateY(-3px);
}
.role-icon-wrap {
  width: 68px; height: 68px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto;
  transition: all 0.3s ease;
}
.role-card:hover .role-icon-wrap,
.role-card--active .role-icon-wrap { transform: scale(1.05); }
.role-title { font-size: 0.95rem; font-weight: 800; color: #fff; letter-spacing: 0.3px; }
.role-desc { font-size: 0.72rem; color: rgba(148,163,184,0.6); line-height: 1.5; }

/* Buttons */
.action-btn {
  background: linear-gradient(135deg, #1d4ed8, #2563eb) !important;
  color: #fff !important;
  border-radius: 14px !important;
  height: 50px;
  font-size: 0.85rem; font-weight: 700;
  box-shadow: 0 8px 24px rgba(37,99,235,0.35);
  transition: all 0.3s ease;
  letter-spacing: 0.3px;
}
.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(37,99,235,0.5);
}

.action-btn:active {
  transform: translateY(0);
}

.back-btn {
  border-radius: 14px !important;
  color: rgba(148,163,184,0.6) !important;
  font-size: 0.8rem; font-weight: 600;
  transition: color 0.2s;
  padding: 0 18px;
}
.back-btn:hover { color: rgba(255,255,255,0.8) !important; }

/* Notice box */
.notice-box {
  background: rgba(245,158,11,0.06);
  border: 1px solid rgba(245,158,11,0.2);
  border-radius: 14px;
}

/* Error */
.err-box {
  background: rgba(239,68,68,0.07);
  border: 1px solid rgba(239,68,68,0.2);
  border-radius: 12px;
}

/* Footer */
.card-footer {
  padding: 14px 40px;
  background: rgba(0,0,0,0.2);
  border-top: 1px solid rgba(255,255,255,0.04);
}
.status-pulse {
  width: 7px; height: 7px; border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 8px rgba(52,211,153,0.8);
  animation: pulse 2.5s ease-in-out infinite;
}
@keyframes pulse {
  0%,100%{opacity:1; transform:scale(1);}
  50%{opacity:0.6; transform:scale(0.85);}
}

.footer-link:hover { text-shadow: 0 0 12px rgba(59,130,246,0.5); }
.z-top { z-index: 10; }

@media (max-width: 480px) {
  .card-body { padding: 28px 22px 22px; }
  .card-footer { padding: 12px 22px; }
  .register-scroll-wrap { padding: 32px 16px 60px; }
}
</style>
