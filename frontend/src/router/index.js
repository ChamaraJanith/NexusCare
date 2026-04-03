import { defineRouter } from '#q-app/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'
import routes from './routes'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  // GLOBAL NAVIGATION GUARD
  Router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token') || localStorage.getItem('nexus_token')

    // ── 1. requiresAuth: protect pages that need a logged-in user ───────────
    if (to.meta?.requiresAuth) {
      if (!token) {
        console.warn('Router Guard: Unauthenticated access blocked →', to.fullPath)
        return next({ path: '/login', query: { redirect: to.fullPath } })
      }
    }

    // ── 2. Doctor dashboard guard (role check) ───────────────────────────────
    // Check if the route is strictly in the /doctor namespace
    if (to.path.startsWith('/doctor/dashboard')) {

      // Quick Native Decoding Validation
      try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''))
        const payload = JSON.parse(jsonPayload)
        
        const userRole = String(payload.role).toLowerCase()
        if (userRole !== 'doctor') {
          console.warn(`Router Guard: Access denied. Role mismatch ('${userRole}' instead of 'doctor').`)
          return next('/login')
        }
      } catch (e) {
        console.error('Router Guard: Corrupt Token format discovered.', e)
        return next('/login')
      }
    }
    
    // Everything passes through if not blocked
    next()
  })

  return Router
})
