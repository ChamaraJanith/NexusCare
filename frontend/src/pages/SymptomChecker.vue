<template>
  <q-page class="bg-black q-pa-lg flex flex-center relative-position overflow-hidden">
    <div class="absolute-top-right orb-bg shadow-cyan"></div>
    <div class="absolute-bottom-left orb-bg shadow-purple"></div>

    <div class="row justify-center full-width z-top">
      <div class="col-12 col-md-8 col-lg-6">
        <q-card flat class="nexus-card glass q-mb-lg animate-fade-in">
          <q-card-section class="row items-center q-py-lg">
            <div class="orb-container-sm q-mr-md">
              <div class="orb-glow bg-cyan"></div>
              <q-icon name="psychology" size="2.5rem" class="text-white relative-position" />
            </div>
            <div>
              <div class="text-h5 font-orbitron text-white text-weight-bolder letter-spacing-2">
                AI SYMPTOM CHECKER
              </div>
              <div class="text-cyan-4 text-caption uppercase letter-spacing-1">
                Powered by Gemini 3 Flash Core
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card flat class="nexus-card glass q-pa-md shadow-24">
          <q-card-section class="q-gutter-y-lg">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model.number="form.age"
                  type="number"
                  label="Patient Age"
                  dark
                  outlined
                  color="cyan-4"
                  class="nexus-input"
                  :rules="[(val) => !!val || 'Required']"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-select
                  v-model="form.gender"
                  :options="['Male', 'Female', 'Other']"
                  label="Gender"
                  dark
                  outlined
                  color="cyan-4"
                  class="nexus-input"
                  behavior="menu"
                  transition-show="jump-down"
                  transition-hide="jump-up"
                  :menu-offset="[0, 8]"
                  popup-content-class="nexus-dropdown-popup"
                  :popup-content-style="{
                    backgroundColor: '#001a1d',
                    border: '2px solid #00ffff',
                    boxShadow: '0 0 15px rgba(0, 255, 255, 0.4)',
                    zIndex: 9999,
                  }"
                  :rules="[(val) => !!val || 'Required']"
                />
              </div>
            </div>

            <q-input
              v-model="form.symptomsText"
              type="textarea"
              label="Describe medical symptoms..."
              dark
              outlined
              color="cyan-4"
              placeholder="E.g., Sharp chest pain and dry cough for 3 days."
              class="nexus-input"
              hint="AI provides better results with specific details"
              :rules="[(val) => !!val || 'Symptoms are required']"
            />

            <q-btn
              label="START NEURAL ANALYSIS"
              icon="analytics"
              class="full-width nexus-btn-glow font-orbitron q-py-md"
              :loading="loading"
              @click="handleCheck"
            >
              <template v-slot:loading>
                <q-spinner-orbit color="white" />
                <span class="q-ml-md">ANALYZING...</span>
              </template>
            </q-btn>
          </q-card-section>
        </q-card>

        <transition
          appear
          enter-active-class="animated zoomIn"
          leave-active-class="animated zoomOut"
        >
          <q-card v-if="result" class="nexus-card glass q-mt-xl border-cyan-glow">
            <q-card-section class="row items-center justify-between">
              <div class="text-h6 font-orbitron text-white">ANALYSIS REPORT</div>
              <q-badge
                :color="getRiskColor(result.riskLevel)"
                class="q-pa-sm text-weight-bold shadow-glow"
              >
                RISK: {{ result.riskLevel.toUpperCase() }}
              </q-badge>
            </q-card-section>

            <q-separator dark class="opacity-10" />

            <q-card-section class="q-pa-lg">
              <div class="text-cyan-4 text-overline q-mb-xs">Suggested Specialty</div>
              <div class="text-h5 text-white text-weight-bolder q-mb-md">
                {{ result.suggestedSpeciality }}
              </div>

              <div class="advice-box q-pa-md q-mb-lg">
                <div class="row items-center q-mb-sm">
                  <q-icon name="smart_toy" color="cyan-4" size="sm" class="q-mr-sm" />
                  <span class="text-cyan-2 text-weight-bold">AI DIAGNOSTIC ADVICE:</span>
                </div>
                <div class="text-grey-3 italic">{{ result.advice }}</div>
              </div>

              <div class="text-white text-overline q-mb-sm">Likely Conditions</div>
              <q-list class="q-gutter-y-sm">
                <q-item
                  v-for="(condition, index) in result.topConditions"
                  :key="index"
                  class="condition-item"
                >
                  <q-item-section>
                    <q-item-label class="text-cyan-1 text-weight-bold">{{
                      condition.name
                    }}</q-item-label>
                    <q-linear-progress
                      :value="getLikelihoodValue(condition.likelihood)"
                      :color="getLikelihoodColor(condition.likelihood)"
                      class="q-mt-xs"
                      rounded
                    />
                  </q-item-section>
                  <q-item-section side>
                    <q-badge outline color="cyan-3" :label="condition.likelihood" />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>

            <q-card-actions align="between" class="q-pa-md bg-glass-dark">
              <q-btn flat label="Reset" color="grey-5" @click="result = null" />
              <q-btn
                label="BOOK SPECIALIST"
                color="cyan-10"
                class="nexus-btn-small"
                icon="event"
                to="/appointments"
              />
            </q-card-actions>
          </q-card>
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
    const response = await api.post('http://localhost:5004/api/ai/symptom-check', form)
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
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');

.font-orbitron {
  font-family: 'Orbitron', sans-serif;
}
.letter-spacing-2 {
  letter-spacing: 2px;
}

/* Glassmorphism Design */
.glass {
  background: rgba(255, 255, 255, 0.03) !important;
  backdrop-filter: blur(15px);
  border: 1px solid rgba(0, 255, 255, 0.1);
  border-radius: 20px;
}

.nexus-card {
  transition: all 0.3s ease;
}

.border-cyan-glow {
  border-color: rgba(0, 255, 255, 0.4);
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.1);
}

/* Button & Inputs Styling */
.nexus-btn-glow {
  background: linear-gradient(45deg, #00838f, #00bcd4);
  color: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 188, 212, 0.3);
}

.nexus-input :deep(.q-field__control) {
  border-radius: 12px;
}

/* Background Decorations */
.orb-bg {
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
  z-index: 0;
}
.shadow-cyan {
  background: #00ffff;
  top: -10%;
  right: -5%;
}
.shadow-purple {
  background: #673ab7;
  bottom: -10%;
  left: -5%;
}

.orb-container-sm {
  position: relative;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.orb-glow {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  filter: blur(15px);
  opacity: 0.5;
}

.advice-box {
  background: rgba(0, 188, 212, 0.05);
  border-left: 4px solid #00bcd4;
  border-radius: 8px;
}

.condition-item {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.shadow-glow {
  box-shadow: 0 0 10px currentColor;
}
.bg-glass-dark {
  background: rgba(0, 0, 0, 0.3);
}
</style>
