<template>
  <q-page class="search-page-bg text-white font-jakarta flex column items-center q-pt-xl">
    <div class="max-width-1000 w-full q-px-md">

      <!-- BACK -->
      <div class="flex items-center q-mb-lg">
        <div class="flex items-center cursor-pointer text-grey-4 back-link" @click="router.push('/appointment/results')">
          <q-icon name="arrow_back" size="sm" class="q-mr-sm" />
          <span class="text-weight-bold">Back to Doctors</span>
        </div>
      </div>

      <!-- DOCTOR CARD -->
      <q-card class="doctor-card q-mb-xl q-pa-lg row items-center no-wrap shadow-none" v-if="doctor">
        <q-avatar size="80px" class="q-mr-lg doctor-avatar">
          <img :src="getImageUrl(doctor.profileImage || doctor.image || doctor.profilePicture)" />
        </q-avatar>
        <div class="col">
          <div class="text-h5 text-weight-bolder q-mb-xs">{{ doctor.name }}</div>
          <div class="text-subtitle2 text-blue-4 flex items-center q-mb-xs">
            <q-icon name="medical_services" size="16px" class="q-mr-xs" />
            {{ doctor.specialization || doctor.specialty }}
          </div>
          <div class="text-caption text-grey-4 flex items-center">
            <q-icon name="local_hospital" size="14px" class="q-mr-xs" />
            {{ doctor.hospital }}
          </div>
        </div>
        <div class="col-auto text-right" v-if="doctor.consultationFee">
          <div class="text-caption text-grey-5 q-mb-xs">Consultation Fee</div>
          <div class="text-h6 text-weight-bold text-green-4">Rs {{ doctor.consultationFee }}</div>
        </div>
      </q-card>

      <!-- HEADER + DATE FILTER -->
      <div class="flex items-center justify-between q-mb-lg">
        <div>
          <div class="text-h5 text-weight-bolder">Available Sessions</div>
          <div class="text-caption text-grey-5 q-mt-xs">
            {{ totalSlots }} session{{ totalSlots !== 1 ? 's' : '' }} found
          </div>
        </div>
        <q-input
          v-model="selectedDateStr"
          type="date"
          outlined dense dark
          color="blue-5"
          class="nexus-input"
          :min="today"
          style="width: 180px"
        >
          <template v-slot:prepend><q-icon name="event" color="blue-5" size="xs" /></template>
        </q-input>
      </div>

      <!-- LOADING -->
      <div v-if="loadingSlots" class="flex flex-center q-py-xl column">
        <q-spinner-dots color="blue-5" size="3em" />
        <div class="q-mt-md text-grey-4 text-weight-bold">Loading available sessions...</div>
      </div>

      <div v-else>
        <!-- NO SLOTS -->
        <div v-if="totalSlots === 0" class="empty-state flex flex-center column q-py-xl">
          <q-icon name="event_busy" size="64px" color="grey-7" class="q-mb-md" />
          <div class="text-h6 text-grey-4 text-weight-bold">No sessions available</div>
          <div class="text-caption text-grey-6 q-mt-sm">Try selecting a different date</div>
        </div>

        <!-- PHYSICAL SESSIONS -->
        <div v-if="physicalSlots.length > 0" class="q-mb-xl">
          <div class="section-header flex items-center q-mb-md q-px-sm">
            <q-icon name="local_hospital" size="20px" color="blue-4" class="q-mr-sm" />
            <span class="text-subtitle1 text-weight-bolder text-white">Physical Consultation</span>
            <q-badge color="blue-8" class="q-ml-sm">{{ physicalSlots.length }}</q-badge>
          </div>

          <!-- Group by date -->
          <div v-for="(group, date) in groupedPhysical" :key="date" class="q-mb-lg">
            <div class="date-label q-mb-sm q-px-sm">
              <q-icon name="calendar_today" size="14px" class="q-mr-xs text-grey-5" />
              <span class="text-caption text-weight-bold text-grey-4 text-uppercase tracking-wider">
                {{ formatDateLabel(date) }}
              </span>
            </div>

            <div class="slot-card q-mb-sm" v-for="slot in group" :key="slot._id">
              <div class="row items-center no-wrap q-pa-md">

                <!-- Hospital icon + name -->
                <div class="col-auto q-mr-md">
                  <div class="hospital-icon flex flex-center">
                    <q-icon name="local_hospital" size="22px" color="blue-5" />
                  </div>
                </div>

                <!-- Hospital + type -->
                <div class="col">
                  <div class="text-weight-bold text-white" style="font-size:14px">{{ slot.hospital || 'Hospital' }}</div>
                  <div class="text-caption text-grey-5">{{ doctor.specialization || doctor.specialty }}</div>
                </div>

                <!-- Time -->
                <div class="col-auto text-center q-mx-md">
                  <div class="text-blue-4 text-weight-bold" style="font-size:15px">
                    {{ formatTime(slot.startTime) }}
                  </div>
                  <div class="text-caption text-grey-6">{{ getSession(slot.startTime) }}</div>
                </div>

                <!-- Patients -->
                <div class="col-auto text-center q-mx-md">
                  <div class="text-white text-weight-bold">{{ slot.bookedCount }}</div>
                  <div class="text-caption text-grey-6">Patients</div>
                </div>

                <!-- Available count -->
                <div class="col-auto text-center q-mx-md">
                  <div :class="availableCount(slot) > 0 ? 'text-green-4' : 'text-red-4'" class="text-weight-bold">
                    {{ availableCount(slot) }}
                  </div>
                  <div class="text-caption text-grey-6">Available</div>
                </div>

                <!-- Fee (physical) -->
                <div class="col-auto text-right q-mx-md">
                  <template v-if="getSlotFee(slot)">
                    <div class="text-green-4 text-weight-bold" style="font-size:13px">
                      Rs {{ (getSlotFee(slot).doctorFee + getSlotFee(slot).hospitalFee).toLocaleString() }}
                    </div>
                    <div class="text-caption text-grey-6">+ Booking Fee</div>
                  </template>
                  <template v-else>
                    <div class="text-green-4 text-weight-bold" style="font-size:13px">
                      Rs {{ doctor.consultationFee || '—' }}
                    </div>
                    <div class="text-caption text-grey-6">+ Booking Fee</div>
                  </template>
                </div>

                <!-- Action -->
                <div class="col-auto q-ml-md">
                  <q-btn
                    unelevated rounded
                    :color="isFull(slot) ? 'grey-8' : 'primary'"
                    :disable="isFull(slot)"
                    class="book-btn text-weight-bold"
                    :label="isFull(slot) ? 'Full' : 'Available'"
                    @click="handleSlotBooking(slot, 'Physical')"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ONLINE SESSIONS -->
        <div v-if="onlineSlots.length > 0" class="q-mb-xl">
          <div class="section-header flex items-center q-mb-md q-px-sm">
            <q-icon name="videocam" size="20px" color="teal-4" class="q-mr-sm" />
            <span class="text-subtitle1 text-weight-bolder text-white">Online Consultation</span>
            <q-badge color="teal-8" class="q-ml-sm">{{ onlineSlots.length }}</q-badge>
          </div>

          <div v-for="(group, date) in groupedOnline" :key="date" class="q-mb-lg">
            <div class="date-label q-mb-sm q-px-sm">
              <q-icon name="calendar_today" size="14px" class="q-mr-xs text-grey-5" />
              <span class="text-caption text-weight-bold text-grey-4 text-uppercase tracking-wider">
                {{ formatDateLabel(date) }}
              </span>
            </div>

            <div class="slot-card q-mb-sm" v-for="slot in group" :key="slot._id">
              <div class="row items-center no-wrap q-pa-md">

                <div class="col-auto q-mr-md">
                  <div class="hospital-icon hospital-icon--online flex flex-center">
                    <q-icon name="videocam" size="22px" color="teal-4" />
                  </div>
                </div>

                <div class="col">
                  <div class="text-weight-bold text-white" style="font-size:14px">{{ slot.platform || 'Online' }}</div>
                  <div class="text-caption text-grey-5">{{ doctor.specialization || doctor.specialty }}</div>
                </div>

                <div class="col-auto text-center q-mx-md">
                  <div class="text-blue-4 text-weight-bold" style="font-size:15px">
                    {{ formatTime(slot.startTime) }}
                  </div>
                  <div class="text-caption text-grey-6">{{ getSession(slot.startTime) }}</div>
                </div>

                <div class="col-auto text-center q-mx-md">
                  <div class="text-white text-weight-bold">{{ slot.bookedCount }}</div>
                  <div class="text-caption text-grey-6">Patients</div>
                </div>

                <div class="col-auto text-center q-mx-md">
                  <div :class="availableCount(slot) > 0 ? 'text-green-4' : 'text-red-4'" class="text-weight-bold">
                    {{ availableCount(slot) }}
                  </div>
                  <div class="text-caption text-grey-6">Available</div>
                </div>

                <!-- Fee (online) -->
                <div class="col-auto text-right q-mx-md">
                  <template v-if="getSlotFee(slot)">
                    <div class="text-green-4 text-weight-bold" style="font-size:13px">
                      Rs {{ (getSlotFee(slot).doctorFee + getSlotFee(slot).hospitalFee).toLocaleString() }}
                    </div>
                    <div class="text-caption text-grey-6">+ Booking Fee</div>
                  </template>
                  <template v-else>
                    <div class="text-green-4 text-weight-bold" style="font-size:13px">
                      Rs {{ doctor.consultationFee || '—' }}
                    </div>
                    <div class="text-caption text-grey-6">+ Booking Fee</div>
                  </template>
                </div>

                <div class="col-auto q-ml-md">
                  <q-btn
                    unelevated rounded
                    :color="isFull(slot) ? 'grey-8' : 'teal'"
                    :disable="isFull(slot)"
                    class="book-btn text-weight-bold"
                    :label="isFull(slot) ? 'Full' : 'Available'"
                    @click="handleSlotBooking(slot, 'Online')"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAppointmentStore } from '../../stores/appointmentStore';
import { useAuthStore } from '../../stores/authStore';
import { getDoctorSlots, getDoctorSlotsNext30Days, getDoctorDetails, calculateSlotFee } from '../../services/appointmentService';

const store = useAppointmentStore();
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const doctor = ref(store.selectedDoctor || null);

const getImageUrl = (img) => {
  if (!img) return 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png';
  if (typeof img === 'object' && img.url) img = img.url;
  if (typeof img === 'string') {
    if (img.startsWith('http')) return img;
    if (img.startsWith('/uploads'))
      return `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}${img}`;
  }
  return img;
};

const today = new Date().toISOString().split('T')[0];
const selectedDateStr = ref('');
const loadingSlots = ref(false);
const physicalSlots = ref([]);
const onlineSlots = ref([]);
const slotFees = ref({});  // keyed by slot._id

const getSlotFee = (slot) => slotFees.value[slot._id] || null;

const fetchFeesForSlots = async (slots, type) => {
  const doctorId = doctor.value?.doctorId || doctor.value?._id || doctor.value?.id;
  await Promise.all(slots.map(async (slot) => {
    if (slotFees.value[slot._id]) return;
    const fee = await calculateSlotFee(doctorId, slot.hospitalId || '', type, slot.hospital || '');
    if (fee) slotFees.value[slot._id] = fee;
  }));
};

const totalSlots = computed(() => physicalSlots.value.length + onlineSlots.value.length);

const groupByDate = (slots) => {
  return slots.reduce((acc, slot) => {
    const key = new Date(slot.date).toISOString().split('T')[0];
    if (!acc[key]) acc[key] = [];
    acc[key].push(slot);
    return acc;
  }, {});
};

const groupedPhysical = computed(() => groupByDate(physicalSlots.value));
const groupedOnline   = computed(() => groupByDate(onlineSlots.value));

const availableCount = (slot) => Math.max((slot.slotCount || 1) - (slot.bookedCount || 0), 0);
const isFull = (slot) => availableCount(slot) === 0;

const formatDateLabel = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const formatTime = (time) => {
  if (!time) return '';
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
};

const getSession = (time) => {
  if (!time) return '';
  const hour = parseInt(time.split(':')[0]);
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
};

onMounted(async () => {
  const doctorId = route.params.doctorId || route.query.doctorId;

  if (!doctor.value && store.selectedDoctor) {
    doctor.value = store.selectedDoctor;
  }

  if (!doctor.value && doctorId) {
    const details = await getDoctorDetails(doctorId);
    if (details) {
      doctor.value = {
        doctorId,
        name: details.name || details.profile?.name || doctorId,
        specialization: details.profile?.specialty || details.profile?.specialization || null,
        hospital: details.profile?.hospital || null,
        experience: details.profile?.experience || null,
        consultationFee: details.profile?.consultationFee || details.profile?.fee || null,
        profileImage: details.profile?.profileImage || null,
      };
    } else {
      doctor.value = { doctorId };
    }
  }

  if (!doctor.value) { router.push('/search'); return; }
  if (doctorId && !doctor.value.doctorId) doctor.value.doctorId = doctorId;
  if (!store.selectedDoctor) store.selectDoctor(doctor.value);

  fetchSlots();
});

const fetchSlots = async () => {
  loadingSlots.value = true;
  store.selectedDate = selectedDateStr.value;
  store.selectedSlot = null;
  try {
    const doctorId = doctor.value.doctorId || doctor.value._id || doctor.value.id;
    const data = selectedDateStr.value
      ? await getDoctorSlots(doctorId, selectedDateStr.value)
      : await getDoctorSlotsNext30Days(doctorId);
    physicalSlots.value = data.physical || [];
    onlineSlots.value   = data.online   || [];
    await store.fetchQueueNumber();
    // Fetch fees in background — non-blocking
    fetchFeesForSlots(physicalSlots.value, 'PHYSICAL');
    fetchFeesForSlots(onlineSlots.value, 'ONLINE');
  } catch (e) {
    console.error(e);
    physicalSlots.value = [];
    onlineSlots.value   = [];
  } finally {
    loadingSlots.value = false;
  }
};

watch(selectedDateStr, fetchSlots);

const handleSlotBooking = (slot, type) => {
  store.selectSlot(slot, type);
  if (!authStore.isLoggedIn) {
    router.push({ path: '/login', query: { redirect: '/appointment/form' } });
    return;
  }
  router.push('/appointment/form');
};
</script>

<style scoped>
.search-page-bg { background: radial-gradient(circle at top right, #0a1128 0%, #030612 100%); min-height: 100vh; }
.max-width-1000 { max-width: 1000px; width: 100%; }
.back-link:hover { color: #60a5fa !important; }

.doctor-card {
  border: 1px solid rgba(30, 58, 138, 0.4);
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(8px);
}
.doctor-avatar {
  border: 3px solid #3b82f6;
  background: #0f172a;
}

.section-header { border-left: 3px solid #3b82f6; padding-left: 10px; }

.date-label { display: flex; align-items: center; }

.slot-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  transition: border-color 0.2s, background 0.2s;
}
.slot-card:hover {
  border-color: rgba(59, 130, 246, 0.4);
  background: rgba(15, 23, 42, 0.85);
}

.hospital-icon {
  width: 44px; height: 44px;
  border-radius: 10px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
}
.hospital-icon--online {
  background: rgba(20, 184, 166, 0.1);
  border-color: rgba(20, 184, 166, 0.2);
}

.book-btn { min-width: 100px; font-size: 13px; }

.nexus-input :deep(.q-field__control) {
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.nexus-input :deep(.q-field__control:hover) { border-color: rgba(59, 130, 246, 0.5); }

.empty-state { opacity: 0.7; }
</style>
