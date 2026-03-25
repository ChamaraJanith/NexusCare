<template>
  <q-layout view="lHh Lpr lFf" class="bg-main">

    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Area -->
    <div class="main-wrapper">

      <TopNav @menu-click="toggleDrawer" />

      <q-page-container>
        <q-page class="page-padding">
          <div class="container">
            <router-view />
          </div>
        </q-page>
      </q-page-container>

    </div>

  </q-layout>
</template>

<script setup>
import Sidebar from "src/components/layout/Sidebar.vue"
import TopNav from "src/components/layout/TopNav.vue"
import { ref } from "vue"

const drawer = ref(false)
const toggleDrawer = () => {
  drawer.value = !drawer.value
}
</script>

<style scoped>
.bg-main {
  background: #f4f7f9;
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.page-padding {
  padding: 20px;
}

.container {
  max-width: 1200px;
  margin: auto;
}
</style>