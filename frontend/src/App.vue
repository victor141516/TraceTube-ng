<script setup lang="ts">
import UserMenu from '@/components/sections/UserMenu.vue'
import { store } from '@/store'
import { onMounted, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const handleAuthChanges = () => {
  if (route.meta.requiresAuth && !store.auth.authenticated) {
    router.push({ name: 'login' })
  }
}
const handleAuthRouteOnAuthenticatedUser = () => {
  // TODO: make this think part of the routes meta
  if (['login', 'signup'].includes((route.name ?? '').toString()) && store.auth.authenticated) {
    router.push({ name: 'root' })
  }
}

const handleRootRoute = () => {
  if (route.name === 'root') {
    if (store.auth.authenticated) {
      router.push({ name: 'search' })
    } else {
      router.push({ name: 'login' })
    }
  }
}

watchEffect(() => {
  handleAuthChanges()
  handleAuthRouteOnAuthenticatedUser()
  handleRootRoute()
})
onMounted(() => {
  handleAuthChanges()
  handleAuthRouteOnAuthenticatedUser()
  handleRootRoute()
})
</script>

<template>
  <div class="p-1 lg:p-4 h-full max-w-screen-lg mx-auto flex flex-col items-center gap-4">
    <div v-if="store.auth.authenticated" class="self-end">
      <UserMenu />
    </div>
    <RouterView />
  </div>
</template>
