<template>
  <button 
    class="slot-card full-width relative-position flex column items-center justify-center q-pa-sm"
    :class="[status, { 'selected': isSelected }]"
    :disabled="status === 'booked' || status === 'unavailable'"
    @click="$emit('select', slotItem)"
  >
    <div class="time-text text-weight-bold">{{ slotItem.time }}</div>
    <div v-if="slotItem.queueNumber" class="queue-badge q-mt-xs">No. {{ slotItem.queueNumber }}</div>
    
    <div v-if="status === 'booked' || status === 'unavailable'" class="booked-overlay absolute-full flex flex-center">
      <span class="text-caption text-weight-bold uppercase text-red-3">Booked</span>
    </div>
  </button>
</template>

<script setup>
defineProps({ slotItem: Object, status: String, isSelected: Boolean });
defineEmits(['select']);
</script>

<style scoped>
.slot-card {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #e2e8f0;
  transition: all 0.2s ease;
  cursor: pointer;
  min-height: 70px;
  overflow: hidden;
}
.slot-card.available:hover { background: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.5); }
.slot-card.selected { background: rgba(37, 99, 235, 0.3); border-color: #3b82f6; box-shadow: 0 0 10px rgba(59, 130, 246, 0.3); }
.slot-card.selected .time-text { color: #60a5fa; }
.slot-card.booked, .slot-card.unavailable { opacity: 0.6; cursor: not-allowed; border-color: rgba(239, 68, 68, 0.2); background: rgba(15, 23, 42, 0.8); }
.time-text { font-size: 14px; z-index: 1; }
.queue-badge { font-size: 10px; background: rgba(255, 255, 255, 0.1); padding: 2px 8px; border-radius: 10px; z-index: 1; }
.slot-card.selected .queue-badge { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
.booked-overlay { background: rgba(239, 68, 68, 0.1); backdrop-filter: grayscale(100%); }
</style>
