<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SearchRequest, SearchResponse, request } from '@/requests/backend'
import { store } from '@/store'
import { useInfiniteScroll } from '@vueuse/core'
import { Blocks, List, XCircle } from 'lucide-vue-next'
import { reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ResultsCards from './ResultsCards.vue'
import ResultsList from './ResultsList.vue'

const DEFAULT_VIEW_MODE = store.settings.preferredResultsView

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
  fetching: boolean
}>({
  searchTerm: initialQueryValue,
  nextPageCursor: null,
  searchResults: null,
  viewMode: initialViewModeValue,
  fetching: false,
})

const updateUrl = () => {
  const query = {} as { q?: string; v?: string }
  if (state.searchTerm) query.q = state.searchTerm
  query.v = state.viewMode
  router.replace({ query })
}

watch(
  () => state.viewMode,
  () => {
    store.settings.preferredResultsView = state.viewMode
    el.value?.scrollTo(0, 0)
    updateUrl()
  },
)

const calculateFetchParams = () => {
  const params: SearchRequest = { q: state.searchTerm.toLowerCase() }
  if (state.nextPageCursor) params.p = state.nextPageCursor
  return params
}

const fetchResults = async () => {
  const results = await request('/api/v1/search', calculateFetchParams())
  state.nextPageCursor = results[results.length - 1]?.cursor ?? null
  state.searchResults ??= []
  state.searchResults = [...state.searchResults, ...results]
}

const onSearchClick = async () => {
  if (!state.searchTerm) return
  state.fetching = true
  state.nextPageCursor = null
  state.searchResults = null
  updateUrl()
  await fetchResults()
  state.fetching = false
}
if (initialQueryValue) onSearchClick()

const el = ref<HTMLElement>(document.querySelector('html')!)
useInfiniteScroll(
  el,
  async () => {
    if (state.nextPageCursor) {
      await fetchResults()
    }
  },
  { distance: 500, interval: 4000 },
)
</script>

<template>
  <div class="h-full flex flex-col gap-4 lg:gap-8 w-full overflow-y-visible">
    <form @submit.prevent="onSearchClick">
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
              <Button :disabled="state.fetching" class="transition-all">Search</Button>
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
    <div class="overflow-y-auto" ref="el" v-if="state.searchResults && state.searchResults.length > 0">
      <ResultsList v-if="state.viewMode === 'list'" :items="state.searchResults" />
      <ResultsCards v-if="state.viewMode === 'cards'" :items="state.searchResults" />
    </div>
    <div class="flex-1 pb-8 flex items-center justify-center">
      <span v-if="state.searchResults?.length === 0"
        >We could not find any results for "{{ state.searchTerm }}" :((</span
      >
    </div>
  </div>
</template>
