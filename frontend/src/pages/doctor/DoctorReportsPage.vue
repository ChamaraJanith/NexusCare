<template>
  <q-page padding style="background: #f4f6f9;">
    <!-- Dashboard Header -->
    <div class="row items-center q-mb-xl">
      <div>
        <div class="text-h4 text-weight-bolder text-dark">Clinical Reports Overview</div>
        <div class="text-subtitle1 text-grey-6 q-mt-xs">High-level insights into your practice and clinical productivity.</div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="q-pa-xl flex flex-center column">
      <q-spinner-puff color="primary" size="60px" />
      <div class="text-grey-6 q-mt-md text-weight-medium">Synchronizing analytics engine globally...</div>
    </div>

    <!-- Dashboard Layout -->
    <div v-else>
       <!-- Key Metric Cards -->
       <div class="row q-col-gutter-lg q-mb-lg">
          
          <div class="col-12 col-md-4">
             <q-card flat class="shadow-2 bg-gradient-primary text-white" style="border-radius: 12px;">
                <q-card-section class="row items-center cursor-pointer">
                   <div>
                      <div class="text-overline text-weight-bold" style="opacity: 0.8;">Total Global Patients</div>
                      <div class="text-h3 text-weight-bolder">{{ metrics.totalPatients }}</div>
                   </div>
                   <q-space />
                   <q-icon name="groups" size="56px" style="opacity: 0.5;" />
                </q-card-section>
             </q-card>
          </div>

          <div class="col-12 col-md-4">
             <q-card flat class="shadow-2 bg-gradient-teal text-white" style="border-radius: 12px;">
                <q-card-section class="row items-center cursor-pointer">
                   <div>
                      <div class="text-overline text-weight-bold" style="opacity: 0.8;">Total Prescriptions Issued</div>
                      <div class="text-h3 text-weight-bolder">{{ metrics.totalPrescriptions }}</div>
                   </div>
                   <q-space />
                   <q-icon name="medication" size="56px" style="opacity: 0.5;" />
                </q-card-section>
             </q-card>
          </div>

          <div class="col-12 col-md-4">
             <q-card flat class="shadow-2 bg-gradient-orange text-white" style="border-radius: 12px;">
                <q-card-section class="row items-center cursor-pointer">
                   <div>
                      <div class="text-overline text-weight-bold" style="opacity: 0.8;">Pending Appointments Map</div>
                      <div class="text-h3 text-weight-bolder">{{ metrics.pendingAppointments }}</div>
                   </div>
                   <q-space />
                   <q-icon name="schedule" size="56px" style="opacity: 0.5;" />
                </q-card-section>
             </q-card>
          </div>

       </div>

       <!-- Recent Global Activity and Charting block -->
       <div class="row q-col-gutter-lg">
          <div class="col-12 col-lg-8">
             <q-card flat class="shadow-2 bg-white" style="border-radius: 12px; height: 100%;">
                <q-card-section>
                   <div class="text-h6 text-weight-bold text-dark q-mb-md">Recent Clinical Activity</div>
                   <q-list separator>
                     <div v-if="metrics.recentActivity.length === 0" class="q-py-xl flex flex-center column">
                         <q-icon name="history_toggle_off" size="48px" color="grey-4" />
                         <span class="text-grey-6 q-mt-sm">No activity recorded natively.</span>
                     </div>
                      <q-item v-for="(act, i) in metrics.recentActivity" :key="i" class="q-py-md">
                         <q-item-section avatar>
                            <q-avatar :color="act.type === 'rx' ? 'teal-1' : 'primary-1'" :text-color="act.type === 'rx' ? 'teal-9' : 'primary-9'">
                               <q-icon :name="act.type === 'rx' ? 'edit_document' : 'person_add'" />
                            </q-avatar>
                         </q-item-section>
                         <q-item-section>
                            <q-item-label class="text-weight-bold text-dark">{{ act.title }}</q-item-label>
                            <q-item-label caption class="text-grey-7">{{ act.subtitle }}</q-item-label>
                         </q-item-section>
                         <q-item-section side>
                            <q-badge transparent color="grey-3" text-color="black">{{ act.date }}</q-badge>
                         </q-item-section>
                      </q-item>
                   </q-list>
                </q-card-section>
             </q-card>
          </div>

          <div class="col-12 col-lg-4">
             <q-card flat class="shadow-2 bg-white" style="border-radius: 12px; height: 100%;">
                <q-card-section class="column full-height">
                   <div class="text-h6 text-weight-bold text-dark q-mb-xl">Workflow Volume Flow</div>
                   
                   <div class="col flex flex-center q-pb-lg">
                      <div class="row items-end justify-center q-gutter-x-sm" style="height: 180px; width: 100%;">
                         <div class="column items-center">
                            <div class="bar bg-primary" :style="{height: metrics.chartData.mo + '%'}"></div>
                            <span class="text-caption text-weight-bold q-mt-sm">Mon</span>
                         </div>
                         <div class="column items-center">
                            <div class="bar bg-teal" :style="{height: metrics.chartData.tu + '%'}"></div>
                            <span class="text-caption text-weight-bold q-mt-sm">Tue</span>
                         </div>
                         <div class="column items-center">
                            <div class="bar bg-orange" :style="{height: metrics.chartData.we + '%'}"></div>
                            <span class="text-caption text-weight-bold q-mt-sm">Wed</span>
                         </div>
                         <div class="column items-center">
                            <div class="bar bg-red" :style="{height: metrics.chartData.th + '%'}"></div>
                            <span class="text-caption text-weight-bold q-mt-sm">Thu</span>
                         </div>
                         <div class="column items-center">
                            <div class="bar bg-deep-purple" :style="{height: metrics.chartData.fr + '%'}"></div>
                            <span class="text-caption text-weight-bold q-mt-sm">Fri</span>
                         </div>
                      </div>
                   </div>

                </q-card-section>
             </q-card>
          </div>
       </div>

    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import axios from 'axios';
import { fetchAppointments } from 'src/services/doctorApi';

const $q = useQuasar();

const loading = ref(true);

const metrics = ref({
   totalPatients: 0,
   totalPrescriptions: 0,
   pendingAppointments: 0,
   recentActivity: [],
   chartData: { mo: 40, tu: 70, we: 50, th: 90, fr: 65 } // Simulated visualization dataset structure scaling
});

const parseJwt = (t) => { try { return JSON.parse(atob(t.split('.')[1])); } catch { return null; } };
const getToken = () => localStorage.getItem('token') || localStorage.getItem('nexus_token');
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

onMounted(async () => {
  const token = getToken();
  const decoded = token ? parseJwt(token) : null;
  
  if (decoded?.roleId) {
    try {
      // Step 1: Base Patient Loadings
      const apts = await fetchAppointments(decoded.roleId);
      
      const seen = new Set();
      const uniquePatients = apts.filter(a => {
        if (seen.has(a.patientId || a.patientName)) return false;
        seen.add(a.patientId || a.patientName);
        return true;
      });

      metrics.value.totalPatients = uniquePatients.length;
      metrics.value.pendingAppointments = apts.filter(a => a.status === 'confirmed' || a.status === 'scheduled').length;

      // Extract EMR payloads horizontally
      let totalRx = 0;
      let globalTimeline = [];

      const patientPromises = uniquePatients.map(async (pt) => {
         const pid = pt.patientId || pt._id;
         try {
            const rxRes = await axios.get(`${API_URL}/api/prescriptions/${pid}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const data = rxRes.data?.success ? rxRes.data.data : rxRes.data;
            if (Array.isArray(data)) {
               totalRx += data.length;
               
               // Pick heavily optimized mapping arrays for global logs natively
               data.forEach(rx => {
                  globalTimeline.push({
                     type: 'rx',
                     title: `Issued Prescription to ${pt.patientName}`,
                     subtitle: `Diagnosis map: ${rx.diagnosis}`,
                     rawDate: new Date(rx.createdAt).getTime(),
                     date: new Date(rx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  });
               });
            }
         } catch(e) {
            console.error(`Failed mapping ${pid}`, e);
         }
      });

      await Promise.all(patientPromises);
      metrics.value.totalPrescriptions = totalRx;

      // Sort timeline globally backwards isolating top 5 bounds strictly natively
      globalTimeline.sort((a,b) => b.rawDate - a.rawDate);
      metrics.value.recentActivity = globalTimeline.slice(0, 5);

    } catch (e) {
      console.error('Extraction metrics fatally disconnected from service map', e);
      $q.notify({ type: 'negative', message: 'Failed to synchronize analytics. Displaying generic bounds.' });
    }
  }
  loading.value = false;
});
</script>

<style scoped>
.bg-gradient-primary {
  background: linear-gradient(135deg, #1976D2 0%, #0D47A1 100%);
}
.bg-gradient-teal {
  background: linear-gradient(135deg, #009688 0%, #004D40 100%);
}
.bg-gradient-orange {
  background: linear-gradient(135deg, #FF9800 0%, #E65100 100%);
}
.bg-primary-1 {
  background: #E3F2FD !important;
}
.bg-teal-1 {
   background: #E0F2F1 !important;
}
.text-primary-9 {
   color: #0D47A1 !important;
}
.text-teal-9 {
   color: #004D40 !important;
}
.bar {
   width: 32px;
   border-radius: 6px 6px 0 0;
   transition: height 1s cubic-bezier(0.4, 0, 0.2, 1);
}
@media (max-width: 600px) {
  .bar { width: 24px; }
}
</style>
