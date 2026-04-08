<template>
  <div class="register-root font-jakarta">
    <!-- Animated background -->
    <div class="bg-layer">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
      <div class="grid-overlay"></div>
    </div>

    <div class="register-wrapper">
      <!-- Top bar -->
      <div class="topbar">
        <div class="topbar-logo" @click="$router.push('/')">
          <div class="logo-circle">
            <span class="logo-letter">N</span>
          </div>
          <span class="brand-name">Nexus Care</span>
        </div>
        <div class="topbar-action">
          Already have an account?
          <span class="link-text q-ml-xs" @click="$router.push('/login')">Sign in</span>
        </div>
      </div>

      <!-- Main content -->
      <div class="register-content">
        <!-- Step indicator -->
        <div class="step-indicator q-mb-xl">
          <div class="step-item" :class="{ active: currentStep >= 1, done: currentStep > 1 }">
            <div class="step-dot">
              <q-icon v-if="currentStep > 1" name="check" size="14px" />
              <span v-else>1</span>
            </div>
            <span class="step-label">Choose Role</span>
          </div>
          <div class="step-line" :class="{ active: currentStep > 1 }"></div>
          <div class="step-item" :class="{ active: currentStep >= 2, done: currentStep > 2 }">
            <div class="step-dot">
              <q-icon v-if="currentStep > 2" name="check" size="14px" />
              <span v-else>2</span>
            </div>
            <span class="step-label">Your Details</span>
          </div>
          <div class="step-line" :class="{ active: currentStep > 2 }"></div>
          <div class="step-item" :class="{ active: currentStep >= 3 }">
            <div class="step-dot"><span>3</span></div>
            <span class="step-label">Complete</span>
          </div>
        </div>

        <!-- STEP 1: Role Selection -->
        <transition name="slide-fade" mode="out-in">
          <div v-if="currentStep === 1" key="step1" class="step-content">
            <div class="step-header q-mb-xl">
              <h2 class="step-title">Join Nexus Care</h2>
              <p class="step-sub">Select your account type to get started</p>
            </div>

            <div class="role-cards">
              <div
                class="role-card"
                :class="{ selected: form.role === 'patient' }"
                @click="selectRole('patient')"
              >
                <div class="role-card-glow patient-glow"></div>
                <div class="role-icon-wrap patient-icon">
                  <q-icon name="person_outline" size="32px" />
                </div>
                <div class="role-info">
                  <div class="role-title">Patient</div>
                  <div class="role-desc">Book appointments, attend video consultations, manage health records and prescriptions.</div>
                </div>
                <div class="role-features">
                  <div class="role-feature"><q-icon name="check_circle" size="14px" color="blue-4" /><span>Book Appointments</span></div>
                  <div class="role-feature"><q-icon name="check_circle" size="14px" color="blue-4" /><span>Video Consultations</span></div>
                  <div class="role-feature"><q-icon name="check_circle" size="14px" color="blue-4" /><span>Medical Records</span></div>
                  <div class="role-feature"><q-icon name="check_circle" size="14px" color="blue-4" /><span>AI Symptom Checker</span></div>
                </div>
                <div class="role-select-indicator">
                  <div class="radio-outer">
                    <div class="radio-inner" v-if="form.role === 'patient'"></div>
                  </div>
                </div>
              </div>

              <div
                class="role-card"
                :class="{ selected: form.role === 'doctor' }"
                @click="selectRole('doctor')"
              >
                <div class="role-card-glow doctor-glow"></div>
                <div class="role-icon-wrap doctor-icon">
                  <q-icon name="medical_services" size="32px" />
                </div>
                <div class="role-info">
                  <div class="role-title">Doctor</div>
                  <div class="role-desc">Manage your practice, conduct telemedicine sessions, and issue digital prescriptions.</div>
                </div>
                <div class="role-features">
                  <div class="role-feature"><q-icon name="check_circle" size="14px" color="teal-4" /><span>Manage Schedule</span></div>
                  <div class="role-feature"><q-icon name="check_circle" size="14px" color="teal-4" /><span>Telemedicine Sessions</span></div>
                  <div class="role-feature"><q-icon name="check_circle" size="14px" color="teal-4" /><span>Issue Prescriptions</span></div>
                  <div class="role-feature"><q-icon name="check_circle" size="14px" color="teal-4" /><span>Patient Records Access</span></div>
                </div>
                <div class="role-select-indicator">
                  <div class="radio-outer doctor-radio">
                    <div class="radio-inner" v-if="form.role === 'doctor'"></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="step-actions q-mt-xl">
              <button class="next-btn" :disabled="!form.role" @click="goStep(2)">
                Continue
                <q-icon name="arrow_forward" size="18px" class="q-ml-sm" />
              </button>
            </div>
          </div>
        </transition>

        <!-- STEP 2: Details Form -->
        <transition name="slide-fade" mode="out-in">
          <div v-if="currentStep === 2" key="step2" class="step-content">
            <div class="step-header q-mb-xl">
              <div class="role-badge" :class="form.role + '-badge'">
                <q-icon :name="form.role === 'patient' ? 'person' : 'medical_services'" size="16px" class="q-mr-xs" />
                {{ form.role === 'patient' ? 'Patient' : 'Doctor' }} Registration
              </div>
              <h2 class="step-title q-mt-md">Your Details</h2>
              <p class="step-sub">Fill in your information to create your account</p>
            </div>

            <!-- Error alert -->
            <div v-if="errorMessage" class="error-alert q-mb-lg">
              <q-icon name="error_outline" size="18px" class="q-mr-sm" />
              <span>{{ errorMessage }}</span>
            </div>

            <q-form @submit.prevent="handleSubmit" class="register-form">
              <div class="form-grid">
                <!-- Common Fields -->
                <div class="field-group full">
                  <label class="field-label">Full Name *</label>
                  <div class="field-wrapper" :class="{ 'field-error': v$.name.$error, 'field-focused': focusedField === 'name' }">
                    <q-icon name="badge" size="20px" class="field-icon" />
                    <input v-model="form.name" type="text" placeholder="Dr. John Silva / Jane Perera"
                      class="field-input" @focus="focusedField = 'name'" @blur="focusedField = ''; v$.name.$touch()" />
                  </div>
                  <div v-if="v$.name.$error" class="field-error-msg">{{ v$.name.$errors[0].$message }}</div>
                </div>

                <div class="field-group">
                  <label class="field-label">Email Address *</label>
                  <div class="field-wrapper" :class="{ 'field-error': v$.email.$error, 'field-focused': focusedField === 'email' }">
                    <q-icon name="mail_outline" size="20px" class="field-icon" />
                    <input v-model="form.email" type="email" placeholder="you@example.com"
                      class="field-input" @focus="focusedField = 'email'" @blur="focusedField = ''; v$.email.$touch()" />
                  </div>
                  <div v-if="v$.email.$error" class="field-error-msg">{{ v$.email.$errors[0].$message }}</div>
                </div>

                <div class="field-group">
                  <label class="field-label">Phone Number</label>
                  <div class="field-wrapper" :class="{ 'field-focused': focusedField === 'phone' }">
                    <q-icon name="phone" size="20px" class="field-icon" />
                    <input v-model="form.phone" type="tel" placeholder="+94 77 123 4567"
                      class="field-input" @focus="focusedField = 'phone'" @blur="focusedField = ''" />
                  </div>
                </div>

                <div class="field-group">
                  <label class="field-label">Password *</label>
                  <div class="field-wrapper" :class="{ 'field-error': v$.password.$error, 'field-focused': focusedField === 'password' }">
                    <q-icon name="lock_outline" size="20px" class="field-icon" />
                    <input v-model="form.password" :type="showPw ? 'text' : 'password'" placeholder="Min. 6 characters"
                      class="field-input" @focus="focusedField = 'password'" @blur="focusedField = ''; v$.password.$touch()" />
                    <button type="button" class="toggle-pw" @click="showPw = !showPw">
                      <q-icon :name="showPw ? 'visibility_off' : 'visibility'" size="18px" />
                    </button>
                  </div>
                  <div v-if="v$.password.$error" class="field-error-msg">{{ v$.password.$errors[0].$message }}</div>
                  <!-- Password strength -->
                  <div class="pw-strength q-mt-sm" v-if="form.password">
                    <div class="pw-bars">
                      <div class="pw-bar" :class="{ active: pwStrength >= 1, 'bar-weak': pwStrength === 1 }"></div>
                      <div class="pw-bar" :class="{ active: pwStrength >= 2, 'bar-medium': pwStrength === 2 }"></div>
                      <div class="pw-bar" :class="{ active: pwStrength >= 3, 'bar-strong': pwStrength >= 3 }"></div>
                    </div>
                    <span class="pw-label" :class="'pw-' + pwStrengthLabel.toLowerCase()">{{ pwStrengthLabel }}</span>
                  </div>
                </div>

                <div class="field-group">
                  <label class="field-label">Confirm Password *</label>
                  <div class="field-wrapper" :class="{ 'field-error': v$.confirmPassword.$error, 'field-focused': focusedField === 'confirmPassword' }">
                    <q-icon name="lock_outline" size="20px" class="field-icon" />
                    <input v-model="form.confirmPassword" :type="showPw2 ? 'text' : 'password'" placeholder="Re-enter password"
                      class="field-input" @focus="focusedField = 'confirmPassword'" @blur="focusedField = ''; v$.confirmPassword.$touch()" />
                    <button type="button" class="toggle-pw" @click="showPw2 = !showPw2">
                      <q-icon :name="showPw2 ? 'visibility_off' : 'visibility'" size="18px" />
                    </button>
                  </div>
                  <div v-if="v$.confirmPassword.$error" class="field-error-msg">{{ v$.confirmPassword.$errors[0].$message }}</div>
                </div>

                <!-- Doctor-specific fields -->
                <template v-if="form.role === 'doctor'">
                  <div class="doctor-section full">
                    <div class="section-divider">
                      <span>Professional Information</span>
                    </div>
                  </div>

                  <div class="field-group">
                    <label class="field-label">SLMC Registration Number *</label>
                    <div class="field-wrapper" :class="{ 'field-error': v$.registrationNumber.$error, 'field-focused': focusedField === 'reg' }">
                      <q-icon name="assignment_ind" size="20px" class="field-icon" />
                      <input v-model="form.registrationNumber" type="text" placeholder="SLMC/XXXX/XXXX"
                        class="field-input" @focus="focusedField = 'reg'" @blur="focusedField = ''; v$.registrationNumber.$touch()" />
                    </div>
                    <div v-if="v$.registrationNumber.$error" class="field-error-msg">{{ v$.registrationNumber.$errors[0].$message }}</div>
                  </div>

                  <div class="field-group">
                    <label class="field-label">Medical Specialty *</label>
                    <div class="field-wrapper" :class="{ 'field-error': v$.specialty.$error, 'field-focused': focusedField === 'specialty' }">
                      <q-icon name="local_hospital" size="20px" class="field-icon" />
                      <select v-model="form.specialty" class="field-input field-select"
                        @focus="focusedField = 'specialty'" @blur="focusedField = ''; v$.specialty.$touch()">
                        <option value="" disabled>Select specialty</option>
                        <option v-for="s in specialties" :key="s" :value="s">{{ s }}</option>
                      </select>
                      <q-icon name="expand_more" size="18px" class="field-icon-right" />
                    </div>
                    <div v-if="v$.specialty.$error" class="field-error-msg">{{ v$.specialty.$errors[0].$message }}</div>
                  </div>

                  <div class="field-group">
                    <label class="field-label">Sub-Specialty</label>
                    <div class="field-wrapper" :class="{ 'field-focused': focusedField === 'subSpec' }">
                      <q-icon name="biotech" size="20px" class="field-icon" />
                      <input v-model="form.subSpecialty" type="text" placeholder="e.g. Interventional Cardiology"
                        class="field-input" @focus="focusedField = 'subSpec'" @blur="focusedField = ''" />
                    </div>
                  </div>

                  <div class="field-group">
                    <label class="field-label">Years of Experience</label>
                    <div class="field-wrapper" :class="{ 'field-focused': focusedField === 'exp' }">
                      <q-icon name="workspace_premium" size="20px" class="field-icon" />
                      <input v-model="form.experience" type="number" min="0" max="60" placeholder="e.g. 10"
                        class="field-input" @focus="focusedField = 'exp'" @blur="focusedField = ''" />
                    </div>
                  </div>

                  <div class="field-group">
                    <label class="field-label">Current Hospital / Clinic</label>
                    <div class="field-wrapper" :class="{ 'field-focused': focusedField === 'hospital' }">
                      <q-icon name="business" size="20px" class="field-icon" />
                      <input v-model="form.hospital" type="text" placeholder="e.g. Nawaloka Hospital"
                        class="field-input" @focus="focusedField = 'hospital'" @blur="focusedField = ''" />
                    </div>
                  </div>

                  <div class="field-group">
                    <label class="field-label">Consultation Fee (LKR)</label>
                    <div class="field-wrapper" :class="{ 'field-focused': focusedField === 'fee' }">
                      <q-icon name="payments" size="20px" class="field-icon" />
                      <input v-model="form.consultationFee" type="number" min="0" placeholder="e.g. 2500"
                        class="field-input" @focus="focusedField = 'fee'" @blur="focusedField = ''" />
                    </div>
                  </div>

                  <div class="field-group full">
                    <label class="field-label">Qualifications (comma-separated)</label>
                    <div class="field-wrapper" :class="{ 'field-focused': focusedField === 'qual' }">
                      <q-icon name="school" size="20px" class="field-icon" />
                      <input v-model="form.qualifications" type="text" placeholder="MBBS, MD, MRCP"
                        class="field-input" @focus="focusedField = 'qual'" @blur="focusedField = ''" />
                    </div>
                  </div>

                  <div class="field-group full">
                    <label class="field-label">Professional Bio</label>
                    <div class="field-wrapper textarea-wrapper" :class="{ 'field-focused': focusedField === 'bio' }">
                      <textarea v-model="form.bio" placeholder="Brief description of your expertise and experience..."
                        class="field-input field-textarea" rows="3"
                        @focus="focusedField = 'bio'" @blur="focusedField = ''"></textarea>
                    </div>
                    <div class="char-count">{{ (form.bio || '').length }}/500</div>
                  </div>

                  <div class="field-group full">
                    <label class="field-label">Verification Documents</label>
                    <div class="upload-zone" :class="{ 'upload-dragging': isDragging }"
                      @dragover.prevent="isDragging = true" @dragleave="isDragging = false"
                      @drop.prevent="handleDrop" @click="$refs.fileInput.click()">
                      <q-icon name="cloud_upload" size="36px" class="upload-icon" />
                      <div class="upload-text">
                        <span class="upload-primary">Click to upload or drag & drop</span>
                        <span class="upload-secondary">PDF, JPG, PNG up to 10MB each (max 5 files)</span>
                      </div>
                      <input ref="fileInput" type="file" multiple accept=".pdf,.jpg,.jpeg,.png"
                        class="hidden" @change="handleFiles" />
                    </div>
                    <div v-if="selectedFiles.length > 0" class="file-list q-mt-md">
                      <div v-for="(file, i) in selectedFiles" :key="i" class="file-item">
                        <q-icon :name="file.type === 'application/pdf' ? 'picture_as_pdf' : 'image'" size="16px" color="blue-4" />
                        <span class="file-name">{{ file.name }}</span>
                        <span class="file-size">{{ formatSize(file.size) }}</span>
                        <button type="button" class="file-remove" @click.stop="removeFile(i)">
                          <q-icon name="close" size="14px" />
                        </button>
                      </div>
                    </div>
                  </div>
                </template>
              </div>

              <!-- Doctor pending notice -->
              <div v-if="form.role === 'doctor'" class="info-notice q-mt-lg">
                <q-icon name="info" size="18px" class="q-mr-sm" />
                <span>Doctor registrations require admin verification before you can log in. You'll be notified once approved.</span>
              </div>

              <div class="step-actions q-mt-xl">
                <button type="button" class="back-btn" @click="goStep(1)">
                  <q-icon name="arrow_back" size="18px" class="q-mr-sm" />
                  Back
                </button>
                <button type="submit" class="next-btn" :class="{ 'loading': isLoading }" :disabled="isLoading">
                  <span v-if="!isLoading" class="btn-content">
                    Create Account
                    <q-icon name="check" size="18px" class="q-ml-sm" />
                  </span>
                  <span v-else class="btn-content">
                    <div class="spinner"></div>
                    Creating account...
                  </span>
                </button>
              </div>
            </q-form>
          </div>
        </transition>

        <!-- STEP 3: Success -->
        <transition name="slide-fade" mode="out-in">
          <div v-if="currentStep === 3" key="step3" class="step-content success-content">
            <div class="success-icon">
              <div class="success-ring"></div>
              <q-icon name="check" size="48px" color="white" />
            </div>
            <h2 class="success-title">
              {{ form.role === 'doctor' ? 'Registration Submitted!' : 'Welcome to Nexus Care!' }}
            </h2>
            <p class="success-sub">
              {{ form.role === 'doctor'
                ? 'Your registration is under review. Our admin team will verify your credentials and notify you via email once approved.'
                : 'Your account has been created successfully. You can now book appointments and access all patient features.'
              }}
            </p>

            <div v-if="form.role === 'doctor'" class="success-steps">
              <div class="success-step">
                <div class="ss-number">1</div>
                <div class="ss-text">Documents under review by admin team</div>
              </div>
              <div class="success-step">
                <div class="ss-number">2</div>
                <div class="ss-text">You'll receive an email notification once verified</div>
              </div>
              <div class="success-step">
                <div class="ss-number">3</div>
                <div class="ss-text">Log in and start managing your practice</div>
              </div>
            </div>

            <button class="next-btn q-mt-xl" @click="$router.push(form.role === 'patient' ? '/patient/dashboard' : '/login')">
              {{ form.role === 'patient' ? 'Go to Dashboard' : 'Back to Login' }}
              <q-icon name="arrow_forward" size="18px" class="q-ml-sm" />
            </button>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, email, minLength, sameAs, helpers } from '@vuelidate/validators'

const MS1_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const currentStep = ref(1)
const isLoading = ref(false)
const showPw = ref(false)
const showPw2 = ref(false)
const focusedField = ref('')
const errorMessage = ref('')
const isDragging = ref(false)
const selectedFiles = ref([])
const fileInput = ref(null)

const form = reactive({
  role: '',
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  // Doctor fields
  registrationNumber: '',
  specialty: '',
  subSpecialty: '',
  experience: '',
  qualifications: '',
  hospital: '',
  consultationFee: '',
  bio: '',
})

const specialties = [
  "Cardiologist",
  "Dermatologist",
  "Neurologist",
  "Orthopedic Surgeon",
  "Pediatrician",
  "General Practitioner",
  "Psychiatrist",
  "Ophthalmologist",
  "Orthopedic Surgeon",
  "Pediatrician",
  "Pulmonologist",
  "Radiologist",
  "Urologist",
  "Endocrinologist",
]

// Validation rules
const isDoctor = computed(() => form.role === 'doctor')

const rules = computed(() => ({
  name: { required: helpers.withMessage('Full name is required', required) },
  email: {
    required: helpers.withMessage('Email is required', required),
    email: helpers.withMessage('Enter a valid email address', email),
  },
  password: {
    required: helpers.withMessage('Password is required', required),
    minLength: helpers.withMessage('Password must be at least 6 characters', minLength(6)),
  },
  confirmPassword: {
    required: helpers.withMessage('Please confirm your password', required),
    sameAs: helpers.withMessage('Passwords do not match', sameAs(computed(() => form.password))),
  },
  registrationNumber: isDoctor.value
    ? { required: helpers.withMessage('Registration number is required for doctors', required) }
    : {},
  specialty: isDoctor.value
    ? { required: helpers.withMessage('Please select your specialty', required) }
    : {},
}))

const v$ = useVuelidate(rules, form)

// Password strength
const pwStrength = computed(() => {
  const pw = form.password
  if (!pw) return 0
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw) || /[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw) && pw.length >= 10) s++
  return Math.max(1, s)
})

const pwStrengthLabel = computed(() => {
  const labels = ['', 'Weak', 'Medium', 'Strong']
  return labels[pwStrength.value] || ''
})

const selectRole = (role) => { form.role = role }
const goStep = (step) => { currentStep.value = step }

const handleFiles = (e) => {
  const files = Array.from(e.target.files || [])
  addFiles(files)
}

const handleDrop = (e) => {
  isDragging.value = false
  const files = Array.from(e.dataTransfer.files || [])
  addFiles(files)
}

const addFiles = (files) => {
  const allowed = files.filter(f =>
    ['application/pdf', 'image/jpeg', 'image/png'].includes(f.type)
  )
  const combined = [...selectedFiles.value, ...allowed].slice(0, 5)
  selectedFiles.value = combined
}

const removeFile = (i) => {
  selectedFiles.value.splice(i, 1)
}

const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

const handleSubmit = async () => {
  errorMessage.value = ''
  const valid = await v$.value.$validate()
  if (!valid) return

  isLoading.value = true
  try {
    const fd = new FormData()
    fd.append('name', form.name)
    fd.append('email', form.email)
    fd.append('password', form.password)
    fd.append('role', form.role)
    if (form.phone) fd.append('phone', form.phone)

    if (form.role === 'doctor') {
      fd.append('registrationNumber', form.registrationNumber)
      fd.append('specialty', form.specialty)
      if (form.subSpecialty) fd.append('subSpecialty', form.subSpecialty)
      if (form.experience) fd.append('experience', form.experience)
      if (form.qualifications) fd.append('qualifications', form.qualifications)
      if (form.hospital) fd.append('hospital', form.hospital)
      if (form.consultationFee) fd.append('consultationFee', form.consultationFee)
      if (form.bio) fd.append('bio', form.bio)
      selectedFiles.value.forEach(f => fd.append('documents', f))
    }

    const res = await fetch(`${MS1_URL}/api/auth/register`, {
      method: 'POST',
      body: fd,
    })
    const data = await res.json()

    if (!res.ok) {
      errorMessage.value = data.message || 'Registration failed. Please try again.'
      return
    }

    // Save token for patients (doctors need verification first)
    if (form.role === 'patient' && data.token) {
      localStorage.setItem('nexus_token', data.token)
      localStorage.setItem('nexus_user', JSON.stringify(data.user))
    }

    currentStep.value = 3
  } catch {
    errorMessage.value = 'Unable to connect. Please check your connection.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }
.font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
.hidden { display: none; }

/* ─── ROOT ─────────────────────────────────────────────────── */
.register-root {
  min-height: 100vh;
  background: #040710;
  color: #fff;
  position: relative;
  overflow-x: hidden;
}

/* ─── BACKGROUND ───────────────────────────────────────────── */
.bg-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.12;
  animation: orbFloat 14s ease-in-out infinite;
}

.orb-1 {
  width: 700px; height: 700px;
  background: radial-gradient(circle, #3b82f6, transparent 70%);
  top: -250px; left: -250px;
}

.orb-2 {
  width: 500px; height: 500px;
  background: radial-gradient(circle, #8b5cf6, transparent 70%);
  bottom: -200px; right: -200px;
  animation-delay: -5s;
}

.orb-3 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, #0ea5e9, transparent 70%);
  top: 40%; right: 20%;
  animation-delay: -9s;
}

@keyframes orbFloat {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1) translate(15px, -15px); }
}

.grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(59, 130, 246, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59, 130, 246, 0.025) 1px, transparent 1px);
  background-size: 60px 60px;
}

/* ─── WRAPPER ──────────────────────────────────────────────── */
.register-wrapper {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ─── TOPBAR ───────────────────────────────────────────────── */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 60px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}

.topbar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.logo-circle {
  width: 40px; height: 40px;
  background: linear-gradient(135deg, #3b82f6, #0ea5e9);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
  flex-shrink: 0;
}

.logo-letter { color: #fff; font-weight: 800; font-size: 20px; }
.brand-name { font-size: 1.25rem; font-weight: 700; color: #fff; }

.topbar-action {
  font-size: 0.875rem;
  color: #64748b;
}

/* ─── CONTENT ──────────────────────────────────────────────── */
.register-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px 80px;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}

/* ─── STEP INDICATOR ───────────────────────────────────────── */
.step-indicator {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 400px;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.step-dot {
  width: 36px; height: 36px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.03);
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
  transition: all 0.4s ease;
}

.step-item.active .step-dot {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.step-item.done .step-dot {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
}

.step-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.step-item.active .step-label { color: #60a5fa; }
.step-item.done .step-label { color: #34d399; }

.step-line {
  flex: 1;
  height: 2px;
  background: rgba(255,255,255,0.08);
  margin: 0 12px;
  margin-bottom: 20px;
  transition: background 0.4s ease;
}

.step-line.active { background: linear-gradient(to right, #3b82f6, rgba(59,130,246,0.3)); }

/* ─── STEP CONTENT ─────────────────────────────────────────── */
.step-content {
  width: 100%;
  animation: fadeUp 0.4s ease;
  padding-bottom: 40px;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all 0.3s ease;
}
.slide-fade-enter-from { opacity: 0; transform: translateX(20px); }
.slide-fade-leave-to { opacity: 0; transform: translateX(-20px); }

.step-header { text-align: center; }
.step-title {
  font-size: 2.2rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: -1px;
  margin-bottom: 10px;
}
.step-sub { font-size: 1rem; color: #64748b; }

/* ─── ROLE CARDS ───────────────────────────────────────────── */
.role-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 8px;
}

.role-card {
  position: relative;
  background: rgba(255,255,255,0.025);
  border: 1.5px solid rgba(255,255,255,0.08);
  border-radius: 20px;
  padding: 32px;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.165, 0.84, 0.44, 1);
  overflow: hidden;
}

.role-card:hover {
  border-color: rgba(59, 130, 246, 0.3);
  background: rgba(59, 130, 246, 0.04);
  transform: translateY(-4px);
}

.role-card.selected {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.08);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15), 0 12px 40px rgba(59, 130, 246, 0.15);
}

.role-card:has(.doctor-glow).selected {
  border-color: #14b8a6;
  background: rgba(20, 184, 166, 0.08);
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.15), 0 12px 40px rgba(20, 184, 166, 0.15);
}

.role-card-glow {
  position: absolute;
  top: -60px; right: -60px;
  width: 180px; height: 180px;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0;
  transition: opacity 0.4s;
}

.patient-glow { background: #3b82f6; }
.doctor-glow { background: #14b8a6; }

.role-card.selected .role-card-glow { opacity: 0.15; }

.role-icon-wrap {
  width: 60px; height: 60px;
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 20px;
}

.patient-icon {
  background: rgba(59, 130, 246, 0.12);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.doctor-icon {
  background: rgba(20, 184, 166, 0.12);
  color: #2dd4bf;
  border: 1px solid rgba(20, 184, 166, 0.2);
}

.role-title {
  font-size: 1.3rem;
  font-weight: 800;
  color: #fff;
  margin-bottom: 8px;
}

.role-desc {
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 20px;
}

.role-features { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
.role-feature {
  display: flex; align-items: center; gap: 8px;
  font-size: 0.82rem; color: #94a3b8; font-weight: 500;
}

.role-select-indicator { display: flex; justify-content: flex-end; }
.radio-outer {
  width: 22px; height: 22px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center;
  transition: all 0.3s;
}

.role-card.selected .radio-outer {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

.role-card:has(.doctor-glow).selected .radio-outer {
  border-color: #14b8a6;
  background: rgba(20, 184, 166, 0.1);
}

.radio-inner {
  width: 10px; height: 10px;
  border-radius: 50%;
  background: #3b82f6;
  animation: popIn 0.2s ease;
}

.doctor-radio .radio-inner { background: #14b8a6; }

@keyframes popIn { from { transform: scale(0); } to { transform: scale(1); } }

/* ─── FORM ─────────────────────────────────────────────────── */
.role-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 16px;
  border-radius: 50px;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.patient-badge {
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.25);
  color: #60a5fa;
}

.doctor-badge {
  background: rgba(20, 184, 166, 0.12);
  border: 1px solid rgba(20, 184, 166, 0.25);
  color: #2dd4bf;
}

.register-form { width: 100%; }

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.full { grid-column: 1 / -1; }

.field-group { display: flex; flex-direction: column; }
.field-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 8px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.field-wrapper {
  display: flex;
  align-items: center;
  background: rgba(255,255,255,0.035);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 0 14px;
  height: 50px;
  transition: all 0.25s ease;
}

.field-wrapper.textarea-wrapper {
  height: auto;
  padding: 14px;
  align-items: flex-start;
}

.field-wrapper.field-focused {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
}

.field-wrapper.field-error {
  border-color: rgba(239, 68, 68, 0.4);
  background: rgba(239, 68, 68, 0.03);
}

.field-icon { color: #334155; flex-shrink: 0; transition: color 0.2s; }
.field-focused .field-icon { color: #60a5fa; }
.field-icon-right { color: #334155; margin-left: auto; pointer-events: none; }

.field-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #fff;
  font-size: 0.9rem;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 500;
  padding: 0 10px;
  width: 100%;
}

.field-textarea {
  resize: none;
  padding: 0;
  min-height: 80px;
  line-height: 1.6;
}

.field-select {
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}

.field-select option {
  background: #0f172a;
  color: #fff;
}

.field-input::placeholder { color: #1e293b; }

.field-error-msg {
  font-size: 0.75rem;
  color: #f87171;
  margin-top: 5px;
  font-weight: 500;
}

.char-count { font-size: 0.72rem; color: #334155; text-align: right; margin-top: 4px; }

/* ─── PASSWORD STRENGTH ────────────────────────────────────── */
.pw-strength { display: flex; align-items: center; gap: 8px; }
.pw-bars { display: flex; gap: 4px; }
.pw-bar {
  width: 40px; height: 3px;
  border-radius: 2px;
  background: rgba(255,255,255,0.08);
  transition: background 0.3s;
}
.pw-bar.active.bar-weak { background: #ef4444; }
.pw-bar.active.bar-medium { background: #f59e0b; }
.pw-bar.active.bar-strong { background: #10b981; }
.pw-label { font-size: 0.72rem; font-weight: 600; }
.pw-weak { color: #ef4444; }
.pw-medium { color: #f59e0b; }
.pw-strong { color: #10b981; }

/* ─── DOCTOR SECTION DIVIDER ───────────────────────────────── */
.section-divider {
  display: flex; align-items: center; gap: 16px;
  font-size: 0.78rem; font-weight: 600;
  color: #2dd4bf; text-transform: uppercase; letter-spacing: 0.08em;
}
.section-divider::before, .section-divider::after {
  content: '';
  flex: 1; height: 1px;
  background: rgba(20, 184, 166, 0.2);
}

/* ─── UPLOAD ZONE ──────────────────────────────────────────── */
.upload-zone {
  border: 1.5px dashed rgba(255,255,255,0.12);
  border-radius: 14px;
  padding: 36px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255,255,255,0.02);
}

.upload-zone:hover, .upload-zone.upload-dragging {
  border-color: rgba(59, 130, 246, 0.4);
  background: rgba(59, 130, 246, 0.04);
}

.upload-icon { color: #334155; transition: color 0.3s; }
.upload-zone:hover .upload-icon { color: #60a5fa; }

.upload-text { text-align: center; }
.upload-primary { display: block; font-size: 0.9rem; color: #94a3b8; font-weight: 600; }
.upload-secondary { display: block; font-size: 0.78rem; color: #475569; margin-top: 4px; }

.file-list { display: flex; flex-direction: column; gap: 8px; }
.file-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 10px;
}

.file-name { flex: 1; font-size: 0.85rem; color: #94a3b8; font-weight: 500; truncate: true; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.file-size { font-size: 0.75rem; color: #475569; white-space: nowrap; }
.file-remove {
  background: none; border: none; cursor: pointer; color: #475569;
  display: flex; align-items: center; padding: 2px;
  border-radius: 4px; transition: color 0.2s;
}
.file-remove:hover { color: #f87171; }

/* ─── INFO / ERROR NOTICES ─────────────────────────────────── */
.error-alert {
  display: flex; align-items: flex-start;
  padding: 14px 18px; border-radius: 12px;
  font-size: 0.875rem; font-weight: 500;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #f87171;
  animation: slideIn 0.3s ease;
}

.info-notice {
  display: flex; align-items: flex-start;
  padding: 14px 18px; border-radius: 12px;
  font-size: 0.875rem; color: #fbbf24; font-weight: 500;
  background: rgba(234, 179, 8, 0.06);
  border: 1px solid rgba(234, 179, 8, 0.2);
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.toggle-pw {
  background: none;
  border: none;
  cursor: pointer;
  color: #475569;
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 6px;
  transition: color 0.2s;
  flex-shrink: 0;
}
.toggle-pw:hover { color: #94a3b8; }

/* ─── ACTIONS ──────────────────────────────────────────────── */
.step-actions {
  display: flex;
  gap: 24px;
  justify-content: flex-end;
  margin-top: 32px;
  margin-bottom: 40px; 
  padding: 0 24px; 
}

.next-btn {
  display: flex; align-items: center; justify-content: center;
  padding: 0 40px;
  height: 52px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: none; border-radius: 12px;
  color: #fff; font-size: 0.95rem; font-weight: 700;
  font-family: 'Plus Jakarta Sans', sans-serif;
  cursor: pointer; transition: all 0.3s ease;
  box-shadow: 0 4px 18px rgba(59, 130, 246, 0.3);
  min-width: 180px;
}

.next-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(59, 130, 246, 0.4);
}

.next-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.back-btn {
  display: flex; align-items: center; justify-content: center;
  padding: 0 32px;
  height: 52px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  color: #94a3b8; font-size: 0.9rem; font-weight: 600;
  font-family: 'Plus Jakarta Sans', sans-serif;
  cursor: pointer; transition: all 0.3s;
}
.back-btn:hover { background: rgba(255,255,255,0.07); color: #fff; }

.btn-content { display: flex; align-items: center; gap: 4px; }

.spinner {
  width: 18px; height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 6px;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ─── SUCCESS ──────────────────────────────────────────────── */
.success-content {
  display: flex; flex-direction: column; align-items: center;
  text-align: center; padding: 40px 24px;
}

.success-icon {
  position: relative;
  width: 96px; height: 96px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 32px;
}

.success-ring {
  position: absolute; inset: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #3b82f6);
  animation: successPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes successPop {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}

.success-title { font-size: 2rem; font-weight: 800; color: #fff; margin-bottom: 16px; }
.success-sub { font-size: 0.95rem; color: #64748b; line-height: 1.7; max-width: 500px; margin-bottom: 32px; }

.success-steps { display: flex; flex-direction: column; gap: 16px; max-width: 400px; width: 100%; }
.success-step {
  display: flex; align-items: center; gap: 16px;
  padding: 16px 20px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  text-align: left;
}

.ss-number {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #60a5fa;
  font-size: 0.875rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.ss-text { font-size: 0.875rem; color: #94a3b8; font-weight: 500; }

/* ─── LINK ─────────────────────────────────────────────────── */
.link-text {
  color: #60a5fa; font-weight: 600; cursor: pointer;
  transition: color 0.2s;
}
.link-text:hover { color: #93c5fd; }

/* ─── RESPONSIVE ───────────────────────────────────────────── */
@media (max-width: 768px) {
  .topbar { padding: 20px 24px; }
  .role-cards { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: 1fr; }
  .full { grid-column: 1; }
  .step-actions { 
    flex-direction: column-reverse;
    padding: 0 16px;
    margin-bottom: 48px;  
  }
  .next-btn, .back-btn { width: 100%; }
  .step-title { font-size: 1.7rem; }
  .topbar-action { display: none; }
}
</style>