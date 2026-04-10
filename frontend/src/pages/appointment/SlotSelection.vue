<template>
  <q-page class="search-page-bg text-white font-jakarta flex column items-center q-pt-xl">
    <div class="max-width-1000 w-full q-px-md">

      <div class="flex items-center justify-between q-mb-lg">
        <div class="flex items-center cursor-pointer text-grey-4 back-link" @click="router.push('/appointment/results')">
          <q-icon name="arrow_back" size="sm" class="q-mr-sm" />
          <span class="text-weight-bold">Back to Doctors</span>
        </div>
      </div>

      <!-- DOCTOR DETAILS BLOCK -->
      <q-card class="nexus-search-card q-mb-xl q-pa-md row items-center no-wrap bg-dark-glass shadow-none" v-if="doctor">
        <q-avatar size="90px" class="q-mr-lg doctor-avatar border-blue">
           <img :src="getImageUrl(doctor.profileImage || doctor.image || doctor.profilePicture)" />
        </q-avatar>
        <div class="col text-white q-pr-sm">
          <div class="text-h5 text-weight-bolder tracking-tight q-mb-xs">{{ doctor.name }}</div>
          <div class="text-subtitle1 text-blue-4 flex items-center q-mb-xs">
            <q-icon name="medical_services" class="q-mr-xs" size="18px" /> {{ doctor.specialization || doctor.specialty }}
          </div>
          <div class="text-caption text-grey-4 flex items-center">
            <q-icon name="local_hospital" class="q-mr-xs" /> {{ doctor.hospital }}
          </div>
        </div>
      </q-card>

      <!-- DATE SELECTION -->
      <div class="timeline-row flex items-center justify-between q-mb-lg">
        <h2 class="text-h5 text-weight-bolder q-ma-none text-white tracking-tight">Select Time Slot</h2>
        <div class="flex items-center">
          <q-input
            v-model="selectedDateStr"
            type="date"
            outlined
            dense
            dark
            color="blue-5"
            class="nexus-input bg-transparent"
            :min="today"
            @update:model-value="fetchSlots"
          >
            <template v-slot:prepend><q-icon name="event" color="blue-5" size="xs" /></template>
          </q-input>
        </div>
      </div>

      <!-- OVERALL NEXT QUEUE NUMBER -->
      <div class="q-mb-md" v-if="store.queueInfo && store.queueInfo.nextNumber">
        <div class="text-h6 text-green-4 text-weight-bold">
          Next Available Number: {{ store.queueInfo.nextNumber }}
        </div>
      </div>

      <div v-if="loadingSlots" class="flex flex-center q-py-xl column">
        <q-spinner-dots color="blue-5" size="3em" />
        <div class="q-mt-md text-grey-4 text-weight-bold">Loading schedule via live backend...</div>
      </div>

      <div v-else>
        <!-- PHYSICAL SLOTS TABLE -->
        <div class="q-mb-xl">
          <div class="flex items-center q-mb-md">
            <q-icon name="store" size="sm" color="blue-4" class="q-mr-sm"/>
            <span class="text-subtitle1 text-weight-bolder tracking-wide uppercase text-white">Physical Consultation</span>
          </div>

          <q-markup-table dark class="bg-dark-glass text-left">
            <thead>
              <tr>
                <th class="text-grey-4 text-weight-bold">DATE</th>
                <th class="text-grey-4 text-weight-bold">TIME</th>
                <th class="text-grey-4 text-weight-bold">HOSPITAL</th>
                <th class="text-grey-4 text-weight-bold">ACTIVE APPOINTMENTS</th>
                <th class="text-grey-4 text-weight-bold">AVAILABLE SLOTS</th>
                <th class="text-grey-4 text-weight-bold">ACTION</th>
                <th class="text-grey-4 text-weight-bold">STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="slot in physicalSlots" :key="slot._id || slot.startTime">
                <td class="text-white">{{ formatDate(slot.date) }}</td>
                <td class="text-blue-4 text-weight-medium">{{ slot.startTime }} - {{ slot.endTime }}</td>
                <td class="text-white">{{ slot.hospital }}</td>
                <td class="text-white text-center">{{ slot.bookedCount }}</td>
                <td class="text-center">
                  <span :class="(slot.slotCount - slot.bookedCount) > 0 ? 'text-green-4' : 'text-red-4'" class="text-weight-bold">
                    {{ Math.max((slot.slotCount || 1) - (slot.bookedCount || 0), 0) }}
                  </span>
                </td>
                <td>
                  <q-btn
                    unelevated
                    rounded
                    :color="slot.isBooked ? 'grey-8' : 'primary'"
                    :disable="slot.isBooked"
                    class="action-btn text-weight-bold q-px-md text-caption"
                    :label="slot.isBooked ? 'Unavailable' : 'Book Now'"
                    @click="handleSlotBooking(slot, 'Physical')"
                  />
                </td>
                <td>
                  <q-chip dense :color="slot.isBooked ? 'red-9' : 'green-9'" text-color="white" class="status-chip border-none shadow-none text-weight-bold">
                    {{ slot.isBooked ? 'Unavailable' : 'Available' }}
                  </q-chip>
                </td>
              </tr>
              <tr v-if="!physicalSlots || physicalSlots.length === 0">
                <td colspan="7" class="text-center text-grey-5 q-py-md">No physical slots available.</td>
              </tr>
            </tbody>
          </q-markup-table>
        </div>

        <!-- ONLINE SLOTS TABLE -->
        <div class="q-mb-xl">
          <div class="flex items-center q-mb-md">
            <q-icon name="videocam" size="sm" color="blue-4" class="q-mr-sm"/>
            <span class="text-subtitle1 text-weight-bolder tracking-wide uppercase text-white">Online Consultation</span>
          </div>

           <q-markup-table dark class="bg-dark-glass text-left">
            <thead>
              <tr>
                <th class="text-grey-4 text-weight-bold">DATE</th>
                <th class="text-grey-4 text-weight-bold">TIME</th>
                <th class="text-grey-4 text-weight-bold">PLATFORM</th>
                <th class="text-grey-4 text-weight-bold">ACTIVE APPOINTMENTS</th>
                <th class="text-grey-4 text-weight-bold">AVAILABLE SLOTS</th>
                <th class="text-grey-4 text-weight-bold">ACTION</th>
                <th class="text-grey-4 text-weight-bold">STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="slot in onlineSlots" :key="slot._id || slot.startTime">
                <td class="text-white">{{ formatDate(slot.date) }}</td>
                <td class="text-blue-4 text-weight-medium">{{ slot.startTime }} - {{ slot.endTime }}</td>
                <td class="text-white">{{ slot.platform || "Zoom" }}</td>
                <td class="text-white text-center">{{ slot.bookedCount }}</td>
                <td class="text-center">
                  <span :class="(slot.slotCount - slot.bookedCount) > 0 ? 'text-green-4' : 'text-red-4'" class="text-weight-bold">
                    {{ Math.max((slot.slotCount || 1) - (slot.bookedCount || 0), 0) }}
                  </span>
                </td>
                <td>
                  <q-btn
                    unelevated
                    rounded
                    :color="slot.isBooked ? 'grey-8' : 'primary'"
                    :disable="slot.isBooked"
                    class="action-btn text-weight-bold q-px-md text-caption"
                    :label="slot.isBooked ? 'Unavailable' : 'Book Now'"
                    @click="handleSlotBooking(slot, 'Online')"
                  />
                </td>
                <td>
                  <q-chip dense :color="slot.isBooked ? 'red-9' : 'green-9'" text-color="white" class="status-chip border-none shadow-none text-weight-bold">
                    {{ slot.isBooked ? 'Unavailable' : 'Available' }}
                  </q-chip>
                </td>
              </tr>
              <tr v-if="!onlineSlots || onlineSlots.length === 0">
                <td colspan="7" class="text-center text-grey-5 q-py-md">No online slots available.</td>
              </tr>
            </tbody>
          </q-markup-table>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAppointmentStore } from '../../stores/appointmentStore';
import { useAuthStore } from '../../stores/authStore';
import { getDoctorSlots, getDoctorSlotsNext30Days, getDoctorDetails } from '../../services/appointmentService';

const store = useAppointmentStore();
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const doctor = ref(history.state?.doctor || store.selectedDoctor || null);

const getImageUrl = (img) => {
  if (!img) return "https://cdn-icons-png.flaticon.com/512/3774/3774299.png";
  if (typeof img === 'object' && img.url) img = img.url;
  if (typeof img === 'string') {
    if (img.startsWith("http")) return img;
    if (img.startsWith("/uploads")) {
      return `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}${img}`;
    }
  }
  return img;
};

const today = new Date().toISOString().split('T')[0];
const selectedDateStr = ref('');

const loadingSlots = ref(false);
const physicalSlots = ref([]);
const onlineSlots = ref([]);

onMounted(async () => {
  const doctorId = route.params.doctorId || route.query.doctorId;

  if (!doctor.value && doctorId) {
    doctor.value = {
      doctorId,
      name: route.query.doctorName || null,
      specialization: route.query.specialization || null,
      hospital: route.query.hospital || null,
    };
  }

  if (!doctor.value) {
    router.push('/search');
    return;
  }

  if (!doctor.value.name && route.query.doctorName) {
    doctor.value.name = route.query.doctorName;
  }

  if (doctorId && (!doctor.value?.doctorId || doctor.value.doctorId !== doctorId)) {
    doctor.value.doctorId = doctorId;
  }

  if (doctorId && (!doctor.value.name || !doctor.value.specialization || !doctor.value.hospital)) {
    doctor.value = {
      ...doctor.value,
      name: doctor.value.name || route.query.doctorName || doctor.value.doctorId,
      specialization: doctor.value.specialization || route.query.specialty || doctor.value.specialty || null,
      hospital: doctor.value.hospital || route.query.hospital || null,
      experience: doctor.value.experience || route.query.experience || null,
      consultationFee: doctor.value.consultationFee || route.query.consultationFee || doctor.value.fee || null,
      profileImage: doctor.value.profileImage || route.query.profileImage || null,
    };

    if (!doctor.value.specialization || !doctor.value.hospital || !doctor.value.profileImage) {
      const details = await getDoctorDetails(doctorId);
      if (details) {
        doctor.value = {
          ...doctor.value,
          name: doctor.value.name || details.name || details.profile?.name || doctor.value.doctorId,
          specialization: doctor.value.specialization || details.profile?.specialty || details.profile?.specialization || null,
          hospital: doctor.value.hospital || details.profile?.hospital || null,
          experience: doctor.value.experience || details.profile?.experience || null,
          consultationFee: doctor.value.consultationFee || details.profile?.consultationFee || details.profile?.fee || null,
          profileImage: doctor.value.profileImage || details.profile?.profileImage || null,
        };
      }
    }
  }

  if (!store.selectedDoctor && doctor.value) {
    store.selectDoctor(doctor.value);
  }

  fetchSlots();
});

function formatDate(date) {
  return new Date(date).toLocaleDateString();
}

const fetchSlots = async () => {
  loadingSlots.value = true;
  store.selectedDate = selectedDateStr.value;
  store.selectedSlot = null;

  try {
    console.log("SELECTED DOCTOR:", doctor.value);
    const doctorId = doctor.value.doctorId || doctor.value._id || doctor.value.id;

    let data;
    if (selectedDateStr.value) {
      data = await getDoctorSlots(doctorId, selectedDateStr.value);
    } else {
      data = await getDoctorSlotsNext30Days(doctorId);
    }

    console.log("SLOTS FRONT:", data);
    physicalSlots.value = data.physical || [];
    onlineSlots.value = data.online || [];
    await store.fetchQueueNumber();
  } catch (error) {
    console.error(error);
    physicalSlots.value = [];
    onlineSlots.value = [];
  } finally {
    loadingSlots.value = false;
  }
};

watch(selectedDateStr, () => {
  fetchSlots();
});

const handleSlotBooking = (slot, type) => {
  // Always save the selection first so it survives any redirect
  store.selectSlot(slot, type);

  // 🔒 AUTH GATE — must be logged in to proceed to the booking form
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
.nexus-search-card { border: 1px solid rgba(30, 58, 138, 0.4); border-radius: 16px; }
.bg-dark-glass { background: rgba(15, 23, 42, 0.6) !important; backdrop-filter: blur(8px); }
.doctor-avatar.border-blue { border: 3px solid #3b82f6; padding: 3px; background: #0f172a; }
.nexus-input :deep(.q-field__control) { border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1); }
.nexus-input :deep(.q-field__control:hover) { border-color: rgba(59, 130, 246, 0.5); }
.action-btn { background: #2563eb !important; font-size: 13px; }
.action-btn.disabled { background: #374151 !important; color: #9ca3af !important; }
.status-chip { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }

:deep(.q-table th) { border-bottom-color: rgba(255, 255, 255, 0.1); }
:deep(.q-table td) { border-bottom-color: rgba(255, 255, 255, 0.05); }
</style>
