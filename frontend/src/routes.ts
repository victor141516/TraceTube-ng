import App from '@/App.vue'
import Auth from '@/pages/Auth.vue'
import Search from '@/pages/Search/Search.vue'
import * as VueRouter from 'vue-router'

export const router = VueRouter.createRouter({
  history: VueRouter.createWebHistory(),
  routes: [
    { name: 'root', path: '/', component: App, meta: { requiresAuth: false } },
    { name: 'login', path: '/login', component: Auth, meta: { requiresAuth: false } },
    { name: 'signup', path: '/signup', component: Auth, meta: { requiresAuth: false } },
    { name: 'search', path: '/search', component: Search, meta: { requiresAuth: true } },
  ] as const,
})
