<template>
  <q-card flat bordered style="border-radius: 14px; transition: box-shadow 0.2s;" class="slot-card">
    <!-- Color accent bar -->
    <div :style="`height: 5px; background: ${slotData.isRecurring ? '#1976d2' : '#1abc9c'}; border-radius: 14px 14px 0 0;`" />

    <q-card-section>
      <!-- Top row: badge + actions -->
      <div class="row items-center justify-between q-mb-md">
        <q-chip
          dense
          :color="slotData.isRecurring ? 'blue-1' : 'teal-1'"
          :text-color="slotData.isRecurring ? 'primary' : 'teal'"
          :icon="slotData.isRecurring ? 'repeat' : 'event'"
          :label="slotData.isRecurring ? 'Recurring' : 'One-Time'"
          style="font-weight: 600; border-radius: 6px; font-size: 11px;"
        />
        <q-chip
          dense
          :color="slotData.isBooked ? 'orange-1' : 'green-1'"
          :text-color="slotData.isBooked ? 'orange' : 'positive'"
          :label="slotData.isBooked ? 'Booked' : 'Available'"
          style="font-weight: 600; border-radius: 6px; font-size: 11px;"
        />
      </div>

      <!-- Date / Day -->
      <div class="text-weight-bold text-dark" style="font-size: 17px; line-height: 1.3; margin-bottom: 6px;">
        {{ slotData.isRecurring ? `Every ${slotData.dayOfWeek}` : formatDate(slotData.date) }}
      </div>

      <!-- Time -->
      <div class="row items-center q-mb-sm text-grey-7">
        <q-icon name="schedule" size="16px" class="q-mr-xs" />
        <span style="font-size: 14px; font-weight: 500;">{{ formatTime(slotData.startTime) }} — {{ formatTime(slotData.endTime) }}</span>
      </div>

      <!-- Location / Platform -->
      <div v-if="getSlotDisplayText(slotData)" class="row items-center text-grey-6">
        <q-icon :name="getSlotIcon(slotData)" size="16px" :class="['q-mr-xs', getSlotIconColor(slotData)]" />
        <span style="font-size: 13px;">{{ getSlotDisplayText(slotData) }}</span>
      </div>
    </q-card-section>

    <q-separator />

    <!-- Actions -->
    <q-card-actions class="q-px-md q-py-sm">
      <q-btn flat dense size="sm" icon="edit" color="primary" label="Edit" class="text-capitalize" @click="$emit('edit', slotData)" />
      <q-space />
      <q-btn flat dense size="sm" icon="delete_outline" color="negative" label="Delete" class="text-capitalize" @click="$emit('delete', slotData)" />
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { onMounted } from 'vue';

const props = defineProps({ slotData: Object });
defineEmits(['edit', 'delete']);

onMounted(() => {
  console.log('SlotData Rendered:', props.slotData);
});

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? String(dateStr) : d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const formatTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
};

const getSlotDisplayText = (slot) => {
  if (slot.slotType === "ONLINE") {
    return slot.platform ? `Online - ${slot.platform}` : "Online";
  }
  return slot.location || slot.hospital || null;
};

const getSlotIcon = (slot) => {
  return slot.slotType === "ONLINE" ? "videocam" : "local_hospital";
};

const getSlotIconColor = (slot) => {
  return slot.slotType === "ONLINE" ? "text-blue-4" : "text-red-3";
};
</script>

<style scoped>
.slot-card:hover {
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
}
</style>
