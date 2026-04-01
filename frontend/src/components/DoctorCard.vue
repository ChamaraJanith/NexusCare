<template>
  <q-card class="nexus-doctor-card bg-dark-glass q-pa-lg text-white">
    <!-- Middle: Profile Row -->
    <div class="row no-wrap items-center q-mb-md border-bottom q-pb-md">
      <!-- Left: Circular image -->
      <q-avatar size="72px" class="q-mr-lg doctor-avatar shadow-lg">
        <img
          :src="getImageUrl(doctor.profileImage)"
          class="doctor-img"
          @error="imgErr=true" 
          v-if="!imgErr" 
        />
        <div v-else class="avatar-fallback full-width full-height flex flex-center bg-blue-grey-9 text-white font-weight-bold">
          {{ initials }}
        </div>
      </q-avatar>
      <!-- Middle: Name + Specialization -->
      <div class="col">
        <div class="text-h6 text-weight-bolder tracking-tight q-mb-xs">{{ doctor.name }}</div>
        <div class="text-caption text-blue-4">{{ doctor.specialization || doctor.specialty }}</div>
      </div>
    </div>

    <!-- Below: Hospital + Experience -->
    <div class="q-mb-md">
      <div class="flex items-center text-caption text-grey-4 q-mb-sm font-weight-medium">
        <q-icon name="add_box" class="q-mr-sm text-grey-6" size="18px" />
        {{ doctor.hospital || 'General Hospital' }}
      </div>
      <div class="flex items-center text-caption text-grey-4 font-weight-medium">
        <q-icon name="location_on" class="q-mr-sm text-grey-6" size="18px" />
        {{ doctor.experience || '10+' }} experience
      </div>
    </div>

    <!-- Bottom: Fee + Book Now -->
    <div class="row items-center justify-between q-mt-md">
      <div>
        <div class="text-caption text-grey-5 q-mb-none font-weight-medium">Fee</div>
        <div class="text-subtitle1 text-weight-bolder text-white">LKR {{ (doctor.fee || doctor.consultationFee || 3000).toLocaleString() }}</div>
      </div>
      <q-btn 
        unelevated 
        rounded
        color="transparent" 
        class="book-btn q-px-lg text-caption text-weight-bold"
        @click="$emit('book', doctor)"
      >
        Book Now <q-icon name="arrow_forward" size="xs" class="q-ml-sm" />
      </q-btn>
    </div>

    <!-- Very Bottom: Availability Badge -->
    <div class="q-mt-md q-pt-sm">
      <div class="availability-badge inline-flex items-center rounded-borders q-px-sm q-py-xs">
        <div class="green-dot q-mr-sm"></div>
        <span class="text-caption text-green-5 text-weight-medium">Available for booking</span>
      </div>
    </div>
  </q-card>
</template>

<script setup>
import { ref, computed } from 'vue';

const getImageUrl = (img) => {
  if (!img) {
    return "https://cdn-icons-png.flaticon.com/512/3774/3774299.png";
  }

  // Extract URL if img is an object (e.g. from Cloudinary)
  if (typeof img === 'object' && img.url) {
    img = img.url;
  }

  if (typeof img === 'string') {
    if (img.startsWith("http")) {
      return img;
    }

    if (img.startsWith("/uploads")) {
      return `http://localhost:5002${img}`;
    }
  }

  return typeof img === 'string' ? img : "https://cdn-icons-png.flaticon.com/512/3774/3774299.png";
};



const props = defineProps({ doctor: { type: Object, required: true } });
defineEmits(['book']);
const imgErr = ref(false);



const initials = computed(() => {
  if (!props.doctor.name) return 'DR';
  const parts = props.doctor.name.replace('Dr.', '').trim().split(' ');
  return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
});
</script>

<style scoped>
.doctor-img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.nexus-doctor-card {
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.4) !important;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: transform 0.2s ease, border-color 0.2s ease;
  box-shadow: none;
}
.nexus-doctor-card:hover { border-color: rgba(59, 130, 246, 0.4); }
.doctor-avatar { border: 2px solid transparent; background: #0f172a; position: relative; }
/* Orange/Yellow active indicator ring based on Image 2 matching */
.doctor-avatar::after {
  content: ''; position: absolute; top: -3px; left: -3px; right: -3px; bottom: -3px;
  border-radius: 50%; border: 3px solid #f59e0b; border-left-color: #3b82f6; z-index: -1;
}

.border-bottom { border-bottom: 1px solid rgba(255, 255, 255, 0.05); }

.book-btn { background: rgba(30, 58, 138, 0.4) !important; transition: all 0.2s; color: #60a5fa !important; border: 1px solid transparent; }
.book-btn:hover { background: #1e3a8a !important; color: white !important; }

.availability-badge { font-size: 11px; background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2); }
.green-dot { width: 8px; height: 8px; border-radius: 50%; background-color: #22c55e; box-shadow: 0 0 6px #22c55e; }
.inline-flex { display: inline-flex; }
</style>