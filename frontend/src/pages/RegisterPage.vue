<template>
  <q-page class="bg-black overflow-hidden">

    <!-- Background grid -->
    <div class="grid-overlay"></div>

    <!-- Glow orbs -->
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>

    <div class="register-scroll-wrap">
      <div class="register-container">

        <!-- Logo -->
        <div class="text-center q-mb-lg">
          <div class="nexus-logo">NEXUS<span class="text-cyan-4">CARE</span></div>
          <div class="font-orbitron text-cyan-8 logo-sub q-mt-xs">◈ NODE REGISTRATION ◈</div>
        </div>

        <!-- Card -->
        <q-card flat class="glass-card">
          <div class="card-accent-bar"></div>

          <div class="q-pa-xl">

            <!-- Step indicator -->
            <div class="row items-center justify-center q-mb-xl">
              <div
                v-for="(step, i) in steps" :key="i"
                class="row items-center"
              >
                <div
                  class="step-circle font-orbitron"
                  :class="currentStep >= i ? 'step-active' : 'step-inactive'"
                >
                  <q-icon v-if="currentStep > i" name="check" size="xs" />
                  <span v-else>{{ i + 1 }}</span>
                </div>
                <div class="step-label font-orbitron text-caption q-mx-xs" :class="currentStep >= i ? 'text-cyan-4' : 'text-grey-8'">
                  {{ step }}
                </div>
                <div v-if="i < steps.length - 1" class="step-line" :class="currentStep > i ? 'step-line-done' : ''"></div>
              </div>
            </div>

            <!-- Role selector (step 0) -->
            <div v-show="currentStep === 0">
              <div class="section-title q-mb-lg">SELECT YOUR ROLE</div>
              <div class="row q-col-gutter-md">
                <div
                  v-for="r in roles" :key="r.value"
                  class="col-12 col-sm-6"
                  @click="form.role = r.value"
                >
                  <div class="role-card cursor-pointer q-pa-lg text-center" :class="form.role === r.value ? 'role-card-active' : ''">
                    <div class="role-icon-wrap q-mb-md" :style="{ background: `${r.color}18`, border: `1px solid ${r.color}40` }">
                      <q-icon :name="r.icon" size="2.5rem" :style="{ color: r.color }" />
                    </div>
                    <div class="text-white font-orbitron text-subtitle2">{{ r.title }}</div>
                    <div class="text-grey-6 text-caption q-mt-xs">{{ r.desc }}</div>
                    <div v-if="form.role === r.value" class="role-selected-badge font-orbitron q-mt-sm">
                      SELECTED ✓
                    </div>
                  </div>
                </div>
              </div>

              <q-btn
                class="full-width nexus-btn q-mt-xl font-orbitron"
                label="CONTINUE →"
                @click="currentStep = 1"
              />
            </div>

            <!-- Basic info (step 1) -->
            <q-form ref="step1Form" v-show="currentStep === 1" @submit.prevent>
              <div class="section-title q-mb-lg">BASIC INFORMATION</div>

              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-6">
                  <div class="field-label q-mb-xs">FULL NAME *</div>
                  <q-input
                    v-model="form.name" placeholder="Enter your full name"
                    dark outlined color="cyan-4" class="nexus-field"
                    :rules="[v => !!v || 'Name is required']"
                  >
                    <template #prepend><q-icon name="badge" size="xs" color="cyan-8" /></template>
                  </q-input>
                </div>
                <div class="col-12 col-sm-6">
                  <div class="field-label q-mb-xs">PHONE NUMBER</div>
                  <q-input
                    v-model="form.phone" placeholder="+94 77 000 0000"
                    dark outlined color="cyan-4" class="nexus-field"
                  >
                    <template #prepend><q-icon name="phone" size="xs" color="cyan-8" /></template>
                  </q-input>
                </div>
              </div>

              <div class="field-label q-mb-xs q-mt-md">EMAIL ADDRESS *</div>
              <q-input
                v-model="form.email" type="email" placeholder="you@nexuscare.lk"
                dark outlined color="cyan-4" class="nexus-field q-mb-md"
                :rules="[v => !!v || 'Required', v => /.+@.+\..+/.test(v) || 'Invalid email']"
              >
                <template #prepend><q-icon name="alternate_email" size="xs" color="cyan-8" /></template>
              </q-input>

              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-6">
                  <div class="field-label q-mb-xs">PASSWORD *</div>
                  <q-input
                    v-model="form.password" :type="showPwd ? 'text' : 'password'"
                    placeholder="Min 6 characters"
                    dark outlined color="cyan-4" class="nexus-field"
                    :rules="[v => !!v || 'Required', v => v.length >= 6 || 'Min 6 chars']"
                  >
                    <template #prepend><q-icon name="lock" size="xs" color="cyan-8" /></template>
                    <template #append>
                      <q-icon :name="showPwd ? 'visibility_off' : 'visibility'" size="xs" color="cyan-9" class="cursor-pointer" @click="showPwd = !showPwd" />
                    </template>
                  </q-input>
                </div>
                <div class="col-12 col-sm-6">
                  <div class="field-label q-mb-xs">CONFIRM PASSWORD *</div>
                  <q-input
                    v-model="form.confirmPassword" :type="showPwd ? 'text' : 'password'"
                    placeholder="Re-enter password"
                    dark outlined color="cyan-4" class="nexus-field"
                    :rules="[v => v === form.password || 'Passwords do not match']"
                  >
                    <template #prepend><q-icon name="lock_reset" size="xs" color="cyan-8" /></template>
                  </q-input>
                </div>
              </div>

              <div class="row q-gutter-sm q-mt-xl">
                <q-btn flat label="← BACK" color="grey-7" class="font-orbitron" @click="currentStep = 0" />
                <q-btn
                  class="col nexus-btn font-orbitron"
                  :label="form.role === 'patient' ? 'REGISTER NODE' : 'CONTINUE →'"
                  :loading="form.role === 'patient' && loading"
                  @click="handleStep1"
                />
              </div>
            </q-form>

            <!-- Doctor details (step 2 - only for doctors) -->
            <q-form ref="step2Form" v-show="currentStep === 2 && form.role === 'doctor'" @submit.prevent>
              <div class="section-title q-mb-lg">PROFESSIONAL CREDENTIALS</div>

              <!-- Verification notice -->
              <div class="notice-box q-pa-md q-mb-lg row items-start">
                <q-icon name="info" color="orange-4" class="q-mr-sm q-mt-xs" size="sm" />
                <div>
                  <div class="text-orange-4 font-orbitron text-caption uppercase q-mb-xs">Verification Required</div>
                  <div class="text-grey-5 text-caption">Your account will be reviewed by an admin before activation. This usually takes 24-48 hours.</div>
                </div>
              </div>

              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-6">
                  <div class="field-label q-mb-xs">SLMC REG. NUMBER *</div>
                  <q-input
                    v-model="form.registrationNumber" placeholder="SLMC/12345"
                    dark outlined color="cyan-4" class="nexus-field"
                    :rules="[v => !!v || 'Required']"
                  >
                    <template #prepend><q-icon name="verified" size="xs" color="cyan-8" /></template>
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
                    dark outlined color="cyan-4" class="nexus-field"
                    behavior="menu"
                    :popup-content-style="dropdownStyle"
                    :rules="[v => !!v || 'Required']"
                  >
                    <template #prepend><q-icon name="stethoscope" size="xs" color="cyan-8" /></template>
                  </q-select>
                </div>
              </div>

              <div class="row q-col-gutter-md q-mt-sm">
                <div class="col-12 col-sm-6">
                  <div class="field-label q-mb-xs">HOSPITAL / CLINIC</div>
                  <q-input
                    v-model="form.hospital" placeholder="e.g. National Hospital Colombo"
                    dark outlined color="cyan-4" class="nexus-field"
                  >
                    <template #prepend><q-icon name="local_hospital" size="xs" color="cyan-8" /></template>
                  </q-input>
                </div>
                <div class="col-12 col-sm-6">
                  <div class="field-label q-mb-xs">YEARS OF EXPERIENCE</div>
                  <q-input
                    v-model.number="form.experience" type="number" placeholder="e.g. 10"
                    dark outlined color="cyan-4" class="nexus-field"
                  >
                    <template #prepend><q-icon name="timeline" size="xs" color="cyan-8" /></template>
                  </q-input>
                </div>
              </div>

              <div class="field-label q-mb-xs q-mt-md">QUALIFICATIONS (comma separated)</div>
              <q-input
                v-model="form.qualifications" placeholder="MBBS, MD, FRCS"
                dark outlined color="cyan-4" class="nexus-field q-mb-md"
              >
                <template #prepend><q-icon name="school" size="xs" color="cyan-8" /></template>
              </q-input>

              <div class="field-label q-mb-xs">CONSULTATION FEE (LKR)</div>
              <q-input
                v-model.number="form.consultationFee" type="number" placeholder="e.g. 2500"
                dark outlined color="cyan-4" class="nexus-field q-mb-md"
              >
                <template #prepend><q-icon name="payments" size="xs" color="cyan-8" /></template>
              </q-input>

              <div class="field-label q-mb-xs">SHORT BIO (max 500 chars)</div>
              <q-input
                v-model="form.bio" type="textarea" placeholder="Brief professional description..."
                dark outlined color="cyan-4" class="nexus-field"
                :maxlength="500" counter
              />

              <!-- Error -->
              <div v-if="errorMsg" class="err-box q-pa-sm q-mt-md row items-center">
                <q-icon name="warning" color="red-4" size="sm" class="q-mr-sm" />
                <span class="text-red-4 font-orbitron text-caption">{{ errorMsg }}</span>
              </div>

              <div class="row q-gutter-sm q-mt-xl">
                <q-btn flat label="← BACK" color="grey-7" class="font-orbitron" @click="currentStep = 1" />
                <q-btn
                  class="col nexus-btn font-orbitron"
                  label="REGISTER NODE"
                  :loading="loading"
                  @click="handleRegister"
                />
              </div>
            </q-form>

          </div>

          <!-- Status bar -->
          <div class="card-status-bar row items-center justify-between q-px-lg q-py-xs">
            <div class="row items-center q-gutter-xs">
              <div class="status-dot"></div>
              <span class="font-orbitron text-caption text-grey-7">SECURE CHANNEL</span>
            </div>
            <span
              class="font-orbitron text-caption text-cyan-4 cursor-pointer link-hover"
              @click="$router.push('/login')"
            >
              ALREADY REGISTERED? →
            </span>
          </div>
        </q-card>

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

const steps = ['ROLE', 'INFO', 'CREDENTIALS']

const roles = [
  { value: 'patient', title: 'PATIENT', icon: 'person_outline', color: '#00bcd4', desc: 'Register, book appointments, manage health records' },
  { value: 'doctor', title: 'DOCTOR', icon: 'medical_services', color: '#ef5350', desc: 'Manage patients, issue prescriptions, set availability' }
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
    filteredSpecialties.value = allSpecialties.filter(s => s.toLowerCase().includes(val.toLowerCase()))
  })
}

const dropdownStyle = {
  backgroundColor: '#020d0f',
  border: '1px solid rgba(0,229,255,0.3)',
  boxShadow: '0 0 20px rgba(0,229,255,0.15)',
  zIndex: 9999
}

const form = reactive({
  role: 'patient',
  name: '', email: '', password: '', confirmPassword: '', phone: '',
  // Doctor fields
  registrationNumber: '', specialty: '', hospital: '',
  experience: null, qualifications: '', consultationFee: null, bio: ''
})

// Step 1 next handler
const handleStep1 = async () => {
  const valid = await step1Form.value?.validate()
  if (!valid) return

  if (form.role === 'patient') {
    await handleRegister()
  } else {
    currentStep.value = 2
  }
}

// Final register
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
        $q.notify({ icon: 'check_circle', color: 'cyan-9', message: `Welcome, ${data.user.name}!`, position: 'top-right', timeout: 2500 })
        router.push('/patient/dashboard')
      } else {
        $q.notify({
          icon: 'pending', color: 'orange-9',
          message: 'Registration complete. Awaiting admin verification.',
          position: 'top-right', timeout: 4000
        })
        router.push('/login')
      }
    }
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Registration failed. Try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700&display=swap');
.font-orbitron { font-family: 'Orbitron', sans-serif; }

.bg-black { background: #020608; }

/* Scroll wrapper - ensures page scrolls on mobile */
.register-scroll-wrap {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 16px 60px;
  position: relative;
  z-index: 10;
}
.register-container { width: 100%; max-width: 600px; }

/* Grid overlay */
.grid-overlay {
  position: fixed; inset: 0;
  background-image:
    linear-gradient(rgba(0,229,255,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,229,255,0.025) 1px, transparent 1px);
  background-size: 50px 50px;
  z-index: 1; pointer-events: none;
}

/* Orbs */
.orb { position: fixed; border-radius: 50%; filter: blur(100px); opacity: 0.07; pointer-events: none; z-index: 0; }
.orb-1 { width: 500px; height: 500px; background: #00e5ff; top: -20%; right: -15%; }
.orb-2 { width: 400px; height: 400px; background: #1565c0; bottom: -15%; left: -10%; }

/* Logo */
.nexus-logo {
  font-family: 'Orbitron', sans-serif;
  font-size: clamp(1.8rem, 5vw, 2.8rem);
  font-weight: 700; color: #fff;
  letter-spacing: 6px;
  text-shadow: 0 0 25px rgba(0,229,255,0.4);
}
.logo-sub { font-size: 0.58rem; letter-spacing: 4px; }

/* Card */
.glass-card {
  background: rgba(6, 14, 16, 0.9) !important;
  backdrop-filter: blur(24px);
  border: 1px solid rgba(0,229,255,0.12);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 0 60px rgba(0,229,255,0.04), 0 30px 60px rgba(0,0,0,0.5);
}
.card-accent-bar { height: 3px; background: linear-gradient(90deg, transparent, #00e5ff, #00bcd4, transparent); }
.card-status-bar { background: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.04); }

/* Steps */
.step-circle {
  width: 28px; height: 28px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.65rem;
  transition: all 0.3s;
}
.step-active { background: rgba(0,229,255,0.15); border: 1px solid #00e5ff; color: #00e5ff; }
.step-inactive { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.3); }
.step-label { font-size: 0.55rem; letter-spacing: 1.5px; }
.step-line { width: 30px; height: 1px; background: rgba(255,255,255,0.1); margin: 0 4px; }
.step-line-done { background: rgba(0,229,255,0.4); }

/* Section title */
.section-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.65rem; letter-spacing: 3px;
  color: rgba(0,229,255,0.5);
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(0,229,255,0.08);
}

/* Field label */
.field-label { font-family: 'Orbitron', sans-serif; font-size: 0.58rem; letter-spacing: 2px; color: rgba(0,229,255,0.45); }

/* Input */
.nexus-field :deep(.q-field__control) {
  border-radius: 10px;
  background: rgba(0,229,255,0.025);
}

/* Role cards */
.role-card {
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px;
  transition: all 0.3s ease;
  background: rgba(255,255,255,0.02);
}
.role-card:hover { border-color: rgba(0,229,255,0.2); background: rgba(0,229,255,0.03); }
.role-card-active { border-color: rgba(0,229,255,0.4) !important; background: rgba(0,229,255,0.06) !important; }
.role-icon-wrap { width: 70px; height: 70px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; }
.role-selected-badge { font-size: 0.6rem; letter-spacing: 2px; color: #00e5ff; }

/* Buttons */
.nexus-btn {
  background: linear-gradient(135deg, #00494f, #006064 40%, #007c80);
  color: #fff !important;
  border-radius: 10px;
  font-size: 0.72rem; letter-spacing: 2.5px;
  box-shadow: 0 4px 20px rgba(0,188,212,0.15);
  transition: all 0.3s ease;
  padding: 12px;
}
.nexus-btn:hover { box-shadow: 0 4px 30px rgba(0,188,212,0.35); transform: translateY(-1px); }

/* Notice box */
.notice-box { background: rgba(255,152,0,0.05); border: 1px solid rgba(255,152,0,0.2); border-radius: 10px; }

/* Error box */
.err-box { background: rgba(229,57,53,0.06); border: 1px solid rgba(229,57,53,0.2); border-radius: 8px; }

/* Status */
.status-dot { width: 6px; height: 6px; border-radius: 50%; background: #00e676; box-shadow: 0 0 6px #00e676; animation: blink 2s infinite; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }

.link-hover:hover { text-shadow: 0 0 10px rgba(0,229,255,0.5); }
</style>