const routes = [
  // 🔹 MAIN APP (DON'T TOUCH ❗)
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },

      // ─── MS1: Auth ──────────────────────────────────────────────
      { path: 'login',    component: () => import('pages/LoginPage.vue') },
      { path: 'register', component: () => import('pages/RegisterPage.vue') },

       // ─── MS1: Patient Portal ────────────────────────────────────
      { path: 'patient/dashboard', component: () => import('pages/PatientDashboard.vue') },

      // AI Symptom Checker
      { path: 'symptoms', component: () => import('pages/SymptomChecker.vue') },

      // Video Session
      { path: 'video', component: () => import('pages/VideoSession.vue') },
      { path: 'doctorVideo', component: () => import('pages/Doctor_Video.vue') },
      { path: 'patientVideo', component: () => import('pages/Patient_Video.vue') },
    ]
  },

  // 🔥 DOCTOR MODULE (NEW - SEPARATE LAYOUT)
  {
    path: '/doctor',
    component: () => import('layouts/DoctorLayout.vue'),
    children: [
      { path: '', redirect: '/doctor/dashboard' },

      { path: 'dashboard', component: () => import('pages/DoctorDashboardPage.vue') },

      { path: 'consultations', component: () => import('pages/ConsultationPage.vue') },

      { path: 'availability', component: () => import('pages/AvailabilityPage.vue') },

      { path: 'analytics', component: () => import('pages/AnalyticsPage.vue') },
    ]
  },

  // ❗ ALWAYS LAST
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes