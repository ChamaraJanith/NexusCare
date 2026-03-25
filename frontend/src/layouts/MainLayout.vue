<template>
  <q-layout view="lHh Lpr lFf" class="bg-black text-white">
    <q-header elevated class="nexus-header">
      <q-toolbar class="q-py-md">
        <q-btn flat dense round icon="menu" @click="toggleLeftDrawer" class="text-cyan-4" />
        <q-toolbar-title class="font-orbitron text-cyan-4 text-weight-bolder letter-spacing-3">
          <q-icon name="hub" size="md" class="q-mr-sm glow-icon" />
          NEXUS CARE
        </q-toolbar-title>
        <q-space />
        <div class="row items-center q-gutter-md no-wrap">
          <div class="status-pill row items-center q-px-md q-py-xs hide-xs">
            <q-badge rounded color="green" class="pulse-green q-mr-sm" />
            <span class="text-overline text-cyan-2">SYSTEM: ONLINE</span>
          </div>
          <q-avatar size="42px" class="border-cyan glow-avatar">
            <img src="https://cdn.quasar.dev/img/avatar.png">
          </q-avatar>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :width="280"
      class="nexus-drawer"
    >
      <div class="sidebar-content full-height bg-black-nexus">
        <q-scroll-area class="fit">
          <div class="q-pa-md">
            <div class="text-cyan-4 text-weight-bold uppercase letter-spacing-2 q-mb-xl opacity-80" style="font-size: 11px;">
              Navigation Nodes
            </div>

            <q-list class="q-gutter-y-sm">
              <q-item clickable v-ripple to="/" exact class="nexus-nav-item">
                <q-item-section avatar>
                  <q-icon name="dashboard" color="cyan-4" size="sm" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-white font-orbitron text-caption">Command Center</q-item-label>
                </q-item-section>
              </q-item>

              <q-item clickable v-ripple to="/symptoms" class="nexus-nav-item active-node">
                <q-item-section avatar>
                  <q-icon name="auto_awesome" color="cyan-2" size="sm" class="glow-icon-sm" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-cyan-1 font-orbitron text-caption text-weight-bolder">Interaction Hub</q-item-label>
                  <q-item-label caption class="text-cyan-8">Node: MS4</q-item-label>
                </q-item-section>
              </q-item>

              <q-separator dark class="q-my-lg opacity-20" />

              <div class="text-grey-5 text-overline q-pl-sm q-mb-sm">Locked Services</div>

              <q-item disable class="nexus-nav-item locked-item-bright">
                <q-item-section avatar><q-icon name="person" color="white" size="xs" /></q-item-section>
                <q-item-section class="text-white font-orbitron text-caption opacity-70">Patient MS1</q-item-section>
              </q-item>

              <q-item disable class="nexus-nav-item locked-item-bright">
                <q-item-section avatar><q-icon name="medical_services" color="white" size="xs" /></q-item-section>
                <q-item-section class="text-white font-orbitron text-caption opacity-70">Doctor MS2</q-item-section>
              </q-item>

              <q-item disable class="nexus-nav-item locked-item-bright">
                <q-item-section avatar><q-icon name="event" color="white" size="xs" /></q-item-section>
                <q-item-section class="text-white font-orbitron text-caption opacity-70">Schedule MS3</q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-scroll-area>

        <div class="absolute-bottom q-pa-md footer-glass">
          <q-btn flat dense class="full-width text-cyan-10" icon="terminal" label="VIEW LOGS" size="xs" />
        </div>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
const leftDrawerOpen = ref(false)
const toggleLeftDrawer = () => { leftDrawerOpen.value = !leftDrawerOpen.value }
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');

.font-orbitron { font-family: 'Orbitron', sans-serif; }

:deep(.q-drawer) {
  background: #00080a !important;
  border-right: 1px solid rgba(0, 255, 255, 0.1) !important;
}

.bg-black-nexus { background: #00080a; }

.nexus-header {
  background: rgba(0, 8, 10, 0.9) !important;
  backdrop-filter: blur(15px);
  border-bottom: 1px solid rgba(0, 255, 255, 0.1);
}

.nexus-nav-item { border-radius: 8px; margin-bottom: 5px; }

.active-node {
  background: rgba(0, 255, 255, 0.1) !important;
  border: 1px solid rgba(0, 255, 255, 0.2);
}
.locked-item-bright {
  opacity: 0.6;
  border: 1px dashed rgba(255, 255, 255, 0.1);
}

.glow-icon-sm { filter: drop-shadow(0 0 5px rgba(0, 255, 255, 0.8)); }
.footer-glass { background: rgba(0, 0, 0, 0.5); border-top: 1px solid rgba(255, 255, 255, 0.05); }
.status-pill { background: rgba(0, 255, 255, 0.05); border: 1px solid rgba(0, 255, 255, 0.1); }
.pulse-green { animation: pulse-green-glow 2s infinite; }

@keyframes pulse-green-glow {
  0% { box-shadow: 0 0 0 0 rgba(0, 255, 0, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(0, 255, 0, 0); }
  100% { box-shadow: 0 0 0 0 rgba(0, 255, 0, 0); }
}
</style>
