<template>
  <q-page class="login-page bg-black flex flex-center overflow-hidden">

    <!-- Animated particle background -->
    <canvas ref="bgCanvas" class="bg-canvas"></canvas>

    <!-- Glowing grid overlay -->
    <div class="grid-overlay"></div>

    <div class="login-container z-top">

      <!-- Logo section -->
      <div class="text-center q-mb-xl logo-section">
        <div class="nexus-logo">NEXUS<span class="text-cyan-4">CARE</span></div>
        <div class="logo-sub font-orbitron text-cyan-7 q-mt-xs">
          ◈ SECURE ACCESS TERMINAL ◈
        </div>
      </div>

      <!-- Card -->
      <q-card flat class="login-card glass-card">

        <!-- Top accent bar -->
        <div class="card-accent-bar"></div>

        <div class="q-pa-xl">

          <!-- Role selector -->
          <div class="q-mb-lg">
            <div class="field-label q-mb-sm">INITIALIZE AS</div>
            <div class="role-selector row">
              <div
                v-for="r in roles" :key="r.value"
                class="col role-pill font-orbitron cursor-pointer text-center q-py-sm"
                :class="selectedRole === r.value ? 'role-pill-active' : ''"
                @click="selectedRole = r.value"
              >
                <q-icon :name="r.icon" size="1rem" class="q-mr-xs" />
                {{ r.label }}
              </div>
            </div>
          </div>

          <!-- Form -->
          <q-form @submit="handleLogin">

            <div class="field-label q-mb-xs">IDENTITY CODE</div>
            <q-input
              v-model="form.email"
              type="email"
              placeholder="user@nexuscare.lk"
              dark outlined color="cyan-4"
              class="nexus-field q-mb-md"
              :rules="[v => !!v || 'Required', v => /.+@.+/.test(v) || 'Invalid email']"
            >
              <template #prepend>
                <q-icon name="alternate_email" size="xs" color="cyan-8" />
              </template>
            </q-input>

            <div class="field-label q-mb-xs">ACCESS KEY</div>
            <q-input
              v-model="form.password"
              :type="showPwd ? 'text' : 'password'"
              placeholder="••••••••••••"
              dark outlined color="cyan-4"
              class="nexus-field q-mb-lg"
              :rules="[v => !!v || 'Required']"
            >
              <template #prepend>
                <q-icon name="lock" size="xs" color="cyan-8" />
              </template>
              <template #append>
                <q-icon
                  :name="showPwd ? 'visibility_off' : 'visibility'"
                  size="xs" color="cyan-9" class="cursor-pointer"
                  @click="showPwd = !showPwd"
                />
              </template>
            </q-input>

            <!-- Error -->
            <div v-if="errorMsg" class="err-box q-pa-sm q-mb-md row items-center">
              <q-icon name="warning" color="red-4" size="sm" class="q-mr-sm" />
              <span class="text-red-4 font-orbitron text-caption">{{ errorMsg }}</span>
            </div>

            <!-- Submit -->
            <q-btn
              type="submit"
              class="full-width login-btn font-orbitron q-py-sm"
              :loading="loading"
            >
              <template #default>
                <q-icon name="login" class="q-mr-sm" />
                AUTHENTICATE
              </template>
              <template #loading>
                <q-spinner-dots color="white" size="1.5em" />
                <span class="q-ml-sm font-orbitron">VERIFYING...</span>
              </template>
            </q-btn>

          </q-form>

          <!-- Divider -->
          <div class="row items-center q-my-lg q-gutter-sm">
            <div class="col"><q-separator dark /></div>
            <div class="text-grey-8 font-orbitron text-caption">OR</div>
            <div class="col"><q-separator dark /></div>
          </div>

          <!-- Register link -->
          <div class="text-center">
            <span class="text-grey-7 text-caption">New node? </span>
            <span
              class="text-cyan-4 font-orbitron text-caption cursor-pointer link-hover"
              @click="$router.push('/register')"
            >
              REQUEST SYSTEM ACCESS →
            </span>
          </div>

        </div>

        <!-- Bottom status bar -->
        <div class="card-status-bar row items-center justify-between q-px-lg q-py-xs">
          <div class="row items-center q-gutter-xs">
            <div class="status-dot"></div>
            <span class="font-orbitron text-caption text-grey-7">SYSTEM ONLINE</span>
          </div>
          <span class="font-orbitron text-caption text-grey-8">MS1 · v1.0.4</span>
        </div>

      </q-card>

    </div>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import axios from 'axios'

const router = useRouter()
const $q = useQuasar()

const bgCanvas = ref(null)
const loading = ref(false)
const showPwd = ref(false)
const errorMsg = ref('')
const selectedRole = ref('patient')

const form = reactive({ email: '', password: '' })

const roles = [
  { value: 'patient', label: 'PATIENT', icon: 'person' },
  { value: 'doctor', label: 'DOCTOR', icon: 'medical_services' },
  { value: 'admin', label: 'ADMIN', icon: 'shield' }
]

// ─── Particle canvas animation ───────────────────────────────────────────────
let animFrame
const initCanvas = () => {
  const canvas = bgCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const particles = Array.from({ length: 80 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.5 + 0.3,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    alpha: Math.random() * 0.5 + 0.1
  }))

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy
      if (p.x < 0) p.x = canvas.width
      if (p.x > canvas.width) p.x = 0
      if (p.y < 0) p.y = canvas.height
      if (p.y > canvas.height) p.y = 0

      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(0, 229, 255, ${p.alpha})`
      ctx.fill()
    })

    // Draw connecting lines between nearby particles
    particles.forEach((a, i) => {
      particles.slice(i + 1).forEach(b => {
        const dist = Math.hypot(a.x - b.x, a.y - b.y)
        if (dist < 120) {
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.strokeStyle = `rgba(0, 229, 255, ${0.08 * (1 - dist / 120)})`
          ctx.lineWidth = 0.5
          ctx.stroke()
        }
      })
    })

    animFrame = requestAnimationFrame(draw)
  }
  draw()
}

// ─── Login handler ────────────────────────────────────────────────────────────
const handleLogin = async () => {
  errorMsg.value = ''
  loading.value = true
  try {
    const { data } = await axios.post('http://localhost:5001/api/auth/login', {
      email: form.email,
      password: form.password
    })

    if (data.token) {
      // Verify role matches selected tab
      if (data.user.role !== selectedRole.value) {
        errorMsg.value = `Account is registered as "${data.user.role}", not "${selectedRole.value}".`
        return
      }

      // Save session
      localStorage.setItem('nexus_token', data.token)
      localStorage.setItem('nexus_user', JSON.stringify(data.user))

      $q.notify({
        icon: 'check_circle',
        color: 'cyan-9',
        message: `Access granted — ${data.user.name}`,
        position: 'top-right',
        timeout: 2500
      })

      // Role-based redirect
      const routes = {
        patient: '/patient/dashboard',
        doctor: '/doctor/dashboard',
        admin: '/admin/dashboard'
      }
      router.push(routes[data.user.role] || '/')
    }
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Connection failed. Check server.'
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
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700&display=swap');

.font-orbitron { font-family: 'Orbitron', sans-serif; }

/* Page */
.login-page { min-height: 100vh; }

/* Canvas */
.bg-canvas {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: 0;
  pointer-events: none;
}

/* Grid overlay */
.grid-overlay {
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  z-index: 1;
  pointer-events: none;
}

/* Container */
.login-container {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 420px;
  padding: 24px 16px;
}

/* Logo */
.nexus-logo {
  font-family: 'Orbitron', sans-serif;
  font-size: clamp(2.2rem, 6vw, 3.2rem);
  font-weight: 700;
  color: #fff;
  letter-spacing: 6px;
  text-shadow: 0 0 25px rgba(0,229,255,0.5), 0 0 50px rgba(0,229,255,0.2);
}
.logo-sub {
  font-size: 0.6rem;
  letter-spacing: 4px;
}

/* Card */
.glass-card {
  background: rgba(8, 16, 18, 0.85) !important;
  backdrop-filter: blur(24px);
  border: 1px solid rgba(0, 229, 255, 0.15);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 0 60px rgba(0, 229, 255, 0.05), 0 25px 50px rgba(0,0,0,0.5);
}

/* Accent bar */
.card-accent-bar {
  height: 3px;
  background: linear-gradient(90deg, transparent, #00e5ff, #00bcd4, transparent);
}

/* Status bar */
.card-status-bar {
  background: rgba(0,0,0,0.3);
  border-top: 1px solid rgba(255,255,255,0.04);
}
.status-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #00e676;
  box-shadow: 0 0 6px #00e676;
  animation: blink 2s infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* Field label */
.field-label {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.6rem;
  letter-spacing: 2px;
  color: rgba(0, 229, 255, 0.5);
}

/* Input */
.nexus-field :deep(.q-field__control) {
  border-radius: 10px;
  background: rgba(0, 229, 255, 0.03);
}
.nexus-field :deep(.q-field__control:hover) {
  background: rgba(0, 229, 255, 0.05);
}

/* Role selector */
.role-selector {
  border: 1px solid rgba(0, 229, 255, 0.12);
  border-radius: 10px;
  overflow: hidden;
}
.role-pill {
  font-size: 0.6rem;
  letter-spacing: 1px;
  color: rgba(255,255,255,0.3);
  transition: all 0.25s ease;
  padding-top: 10px;
  padding-bottom: 10px;
}
.role-pill:hover { color: rgba(0, 229, 255, 0.6); background: rgba(0,229,255,0.04); }
.role-pill-active {
  color: #00e5ff !important;
  background: rgba(0, 229, 255, 0.08) !important;
  border-bottom: 2px solid #00e5ff;
}

/* Login button */
.login-btn {
  background: linear-gradient(135deg, #00494f, #006064 40%, #007c80);
  color: #fff;
  border-radius: 10px;
  font-size: 0.75rem;
  letter-spacing: 3px;
  box-shadow: 0 4px 25px rgba(0, 188, 212, 0.2);
  transition: all 0.3s ease;
}
.login-btn:hover {
  box-shadow: 0 4px 35px rgba(0, 188, 212, 0.4);
  transform: translateY(-1px);
}

/* Error box */
.err-box {
  background: rgba(229, 57, 53, 0.06);
  border: 1px solid rgba(229, 57, 53, 0.25);
  border-radius: 8px;
}

/* Link */
.link-hover { transition: text-shadow 0.2s; }
.link-hover:hover { text-shadow: 0 0 10px rgba(0,229,255,0.6); }

.z-top { z-index: 10; }
</style>