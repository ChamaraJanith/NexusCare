<template>
  <q-page padding style="background: #f5f6fa; min-height: 100vh;">

    <!-- Page Header -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h5 text-weight-bold" style="color: #1c2b36;">Availability Slots</div>
        <div class="text-grey-6 text-body2">Manage your one-time and recurring availability</div>
      </div>
      <q-btn
        unelevated
        color="primary"
        icon="add"
        label="Add Slot"
        class="text-capitalize text-weight-bold"
        style="border-radius: 10px; padding: 10px 20px;"
        @click="openDialog()"
      />
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="row q-col-gutter-md">
      <div v-for="n in 4" :key="n" class="col-12 col-sm-6 col-md-4">
        <q-card flat bordered style="border-radius: 14px;">
          <q-card-section>
            <q-skeleton type="rect" height="20px" class="q-mb-sm" />
            <q-skeleton type="rect" height="14px" width="60%" class="q-mb-sm" />
            <q-skeleton type="rect" height="14px" width="40%" />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Error state -->
    <q-banner v-else-if="error" class="bg-red-1 text-negative rounded-borders q-mb-md" rounded>
      <template v-slot:avatar><q-icon name="error" /></template>
      {{ error }}
    </q-banner>

    <!-- Empty State -->
    <div v-else-if="slots.length === 0" class="column items-center justify-center q-pa-xl" style="min-height: 50vh;">
      <q-icon name="event_available" size="80px" color="grey-4" class="q-mb-lg" />
      <div class="text-h6 text-weight-bold text-grey-6 q-mb-sm">No availability slots yet</div>
      <div class="text-grey-5 q-mb-lg text-center" style="max-width: 320px;">
        Click "Add Slot" to set your one-time or recurring availability for patients to book.
      </div>
      <q-btn unelevated color="primary" icon="add" label="Add Your First Slot" class="text-capitalize" style="border-radius: 10px;" @click="openDialog()" />
    </div>

    <!-- Slots Grid -->
    <div v-else>
      <!-- Recurring Slots Section -->
      <div v-if="recurringSlots.length > 0" class="q-mb-lg">
        <div class="text-subtitle1 text-weight-bold text-grey-8 q-mb-md row items-center">
          <q-icon name="repeat" size="20px" class="q-mr-sm text-primary" /> Weekly Recurring Slots
        </div>
        <div class="row q-col-gutter-md">
          <div v-for="slot in recurringSlots" :key="slot._id" class="col-12 col-sm-6 col-md-4">
            <SlotCard :slotData="slot" @edit="openDialog(slot)" @delete="confirmDelete(slot)" />
          </div>
        </div>
      </div>

      <!-- One-Time Slots Section -->
      <div v-if="oneTimeSlots.length > 0">
        <div class="text-subtitle1 text-weight-bold text-grey-8 q-mb-md row items-center">
          <q-icon name="event" size="20px" class="q-mr-sm text-teal" /> One-Time Slots
        </div>
        <div class="row q-col-gutter-md">
          <div v-for="slot in oneTimeSlots" :key="slot._id" class="col-12 col-sm-6 col-md-4">
            <SlotCard :slotData="slot" @edit="openDialog(slot)" @delete="confirmDelete(slot)" />
          </div>
        </div>
      </div>
    </div>

    <!-- ────────────── ADD / EDIT DIALOG ────────────── -->
    <q-dialog v-model="showDialog" persistent>
      <q-card style="width: 480px; max-width: 95vw; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);" class="q-pa-sm">
        <q-card-section class="q-pb-sm row items-center justify-between">
          <div>
            <div class="text-h6 text-weight-bolder" style="color: #1a2a3a;">
              {{ editMode ? 'Edit Availability Slot' : 'Add Availability Slot' }}
            </div>
            <div class="text-grey-6 text-caption q-mt-xs">Configure your schedule for patient bookings</div>
          </div>
          <q-btn icon="close" flat round dense v-close-popup class="text-grey-5" />
        </q-card-section>

        <q-separator class="q-mx-md q-mt-sm q-mb-md" />

        <q-card-section class="column q-gutter-y-lg q-pt-none">

          <!-- Slot Type -->
          <div>
            <div class="text-weight-bold text-dark q-mb-sm" style="font-size: 13px;">SLOT TYPE</div>
            <q-btn-toggle
              v-model="form.type"
              spread
              no-caps
              toggle-color="primary"
              color="white"
              text-color="grey-7"
              :options="[
                {label: 'One-Time Date', value: 'single', icon: 'event'},
                {label: 'Weekly Recurring', value: 'recurring', icon: 'repeat'}
              ]"
              style="border: 1px solid #e0e0e0; border-radius: 10px;"
              @update:model-value="form.date = ''; form.dayOfWeek = ''"
            />
          </div>

          <!-- Date Picker (one-time) -->
          <div v-if="form.type === 'single'">
            <div class="text-weight-bold text-dark q-mb-sm" style="font-size: 13px;">SELECT DATE</div>
            <q-input
              outlined
              v-model="form.date"
              mask="date"
              :rules="['date']"
              label="Choose a date"
              color="primary"
              style="border-radius: 10px;"
              bg-color="grey-1"
            >
              <template v-slot:prepend>
                <q-icon name="event" class="cursor-pointer" color="primary">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale" class="z-top bg-white shadow-10">
                    <q-date
                      v-model="form.date"
                      color="primary"
                      text-color="dark"
                      :options="futureDatesOnly"
                      mask="YYYY/MM/DD"
                      class="bg-white text-dark"
                    >
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <!-- Day of Week (recurring) -->
          <div v-if="form.type === 'recurring'">
            <div class="text-weight-bold text-dark q-mb-sm" style="font-size: 13px;">DAY OF WEEK</div>
            <div class="row q-gutter-sm">
              <q-chip
                v-for="day in weekDays"
                :key="day"
                clickable
                :selected="form.dayOfWeek === day"
                @click="form.dayOfWeek = day"
                :color="form.dayOfWeek === day ? 'primary' : 'grey-2'"
                :text-color="form.dayOfWeek === day ? 'white' : 'dark'"
                style="border-radius: 8px; font-weight: 600; font-size: 13px; padding: 14px 12px; transition: all 0.2s;"
              >
                {{ day.substring(0, 3) }}
              </q-chip>
            </div>
          </div>

          <!-- Time Row -->
          <div>
            <div class="text-weight-bold text-dark q-mb-sm" style="font-size: 13px;">TIME RANGE</div>
            <div class="row q-col-gutter-md">
              <div class="col-6">
                <q-input
                  v-model="form.startTime"
                  outlined
                  type="time"
                  label="Start Time"
                  color="primary"
                  bg-color="grey-1"
                  style="border-radius: 10px;"
                >
                  <template v-slot:prepend><q-icon name="schedule" color="primary" /></template>
                </q-input>
              </div>
              <div class="col-6">
                <q-input
                  v-model="form.endTime"
                  outlined
                  type="time"
                  label="End Time"
                  color="teal"
                  bg-color="grey-1"
                  style="border-radius: 10px;"
                  :error="timeError"
                  :error-message="'End time must be after start'"
                >
                  <template v-slot:prepend><q-icon name="schedule" color="teal" /></template>
                </q-input>
              </div>
            </div>
          </div>

          <!-- Online / Physical Type -->
          <div>
            <div class="text-weight-bold text-dark q-mb-sm" style="font-size: 13px;">SLOT TYPE (ONLINE / PHYSICAL)</div>
            <q-btn-toggle
              v-model="form.slotType"
              spread
              no-caps
              toggle-color="primary"
              color="white"
              text-color="grey-7"
              :options="[
                {label: 'ONLINE', value: 'ONLINE', icon: 'videocam'},
                {label: 'PHYSICAL', value: 'PHYSICAL', icon: 'person'}
              ]"
              style="border: 1px solid #e0e0e0; border-radius: 10px;"
              @update:model-value="onSlotTypeChange"
            />
          </div>

          <!-- Slot Count (PHYSICAL only) -->
          <div v-if="form.slotType === 'PHYSICAL'">
            <div class="text-weight-bold text-dark q-mb-sm" style="font-size: 13px;">SLOT CAPACITY</div>
            <q-input
              v-model.number="form.slotCount"
              outlined
              type="number"
              :min="1"
              :max="100"
              label="Number of patients per slot"
              color="primary"
              bg-color="grey-1"
              style="border-radius: 10px;"
            >
              <template v-slot:prepend><q-icon name="people" color="primary" /></template>
              <template v-slot:hint>Number of patients that can be booked in this time slot</template>
            </q-input>
          </div>

          <!-- Platform (ONLINE) -->
          <div v-if="form.slotType === 'ONLINE'">
            <div class="text-weight-bold text-dark q-mb-sm" style="font-size: 13px;">PLATFORM</div>
            <q-select
              v-model="form.platform"
              :options="platformOptions"
              outlined
              use-input
              hide-selected
              fill-input
              input-debounce="0"
              label="Select Platform"
              color="primary"
              bg-color="grey-1"
              style="border-radius: 10px;"
              popup-content-class="bg-white shadow-3"
              options-dense
              @filter="filterPlatforms"
              @input-value="form.platform = $event"
            >
              <template v-slot:prepend><q-icon name="videocam" color="blue-4" /></template>
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey-5">Type to add custom platform</q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <!-- Hospital (PHYSICAL) -->
          <div v-if="form.slotType === 'PHYSICAL'">
            <div class="text-weight-bold text-dark q-mb-sm" style="font-size: 13px;">LOCATION</div>
            <q-select
              v-model="form.location"
              :options="hospitalOptions"
              outlined
              use-input
              hide-selected
              fill-input
              input-debounce="0"
              label="Select Hospital / Clinic"
              color="primary"
              bg-color="grey-1"
              style="border-radius: 10px;"
              popup-content-class="bg-white shadow-3"
              options-dense
              @filter="filterHospitals"
              @input-value="form.location = $event"
            >
              <template v-slot:prepend><q-icon name="local_hospital" color="red-4" /></template>
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey-5">Type to add custom hospital</q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

        </q-card-section>

        <!-- Error Banner in Dialog -->
        <q-card-section v-if="dialogError" class="q-pt-none q-pb-md text-red bg-red-1 rounded-borders q-mx-md q-px-sm row items-center">
          <q-icon name="error_outline" size="xs" class="q-mr-sm" />
          <span style="font-size: 13px; font-weight: 500;">{{ dialogError }}</span>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md q-pt-sm" style="background: #fafafa; border-radius: 0 0 16px 16px;">
          <q-btn flat label="Cancel" color="grey-7" class="text-capitalize q-mr-sm text-weight-bold" v-close-popup />
          <q-btn
            unelevated
            :label="editMode ? 'Save Changes' : 'Add Slot'"
            color="primary"
            class="text-capitalize text-weight-bold"
            style="border-radius: 8px; padding: 8px 24px;"
            :loading="submitting"
            :disable="!isFormValid"
            @click="submitSlot"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- DELETE CONFIRM DIALOG -->
    <q-dialog v-model="showDeleteConfirm">
      <q-card style="border-radius: 14px; min-width: 320px;">
        <q-card-section class="row items-center q-pb-none">
          <q-avatar icon="delete" color="negative" text-color="white" class="q-mr-md" />
          <div class="text-h6 text-weight-bold">Delete Slot?</div>
        </q-card-section>
        <q-card-section class="text-grey-7">
          This availability slot will be removed. Patients can no longer book this time.
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey-7" class="text-capitalize" v-close-popup />
          <q-btn unelevated label="Delete" color="negative" class="text-capitalize" :loading="deleting" @click="executeDelete" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { fetchAvailability, createAvailabilitySlot, updateAvailabilitySlot, deleteAvailabilitySlot } from 'src/services/doctorApi';
import SlotCard from 'src/components/doctor/SlotCard.vue';

defineProps({ doctor: Object });

const $q = useQuasar();

// ─── State ────────────────────────────────────────────────────────
const loading = ref(true);
const error = ref('');
const slots = ref([]);
const showDialog = ref(false);
const showDeleteConfirm = ref(false);
const editMode = ref(false);
const submitting = ref(false);
const deleting = ref(false);
const dialogError = ref('');
const slotToDelete = ref(null);

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const allHospitals = [
  "Asiri Hospital Colombo",
  "Asiri Surgical Hospital",
  "Nawaloka Hospital",
  "Durdans Hospital",
  "Lanka Hospitals",
  "Hemas Hospital Wattala",
  "Hemas Hospital Thalawathugoda",
  "Kings Hospital Colombo",
  "Ninewells Hospital",
  "Joseph Fraser Memorial Hospital",
  "Melsta Hospital Ragama",
  "Asiri Central Hospital Kandy",
  "Nawaloka Hospital Negombo",
  "Leesons Hospital",
  "Golden Key Eye & ENT Hospital",
  "Oasis Hospital Colombo"
];
const hospitalOptions = ref([...allHospitals]);

const allPlatforms = [
  "Zoom",
  "Microsoft Teams",
  "Google Meet",
  "WhatsApp Call",
  "Other"
];
const platformOptions = ref([...allPlatforms]);

const defaultForm = () => ({
  _id: null,
  type: 'single',
  date: '',
  dayOfWeek: '',
  startTime: '',
  endTime: '',
  location: '',
  platform: '',
  slotType: '',
  slotCount: 1,
});
const form = ref(defaultForm());

const onSlotTypeChange = (val) => {
  if (val === 'ONLINE') {
    form.value.location = '';
    form.value.slotCount = 1; // ONLINE always single-booking
  } else if (val === 'PHYSICAL') {
    form.value.platform = '';
    if (!form.value.slotCount || form.value.slotCount < 1) {
      form.value.slotCount = 1;
    }
  }
};

// ─── Computed ─────────────────────────────────────────────────────
const timeError = computed(() => {
  if (form.value.startTime && form.value.endTime) {
    return form.value.startTime >= form.value.endTime;
  }
  return false;
});

const isFormValid = computed(() => {
  if (!form.value.startTime || !form.value.endTime || timeError.value) return false;
  if (!form.value.slotType) return false;

  if (form.value.slotType === 'PHYSICAL' && !form.value.location) return false;
  if (form.value.slotType === 'PHYSICAL' && (!form.value.slotCount || form.value.slotCount < 1)) return false;
  if (form.value.slotType === 'ONLINE' && !form.value.platform) return false;

  if (form.value.type === 'single' && !form.value.date) return false;
  if (form.value.type === 'recurring' && !form.value.dayOfWeek) return false;
  return true;
});

const recurringSlots = computed(() => slots.value.filter(s => s.isRecurring));
const oneTimeSlots   = computed(() => slots.value.filter(s => !s.isRecurring));

const futureDatesOnly = (date) => {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
  return date >= today;
};

// ─── Helpers ──────────────────────────────────────────────────────
const parseJwt = (t) => {
  try { return JSON.parse(atob(t.split('.')[1])); }
  catch { return null; }
};

const getDoctorId = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('nexus_token');
  return parseJwt(token)?.roleId || null;
};

// ─── Load Slots ───────────────────────────────────────────────────
const loadSlots = async () => {
  loading.value = true;
  error.value = '';
  try {
    const doctorId = getDoctorId();
    if (!doctorId) throw new Error('Could not determine doctor ID');
    slots.value = await fetchAvailability(doctorId);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

// ─── Dialog Controls ──────────────────────────────────────────────
const openDialog = (slot = null) => {
  dialogError.value = '';
  if (slot) {
    editMode.value = true;
    form.value = {
      _id: slot._id,
      type: slot.isRecurring ? 'recurring' : 'single',
      date: slot.date ? new Date(slot.date).toISOString().slice(0, 10).replace(/-/g, '/') : '',
      dayOfWeek: slot.dayOfWeek || '',
      startTime: slot.startTime || '',
      endTime: slot.endTime || '',
      location: slot.location || slot.hospital || '',
      platform: slot.platform || '',
      slotType: slot.slotType || '',
      slotCount: slot.slotCount || 1,
    };
  } else {
    editMode.value = false;
    form.value = defaultForm();
  }
  showDialog.value = true;
};

const closeDialog = () => {
  showDialog.value = false;
  dialogError.value = '';
};

// ─── Submit ───────────────────────────────────────────────────────
const submitSlot = async () => {
  dialogError.value = '';

  // Validate
  if (!form.value.slotType) {
    dialogError.value = 'slotType required (ONLINE / PHYSICAL)';
    return;
  }
  if (form.value.slotType === 'PHYSICAL' && !form.value.location) {
    dialogError.value = 'Location required';
    return;
  }
  if (form.value.slotType === 'PHYSICAL' && (!form.value.slotCount || form.value.slotCount < 1)) {
    dialogError.value = 'Slot count must be at least 1';
    return;
  }
  if (form.value.slotType === 'ONLINE' && !form.value.platform) {
    dialogError.value = 'Platform required';
    return;
  }
  if (!form.value.startTime || !form.value.endTime) {
    dialogError.value = 'Please set both start and end time.';
    return;
  }
  if (form.value.type === 'single' && !form.value.date) {
    dialogError.value = 'Please select a date.';
    return;
  }
  if (form.value.type === 'recurring' && !form.value.dayOfWeek) {
    dialogError.value = 'Please select a day of the week.';
    return;
  }

  submitting.value = true;
  try {
    const payload = {
      type: form.value.type,
      startTime: form.value.startTime,
      endTime: form.value.endTime,
      slotType: form.value.slotType,
      slotCount: form.value.slotType === 'ONLINE' ? 1 : Number(form.value.slotCount),
      location: form.value.slotType === 'PHYSICAL' ? form.value.location : null,
      platform: form.value.slotType === 'ONLINE' ? form.value.platform : null,
      ...(form.value.type === 'single'
        ? { date: form.value.date.replace(/\//g, '-') }
        : { dayOfWeek: form.value.dayOfWeek }
      ),
    };

    if (editMode.value) {
      await updateAvailabilitySlot(form.value._id, payload);
      $q.notify({ type: 'positive', message: 'Slot updated successfully', icon: 'check_circle' });
    } else {
      await createAvailabilitySlot(payload);
      $q.notify({ type: 'positive', message: 'Slot added successfully', icon: 'check_circle' });
    }

    closeDialog();
    await loadSlots();
  } catch (err) {
    dialogError.value = err.response?.data?.message || err.message || 'Failed to save slot.';
  } finally {
    submitting.value = false;
  }
};

// ─── Delete ───────────────────────────────────────────────────────
const confirmDelete = (slot) => {
  slotToDelete.value = slot;
  showDeleteConfirm.value = true;
};

const executeDelete = async () => {
  deleting.value = true;
  try {
    await deleteAvailabilitySlot(slotToDelete.value._id);
    $q.notify({ type: 'positive', message: 'Slot deleted', icon: 'delete' });
    showDeleteConfirm.value = false;
    await loadSlots();
  } catch (err) {
    $q.notify({ type: 'negative', message: err.response?.data?.message || 'Failed to delete slot', icon: 'error' });
  } finally {
    deleting.value = false;
  }
};

// ─── Filter methods ──────────────────────────────────────────────
const filterHospitals = (val, update) => {
  update(() => {
    hospitalOptions.value = val === ''
      ? allHospitals
      : allHospitals.filter(h => h.toLowerCase().includes(val.toLowerCase()));
  });
};

const filterPlatforms = (val, update) => {
  update(() => {
    platformOptions.value = val === ''
      ? allPlatforms
      : allPlatforms.filter(p => p.toLowerCase().includes(val.toLowerCase()));
  });
};

onMounted(loadSlots);
</script>

<style>
/* 
  Fix for Quasar QDate text color issues 
  (Overriding any global framework/Tailwind conflicts causing white text)
*/
.q-date__calendar-days .q-btn__content {
  color: #1c2b36 !important; /* Force dark text for dates */
  font-weight: 500;
}
.q-date__calendar-weekdays {
  color: #4cad84 !important; /* Teal for weekdays (M, T, W, etc) */
  font-weight: 700;
}
.q-date__header {
  background-color: #f5f6fa !important;
  color: #1c2b36 !important; /* Dark text for the header (Year/Month) */
}
.q-date__header-subtitle, .q-date__header-title-label {
  color: #1c2b36 !important;
}
.q-date__navigation {
  color: #1c2b36 !important; /* Dark icons for next/prev month arrows */
}
/* Ensure the popup has a high z-index and white background */
.q-menu {
  z-index: 9999 !important;
  background: #ffffff !important;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15) !important;
  max-height: 250px !important;
  overflow-y: auto !important;
}

/* Fix for QSelect Dropdown Menu Items */
.q-menu .q-item {
  color: #1a2a3a !important; /* Dark, readable text */
  padding: 10px 16px !important;
  background-color: transparent !important;
  transition: background-color 0.2s;
}

.q-menu .q-item:hover {
  background-color: #f1f5f9 !important; /* Light blue-grey hover */
}

.q-menu .q-item--active, .q-menu .q-item.q-manual-focusable--focused {
  background-color: #e0f2fe !important; /* Light blue selected */
  color: #0369a1 !important; /* Darker blue active text */
  font-weight: 600;
}
</style>
