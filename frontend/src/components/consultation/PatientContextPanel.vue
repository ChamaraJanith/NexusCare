<template>
  <q-card class="panel">

    <div class="text-center q-pa-md">

      <q-avatar size="80px">
        <img :src="patient.avatar" />
      </q-avatar>

      <div class="text-h6 q-mt-sm">{{ patient.name }}</div>

      <div class="text-grey">
        Age: {{ patient.age }} | {{ patient.bloodGroup }}
      </div>

    </div>

    <q-separator />

    <!-- Allergies -->
    <div class="q-pa-md">
      <div class="title">Allergies</div>

      <q-badge
        v-for="a in patient.allergies"
        :key="a"
        color="red"
        class="q-mr-sm q-mt-sm"
      >
        {{ a }}
      </q-badge>
    </div>

    <q-separator />

    <!-- History -->
    <div class="q-pa-md">
      <div class="title">Medical History</div>

      <div v-for="h in patient.medicalHistory" :key="h.id" class="q-mt-sm">
        <div class="text-bold">{{ h.type }}</div>
        <div class="text-grey text-caption">{{ h.date }}</div>
      </div>
    </div>

  </q-card>
</template>

<script setup>
defineProps({
  patient: Object
})
</script>

<style scoped>
.panel {
  border-radius: 16px;
}

.title {
  font-weight: 600;
}
</style>