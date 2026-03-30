<template>
  <q-card
    flat bordered
    style="border-radius: 14px; transition: box-shadow 0.2s, opacity 0.2s;"
    :style="isExpired ? 'opacity: 0.6;' : ''"
    class="slot-card"
  >
    <!-- Color accent bar -->
    <div :style="`height: 5px; background: ${slotData.isRecurring ? '#1976d2' : '#1abc9c'}; border-radius: 14px 14px 0 0;`" />

    <q-card-section>
      <!-- Top row: badge + status chips -->
      <div class="row items-center justify-between q-mb-md">
        <q-chip
          dense
          :color="isTemplate ? 'grey-3' : 'green-1'"
          :text-color="isTemplate ? 'grey-8' : 'positive'"
          :icon="isTemplate ? 'tune' : 'check_circle'"
          :label="isTemplate ? 'Template' : 'Live Slot'"
          style="font-weight: 600; border-radius: 6px; font-size: 11px;"
        />
        <q-chip
          v-if="!isTemplate"
          dense
          :color="capacityChipColor"
          :text-color="capacityChipTextColor"
          :label="capacityChipLabel"
          style="font-weight: 600; border-radius: 6px; font-size: 11px;"
        />
        <!-- Expired badge -->
        <q-chip
          v-if="isExpired"
          dense
          color="grey-3"
          text-color="grey-7"
          icon="schedule_send"
          label="Expired"
          style="font-weight: 600; border-radius: 6px; font-size: 11px;"
        />
      </div>

      <!-- Date / Day -->
      <div class="text-weight-bold text-dark" style="font-size: 17px; line-height: 1.3; margin-bottom: 6px;">
        <span v-if="slotData.isRecurring && !slotData.date">Every {{ slotData.dayOfWeek }} (Template)</span>
        <span v-else>{{ formatDate(slotData.date) }}</span>
      </div>

      <!-- Time -->
      <div class="row items-center q-mb-sm text-grey-7">
        <q-icon name="schedule" size="16px" class="q-mr-xs" />
        <span style="font-size: 14px; font-weight: 500;">{{ formatTime(slotData.startTime) }} — {{ formatTime(slotData.endTime) }}</span>
      </div>

      <!-- Location / Platform -->
      <div v-if="getSlotDisplayText(slotData)" class="row items-center text-grey-6 q-mb-md">
        <q-icon :name="getSlotIcon(slotData)" size="16px" :class="['q-mr-xs', getSlotIconColor(slotData)]" />
        <span style="font-size: 13px;">{{ getSlotDisplayText(slotData) }}</span>
      </div>

      <!-- ─── Capacity Usage ──────────────────────────────────────── -->
      <div v-if="!isTemplate" class="capacity-container">
        <!-- Counter row -->
        <div class="row items-center justify-between q-mb-xs">
          <div class="row items-center" style="gap: 4px;">
            <q-icon name="people" size="14px" :style="`color: ${barColor}`" />
            <span style="font-size: 12px; font-weight: 600; color: #374151;">
              {{ booked }} / {{ total }} booked
            </span>
          </div>
          <span
            v-if="remaining === 0"
            style="font-size: 11px; font-weight: 700; color: #ef4444; text-transform: uppercase; letter-spacing: 0.5px;"
          >
            FULL
          </span>
          <span
            v-else
            style="font-size: 11px; color: #6b7280;"
          >
            {{ remaining }} left
          </span>
        </div>

        <!-- Progress bar -->
        <div class="progress-bar-container">
          <div
            class="progress-bar-fill"
            :style="`width: ${percentage}%; background-color: ${barColor};`"
          />
        </div>
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
import { computed, onMounted } from 'vue';

const props = defineProps({ slotData: Object });
defineEmits(['edit', 'delete']);

onMounted(() => {
  console.log('SlotData Rendered:', props.slotData);
});

const isTemplate = computed(() => props.slotData?.isRecurring && !props.slotData?.date);

// ─── Capacity Computed ────────────────────────────────────────────
const total      = computed(() => props.slotData?.slotCount   || 1);
const booked     = computed(() => props.slotData?.bookedCount || 0);
const remaining  = computed(() => total.value - booked.value);
const percentage = computed(() => Math.min((booked.value / total.value) * 100, 100));

// ─── Expiry Detection ────────────────────────────────────────────
const isExpired = computed(() => {
  if (!props.slotData?.date || !props.slotData?.startTime) return false;
  const slotDateTime = new Date(props.slotData.date);
  const [h, m] = props.slotData.startTime.split(':');
  slotDateTime.setHours(parseInt(h), parseInt(m), 0, 0);
  return slotDateTime < new Date();
});

const barColor = computed(() => {
  if (percentage.value > 80) return '#ef4444'; // red
  if (percentage.value > 50) return '#f59e0b'; // amber
  return '#10b981';                             // green
});

// Status chip — replaces old isBooked chip with capacity-aware state
const capacityChipLabel     = computed(() => remaining.value === 0 ? 'Slot Full' : 'Available');
const capacityChipColor     = computed(() => remaining.value === 0 ? 'red-1' : 'green-1');
const capacityChipTextColor = computed(() => remaining.value === 0 ? 'negative' : 'positive');

// ─── Formatting ──────────────────────────────────────────────────
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

.capacity-container {
  margin-top: 4px;
}

.progress-bar-container {
  width: 100%;
  height: 6px;
  background-color: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.4s ease, background-color 0.3s ease;
}
</style>
