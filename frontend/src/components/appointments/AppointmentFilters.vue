<template>
  <div class="row q-col-gutter-md q-mb-md">

    <q-input
      filled
      v-model="search"
      label="Search patient..."
      class="col-12 col-md-6"
    />

    <q-select
      filled
      v-model="status"
      :options="options"
      label="Status"
      class="col-12 col-md-3"
    />

  </div>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
  search: String,
  status: String
})

const emit = defineEmits(["update:search", "update:status"])

const options = ["all", "upcoming", "completed", "cancelled"]

const search = computed({
  get: () => props.search,
  set: v => emit("update:search", v)
})

const status = computed({
  get: () => props.status,
  set: v => emit("update:status", v)
})
</script>