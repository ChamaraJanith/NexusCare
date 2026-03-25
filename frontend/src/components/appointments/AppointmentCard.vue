<template>
  <q-card class="q-pa-md q-mb-sm card">

    <div class="row justify-between items-center">

      <div>
        <div class="text-bold">{{ appointment.patientName }}</div>
        <div class="text-grey">{{ appointment.reason }}</div>
      </div>

      <div class="row items-center q-gutter-md">
        <div>{{ appointment.date }}</div>
        <div>{{ appointment.time }}</div>

        <q-badge :color="color">
          {{ appointment.status }}
        </q-badge>
      </div>

    </div>

  </q-card>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
  appointment: Object
})

const color = computed(() => {
  if (props.appointment.status === "completed") return "green"
  if (props.appointment.status === "cancelled") return "red"
  return "blue"
})
</script>

<style scoped>
.card {
  border-radius: 12px;
}
</style>