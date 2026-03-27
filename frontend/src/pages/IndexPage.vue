<template>
  <q-page class="text-white font-jakarta overflow-x-hidden page-shell">



    <!-- HERO -->
    <section id="hero" class="hero-section flex flex-center relative-position">
      <div class="hero-bg">
        <div class="grid-overlay"></div>
      </div>

      <div class="container hero-content text-center z-max q-px-md">
        <div class="q-mb-lg flex justify-center">
          <div class="trusted-badge q-py-xs q-px-sm row items-center no-wrap">
            <q-icon name="auto_awesome" color="blue-4" size="14px" class="q-mr-sm" />
            <span class="text-caption text-weight-bolder tracking-wider text-blue-2">THE FUTURE OF CARE</span>
          </div>
        </div>

        <h1 class="hero-title q-ma-none text-weight-bolder">
          Cinematic<br>
          <span class="text-gradient-primary">Intelligence</span><br>
          for Wellness.
        </h1>

        <p class="hero-subtitle q-mx-auto q-mt-lg text-body1 text-grey-4">
          Step into a clinical sanctuary where cutting-edge AI meets human empathy.<br class="gt-xs">
          Seamless consultations and insights, redefined for the elite patient experience.
        </p>

        <div class="row justify-center q-gutter-md q-mt-xl">
          <q-btn to="/login" unelevated color="blue-6" label="Start Your Journey" class="btn-primary-glow q-px-xl q-py-md text-weight-bold" icon-right="arrow_forward" />
          <q-btn outline color="white" label="Explore Platform" class="btn-outline-glow q-px-xl q-py-md text-weight-bold" />
        </div>

        <div
          ref="heroVisualRef"
          class="hero-visual q-mx-auto q-mt-xl"
          @mousemove="handleHeroMove"
          @mouseleave="resetHeroMove"
        >
          <div ref="heroVisualInnerRef" class="hero-visual-frame" :style="heroVisualStyle">
            <img
              src="https://images.unsplash.com/photo-1666214280557-f1b5022eb634?q=80&w=1400&auto=format&fit=crop"
              alt="Nexus cinematic healthcare interface"
              class="hero-visual-media"
            >
            <div class="hero-visual-vignette"></div>
            <div class="hero-spotlight" :style="heroSpotlightStyle"></div>

            <div class="hero-visual-meta left">
              <div class="meta-label">LIVE TRIAGE</div>
              <div class="meta-value">2,184 active sessions</div>
            </div>

            <div class="hero-visual-meta right">
              <div class="meta-label">SYSTEM HEALTH</div>
              <div class="meta-value">99.97% uptime</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- WORKFLOW -->
    <section id="workflow" class="section-padding q-px-md">
      <div class="max-width-1200 q-mx-auto">
        <div class="row items-end justify-between q-mb-xl">
          <div class="col-12 col-md-6">
            <h2 class="section-title q-ma-none">Precision Workflow</h2>
            <p class="text-grey-5 q-mt-sm text-body1">How Nexus Care orchestrates your health journey from intake to recovery.</p>
          </div>
          <div class="row q-gutter-sm lt-md-hide">
            <q-btn round flat icon="chevron_left" class="border-grey" />
            <q-btn round flat icon="chevron_right" class="border-grey" />
          </div>
        </div>

        <div class="row q-col-gutter-lg q-pt-xl">
          <div
            class="col-12 col-md-4"
            v-for="(step, i) in workflowSteps"
            :key="i"
          >
            <div class="glass-card workflow-card full-height column justify-center" :class="{ 'card-active': i === 0, 'card-inactive-1': i === 1, 'card-inactive-2': i === 2 }">
              <div class="card-bg-layer" :style="{ backgroundImage: `url(${step.img})` }"></div>
              <div class="card-gradient-overlay"></div>
              <div class="z-top relative-position">
                <div class="card-num font-jakarta">{{ step.num }}</div>
                <div class="q-mt-md">
                  <div class="text-h6 text-weight-bolder q-mb-sm tracking-wider">{{ step.title }}</div>
                  <p class="text-body2 line-height-1-6 q-mb-none font-weight-medium desc-text">{{ step.desc }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- NEURAL TRIAGE -->
    <section id="triage" class="section-padding q-px-md">
      <div class="max-width-1200 q-mx-auto triage-container">
        <div class="row q-col-gutter-xl items-center">
          <div class="col-12 col-md-5">
            <h2 class="section-title q-ma-none q-mb-lg">
              Neural<br>
              <span class="text-blue-5">Triage</span><br>
              Engine
            </h2>

            <div class="q-mb-lg">
              <div class="row no-wrap items-start q-mb-md">
                <q-icon name="graphic_eq" color="blue-4" size="sm" class="q-mr-md q-mt-xs" />
                <div>
                  <div class="text-weight-bold text-body1">Linguistic Processing</div>
                  <div class="text-grey-5 text-caption">Translates user symptoms in natural language into exact clinical terminology.</div>
                </div>
              </div>
              <div class="row no-wrap items-start">
                <q-icon name="account_tree" color="blue-4" size="sm" class="q-mr-md q-mt-xs" />
                <div>
                  <div class="text-weight-bold text-body1">Cross-Clinical Matching</div>
                  <div class="text-grey-5 text-caption">The AI correlates tens of thousands of data points to recommend ideal specialists.</div>
                </div>
              </div>
            </div>

            <q-btn unelevated color="white" text-color="black" label="Launch Analyzer" class="btn-pill q-px-lg q-py-sm text-weight-bold" />
          </div>

          <div class="col-12 col-md-7">
            <div class="triage-ui-mockup">
              <div class="row items-center q-mb-md">
                <div class="triage-bot-icon q-mr-sm">
                  <q-icon name="smart_toy" color="white" style="font-size: 16px;" />
                </div>
                <div>
                  <div class="text-caption text-grey-5">NEXUS ADMIN</div>
                  <div class="text-weight-bold text-caption">Active Analysis...</div>
                </div>
              </div>

              <div class="chat-bubble q-mb-md">
                "I'm experiencing a slight respiratory distress and a slight fever when standing up suddenly."
              </div>

              <div class="system-bubble">
                <div class="text-caption text-blue-3 text-weight-bold q-mb-xs uppercase letter-spacing-1">
                  <q-icon name="auto_awesome" class="q-mr-xs" /> System Result
                </div>
                <div class="text-body2 text-white q-mb-md">Analyzing worldwide patterns... Probability of orthostatic hypotension with viral infection.</div>

                <div class="row q-col-gutter-md">
                  <div class="col-6">
                    <div class="text-caption text-grey-5 uppercase">Risk Score</div>
                    <div class="text-weight-bold text-green-4">Low</div>
                  </div>
                  <div class="col-6">
                    <div class="text-caption text-grey-5 uppercase">Priority</div>
                    <div class="text-weight-bold text-white">Routine</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- BORDERLESS CONSULTATION -->
    <section id="consultation" class="section-padding q-px-md">
      <div class="max-width-1200 q-mx-auto row q-col-gutter-xl items-center">
        <div class="col-12 col-md-5">
          <div class="borderless-img-container">
            <q-badge color="white" text-color="black" class="absolute-top-left q-ma-md q-pa-sm text-weight-bold" style="z-index: 2;">
              <q-icon name="fiber_manual_record" color="red" style="font-size: 10px;" class="q-mr-xs" /> 00:05:21 SEC LIVE
            </q-badge>
            <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=1000&auto=format&fit=crop" class="borderless-img" />
          </div>
        </div>

        <div class="col-12 col-md-7 consultation-content q-pl-xl">
          <h2 class="section-title q-ma-none q-mb-md">
            Borderless<br>
            <span class="text-teal-4">Consultation.</span>
          </h2>
          <p class="text-grey-5 text-body1 line-height-1-6 q-mb-xl">
            Geography is obsolete. Connect with the world's most distinguished medical minds in immersive 4K video, protected by military-grade encryption.
          </p>

          <div class="row q-col-gutter-md q-mb-xl">
            <div class="col-6">
              <q-icon name="shield" color="blue-4" size="md" class="q-mb-sm" />
              <div class="text-weight-bold text-body2">Post-Quantum Privacy</div>
              <div class="text-caption text-grey-6">Your data encrypted infinitely.</div>
            </div>
            <div class="col-6">
              <q-icon name="speed" color="blue-4" size="md" class="q-mb-sm" />
              <div class="text-weight-bold text-body2">Ultra-Low Latency</div>
              <div class="text-caption text-grey-6">Sub-10ms global routing.</div>
            </div>
          </div>

          <q-btn outline color="white" label="Learn About Telemedicine" class="btn-pill q-px-lg q-py-sm" />
        </div>
      </div>
    </section>

    <!-- PARTNERS -->
    <section id="partners" class="q-py-xl border-y-dark">
      <div class="max-width-1200 q-mx-auto flex justify-center items-center q-gutter-xl opacity-50">
        <div class="text-h6 text-weight-bold partner-logo">PayNow</div>
        <div class="text-h6 text-weight-bold partner-logo">stripe</div>
        <div class="text-h6 text-weight-bold partner-logo">PayPal</div>
        <div class="text-h6 text-weight-bold partner-logo">Apple</div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer id="contact" class="q-py-xl q-px-md">
      <div class="max-width-1200 q-mx-auto row q-col-gutter-xl">
        <div class="col-12 col-md-4">
          <div class="text-h6 text-weight-bold q-mb-sm flex items-center">
             Nexus Care
          </div>
          <p class="text-grey-6 text-caption q-pr-xl">
            Pioneering the synthesis of intelligence and empathy in world-class health.
          </p>
          <div class="row q-gutter-sm q-mt-md">
            <q-btn round flat size="sm" icon="share" class="bg-grey-9" />
            <q-btn round flat size="sm" icon="public" class="bg-grey-9" />
          </div>
        </div>

        <div class="col-6 col-md-2">
          <div class="text-weight-bold q-mb-md text-caption uppercase text-grey-5">Care Portal</div>
          <div class="text-caption text-grey-4 q-mb-sm cursor-pointer hover-white">Clinical Vault</div>
          <div class="text-caption text-grey-4 q-mb-sm cursor-pointer hover-white">HIPAA Governance</div>
          <div class="text-caption text-grey-4 q-mb-sm cursor-pointer hover-white">Network Directory</div>
        </div>

        <div class="col-6 col-md-3">
          <div class="text-weight-bold q-mb-md text-caption uppercase text-grey-5">Infrastructure</div>
          <div class="text-caption text-grey-4 q-mb-sm cursor-pointer hover-white">Node Dashboard</div>
          <div class="text-caption text-grey-4 q-mb-sm cursor-pointer hover-white">API Documentation</div>
          <div class="text-caption text-grey-4 q-mb-sm cursor-pointer hover-white">Security Whitepaper</div>
        </div>

        <div class="col-12 col-md-3">
          <div class="glass-card q-pa-md text-center border-radius-16">
            <div class="text-caption text-weight-bold q-mb-sm">Newsletter</div>
            <input
              v-model="email"
              type="email"
              placeholder="Email Address"
              class="newsletter-input"
            />
            <q-btn unelevated color="blue-6" class="full-width btn-pill" label="Subscribe" />
          </div>
        </div>
      </div>

      <div class="max-width-1200 q-mx-auto row justify-between items-center q-mt-xl border-t-dark text-caption text-grey-6">
        <div>© 2026 Nexus Care Intelligent Group. All rights reserved.</div>
        <div class="row q-gutter-md">
          <span class="cursor-pointer hover-white">Privacy</span>
          <span class="cursor-pointer hover-white">Legal</span>
          <span class="cursor-pointer hover-white">Cookie Policy</span>
        </div>
      </div>
    </footer>

  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'

const email = ref('')
const heroVisualRef = ref(null)
const heroVisualInnerRef = ref(null)
const tiltX = ref(0)
const tiltY = ref(0)
const spotlightX = ref(50)
const spotlightY = ref(50)
const activeSection = ref('hero')
let sectionObserver = null

const heroVisualStyle = computed(() => ({
  transform: `perspective(1200px) rotateX(${tiltX.value}deg) rotateY(${tiltY.value}deg)`
}))

const heroSpotlightStyle = computed(() => ({
  '--spot-x': `${spotlightX.value}%`,
  '--spot-y': `${spotlightY.value}%`
}))

const handleHeroMove = (event) => {
  const el = heroVisualRef.value
  if (!el) return

  const rect = el.getBoundingClientRect()
  const x = (event.clientX - rect.left) / rect.width
  const y = (event.clientY - rect.top) / rect.height

  tiltY.value = (x - 0.5) * 9
  tiltX.value = (0.5 - y) * 8
  spotlightX.value = x * 100
  spotlightY.value = y * 100
}

const resetHeroMove = () => {
  tiltX.value = 0
  tiltY.value = 0
  spotlightX.value = 50
  spotlightY.value = 50
}

const workflowSteps = [
  { num: '01', title: 'Digital Twin Setup', desc: 'Our AI creates a dynamic, ever-evolving digital protocol of your health history, genetics, and vitals.', img: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?q=80&w=800&auto=format&fit=crop' },
  { num: '02', title: 'AI Triage Analysis', desc: 'Instant symptom processing through our neural resonance engine to match precise specialists.', img: 'https://images.unsplash.com/photo-1555255707-c07966088b7b?q=80&w=800&auto=format&fit=crop' },
  { num: '03', title: 'HD Consultation', desc: 'Encrypted true-fidelity video link with the world\'s leading practitioners from any device.', img: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?q=80&w=800&auto=format&fit=crop' }
]

onMounted(() => {
  sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

      if (visible.length > 0) {
        activeSection.value = visible[0].target.id
      }
    },
    {
      root: null,
      rootMargin: '-34% 0px -52% 0px',
      threshold: [0.2, 0.35, 0.5, 0.75]
    }
  )

  gsap.from('.trusted-badge', { y: 20, opacity: 0, duration: 1, ease: 'power3.out', delay: 0.2 })



  gsap.from(['.hero-title', '.hero-subtitle', '.hero-visual', '.accuracy-card'], {
    opacity: 0,
    y: 24,
    duration: 0.9,
    stagger: 0.14,
    ease: 'power3.out'
  })

  gsap.from(['.platform-card', '.triage-container', '.borderless-img-container'], {
    opacity: 0,
    y: 26,
    duration: 0.75,
    stagger: 0.08,
    ease: 'power2.out'
  })
})

onBeforeUnmount(() => {
  if (sectionObserver) {
    sectionObserver.disconnect()
    sectionObserver = null
  }
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* GLOBAL */
.font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
.bg-nexus { background-color: transparent; }
.max-width-1200 { max-width: 1200px; }
.page-shell { padding-top: 0; }
.section-padding { padding-top: 140px; padding-bottom: 140px; }
.hero-content { max-width: 1000px; margin: 0 auto; position: relative; z-index: 10; }
.btn-pill { border-radius: 50px; text-transform: none; letter-spacing: 0.5px; }

.btn-primary-glow {
  border-radius: 50px;
  text-transform: none;
  background: linear-gradient(135deg, #1d4ed8, #2563eb) !important;
  box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.5);
  transition: all 0.3s ease;
}
.btn-primary-glow:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 35px -5px rgba(37, 99, 235, 0.6);
}

.btn-outline-glow {
  border-radius: 50px;
  text-transform: none;
  border: 1px solid rgba(255,255,255,0.2) !important;
  transition: all 0.3s ease;
  background: rgba(255,255,255,0.03);
}
.btn-outline-glow:hover {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.5) !important;
  box-shadow: 0 0 20px rgba(255,255,255,0.1);
}

.border-grey { border: 1px solid rgba(255,255,255,0.1); }
.border-y-dark { border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05); }
.border-t-dark { border-top: 1px solid rgba(255,255,255,0.05); padding-top: 40px; }
.line-height-1-6 { line-height: 1.6; }
.opacity-50 { opacity: 0.5; }
.hover-white:hover { color: #ffffff !important; transition: 0.3s; }
.uppercase { text-transform: uppercase; }
.letter-spacing-1 { letter-spacing: 1px; }
.tracking-wider { letter-spacing: 1.5px; }
.border-radius-16 { border-radius: 16px; }

section[id] { scroll-margin-top: 96px; position: relative; }

/* ATMOSPHERIC GRADIENTS */
section::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

#workflow::before {
  background: radial-gradient(circle at 10% 20%, rgba(37, 99, 235, 0.04), transparent 50%);
}

#platform::before {
  background: radial-gradient(circle at 90% 80%, rgba(20, 184, 166, 0.04), transparent 50%);
}

#triage::before {
  background: radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.03), transparent 60%);
}

/* NEWSLETTER INPUT - native element replaces q-input */
.newsletter-input {
  display: block;
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50px;
  padding: 10px 18px;
  color: #ffffff;
  font-size: 0.8rem;
  font-family: 'Plus Jakarta Sans', sans-serif;
  outline: none;
  box-sizing: border-box;
  margin-bottom: 10px;
}
.newsletter-input::placeholder { color: #64748b; }
.newsletter-input:focus { border-color: rgba(59, 130, 246, 0.5); }

/* TYPOGRAPHY */
.section-title {
  font-size: clamp(2.8rem, 6vw, 4.2rem);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -2px;
}

/* HERO */
.hero-section { min-height: 100vh; padding-top: 140px; padding-bottom: 100px; }
.hero-bg {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background:
    radial-gradient(ellipse at center 0%, rgba(14, 165, 233, 0.15), transparent 60%),
    radial-gradient(circle at 80% 80%, rgba(37, 99, 235, 0.1), transparent 50%);
  opacity: 1;
  z-index: 0;
}

.grid-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image:
    linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  mask-image: radial-gradient(ellipse at top center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%);
  -webkit-mask-image: radial-gradient(ellipse at top center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%);
  pointer-events: none;
}

.hero-title {
  font-size: clamp(4rem, 9vw, 6.8rem);
  letter-spacing: -3.5px;
  line-height: 1.05;
  text-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

.text-gradient-primary {
  background: linear-gradient(to right, #38bdf8, #818cf8, #e879f9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle { max-width: 720px; color: #94a3b8; font-size: 1.25rem; line-height: 1.6; }

.hero-visual {
  position: relative;
  width: min(100%, 1000px);
  transform-style: preserve-3d;
  z-index: 5;
}

.hero-visual-frame {
  position: relative;
  border-radius: 32px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 40px 100px rgba(0, 0, 0, 0.8);
  transition: transform 0.2s ease-out;
  background: #000;
}

.hero-visual-media {
  display: block;
  width: 100%;
  height: clamp(300px, 45vw, 500px);
  object-fit: cover;
  filter: saturate(1.1) contrast(1.1);
  opacity: 0.85;
}

.hero-visual-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, transparent 20%, rgba(0,0,0,0.6) 100%);
}

.hero-spotlight {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at var(--spot-x) var(--spot-y), rgba(125, 211, 252, 0.2), transparent 40%);
  pointer-events: none;
}

.hero-visual-meta {
  position: absolute;
  bottom: 24px;
  background: rgba(10, 15, 30, 0.6);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 12px 18px;
  text-align: left;
}

.hero-visual-meta.left { left: 24px; }
.hero-visual-meta.right { right: 24px; }

.meta-label {
  font-size: 0.7rem;
  letter-spacing: 1px;
  color: #5eead4;
  font-weight: 700;
  text-transform: uppercase;
}

.meta-value {
  font-size: 0.9rem;
  color: #fff;
  font-weight: 700;
}

.trusted-badge {
  border: 1px solid rgba(125, 211, 252, 0.3);
  background: rgba(14, 165, 233, 0.1);
  backdrop-filter: blur(12px);
  border-radius: 50px;
  box-shadow: 0 0 20px rgba(14, 165, 233, 0.15);
}
.accuracy-card {
  position: absolute;
  bottom: 10%; right: 2%;
  background: rgba(10, 15, 30, 0.7);
  backdrop-filter: blur(20px);
  padding: 24px 32px;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.1);
  min-width: 280px;
  z-index: 20;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
}
/* WORKFLOW CARDS */
.glass-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
}

.workflow-card {
  height: 680px;
  padding: 40px;
}

.card-bg-layer {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background-size: cover;
  background-position: center;
  opacity: 0.25;
  transition: all 0.6s ease;
  filter: grayscale(0.5) contrast(1.3);
  z-index: 0;
}

.card-gradient-overlay {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: linear-gradient(to top, rgba(4, 7, 16, 0.85) 0%, rgba(4, 7, 16, 0.2) 60%, transparent 100%);
  z-index: 1;
}

.glass-card:hover {
  transform: translateY(-8px);
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
}

.glass-card:hover .card-bg-layer {
  opacity: 0.4;
  filter: grayscale(0.2) contrast(1.1);
  transform: scale(1.05);
}

.card-num {
  font-size: 4rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -2px;
}

.card-active .text-h6 { color: #ffffff; }
.card-active .desc-text { color: #94a3b8; }
.card-active .card-num { color: rgba(255, 255, 255, 0.05); }

.card-inactive-1 .text-h6 { color: #cbd5e1; }
.card-inactive-1 .desc-text { color: #64748b; }
.card-inactive-1 .card-num { color: rgba(255, 255, 255, 0.03); }

.card-inactive-2 .text-h6 { color: #64748b; }
.card-inactive-2 .desc-text { color: #475569; }
.card-inactive-2 .card-num { color: rgba(255, 255, 255, 0.015); }

/* PLATFORM CARDS */
.platform-card {
  background: rgba(10, 15, 30, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 32px;
  padding: 40px;
  overflow: hidden;
  transition: all 0.5s ease;
}
.platform-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(to top, rgba(4, 7, 16, 1) 0%, rgba(4, 7, 16, 0.8) 40%, rgba(4, 7, 16, 0.2) 100%);
  z-index: 1;
}
.platform-card:hover {
  border-color: rgba(20, 184, 166, 0.4);
  box-shadow: 0 20px 50px -10px rgba(0,0,0,0.8), 0 0 40px -10px rgba(20, 184, 166, 0.2);
  transform: translateY(-8px);
}
.platform-card--tall { height: 460px; }
.platform-shift { margin-top: 60px; }

.practitioner-img, .patient-img {
  position: absolute;
  top: 0; left: 0; right: 0; height: 100%;
  background-size: cover;
  background-position: center;
  opacity: 0.35;
  transition: all 0.6s ease;
  filter: grayscale(0.6) contrast(1.1);
}
.practitioner-img { background-image: url('https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=800&auto=format&fit=crop'); }
.patient-img { background-image: url('https://images.unsplash.com/photo-1551076805-e1869033e561?q=80&w=800&auto=format&fit=crop'); }

.platform-card:hover .practitioner-img,
.platform-card:hover .patient-img {
  opacity: 0.6;
  filter: grayscale(0.1) contrast(1.1);
  transform: scale(1.05);
}

.drop-shadow-glow { filter: drop-shadow(0 0 12px rgba(96, 165, 250, 0.6)); }
.drop-shadow-glow-teal { filter: drop-shadow(0 0 12px rgba(45, 212, 191, 0.6)); }
.group-hover:hover .transition { transform: translateX(4px); }
.transition { transition: all 0.3s ease; }

/* NEURAL TRIAGE */
.triage-container {
  background: rgba(10, 15, 30, 0.4);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 48px;
  padding: 80px;
}
.triage-ui-mockup {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 32px;
  padding: 40px;
  box-shadow: 0 30px 60px rgba(0,0,0,0.4);
}
.triage-bot-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1e3a8a, #1e40af);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.chat-bubble {
  background: rgba(255,255,255,0.05);
  padding: 24px;
  border-radius: 20px 20px 20px 4px;
  font-size: 1rem;
  color: #e2e8f0;
  border: 1px solid rgba(255,255,255,0.03);
}
.system-bubble {
  background: rgba(37, 99, 235, 0.08);
  border: 1px solid rgba(37, 99, 235, 0.15);
  padding: 24px;
  border-radius: 20px 20px 4px 20px;
  margin-top: 20px;
}

/* BORDERLESS CONSULTATION */
.borderless-img-container {
  position: relative;
  border-radius: 40px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 40px 80px rgba(0,0,0,0.5);
}
.borderless-img {
  width: 100%;
  height: 100%;
  min-height: 500px;
  object-fit: cover;
  display: block;
  filter: saturate(1.1) contrast(1.05);
}
.partner-logo { min-width: 80px; text-align: center; font-size: 1.2rem; }

.consultation-content { padding-left: 48px; }

@media (max-width: 1024px) {
  .section-padding { padding-top: 100px; padding-bottom: 100px; }
  .hero-title { font-size: clamp(3.2rem, 9vw, 5rem); }
  .hero-subtitle { font-size: 1.1rem; }
  .platform-card--tall { height: 380px; }
  .consultation-content { padding-left: 20px; }
  .triage-container { padding: 40px; }
}

@media (max-width: 768px) {
  .hero-section { padding-top: 100px; }
  .section-title { font-size: 2.5rem; }
  .hero-title { font-size: 3.2rem; }
  .triage-container { padding: 30px; border-radius: 32px; }
  .accuracy-card {
    position: static;
    margin: 24px auto 0;
    min-width: auto;
    width: min(100%, 320px);
  }
  .platform-shift { margin-top: 0; }
  .platform-card--tall {
    height: auto;
    min-height: 290px;
  }
  .consultation-content {
    padding-left: 0 !important;
    margin-top: 24px;
  }
  .borderless-img { min-height: 300px; }
  .partner-logo {
    font-size: 0.95rem;
    min-width: 58px;
  }
  .q-gutter-xl > * { margin-top: 10px; }
}
</style>
