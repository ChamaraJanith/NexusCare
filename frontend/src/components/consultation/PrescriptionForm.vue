<template>
  <q-card class="panel">

    <div class="q-pa-md text-h6">E-Prescription</div>

    <q-separator />

    <div class="q-pa-md">

      <q-input v-model="drug" label="Drug Name" />
      <q-input v-model="dosage" label="Dosage" class="q-mt-md"/>

      <q-btn label="Add Prescription" color="primary" class="q-mt-md"/>

    </div>

  </q-card>
</template>

<script setup>
import { ref } from "vue"

const drug = ref("")
const dosage = ref("")
</script>

<style scoped>
.panel {
  border-radius: 16px;
}
</style>