<template>
  <q-page padding class="bg-grey-1">
    <div class="row justify-center">
      <div class="col-12 col-md-8 col-lg-6">

        <q-card flat bordered class="q-mb-md">
          <q-card-section class="bg-primary text-white">
            <div class="text-h6">
              <q-icon name="psychology" size="sm" class="q-mr-sm" />
              AI Symptom Checker
            </div>
            <div class="text-subtitle2">Powered by Gemini 3 Flash</div>
          </q-card-section>
        </q-card>

        <q-card flat bordered>
          <q-card-section class="q-gutter-y-md">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model.number="form.age"
                  type="number"
                  label="Age"
                  outlined
                  dense
                  :rules="[val => !!val || 'Required']"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-select
                  v-model="form.gender"
                  :options="['Male', 'Female', 'Other']"
                  label="Gender"
                  outlined
                  dense
                  :rules="[val => !!val || 'Required']"
                />
              </div>
            </div>

            <q-input
              v-model="form.symptomsText"
              type="textarea"
              label="Describe how you feel..."
              outlined
              placeholder="E.g., I have a sharp pain in my chest and a dry cough for 3 days."
              hint="Be as specific as possible for better results."
              :rules="[val => !!val || 'Symptoms are required']"
            />

            <q-btn
              label="Analyze Symptoms"
              color="primary"
              icon="analytics"
              class="full-width"
              :loading="loading"
              @click="handleCheck"
            />
          </q-card-section>
        </q-card>

        <transition-group
          appear
          enter-active-class="animated fadeIn"
          leave-active-class="animated fadeOut"
        >
          <q-card v-if="result" :key="result" flat bordered class="q-mt-md">
            <q-card-section>
              <div class="row items-center justify-between">
                <div class="text-h6">Analysis Results</div>
                <q-badge :color="getRiskColor(result.riskLevel)" class="q-pa-sm text-subtitle2">
                  RISK: {{ result.riskLevel.toUpperCase() }}
                </q-badge>
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section>
              <div class="text-subtitle1 text-bold color-primary">Suggested Specialty:</div>
              <div class="text-h6 text-secondary">{{ result.suggestedSpeciality }}</div>

              <q-banner dense class="bg-blue-1 q-mt-md rounded-borders">
                <template v-slot:avatar>
                  <q-icon name="info" color="blue" />
                </template>
                <strong>AI Advice:</strong> {{ result.advice }}
              </q-banner>

              <div class="q-mt-lg text-bold">Possible Conditions:</div>
              <q-list bordered separator class="q-mt-sm rounded-borders">
                <q-item v-for="(condition, index) in result.topConditions" :key="index">
                  <q-item-section>
                    <q-item-label class="text-bold">{{ condition.name }}</q-item-label>
                    <q-item-label caption>Likelihood: {{ condition.likelihood }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-linear-progress
                      :value="getLikelihoodValue(condition.likelihood)"
                      :color="getLikelihoodColor(condition.likelihood)"
                      class="q-mt-sm"
                      style="width: 100px"
                    />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>

            <q-card-actions align="right">
              <q-btn flat label="Clear" color="grey" @click="result = null" />
              <q-btn label="Book Appointment" color="secondary" icon="event" to="/appointments" />
            </q-card-actions>
          </q-card>
        </transition-group>

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
  gender: ''
})

const handleCheck = async () => {
  // Simple validation
  if (!form.symptomsText || !form.age || !form.gender) {
    $q.notify({
      type: 'warning',
      message: 'Please fill all fields before analyzing.'
    })
    return
  }

  loading.value = true
  try {
    // Calling MS4 AI Symptom Service [cite: 7, 30]
    // Note: Use your specific backend URL/Port here
    const response = await api.post('http://localhost:5004/api/ai/symptom-check', form)

    if (response.data.success) {
      result.value = response.data.data
      $q.notify({
        type: 'positive',
        message: 'Analysis complete!'
      })
    }
  } catch (error) {
    console.error('Frontend Error:', error)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.details || 'AI service is currently unavailable.'
    })
  } finally {
    loading.value = false
  }
}

// UI Helper Functions
const getRiskColor = (level) => {
  const map = { low: 'positive', medium: 'orange', high: 'negative', emergency: 'black' }
  return map[level] || 'grey'
}

const getLikelihoodColor = (likelihood) => {
  const map = { high: 'negative', medium: 'orange', low: 'positive' }
  return map[likelihood] || 'blue'
}

const getLikelihoodValue = (likelihood) => {
  const map = { high: 1, medium: 0.6, low: 0.3 }
  return map[likelihood] || 0
}
</script>

<style scoped>
.color-primary {
  color: #1976D2;
}
</style>
