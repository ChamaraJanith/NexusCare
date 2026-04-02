<template>
  <div class="login-root font-jakarta">
    <!-- Animated background -->
    <div class="bg-layer">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
      <div class="grid-overlay"></div>
      <!-- Canvas for particle animation -->
      <canvas ref="bgCanvas" class="bg-canvas"></canvas>
    </div>

    <div class="login-container">
      <!-- Left Panel - Branding -->
      <div class="brand-panel gt-sm">
        <div class="brand-content">
          <div class="brand-logo" @click="$router.push('/')">
            <div class="logo-circle">
              <span class="logo-letter">N</span>
            </div>
            <span class="brand-name">Nexus Care</span>
          </div>

          <div class="brand-hero">
            <div class="badge-pill q-mb-xl">
              <q-icon name="auto_awesome" size="14px" class="q-mr-xs" />
              AI-Powered Healthcare
            </div>
            <h1 class="brand-headline">
              Your Health,<br />
              <span class="gradient-text">Reimagined.</span>
            </h1>
            <p class="brand-sub">
              Connect with verified specialists, attend video consultations,
              and manage your health journey — all in one place.
            </p>
          </div>

          <div class="stats-row">
            <div class="stat-item">
              <div class="stat-number">500+</div>
              <div class="stat-label">Verified Doctors</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-number">50K+</div>
              <div class="stat-label">Patients Served</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-number">4.9★</div>
              <div class="stat-label">Average Rating</div>
            </div>
          </div>

          <div class="trust-badges">
            <div class="trust-badge">
              <q-icon name="verified_user" size="16px" color="blue-4" />
              <span>SSL Secured</span>
            </div>
            <div class="trust-badge">
              <q-icon name="lock" size="16px" color="blue-4" />
              <span>HIPAA Compliant</span>
            </div>
            <div class="trust-badge">
              <q-icon name="support_agent" size="16px" color="blue-4" />
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel - Login Form -->
      <div class="form-panel">
        <div class="form-card">
          <!-- Mobile logo -->
          <div class="mobile-logo lt-md q-mb-xl" @click="$router.push('/')">
            <div class="logo-circle-sm">
              <span class="logo-letter-sm">N</span>
            </div>
            <span class="brand-name-sm">Nexus Care</span>
          </div>

          <div class="form-header q-mb-xl">
            <h2 class="form-title">Welcome back</h2>
            <p class="form-subtitle">Sign in to your account to continue</p>
          </div>

          <!-- Role Selector -->
          <div class="role-selector q-mb-xl">
            <div
              v-for="role in ['Patient', 'Doctor', 'Admin']"
              :key="role"
              class="role-pill"
              :class="{ 'role-pill-active': selectedRole === role }"
              @click="selectedRole = role"
            >
              {{ role }}
            </div>
          </div>

          <!-- Error alert -->
          <div v-if="errorMsg" class="error-alert q-mb-xl">
            <q-icon name="error_outline" size="18px" class="q-mr-sm" />
            <span>{{ errorMsg }}</span>
          </div>

          <!-- Rejected doctor alert -->
          <div v-if="rejectionReason" class="rejected-alert q-mb-xl">
            <q-icon name="cancel" size="18px" class="q-mr-sm" />
            <div>
              <div class="text-weight-bold q-mb-xs">Registration Rejected</div>
              <div class="text-caption">{{ rejectionReason }}</div>
            </div>
          </div>

          <!-- Pending alert -->
          <div v-if="pendingVerification" class="pending-alert q-mb-xl">
            <q-icon name="schedule" size="18px" class="q-mr-sm" />
            <span>Your doctor account is pending admin verification.</span>
          </div>

          <q-form @submit.prevent="handleLogin" class="login-form">
            <!-- Email -->
            <div class="field-group q-mb-xl">
              <label class="field-label">Email Address</label>
              <div class="field-wrapper" :class="{ 'field-error': v$.email.$error, 'field-focused': focusedField === 'email' }">
                <q-icon name="mail_outline" size="20px" class="field-icon" />
                <input
                  v-model="form.email"
                  type="email"
                  placeholder="you@example.com"
                  class="field-input"
                  @focus="focusedField = 'email'"
                  @blur="focusedField = ''; v$.email.$touch()"
                />
              </div>
              <div v-if="v$.email.$error" class="field-error-msg">
                {{ v$.email.$errors[0].$message }}
              </div>
            </div>

            <!-- Password -->
            <div class="field-group q-mb-lg">
              <label class="field-label">Password</label>
              <div class="field-wrapper" :class="{ 'field-error': v$.password.$error, 'field-focused': focusedField === 'password' }">
                <q-icon name="lock_outline" size="20px" class="field-icon" />
                <input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Enter your password"
                  class="field-input"
                  @focus="focusedField = 'password'"
                  @blur="focusedField = ''; v$.password.$touch()"
                />
                <button type="button" class="toggle-pw" @click="showPassword = !showPassword">
                  <q-icon :name="showPassword ? 'visibility_off' : 'visibility'" size="20px" />
                </button>
              </div>
              <div v-if="v$.password.$error" class="field-error-msg">
                {{ v$.password.$errors[0].$message }}
              </div>
            </div>

            <!-- Submit -->
            <button
              type="submit"
              class="submit-btn q-mt-xxl"
              :class="{ 'loading': loading }"
              :disabled="loading"
            >
              <span v-if="!loading" class="btn-content">
                Sign In as {{ selectedRole }}
                <q-icon name="arrow_forward" size="18px" class="q-ml-sm" />
              </span>
              <span v-else class="btn-content">
                <div class="spinner"></div>
                Authenticating...
              </span>
            </button>
          </q-form>

          <div class="form-footer q-mt-xxl">
            <p class="footer-text">
              Don't have an account?
              <span class="link-text" @click="$router.push('/register')">Create one</span>
            </p>
            <p class="footer-text q-mt-md">
              <span class="link-text" @click="$router.push('/')">← Back to Home</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useVuelidate } from '@vuelidate/core'
import { required, email, minLength, helpers } from '@vuelidate/validators'
import axios from 'axios'

const router = useRouter()
const $q = useQuasar()

const MS1_URL = import.meta.env.VITE_MS1_URL || 'http://localhost:5001'

// Form data
const form = reactive({ email: '', password: '' })
const selectedRole = ref('Patient')
const showPassword = ref(false)
const loading = ref(false)
const focusedField = ref('')
const errorMsg = ref('')
const rejectionReason = ref('')
const pendingVerification = ref(false)

// Canvas animation
const bgCanvas = ref(null)
let animFrame = null

// Validation rules
const rules = {
  email: {
    required: helpers.withMessage('Email is required', required),
    email: helpers.withMessage('Enter a valid email address', email),
  },
  password: {
    required: helpers.withMessage('Password is required', required),
    minLength: helpers.withMessage('Password must be at least 6 characters', minLength(6)),
  },
}

const v$ = useVuelidate(rules, form)

// Canvas initialization
const initCanvas = () => {
  const canvas = bgCanvas.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const particles = []
  const particleCount = 80

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width
      this.y = Math.random() * canvas.height
      this.size = Math.random() * 1.5 + 0.5
      this.speedX = Math.random() * 0.4 - 0.2
      this.speedY = Math.random() * 0.4 - 0.2
      this.opacity = Math.random() * 0.4 + 0.2
    }

    update() {
      this.x += this.speedX
      this.y += this.speedY

      if (this.x > canvas.width) this.x = 0
      if (this.x < 0) this.x = canvas.width
      if (this.y > canvas.height) this.y = 0
      if (this.y < 0) this.y = canvas.height
    }

    draw() {
      ctx.fillStyle = `rgba(147, 197, 253, ${this.opacity})`
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle())
  }

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    particles.forEach(particle => {
      particle.update()
      particle.draw()
    })

    // Draw connections
    particles.forEach((p1, i) => {
      particles.slice(i + 1).forEach(p2 => {
        const distance = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2)
        if (distance < 120) {
          ctx.strokeStyle = `rgba(147, 197, 253, ${0.15 * (1 - distance / 120)})`
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.stroke()
        }
      })
    })

    animFrame = requestAnimationFrame(animate)
  }

  animate()
}

// Login handler
const handleLogin = async () => {
  errorMsg.value = ''
  rejectionReason.value = ''
  pendingVerification.value = false

  const valid = await v$.value.$validate()
  if (!valid) return

  loading.value = true
  try {
    const res = await axios.post(`${MS1_URL}/api/auth/login`, {
      email: form.email,
      password: form.password,
      role: selectedRole.value.toLowerCase()
    })

    const { token, user } = res.data

    // Verify role matches
    if (user.role !== selectedRole.value.toLowerCase()) {
      errorMsg.value = `Access denied: Identity configured as "${user.role.toUpperCase()}", not "${selectedRole.value.toUpperCase()}".`
      return
    }

    // Store tokens
    localStorage.setItem('token', token)
    localStorage.setItem('nexus_token', token)
    localStorage.setItem('nexus_user', JSON.stringify(user))

    $q.notify({
      icon: 'check_circle',
      color: 'cyan-9',
      message: `Security clearance granted — ${user.name || user.role}`,
      position: 'top-right',
      timeout: 2500
    })

    // Navigate based on role
    const routes = {
      patient: '/patient/dashboard',
      doctor: '/doctor/dashboard',
      admin: '/admin/dashboard'
    }

    const targetRoute = routes[user.role] || '/'
    await router.push(targetRoute)

  } catch (err) {
    console.error('LOGIN ERROR:', err)
    
    if (err.response) {
      const data = err.response.data
      if (data.rejected) {
        rejectionReason.value = data.message
      } else if (data.verified === false) {
        pendingVerification.value = true
      } else {
        errorMsg.value = data.message || 'Login failed. Please try again.'
      }
    } else if (err.request) {
      errorMsg.value = 'No response from server'
    } else {
      errorMsg.value = err.message
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  initCanvas()
  window.addEventListener('resize', () => {
    if (bgCanvas.value) {
      bgCanvas.value.width = window.innerWidth
      bgCanvas.value.height = window.innerHeight
    }
  })
})

onUnmounted(() => {
  if (animFrame) cancelAnimationFrame(animFrame)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

.font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
.font-orbitron { font-family: 'Sora', sans-serif; }

/* ─── ROOT ─────────────────────────────────────────────────── */
.login-root {
  min-height: 100vh;
  background: #040710;
  color: #fff;
  position: relative;
  overflow: hidden;
}

/* ─── BACKGROUND ───────────────────────────────────────────── */
.bg-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.bg-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
  animation: orbFloat 12s ease-in-out infinite;
}

.orb-1 {
  width: 600px; height: 600px;
  background: radial-gradient(circle, #3b82f6, transparent 70%);
  top: -200px; left: -200px;
  animation-delay: 0s;
}

.orb-2 {
  width: 500px; height: 500px;
  background: radial-gradient(circle, #8b5cf6, transparent 70%);
  bottom: -150px; right: -150px;
  animation-delay: -4s;
}

.orb-3 {
  width: 350px; height: 350px;
  background: radial-gradient(circle, #06b6d4, transparent 70%);
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -8s;
}

@keyframes orbFloat {
  0%, 100% { transform: scale(1) translate(0, 0); }
  33% { transform: scale(1.08) translate(20px, -20px); }
  66% { transform: scale(0.95) translate(-15px, 15px); }
}

.grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
}

/* ─── LAYOUT ───────────────────────────────────────────────── */
.login-container {
  position: relative;
  z-index: 1;
  display: flex;
  min-height: 100vh;
}

/* ─── BRAND PANEL ──────────────────────────────────────────── */
.brand-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 40px 60px 80px;
  position: relative;
}

.brand-panel::after {
  content: '';
  position: absolute;
  right: 0;
  top: 10%;
  bottom: 10%;
  width: 1px;
  background: linear-gradient(to bottom, transparent, rgba(59, 130, 246, 0.3), transparent);
}

.brand-content {
  max-width: 480px;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  margin-bottom: 80px;
}

.logo-circle {
  width: 44px; height: 44px;
  background: linear-gradient(135deg, #3b82f6, #0ea5e9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
  flex-shrink: 0;
}

.logo-letter { color: white; font-weight: 800; font-size: 22px; }

.brand-name { font-size: 1.4rem; font-weight: 700; color: #fff; }

.badge-pill {
  display: inline-flex;
  align-items: center;
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #60a5fa;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 6px 14px;
  border-radius: 50px;
  margin-bottom: 28px;
}

.brand-headline {
  font-size: clamp(2.4rem, 3.5vw, 3.2rem);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -1.5px;
  margin-bottom: 24px;
  color: #fff;
}

.gradient-text {
  background: linear-gradient(135deg, #60a5fa, #a78bfa, #38bdf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-sub {
  font-size: 1rem;
  color: #94a3b8;
  line-height: 1.7;
  margin-bottom: 56px;
}

.stats-row {
  display: flex;
  align-items: center;
  gap: 32px;
  margin-bottom: 40px;
  padding: 28px 32px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 20px;
}

.stat-item { text-align: center; }
.stat-number { font-size: 1.6rem; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
.stat-label { font-size: 0.72rem; color: #64748b; font-weight: 500; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.06em; }
.stat-divider { width: 1px; height: 36px; background: rgba(255,255,255,0.08); }

.trust-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.trust-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  color: #64748b;
  font-weight: 500;
}

/* ─── FORM PANEL ───────────────────────────────────────────── */
.form-panel {
  width: 520px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 60px;
}

.form-card {
  width: 100%;
  max-width: 400px;
  padding: 20px 0; /* 增加上下内边距 */
}

.mobile-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.logo-circle-sm {
  width: 36px; height: 36px;
  background: linear-gradient(135deg, #3b82f6, #0ea5e9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.logo-letter-sm { color: white; font-weight: 800; font-size: 18px; }
.brand-name-sm { font-size: 1.2rem; font-weight: 700; color: #fff; }

.form-title {
  font-size: 2rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.8px;
  margin-bottom: 8px;
}

.form-subtitle {
  font-size: 0.95rem;
  color: #64748b;
  font-weight: 400;
}

/* ─── ROLE SELECTOR ───────────────────────────────────────── */
.role-selector {
  display: flex;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 14px;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.35);
}

.role-pill {
  flex: 1;
  font-size: 0.62rem;
  letter-spacing: 1px;
  color: rgba(203, 213, 225, 0.56);
  transition: all 0.25s ease;
  padding: 12px;
  text-align: center;
  cursor: pointer;
  text-transform: uppercase;
  font-weight: 600;
}

.role-pill:hover {
  color: rgba(191, 219, 254, 0.96);
  background: rgba(59, 130, 246, 0.1);
}

.role-pill-active {
  color: #bfdbfe !important;
  background: linear-gradient(180deg, rgba(59, 130, 246, 0.22), rgba(59, 130, 246, 0.1)) !important;
  border-bottom: 2px solid #3b82f6;
}

/* ─── ALERTS ───────────────────────────────────────────────── */
.error-alert, .rejected-alert, .pending-alert {
  display: flex;
  align-items: flex-start;
  padding: 14px 18px;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.error-alert {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #f87171;
}

.rejected-alert {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.pending-alert {
  background: rgba(234, 179, 8, 0.08);
  border: 1px solid rgba(234, 179, 8, 0.2);
  color: #facc15;
}

/* ─── FORM FIELDS ──────────────────────────────────────────── */
.login-form { width: 100%; }
.field-group { display: flex; flex-direction: column; }

.field-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 12px; /* 增加标签与输入框的间距 */
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.field-wrapper {
  display: flex;
  align-items: center;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 0 16px;
  height: 54px;
  transition: all 0.25s ease;
  position: relative;
}

.field-wrapper.field-focused {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.06);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.field-wrapper.field-error {
  border-color: rgba(239, 68, 68, 0.5);
  background: rgba(239, 68, 68, 0.04);
}

.field-icon { color: #475569; flex-shrink: 0; transition: color 0.2s; }
.field-focused .field-icon { color: #60a5fa; }

.field-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #fff;
  font-size: 0.95rem;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 500;
  padding: 0 12px;
  width: 100%;
}

.field-input::placeholder { color: #334155; }

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
}

.toggle-pw:hover { color: #94a3b8; }

.field-error-msg {
  font-size: 0.78rem;
  color: #f87171;
  margin-top: 8px; /* 增加错误消息与输入框的间距 */
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.field-error-msg::before { content: '!'; }

/* ─── SUBMIT BUTTON ────────────────────────────────────────── */
.submit-btn {
  width: 100%;
  height: 54px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 0.95rem;
  font-weight: 700;
  font-family: 'Plus Jakarta Sans', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.35);
}

.submit-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
  opacity: 0;
  transition: opacity 0.3s;
}

.submit-btn:hover:not(:disabled)::before { opacity: 1; }
.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(59, 130, 246, 0.45);
}

.submit-btn:active:not(:disabled) { transform: translateY(0); }

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.spinner {
  width: 18px; height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ─── FOOTER ───────────────────────────────────────────────── */
.footer-text {
  font-size: 0.875rem;
  color: #475569;
  text-align: center;
}

.link-text {
  color: #60a5fa;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s;
}

.link-text:hover { color: #93c5fd; text-decoration: underline; }

/* ─── RESPONSIVE ───────────────────────────────────────────── */
@media (max-width: 1024px) {
  .form-panel { padding: 40px 32px; }
}

@media (max-width: 768px) {
  .form-panel {
    width: 100%;
    padding: 40px 24px;
    min-height: 100vh;
  }

  .form-card { 
    max-width: 100%; 
    padding: 16px 0; /* 移动端稍微减少内边距 */
  }
  .form-title { font-size: 1.7rem; }
  
  .brand-panel {
    display: none;
  }
}

@media (max-width: 520px) {
  .form-panel {
    padding: 24px 16px;
  }
  
  .role-pill {
    font-size: 0.55rem;
    padding: 10px 6px;
  }
}

/* Quasar 框架的间距类扩展 */
.q-mb-xl { margin-bottom: 32px !important; }
.q-mt-xxl { margin-top: 48px !important; }
.q-mt-xl { margin-top: 32px !important; }
.q-mb-lg { margin-bottom: 24px !important; }
.q-mb-md { margin-bottom: 16px !important; }
.q-mt-md { margin-top: 16px !important; }
</style>