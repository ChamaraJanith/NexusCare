const routes = [
  // 🔹 MAIN APP (public layout)
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },

      // Auth
      { path: 'login',    component: () => import('pages/LoginPage.vue') },
      { path: 'register', component: () => import('pages/RegisterPage.vue') },

      // Patient Portal
      { path: 'patient/dashboard', component: () => import('pages/PatientDashboard.vue') },

      // Admin
      { path: 'admin/dashboard', component: () => import('pages/AdminDashboard.vue') },

      // AI Symptom Checker
      { path: 'symptoms', component: () => import('pages/SymptomChecker.vue') },

      // Video
      { path: 'video', component: () => import('pages/VideoSession.vue') },
      { path: 'doctorVideo', component: () => import('pages/Doctor_Video.vue') },
      { path: 'patientVideo', component: () => import('pages/Patient_Video.vue') },
    ]
  },

  // 🔹 DOCTOR PORTAL (standalone DoctorLayout with sidebar)
  {
    path: '/doctor',
    component: () => import('layouts/DoctorLayout.vue'),
    children: [
      { path: '',              redirect: '/doctor/dashboard' },
      { path: 'dashboard',     component: () => import('pages/doctor/DoctorDashboardHome.vue') },
      { path: 'schedule',      component: () => import('pages/doctor/DoctorSchedulePage.vue') },
      { path: 'patients',      component: () => import('pages/doctor/DoctorPatientsPage.vue') },
      { path: 'consultations', component: () => import('pages/doctor/DoctorConsultationsPage.vue') },
      { path: 'availability',  component: () => import('pages/doctor/DoctorAvailabilityPage.vue') },
      { path: 'reports',       component: () => import('pages/doctor/DoctorReportsPage.vue') },
    ]
  },

  // ❗ ALWAYS LAST
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
