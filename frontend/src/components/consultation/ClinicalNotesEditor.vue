<template>
  <q-card class="panel">

    <div class="q-pa-md text-h6">Clinical Notes</div>

    <q-separator />

    <div class="q-pa-md">

      <q-input v-model="notes.chief" label="Chief Complaint" type="textarea" />

      <q-input v-model="notes.history" label="History" type="textarea" class="q-mt-md"/>

      <q-input v-model="notes.exam" label="Examination" type="textarea" class="q-mt-md"/>

    </div>

  </q-card>
</template>

<script setup>
import { reactive } from "vue"

const notes = reactive({
  chief: "",
  history: "",
  exam: ""
})
</script>

<style scoped>
.panel {
  border-radius: 16px;
}
</style>