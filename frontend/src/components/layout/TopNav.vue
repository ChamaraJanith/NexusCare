<template>
  <q-header class="topnav">

    <q-toolbar>

      <q-btn flat dense icon="menu" @click="$emit('menu-click')" />

      <div class="title">{{ title }}</div>

      <q-space />

      <q-btn flat round icon="notifications" />

      <q-avatar>
        <img src="https://cdn.quasar.dev/img/avatar.png" />
      </q-avatar>

    </q-toolbar>

  </q-header>
</template>

<script setup>
import { useRoute } from "vue-router"
import { computed } from "vue"

const route = useRoute()

const title = computed(() => {
  if (route.path.includes("consultations")) return "Consultations"
  if (route.path.includes("analytics")) return "Analytics"
  return "Dashboard"
})
</script>

<style scoped>
.topnav {
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.title {
  font-weight: 600;
  font-size: 16px;
}
</style>