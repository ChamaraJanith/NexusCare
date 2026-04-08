<template>
  <q-page class="text-white font-jakarta flex flex-center relative-position page-shell overflow-hidden">
    <!-- Atmospheric Background -->
    <div class="page-bg-gradient"></div>

    <div class="row justify-center full-width z-top max-width-1200 q-px-md">
      <div class="col-12 col-md-8 col-lg-7">
        
        <!-- Header area -->
        <div class="text-center q-mb-xl mt-120">
          <div class="trusted-badge q-py-xs q-px-sm row items-center inline no-wrap q-mb-lg">
            <q-icon name="auto_awesome" color="blue-4" size="14px" class="q-mr-sm" />
            <span class="text-caption text-weight-bolder tracking-wider text-blue-2 uppercase">POWERED BY GEMINI 3 FLASH CORE</span>
          </div>
          <h1 class="page-title q-ma-none text-weight-bolder">
            Neural <span class="text-gradient-primary">Symptom</span> Analysis.
          </h1>
          <p class="text-grey-4 text-body1 q-mt-md mt-subtitle mx-auto">
            Input bio-data and pathology descriptions. Our intelligence engine will process the linguistic patterns and output potential clinical pathways.
          </p>
        </div>

        <!-- Form Card -->
        <div class="glass-card q-pa-xl shadow-glow relative-position">
          <div class="row q-col-gutter-lg">
            <div class="col-12 col-sm-6">
              <div class="text-caption text-weight-bold text-grey-5 uppercase letter-spacing-1 q-mb-sm">Patient Age</div>
              <q-input
                v-model.number="form.age"
                type="number"
                dark
                outlined
                color="blue-4"
                class="cinematic-input"
                :rules="[(val) => !!val || 'Required']"
                placeholder="Enter age"
              />
            </div>
            <div class="col-12 col-sm-6">
              <div class="text-caption text-weight-bold text-grey-5 uppercase letter-spacing-1 q-mb-sm">Gender Profile</div>
              <q-select
                v-model="form.gender"
                :options="['Male', 'Female', 'Other']"
                dark
                outlined
                color="blue-4"
                class="cinematic-input popup-custom"
                behavior="menu"
                :popup-content-style="{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8)',
                  borderRadius: '12px',
                  zIndex: 9999
                }"
                :rules="[(val) => !!val || 'Required']"
                placeholder="Select gender"
              />
            </div>
          </div>

          <div class="q-mt-md">
            <div class="text-caption text-weight-bold text-grey-5 uppercase letter-spacing-1 q-mb-sm">Medical Pathologies</div>
            <q-input
              v-model="form.symptomsText"
              type="textarea"
              dark
              outlined
              color="blue-4"
              placeholder="E.g., Sharp chest pain and dry cough for 3 days."
              class="cinematic-input textarea-glow"
              hint="AI provides better results with highly specific anatomical details"
              :rules="[(val) => !!val || 'Symptoms are required']"
            />
          </div>

          <div class="q-mt-xl text-center">
            <q-btn
              unelevated
              color="blue-6"
              label="Initiate Neural Analysis"
              icon-right="analytics"
              class="btn-primary-glow full-width text-weight-bold q-py-md text-subtitle1"
              :loading="loading"
              @click="handleCheck"
            >
              <template v-slot:loading>
                <q-spinner-dots color="white" />
                <span class="q-ml-md text-weight-bold">PROCESSING NEURAL PATHWAYS...</span>
              </template>
            </q-btn>
          </div>
        </div>

        <!-- Results Block -->
        <transition
          appear
          enter-active-class="animated fadeInDown"
          leave-active-class="animated fadeOutUp"
        >
          <div v-if="result" class="glass-card q-mt-xl border-blue-glow q-pa-xl">
            <div class="row items-center justify-between q-mb-lg border-b-dark q-pb-md">
              <div class="row items-center">
                 <div class="triage-bot-icon q-mr-md">
                   <q-icon name="smart_toy" color="white" size="18px" />
                 </div>
                 <div>
                   <div class="text-caption text-grey-5">SYSTEM RESPONSE</div>
                   <div class="text-weight-bold text-body1">Analysis Complete</div>
                 </div>
              </div>
              <q-badge
                :color="getRiskColor(result.riskLevel)"
                class="q-pa-sm text-weight-bold letter-spacing-1 shadow-glow-badge"
              >
                RISK: {{ result.riskLevel.toUpperCase() }}
              </q-badge>
            </div>

            <div class="row q-col-gutter-xl q-mb-lg">
              <div class="col-12 col-md-5">
                <div class="text-grey-5 text-overline q-mb-xs letter-spacing-1">Matched Specialty</div>
                <div class="text-h5 text-white text-weight-bolder text-gradient-primary inline-block">
                  {{ result.suggestedSpeciality }}
                </div>
              </div>
              
              <div class="col-12 col-md-7">
                <div class="system-bubble">
                  <div class="text-caption text-blue-3 text-weight-bold q-mb-xs uppercase letter-spacing-1 row items-center">
                    <q-icon name="auto_awesome" class="q-mr-xs" /> Diagnostic Advice
                  </div>
                  <div class="text-body2 text-white line-height-1-6">
                    "{{ result.advice }}"
                  </div>
                </div>
              </div>
            </div>

            <div class="text-white text-overline letter-spacing-1 q-mb-md">Correlated Conditions</div>
            <div class="q-gutter-y-md">
              <div
                v-for="(condition, index) in result.topConditions"
                :key="index"
                class="condition-item row items-center q-pa-md"
              >
                <div class="col">
                  <div class="text-white text-weight-bold text-body1 q-mb-xs">{{ condition.name }}</div>
                  <div class="row items-center q-gutter-sm">
                    <div class="col-8">
                      <q-linear-progress
                        :value="getLikelihoodValue(condition.likelihood)"
                        :color="getLikelihoodColor(condition.likelihood)"
                        size="8px"
                        class="border-radius-50"
                      />
                    </div>
                  </div>
                </div>
                <div class="col-auto">
                   <q-badge outline color="blue-3" :label="condition.likelihood" class="text-weight-bold q-pa-sm text-caption tracking-wider" />
                </div>
              </div>
            </div>

            <div class="row q-mt-xl pt-lg border-t-dark justify-between items-center">
              <q-btn flat label="Reset Interface" color="grey-5" @click="result = null" class="text-weight-bold" />
              <q-btn
                unelevated
                label="Book Specialist"
                color="blue-6"
                class="btn-primary-glow q-px-xl q-py-sm text-weight-bold"
                icon-right="event"
                to="/appointments"
              />
            </div>
          </div>
        </transition>

      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { api } from 'boot/axios'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const loading = ref(false)
const result = ref(null)

const form = reactive({
  symptomsText: '',
  age: null,
  gender: '',
})

const handleCheck = async () => {
  if (!form.symptomsText || !form.age || !form.gender) {
    $q.notify({ type: 'warning', message: 'Incomplete bio-data. Please fill all fields.' })
    return
  }

  loading.value = true
  try {
    // Calling MS4 AI Symptom Service
    const response = await api.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/ai/symptom-check`, form)
    if (response.data.success) {
      result.value = response.data.data
      $q.notify({ icon: 'cloud_done', color: 'cyan-9', message: 'Neural analysis complete.' })
    }
  } catch (error) {
    // ESLint error එක විසඳීමට console.log එක් කරන ලදී
    console.error('AI Node Connection Error:', error)
    $q.notify({ type: 'negative', message: 'MS4 Connection Error: AI Node unreachable.' })
  } finally {
    loading.value = false
  }
}

// UI Helper Functions
const getRiskColor = (level) => {
  const map = { low: 'cyan-8', medium: 'orange-8', high: 'red-9', emergency: 'black' }
  return map[level] || 'grey-7'
}

const getLikelihoodColor = (likelihood) => {
  const map = { high: 'red-5', medium: 'orange-5', low: 'cyan-5' }
  return map[likelihood] || 'blue-5'
}

const getLikelihoodValue = (likelihood) => {
  const map = { high: 1, medium: 0.6, low: 0.3 }
  return map[likelihood] || 0.1
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* GLOBAL */
.font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
.max-width-1200 { max-width: 1200px; }
.page-shell { padding-top: 100px; padding-bottom: 100px; }
.mt-120 { margin-top: 40px; }
.mt-subtitle { max-width: 600px; line-height: 1.6; }

/* ATMOSPHERIC GRADIENTS */
.page-bg-gradient {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none;
  background: 
    radial-gradient(circle at 50% 30%, rgba(37, 99, 235, 0.08), transparent 60%),
    radial-gradient(circle at 10% 80%, rgba(56, 189, 248, 0.04), transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.05), transparent 50%);
  z-index: 0;
}

/* TYPOGRAPHY */
.page-title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  letter-spacing: -2px;
  line-height: 1.1;
  text-shadow: 0 10px 30px rgba(0,0,0,0.5);
}
.text-gradient-primary {
  background: linear-gradient(to right, #38bdf8, #818cf8, #e879f9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.tracking-wider { letter-spacing: 1.5px; }
.letter-spacing-1 { letter-spacing: 1px; }
.line-height-1-6 { line-height: 1.6; }

/* BADGES & ICONS */
.trusted-badge {
  border: 1px solid rgba(125, 211, 252, 0.3);
  background: rgba(14, 165, 233, 0.1);
  backdrop-filter: blur(12px);
  border-radius: 50px;
  box-shadow: 0 0 20px rgba(14, 165, 233, 0.15);
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

/* CARDS & CONTAINERS */
.glass-card {
  background: rgba(10, 15, 30, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  position: relative;
}

.system-bubble {
  background: rgba(37, 99, 235, 0.08);
  border: 1px solid rgba(37, 99, 235, 0.15);
  padding: 24px;
  border-radius: 20px 20px 4px 20px;
}

.condition-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  transition: all 0.3s ease;
}
.condition-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

/* BORDERS */
.border-b-dark { border-bottom: 1px solid rgba(255,255,255,0.05); }
.border-t-dark { border-top: 1px solid rgba(255,255,255,0.05); padding-top: 24px;}
.border-blue-glow { border: 1px solid rgba(59, 130, 246, 0.3); box-shadow: 0 0 30px rgba(59, 130, 246, 0.1); }
.border-radius-50 { border-radius: 50px; }

/* INPUTS */
.cinematic-input :deep(.q-field__control) {
  background: rgba(0, 0, 0, 0.2) !important;
  border-radius: 12px;
}
.cinematic-input :deep(.q-field__control:before) {
  border-color: rgba(255, 255, 255, 0.1);
}
.cinematic-input :deep(.q-field__control:hover:before) {
  border-color: rgba(255, 255, 255, 0.2);
}
.textarea-glow :deep(.q-field__control:focus-within) {
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.1);
}

/* BUTTONS */
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

@media (max-width: 768px) {
  .page-shell { padding-top: 60px; padding-bottom: 60px; }
  .page-title { font-size: 2.8rem; }
  .glass-card { padding: 24px !important; }
}
</style>
