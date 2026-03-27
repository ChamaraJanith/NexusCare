<template>
  <q-page padding style="background: #f5f6fa;">
    <div class="row items-center justify-between q-mb-lg">
      <div class="text-h5 text-weight-bold text-dark">Availability Slots</div>
      <q-btn color="primary" icon="add" label="Add Slot" class="text-capitalize" style="border-radius: 8px;" @click="showAdd = true" />
    </div>

    <div v-if="loading" class="flex flex-center" style="min-height: 40vh;">
      <q-spinner-puff color="primary" size="50px" />
    </div>

    <div v-else-if="slots.length === 0" class="q-pa-xl flex flex-center column" style="min-height: 40vh;">
      <q-icon name="event_available" size="64px" color="grey-4" class="q-mb-md" />
      <div class="text-grey-5 text-h6">No availability slots configured.</div>
      <div class="text-grey-6 q-mt-sm">Click "Add Slot" to set your available hours.</div>
    </div>

    <div v-else class="row q-col-gutter-md">
      <div v-for="slot in slots" :key="slot._id" class="col-12 col-sm-6 col-md-4">
        <q-card flat bordered style="border-radius: 12px;">
          <q-card-section>
            <div class="row items-center q-mb-sm">
              <q-icon name="calendar_today" color="primary" size="20px" class="q-mr-sm" />
              <span class="text-weight-bold text-dark" style="font-size: 15px;">{{ slot.day || formatDate(slot.date) }}</span>
            </div>
            <div class="text-grey-7" style="font-size: 13px;">
              <q-icon name="schedule" size="14px" class="q-mr-xs" />
              {{ slot.startTime }} — {{ slot.endTime }}
            </div>
            <q-badge class="q-mt-sm" :color="slot.isBooked ? 'negative' : 'positive'" :label="slot.isBooked ? 'Booked' : 'Available'" />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Add Slot Dialog (placeholder) -->
    <q-dialog v-model="showAdd">
      <q-card style="min-width: 350px; border-radius: 12px;">
        <q-card-section class="text-h6 text-weight-bold">Add Availability Slot</q-card-section>
        <q-card-section>
          <div class="text-grey-6">This feature connects to POST /api/availability. Form coming soon.</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { fetchAvailability } from 'src/services/doctorApi';

const props = defineProps({ doctor: Object });
const slots = ref([]);
const loading = ref(true);
const showAdd = ref(false);

const parseJwt = (t) => { try { return JSON.parse(atob(t.split('.')[1])); } catch { return null; } };
const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString() : '';

onMounted(async () => {
  const token = localStorage.getItem('token') || localStorage.getItem('nexus_token');
  const decoded = token ? parseJwt(token) : null;
  if (decoded?.roleId) {
    slots.value = await fetchAvailability(decoded.roleId);
    console.log('[Availability] Loaded slots:', slots.value);
  }
  loading.value = false;
});
</script>
