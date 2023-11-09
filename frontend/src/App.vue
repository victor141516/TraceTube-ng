<script setup lang="tsx">
import UserMenu from '@/components/sections/UserMenu.vue'
import { store } from '@/store'
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const handleAuthChanges = async () => {
  if (route.meta.requiresAuth && !store.auth.authenticated) {
    await router.push({ name: 'login' })
  }
}
const handleAuthRouteOnAuthenticatedUser = async () => {
  // TODO: make this thing part of the routes meta
  if (['login', 'signup'].includes((route.name ?? '').toString()) && store.auth.authenticated) {
    await router.push({ name: 'root' })
  }
}

const handleRootRoute = async () => {
  if (route.name === 'root') {
    if (store.auth.authenticated) {
      await router.push({ name: 'search' })
    } else {
      await router.push({ name: 'login' })
    }
  }
}

const ready = ref(false)

watch(
  () => [route, store.auth.authenticated],
  async () => {
    console.log('watcheffect')
    await router.isReady()
    await handleAuthChanges()
    await handleAuthRouteOnAuthenticatedUser()
    await handleRootRoute()
  },
)
onMounted(async () => {
  await router.isReady()
  await handleAuthChanges()
  await handleAuthRouteOnAuthenticatedUser()
  await handleRootRoute()
  ready.value = true
})
</script>

<template>
  <div class="px-1.5 py-2 lg:p-4 h-full max-w-screen-lg mx-auto flex flex-col items-center gap-2 lg:gap-4">
    <div v-if="store.auth.authenticated" class="self-end" v-motion-slide-right>
      <UserMenu />
    </div>
    <RouterView v-if="ready" v-motion-slide-top />
  </div>
</template>
