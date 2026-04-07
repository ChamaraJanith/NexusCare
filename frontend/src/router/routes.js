const routes = [
  // 🔹 MAIN APP (public layout)
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },

      // Auth
      { path: 'login', component: () => import('pages/LoginPage.vue') },
      { path: 'register', component: () => import('pages/RegisterPage.vue') },

      // Patient Portal
      { path: 'patient/dashboard', component: () => import('pages/PatientDashboard.vue') },

      // Admin
      //{ path: 'admin/dashboard', component: () => import('pages/AdminDashboard.vue') },

      //{ path: 'payment', component: () => import('pages/PaymentPage.vue') },
      { path: 'payment', component: () => import('pages/appointment/PaymentSuccess.vue') },
      { path: 'payment/success', redirect: '/payment?status=success' },
      { path: 'payment/cancel', redirect: '/payment?status=cancel' },

      // AI Symptom Checker
      { path: 'symptoms', component: () => import('pages/SymptomChecker.vue') },

      // Explicit Request: /search pointing to Search Page
      { path: 'search', component: () => import('pages/appointment/SearchPage.vue') },
      // Map /appointment to Search Page as well
      { path: 'appointment', component: () => import('pages/appointment/SearchPage.vue') },

      // Appointment Booking Flow
      { path: 'appointment/results', component: () => import('pages/appointment/DoctorResults.vue') },
      { path: 'appointment/book/:doctorId', name: 'SlotSelection', component: () => import('pages/appointment/SlotSelection.vue') },
      { path: 'appointment/form', component: () => import('pages/appointment/PatientForm.vue'), meta: { requiresAuth: true } },
      { path: 'appointment/summary', component: () => import('pages/appointment/SummaryPage.vue') },
      { path: 'appointment/payment', component: () => import('pages/appointment/PaymentPage.vue') },
      { path: 'appointment/receipt', component: () => import('pages/appointment/ReceiptPage.vue') },
      { path: 'receipt/:orderId', component: () => import('pages/appointment/ReceiptPage.vue') },
      { path: 'patient/appointments', component: () => import('pages/appointment/MyAppointments.vue') },
      { path: 'appointment/pending', component: () => import('pages/appointment/AppointmentPending.vue') },

      // Video
      { path: 'video', component: () => import('pages/VideoSession.vue') },
      { path: 'doctorVideo', name: 'DoctorVideo', component: () => import('pages/Doctor_Video.vue') },
      { path: 'patientVideo', component: () => import('pages/Patient_Video.vue') },
    ]
  },

  // 🔹 DOCTOR PORTAL (standalone DoctorLayout with sidebar)
  {
    path: '/doctor',
    component: () => import('layouts/DoctorLayout.vue'),
    children: [
      { path: '', redirect: '/doctor/dashboard' },
      { path: 'dashboard', component: () => import('pages/doctor/DoctorDashboardHome.vue') },
      { path: 'schedule', component: () => import('pages/doctor/DoctorSchedulePage.vue') },
      { path: 'patients', component: () => import('pages/doctor/DoctorPatientsPage.vue') },
      { path: 'consultations', component: () => import('pages/doctor/DoctorConsultationsPage.vue') },
      { path: 'availability', component: () => import('pages/doctor/DoctorAvailabilityPage.vue') },
      { path: 'profile', component: () => import('pages/doctor/DoctorProfilePage.vue') },
      { path: 'reports', component: () => import('pages/doctor/DoctorReportsPage.vue') },
    ]
  },

  {
    path: '/admin',
    component: () => import('layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      // Redirect /admin → /admin/dashboard
      { path: '', redirect: '/admin/dashboard' },

      // Dashboard Home
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('pages/admin/AdminDashboardHome.vue')
      },

      // User Management
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('pages/admin/AdminUsersPage.vue')
      },

      // Doctor Verifications (Pending)
      {
        path: 'doctors/pending',
        name: 'AdminDoctorVerifications',
        component: () => import('pages/admin/AdminDoctorVerifications.vue')
      },

      // All Doctors (reuse users page filtered to doctor role, or create separate)
      {
        path: 'doctors',
        name: 'AdminDoctors',
        component: () => import('pages/admin/AdminUsersPage.vue')   // same component, pre-filtered
      },

      // Patients (reuse users page filtered to patient role)
      {
        path: 'patients',
        name: 'AdminPatients',
        component: () => import('pages/admin/AdminUsersPage.vue')
      },

      // Payments
      {
        path: 'payments',
        name: 'AdminPayments',
        component: () => import('pages/admin/AdminPaymentsPage.vue')
      },

      // Fee Management (service fee + hospital fee + doctor fees)
      {
        path: 'fees',
        name: 'AdminFees',
        component: () => import('pages/admin/AdminFeesPage.vue')
      },

      // Hospitals (also accessible from fees page)
      {
        path: 'hospitals',
        name: 'AdminHospitals',
        component: () => import('pages/admin/AdminFeesPage.vue')   // hospitals section is inside fees page
      },

      // Reports & Analytics (placeholder — extend as needed)
      {
        path: 'reports',
        name: 'AdminReports',
        component: () => import('pages/admin/AdminDashboardHome.vue')  // reuse dashboard until reports page built
      },

      // Settings (placeholder)
      {
        path: 'settings',
        name: 'AdminSettings',
        component: () => import('pages/admin/AdminDashboardHome.vue')
      },
    ]
  },




  // ❗ ALWAYS LAST
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes