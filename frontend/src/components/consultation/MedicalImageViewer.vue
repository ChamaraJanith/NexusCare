<template>
  <q-card class="image-panel">

    <img
      src="https://images.unsplash.com/photo-1530497610245-94d3c16cda28"
      class="image"
    />

    <div class="overlay">
      <q-btn icon="zoom_in" flat round />
      <q-btn icon="edit" flat round />
    </div>

  </q-card>
</template>

<style scoped>
.image-panel {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
}

.image {
  width: 100%;
  height: 300px;
  object-fit: cover;
}

.overlay {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 10px;
}
</style>