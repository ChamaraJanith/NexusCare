<template>
  <div>

    <div class="text-h5 q-mb-md">Analytics</div>

    <div class="row q-col-gutter-md">

      <q-card class="col-12 col-md-6 q-pa-md">
        <div class="text-subtitle1">Consultations Trend</div>
        <div class="chart-placeholder">Chart Here 📈</div>
      </q-card>

      <q-card class="col-12 col-md-6 q-pa-md">
        <div class="text-subtitle1">Patient Distribution</div>
        <div class="chart-placeholder">Chart Here 📊</div>
      </q-card>

    </div>

  </div>
</template>

<style scoped>
.chart-placeholder {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border-radius: 10px;
}
</style>