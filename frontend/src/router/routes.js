const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      // AI Symptom Checker route
      { path: 'symptoms', component: () => import('pages/SymptomChecker.vue') }
    ]
  },

  // keep this line if we enter invalid routes and redirect to 404 page (must always be last)
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
