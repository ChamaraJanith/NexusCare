const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      // AI Symptom Checker route එක මෙතන පමණක් තිබිය යුතුයි
      { path: 'symptoms', component: () => import('pages/SymptomChecker.vue') }
    ]
  },

  // මේක හැමවෙලේම අන්තිමට තියෙන්න ඕනේ (වැරදි URL එකක් ගැහුවොත් 404 පෙන්වන්න)
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
