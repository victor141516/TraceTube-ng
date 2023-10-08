<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SearchRequest, SearchResponse, request } from '@/requests/backend'
import { useInfiniteScroll } from '@vueuse/core'
import { Blocks, List, XCircle } from 'lucide-vue-next'
import { onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ResultsCards from './ResultsCards.vue'
import ResultsList from './ResultsList.vue'

const DEFAULT_VIEW_MODE = 'cards' as const

const router = useRouter()
const route = useRoute()

const searchInputPlaceholder = ['uwu', 'owo', 'hi!', 'ehehe'].sort(() => Math.random() - 0.5)[0]
const initialQueryValue = (Array.isArray(route.query.q) ? route.query.q[0] : route.query.q) ?? ''

const initialViewModeValue = (() => {
  const qFromUrl = Array.isArray(route.query.v) ? route.query.v[0] : route.query.v
  const qFromUrlIsCards = (qFromUrl ?? DEFAULT_VIEW_MODE) === 'cards'
  return qFromUrlIsCards ? 'cards' : 'list'
})()

const state = reactive<{
  searchTerm: string
  nextPageCursor: null | number
  searchResults: null | SearchResponse
  viewMode: 'list' | 'cards'
}>({
  searchTerm: initialQueryValue,
  nextPageCursor: null,
  searchResults: null,
  viewMode: initialViewModeValue,
})

const updateUrl = () => {
  const query = {} as { q?: string; v?: string }
  if (state.searchTerm) query.q = state.searchTerm
  if (state.viewMode !== DEFAULT_VIEW_MODE) query.v = state.viewMode
  router.replace({ query })
}

onMounted(() => {
  updateUrl()
})

watch(
  () => state.searchTerm,
  () => {
    state.nextPageCursor = null
    state.searchResults = null
    updateUrl()
  },
)

watch(
  () => state.viewMode,
  () => {
    el.value?.scrollTo(0, 0)
    updateUrl()
  },
)

const onSearch = async () => {
  if (!state.searchTerm) return
  const params: SearchRequest = { q: state.searchTerm }
  if (state.nextPageCursor) params.p = state.nextPageCursor
  const results = await request('/api/v1/search', params)
  state.nextPageCursor = results[results.length - 1]?.cursor ?? null

  state.searchResults ??= []
  state.searchResults = [...state.searchResults, ...results]
}
if (initialQueryValue) onSearch()

const el = ref<HTMLElement>(document.querySelector('html')!)
useInfiniteScroll(
  el,
  () => {
    if (state.nextPageCursor) {
      onSearch()
    }
  },
  { distance: 500, interval: 4000 },
)
</script>

<template>
  <div class="flex flex-col gap-8 w-full overflow-y-hidden">
    <form @submit.prevent="onSearch">
      <Card>
        <CardHeader>
          <CardTitle>Search in your videos</CardTitle>
        </CardHeader>
        <CardContent class="space-y-2">
          <div class="relative">
            <Input autofocus required v-model="state.searchTerm" name="search" :placeholder="searchInputPlaceholder" />
            <div class="absolute right-0 h-full top-0 flex items-center mr-2">
              <XCircle @click="() => (state.searchTerm = '')" class="opacity-30 hover:opacity-60 cursor-pointer" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div class="flex">
            <div class="flex-1 mt-auto">
              <Button>Search</Button>
            </div>
            <div class="flex gap-2">
              <label for="view-type-cards" class="flex mt-auto">
                <input
                  type="radio"
                  class="appearance-none hidden peer"
                  id="view-type-cards"
                  name="view-type"
                  value="cards"
                  v-model="state.viewMode"
                />
                <Card class="p-1 peer-checked:bg-primary/20 cursor-pointer">
                  <Blocks />
                </Card>
              </label>
              <label for="view-type-list" class="flex mt-auto">
                <input
                  type="radio"
                  class="appearance-none hidden peer"
                  id="view-type-list"
                  name="view-type"
                  value="list"
                  v-model="state.viewMode"
                />
                <Card class="p-1 peer-checked:bg-primary/20 cursor-pointer">
                  <List />
                </Card>
              </label>
            </div>
          </div>
        </CardFooter>
      </Card>
    </form>
    <div class="overflow-y-auto" ref="el" v-if="state.searchResults">
      <ResultsList v-if="state.viewMode === 'list'" :items="state.searchResults" />
      <ResultsCards v-if="state.viewMode === 'cards'" :items="state.searchResults" />
    </div>
  </div>
</template>
