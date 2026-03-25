<template>
  <div>

    <!-- 🔥 HEADER -->
    <div class="row justify-between items-center q-mb-md">
      <div class="text-h5 text-weight-bold">Doctor Dashboard</div>
    </div>

    <!-- 🔥 LOADING -->
    <div v-if="store.loading" class="flex flex-center q-my-lg">
      <q-spinner size="50px" color="primary" />
    </div>

    <!-- 🔥 ERROR -->
    <div v-if="store.error" class="text-red q-mb-md">
      {{ store.error }}
    </div>

    <!-- 🔥 STATS -->
    <div class="row q-col-gutter-md q-mb-lg">

      <q-card class="col-12 col-md-3 stat-card">
        <div class="text-grey">Total Patients</div>
        <div class="text-h6">{{ stats.totalPatients }}</div>
      </q-card>

      <q-card class="col-12 col-md-3 stat-card">
        <div class="text-grey">Appointments</div>
        <div class="text-h6">{{ stats.totalAppointments }}</div>
      </q-card>

      <q-card class="col-12 col-md-3 stat-card">
        <div class="text-grey">Revenue</div>
        <div class="text-h6">${{ stats.revenue }}</div>
      </q-card>

      <q-card class="col-12 col-md-3 stat-card">
        <div class="text-grey">Rating</div>
        <div class="text-h6">{{ stats.rating }} ⭐</div>
      </q-card>

    </div>

    <!-- 🔥 FILTERS -->
    <AppointmentFilters
      v-model:search="search"
      v-model:status="status"
    />

    <!-- 🔥 APPOINTMENT LIST -->
    <div v-if="!store.loading">
      <AppointmentCard
        v-for="a in filteredAppointments"
        :key="a._id || a.id"
        :appointment="a"
      />
    </div>

    <!-- 🔥 EMPTY STATE -->
    <div v-if="filteredAppointments.length === 0 && !store.loading" class="text-grey text-center q-mt-lg">
      No appointments found
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { useAppointmentStore } from "src/stores/appointmentStore"

import AppointmentCard from "src/components/appointments/AppointmentCard.vue"
import AppointmentFilters from "src/components/appointments/AppointmentFilters.vue"

const store = useAppointmentStore()

const search = ref("")
const status = ref("all")

// 🔥 LOAD DATA FROM API
onMounted(() => {
  store.fetchAppointments()
})

// 🔥 FILTER LOGIC
const filteredAppointments = computed(() => {
  return store.appointments.filter(a => {
    const name = a.patientName || a.patient?.name || ""

    const matchSearch = name.toLowerCase().includes(search.value.toLowerCase())
    const matchStatus = status.value === "all" || a.status === status.value

    return matchSearch && matchStatus
  })
})

// 🔥 STATS CALCULATION (dynamic)
const stats = computed(() => {
  const totalAppointments = store.appointments.length

  const totalPatients = new Set(
    store.appointments.map(a => a.patientId || a.patient?._id)
  ).size

  const revenue = totalAppointments * 25 // dummy calc (later real API)
  const rating = 4.8

  return {
    totalAppointments,
    totalPatients,
    revenue,
    rating
  }
})
</script>

<style scoped>
.stat-card {
  padding: 18px;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: 0.2s;
}

.stat-card:hover {
  transform: translateY(-3px);
}
</style>