<template>
  <q-page padding style="background: #f5f6fa;">
    <div class="text-h5 text-weight-bold text-dark q-mb-lg">Reports</div>

    <div class="q-pa-xl flex flex-center column" style="min-height: 40vh;">
      <q-icon name="assessment" size="64px" color="grey-4" class="q-mb-md" />
      <div class="text-grey-5 text-h6">Reports Module</div>
      <div class="text-grey-6 q-mt-sm text-center" style="max-width: 400px;">
        Report generation and analytics will be available here once integrated with the reporting service.
      </div>
    </div>
  </q-page>
</template>

<script setup>
defineProps({ doctor: Object });
</script>
