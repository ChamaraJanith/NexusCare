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

    <!-- View Mode Toggle & Badge -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <q-chip v-if="viewMode === 'ALL'" color="primary" text-color="white" icon="view_list" label="Overview" class="text-weight-bold" />
        <q-chip v-else color="teal" text-color="white" icon="visibility" label="Live Capacity" class="text-weight-bold" />
      </div>
      <q-btn-toggle
        v-model="viewMode"
        no-caps
        rounded
        toggle-color="primary"
        color="white"
        text-color="grey-8"
        :options="[
          {label: 'All Slots', value: 'ALL', icon: 'view_list'},
          {label: 'By Date', value: 'DATE', icon: 'event'}
        ]"
        style="border: 1px solid #e0e0e0; box-shadow: 0 2px 8px rgba(0,0,0,0.05);"
      />
    </div>

    <!-- Date Selector (Only in DATE mode) -->
    <div v-if="viewMode === 'DATE'" class="q-mb-lg bg-white q-pa-md shadow-1" style="border-radius: 12px; border: 1px solid #e0e0e0;">
      <div class="row items-center justify-between q-mb-md">
        <div class="text-weight-bold text-grey-8">Quick Select</div>
        <div>
          <q-btn unelevated size="sm" color="primary" class="text-capitalize q-mr-sm" label="Today" @click="setToday" />
          <q-btn outline size="sm" color="primary" class="text-capitalize" label="Tomorrow" @click="setTomorrow" />
        </div>
      </div>
      <q-separator class="q-mb-md" color="grey-2" />
      <div class="row items-center justify-between">
        <div class="row items-center">
          <q-icon name="event" size="24px" color="primary" class="q-mr-md" />
          <div>
            <div class="text-weight-bold" style="font-size: 16px;">Selected Date: <span class="text-primary">[ {{ selectedDateStr }} ]</span></div>
            <div class="text-grey-6 text-caption">Viewing capacity and queue for this specific date</div>
          </div>
        </div>
        <q-input
          outlined
          dense
          type="date"
          v-model="selectedDateStr"
          color="primary"
          style="min-width: 200px;"
        />
      </div>
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

    <!-- Main Content -->
    <div v-if="!loading && !error">
      
      <!-- DATE MODE -->
      <template v-if="viewMode === 'DATE'">
        <!-- Date Slots Section -->
        <div class="q-mb-xl">
          <div class="text-subtitle1 text-weight-bold text-grey-8 q-mb-md row items-center">
            <q-icon name="event_available" size="20px" class="q-mr-sm text-teal" /> Slots for {{ formattedSelectedDate }}
          </div>
          
          <!-- Empty State for Date -->
          <div v-if="slots.length === 0" class="column items-center justify-center q-pa-xl bg-white shadow-1" style="min-height: 25vh; border-radius: 14px;">
            <div class="text-h6 text-weight-bold text-orange-6 q-mb-sm">⚠️ No slots available for selected date</div>
            <div class="text-grey-5 q-mb-lg text-center" style="max-width: 320px;">
              There are no available slots scheduled on {{ formattedSelectedDate }}.
            </div>
            <q-btn unelevated color="primary" icon="add" label="Add Slot" class="text-capitalize" style="border-radius: 10px;" @click="openDialog()" />
          </div>

          <!-- Slots Grid -->
          <div v-else class="row q-col-gutter-md">
            <div v-for="slot in slots" :key="slot._id" class="col-12 col-sm-6 col-md-4">
              <SlotCard :slotData="slot" @edit="openDialog(slot)" @delete="confirmDelete(slot)" />
            </div>
          </div>
        </div>

        <!-- Recurring Templates Section -->
        <div v-if="templateSlots.length > 0">
          <q-separator color="grey-3" class="q-mb-md" />
          <div class="text-subtitle1 text-weight-bold text-grey-8 q-mb-md row items-center">
            <q-icon name="repeat" size="20px" class="q-mr-sm text-grey-6" /> Recurring Templates
          </div>
          <div class="row q-col-gutter-md">
            <div v-for="slot in templateSlots" :key="slot._id" class="col-12 col-sm-6 col-md-4">
              <SlotCard :slotData="slot" @edit="openDialog(slot)" @delete="confirmDelete(slot)" />
            </div>
          </div>
        </div>
      </template>

      <!-- ALL MODE -->
      <!-- ALL MODE -->
      <template v-else-if="viewMode === 'ALL'">
        <div class="availability-container">
          
          <!-- Next 7 Days Preview -->
          <div class="q-mb-md">
            <div class="text-subtitle1 text-weight-bold text-grey-8 q-mb-md row items-center">
              <q-icon name="view_week" size="20px" class="q-mr-sm text-primary" /> Next 7 Days Preview
            </div>
            <div class="next-days">
              <div 
                v-for="date in next7Days" 
                :key="date.toISOString()" 
                @click="selectDate(date)" 
                class="day-card"
                :class="{ 'selected-day': isSelectedDate(date) }"
              >
                <div class="day-name">{{ formatShortDay(date) }}</div>
                <div class="day-number">{{ formatDay(date) }}</div>
                <div class="day-status">Available</div>
              </div>
            </div>
          </div>

          <!-- Calendar Grid -->
          <div class="calendar-container q-mb-xl">
            <div class="calendar-header q-mb-md">
              <div class="month-nav" style="display: flex; align-items: center;">
                <q-btn flat round dense icon="chevron_left" @click="prevMonth" />
                <h3 class="text-h6 text-weight-bold q-ma-none q-px-sm" style="color: #1f2937;">{{ currentMonthName }}</h3>
                <q-btn flat round dense icon="chevron_right" @click="nextMonth" />
              </div>
              <div class="quick-actions">
                <button class="quick-btn primary" @click="setToday()">Today</button>
                <button class="quick-btn outline" @click="setTomorrow()">Tomorrow</button>
              </div>
            </div>
            
            <div class="calendar-grid text-caption text-weight-bold text-grey-5 text-center font-weight-bold" style="border-bottom: 1px solid #f3f4f6; padding-bottom: 8px; margin-top: 0; gap: 10px;">
              <div v-for="d in ['SUN','MON','TUE','WED','THU','FRI','SAT']" :key="d" style="align-self:end">{{ d }}</div>
            </div>

            <div class="calendar-grid">
              <!-- empty cells for offset -->
              <div v-for="n in calendarOffset" :key="'empty'+n"></div>
              
              <div
                v-for="day in calendarDays" 
                :key="day.toISOString()"
                class="calendar-cell"
                :class="{
                  today: isToday(day),
                  selected: isSelectedDate(day),
                  past: isPast(day) && !isToday(day)
                }"
                @click="selectDate(day)"
              >
                <span class="text-weight-bold" style="font-size: 15px; color: #374151;">{{ day.getDate() }}</span>
                <!-- availability indicator -->
                <div class="dot available"></div>
              </div>
            </div>
          </div>

          <!-- Slots Section -->
          <div class="slots-section">
            <div v-if="recurringSlots.length > 0" class="section">
              <div class="text-h6 text-weight-bold text-grey-8 q-mb-md row items-center">
                <q-icon name="repeat" size="24px" class="q-mr-sm text-primary" /> Recurring Slots
              </div>
              <div class="row q-col-gutter-md">
                <div v-for="slot in recurringSlots" :key="slot._id" class="col-12 col-sm-6 col-md-4">
                  <SlotCard :slotData="slot" @edit="openDialog(slot)" @delete="confirmDelete(slot)" class="slot-card" />
                </div>
              </div>
            </div>

            <div v-if="oneTimeSlots.length > 0" class="section">
              <div class="text-h6 text-weight-bold text-grey-8 q-mb-md row items-center">
                <q-icon name="event" size="24px" class="q-mr-sm text-teal" /> One-Time Slots
              </div>
              <div class="row q-col-gutter-md">
                <div v-for="slot in oneTimeSlots" :key="slot._id" class="col-12 col-sm-6 col-md-4">
                  <SlotCard :slotData="slot" @edit="openDialog(slot)" @delete="confirmDelete(slot)" class="slot-card" />
                </div>
              </div>
            </div>
            
            <div v-if="allSlots.length === 0" class="column items-center justify-center q-pa-xl bg-white shadow-1" style="min-height: 25vh; border-radius: 14px;">
              <q-icon name="event_available" size="60px" color="grey-4" class="q-mb-md" />
              <div class="text-h6 text-weight-bold text-grey-6 q-mb-sm">No availability slots yet</div>
              <q-btn unelevated color="primary" icon="add" label="Add Your First Slot" class="text-capitalize" style="border-radius: 10px;" @click="openDialog()" />
            </div>
          </div>

        </div>
      </template>        
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
import { ref, computed, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { fetchAvailability, fetchAvailabilityByDate, createAvailabilitySlot, updateAvailabilitySlot, deleteAvailabilitySlot } from 'src/services/doctorApi';
import SlotCard from 'src/components/doctor/SlotCard.vue';

defineProps({ doctor: Object });

const $q = useQuasar();

// ─── State ────────────────────────────────────────────────────────
const viewMode = ref('ALL');
const allSlots = ref([]);
const selectedDateStr = ref(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
const formattedSelectedDate = computed(() => {
  const d = new Date(selectedDateStr.value);
  return isNaN(d.getTime()) ? selectedDateStr.value : d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
});

watch(selectedDateStr, () => {
  if (viewMode.value === 'DATE') loadSlots();
});

watch(viewMode, () => {
  loadSlots();
});

const loading = ref(true);
const error = ref('');
const slots = ref([]);
const templateSlots = ref([]);
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

// Computed for ALL view
const recurringSlots = computed(() => allSlots.value.filter(s => s.isRecurring));
const oneTimeSlots   = computed(() => allSlots.value.filter(s => !s.isRecurring));

// ─── Helpers: Advanced Navigation ─────────────────────────────────
const getNext7Days = () => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
};
const next7Days = ref(getNext7Days());

const formatShortDay = (date) => date.toLocaleDateString('en-US', { weekday: 'short' });
const formatDay = (date) => date.getDate();

const currentMonth = ref(new Date());

const getDaysInMonth = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const lastDay = new Date(year, month + 1, 0);
  const days = [];
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  return days;
};
const calendarDays = computed(() => getDaysInMonth(currentMonth.value));

const calendarOffset = computed(() => {
  const year = currentMonth.value.getFullYear();
  const month = currentMonth.value.getMonth();
  const firstDay = new Date(year, month, 1);
  return firstDay.getDay(); 
});

const prevMonth = () => {
  const d = new Date(currentMonth.value);
  d.setMonth(d.getMonth() - 1);
  currentMonth.value = d;
};
const nextMonth = () => {
  const d = new Date(currentMonth.value);
  d.setMonth(d.getMonth() + 1);
  currentMonth.value = d;
};
const currentMonthName = computed(() => currentMonth.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));

const selectDate = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  selectedDateStr.value = `${yyyy}-${mm}-${dd}`;
  viewMode.value = "DATE";
};

const setToday = () => {
  selectDate(new Date());
};

const setTomorrow = () => {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  selectDate(t);
};

const isToday = (date) => {
  const today = new Date();
  return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
};

const isPast = (date) => {
  const today = new Date();
  today.setHours(0,0,0,0);
  return date < today;
};

const isSelectedDate = (date) => {
  if (!selectedDateStr.value) return false;
  const d = new Date(selectedDateStr.value);
  return date.getDate() === d.getDate() && date.getMonth() === d.getMonth() && date.getFullYear() === d.getFullYear();
};

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
    
    if (viewMode.value === 'ALL') {
      allSlots.value = await fetchAvailability(doctorId);
    } else {
      // Fetch date-specific slots
      slots.value = await fetchAvailabilityByDate(doctorId, selectedDateStr.value);
      
      // Fetch generic templates
      const apiAllSlots = await fetchAvailability(doctorId);
      templateSlots.value = apiAllSlots.filter(s => s.isRecurring && !s.parentSlotId && !s.date);
    }
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

/* ─── Modern Vertical Availability Styling ───────── */
.availability-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.next-days {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.day-card {
  flex: 1;
  min-width: 90px;
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  border-radius: 12px;
  padding: 10px;
  text-align: center;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 2px 6px rgba(0,0,0,0.04);
}

.day-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}

.day-name {
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
  font-weight: bold;
  margin-bottom: 4px;
}

.day-number {
  font-size: 16px;
  font-weight: 900;
  color: #1f2937;
}

.day-status {
  font-size: 11px;
  color: #10b981;
  margin-top: 4px;
  font-weight: bold;
}

.selected-day {
  background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
  color: white !important;
}
.selected-day .day-name, .selected-day .day-number, .selected-day .day-status {
  color: white !important;
}

.calendar-container {
  background: #ffffff;
  padding: 16px;
  border-radius: 16px;
  box-shadow: 0 3px 10px rgba(0,0,0,0.04);
  border: 1px solid #f3f4f6;
  max-width: 800px;
  margin: 0 auto;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-top: 16px;
}

.calendar-cell {
  height: 55px;
  border-radius: 10px;
  font-size: 13px;
  background: #f9fafb;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #f3f4f6;
}

.calendar-cell:hover {
  background: #e0f2fe;
  border-color: #bae6fd;
}

.calendar-cell.today {
  border: 2px solid #3b82f6;
  background: #eff6ff;
}

.calendar-cell.selected {
  background: #3b82f6 !important;
  color: white;
  border-color: #3b82f6;
}
.calendar-cell.selected span {
  color: white !important;
}

.calendar-cell.past {
  opacity: 0.4;
  cursor: default;
  background: #f3f4f6;
}
.calendar-cell.past:hover {
  background: #f3f4f6;
  border-color: #f3f4f6;
}

.dot {
  position: absolute;
  bottom: 6px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.dot.available {
  background: #10b981;
}

.dot.full {
  background: #ef4444;
}

.slots-section {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.slot-card {
  border-radius: 14px;
  background: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  transition: all 0.2s ease;
}

.slot-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(0,0,0,0.08);
}

.quick-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.quick-btn {
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-btn.primary {
  background: #3b82f6;
  color: white;
  border: none;
}

.quick-btn.primary:hover {
  background: #2563eb;
}

.quick-btn.outline {
  border: 1px solid #3b82f6;
  color: #3b82f6;
  background: transparent;
}

.quick-btn.outline:hover {
  background: #eff6ff;
}
</style>
