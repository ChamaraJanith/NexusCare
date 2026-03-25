<template>
  <q-drawer
    show-if-above
    bordered
    :width="260"
    class="sidebar"
  >

    <div class="logo">
      <q-icon name="monitor_heart" size="28px" />
      <span>NexusCare</span>
    </div>

    <q-list class="menu">

      <q-item clickable to="/doctor/dashboard" v-ripple>
        <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
        <q-item-section>Dashboard</q-item-section>
      </q-item>

      <q-item clickable to="/doctor/consultations">
        <q-item-section avatar><q-icon name="chat" /></q-item-section>
        <q-item-section>Consultations</q-item-section>
      </q-item>

      <q-item clickable to="/doctor/availability">
        <q-item-section avatar><q-icon name="schedule" /></q-item-section>
        <q-item-section>Availability</q-item-section>
      </q-item>

      <q-item clickable to="/doctor/analytics">
        <q-item-section avatar><q-icon name="bar_chart" /></q-item-section>
        <q-item-section>Analytics</q-item-section>
      </q-item>

    </q-list>

  </q-drawer>
</template>

<style scoped>
.sidebar {
  background: #0f172a;
  color: #cbd5e1;
}

.logo {
  padding: 20px;
  font-size: 18px;
  font-weight: bold;
  display: flex;
  gap: 10px;
  color: #22c55e;
}

.menu {
  padding: 10px;
}
</style>