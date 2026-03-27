<template>
  <q-page class="q-pa-md q-pa-lg-xl bg-grey-1" style="min-height: 100vh;">
    
    <div class="row items-center q-mb-xl">
      <q-btn flat round dense icon="arrow_back" color="grey-8" class="q-mr-md" @click="$router.push('/doctor')" />
      <div>
        <h1 class="text-h4 text-weight-bolder text-dark q-ma-none" style="letter-spacing: -0.5px;">My Profile</h1>
        <div class="text-grey-6 text-subtitle2 q-mt-xs">Manage your professional details and public appearance</div>
      </div>
    </div>

    <!-- MAIN CONTENT -->
    <div v-if="pageLoading" class="row justify-center items-center" style="min-height: 50vh;">
      <q-spinner-gears size="60px" color="primary" />
    </div>

    <div v-else class="row q-col-gutter-xl justify-center">
      
      <!-- LEFT COLUMN -->
      <div class="col-12 col-md-4">
        <q-card flat bordered class="profile-card q-pa-xl text-center shadow-subtle border-radius-16">
          
          <div class="relative-position inline-block q-mx-auto avatar-container cursor-pointer" @click="triggerFileUpload">
            <q-avatar size="160px" class="shadow-10 bg-grey-2">
              
              <img v-if="previewImage" :src="previewImage" style="object-fit: cover;" />
              
              <img v-else-if="getAvatarUrl" :src="getAvatarUrl" style="object-fit: cover;" />
              
              <div v-else class="text-h2 text-grey-5">
                {{ doctor.name ? doctor.name.charAt(0).toUpperCase() : 'DR' }}
              </div>
            </q-avatar>

            <div class="avatar-overlay text-white flex flex-center rounded-borders transition-03s">
              <q-icon name="photo_camera" size="32px" />
              <div class="text-caption text-weight-bold q-mt-xs">CHANGE</div>
            </div>

            <input 
              type="file" 
              ref="fileInputRef" 
              accept="image/png, image/jpeg, image/webp" 
              style="display: none;" 
              @change="handleFileSelect" 
            />
          </div>

          <div class="q-mt-lg">
            <h2 class="text-h5 text-weight-bold text-dark q-mb-xs">
              Dr. {{ doctor.name }}
            </h2>

            <q-badge color="blue-1" text-color="blue-8" class="q-px-sm q-py-xs text-weight-bold">
              {{ form.specialization || 'General' }}
            </q-badge>
          </div>

          <div class="q-mt-xl text-left q-gutter-y-sm">
            <div class="row items-center text-grey-7">
              <q-icon name="email" size="20px" class="q-mr-md text-blue-grey-4" />
              <div class="text-weight-medium text-body2">
                {{ doctor.email || 'N/A' }}
              </div>
            </div>
          </div>
        </q-card>
      </div>

      <!-- RIGHT COLUMN -->
      <div class="col-12 col-md-8">
        <q-card flat bordered class="q-pa-xl shadow-subtle border-radius-16 bg-white">

          <div class="text-h6 text-weight-bold q-mb-lg flex items-center">
            <q-icon name="manage_accounts" color="primary" size="24px" class="q-mr-sm" />
            Professional Identity
          </div>

          <q-form @submit.prevent="saveProfile" class="q-gutter-y-lg">

            <div class="row q-col-gutter-lg">

              <div class="col-12 col-sm-6">
                <q-input v-model="form.specialization" label="Specialization" outlined />
              </div>

              <div class="col-12 col-sm-6">
                <q-input v-model.number="form.experience" type="number" label="Years of Experience" outlined />
              </div>

              <div class="col-12">
                <q-input v-model="form.hospital" label="Primary Hospital / Clinic" outlined />
              </div>

              <div class="col-12">
                <q-input v-model="form.location" label="City / Location" outlined />
              </div>

              <div class="col-12">
                <q-input v-model="form.bio" type="textarea" label="Biography & Approach" outlined rows="4" />
              </div>

            </div>

            <q-separator class="q-my-lg" />

            <div class="row justify-end q-gutter-md">
              <q-btn flat label="Discard Changes" color="grey-6" @click="resetForm" />
              <q-btn color="primary" label="Save Profile" type="submit" :loading="saving" />
            </div>

          </q-form>
        </q-card>
      </div>

    </div>
  </q-page>
</template>

<script setup>
import { ref, reactive, inject, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import { fetchDoctorProfile, updateDoctorProfileData, uploadDoctorImage } from 'src/services/doctorApi';

const $q = useQuasar();

const layoutDoctor = inject('doctor', ref({}));
const doctor = ref({});

const getAvatarUrl = computed(() => {
  const d = doctor.value || layoutDoctor.value;
  return d?.profileImage?.url || null;
});

const fileInputRef = ref(null);
const previewImage = ref(null);

const form = reactive({
  specialization: '',
  experience: 0,
  hospital: '',
  location: '',
  bio: ''
});

const saving = ref(false);
const pageLoading = ref(true);

// 🔥 AUTO FILL
const loadProfile = async () => {
  try {
    const d = await fetchDoctorProfile();

    // 🔥 handle both response formats
    const profile = d.data || d;

    doctor.value = profile;

    // 🔥 FIX: specialty → specialization
    form.specialization = profile.specialization || profile.specialty || '';
    form.experience = profile.experience || 0;
    form.hospital = profile.hospital || '';
    form.location = profile.location || '';
    form.bio = profile.bio || '';

    Object.assign(layoutDoctor.value, profile);

    console.log("PROFILE FIXED:", profile); // debug
    console.log("PROFILE FULL:", d);
  } catch (err) {
    console.error(err);
  }
};

onMounted(async () => {
  await loadProfile();
  pageLoading.value = false;
});

// RESET
const resetForm = () => {
  form.specialization = doctor.value.specialization || '';
  form.experience = doctor.value.experience || 0;
  form.hospital = doctor.value.hospital || '';
  form.location = doctor.value.location || '';
  form.bio = doctor.value.bio || '';
  previewImage.value = null;
};

// IMAGE
const triggerFileUpload = () => {
  fileInputRef.value.click();
};

const handleFileSelect = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  previewImage.value = URL.createObjectURL(file);

  try {
    await uploadDoctorImage(file);
    await loadProfile();

    $q.notify({ type: 'positive', message: 'Image updated' });

  } catch {
    $q.notify({ type: 'negative', message: 'Upload failed' });
  }
};

// SAVE
const saveProfile = async () => {
  saving.value = true;
  try {
    const updated = await updateDoctorProfileData({ ...form });

    Object.assign(doctor.value, updated);

    $q.notify({ type: 'positive', message: 'Profile updated' });

  } catch {
    $q.notify({ type: 'negative', message: 'Update failed' });
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.shadow-subtle {
  box-shadow: 0 4px 24px rgba(0,0,0,0.04);
}
.border-radius-16 {
  border-radius: 16px;
}
.profile-card {
  border-top: 4px solid #1976d2;
}
.avatar-container {
  overflow: hidden;
  border-radius: 50%;
}
.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.5);
  opacity: 0;
  transition: 0.3s;
}
.avatar-container:hover .avatar-overlay {
  opacity: 1;
}
</style>