<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchResponse } from '@/requests/backend'
import { ArrowLeft, ArrowRight } from 'lucide-vue-next'
import { ref, watch } from 'vue'

type VideoId = string

const props = defineProps<{ items: SearchResponse }>()

const groupResults = (videos: SearchResponse) => {
  const groups = videos.reduce((acc, video) => {
    acc[video.videoId] ??= []
    acc[video.videoId].push(video)
    return acc
  }, {} as Record<string, SearchResponse>)
  return groups
}

const groups = ref({} as Record<VideoId, SearchResponse>)
const selectedGroupItems = ref({} as Record<VideoId, number>)
const runningAnimations = ref({} as Record<VideoId, boolean>)
const animationDirection = ref<'left' | 'right'>('left')

watch(
  () => props.items,
  () => {
    groups.value = groupResults(props.items)
    selectedGroupItems.value = Object.fromEntries(Object.entries(groups.value).map(([videoId]) => [videoId, 0]))
    runningAnimations.value = Object.fromEntries(Object.entries(groups.value).map(([videoId]) => [videoId, false]))
  },
  { immediate: true },
)

const getSelectedItem = (videoId: VideoId) => {
  const group = groups.value[videoId]
  const selectedItemIndex = selectedGroupItems.value[videoId]
  return group[selectedItemIndex]
}

const handleLeft = (videoId: VideoId) => {
  if (selectedGroupItems.value[videoId] === 0) return
  animationDirection.value = 'left'
  runningAnimations.value[videoId] = true
  selectedGroupItems.value[videoId] -= 1
}

const handleRight = (videoId: VideoId) => {
  if (selectedGroupItems.value[videoId] === groups.value[videoId].length - 1) return
  animationDirection.value = 'right'
  runningAnimations.value[videoId] = true
  selectedGroupItems.value[videoId] += 1
}
</script>

<template>
  <div class="grid grid-cols-search-result gap-2 lg:gap-4">
    <a
      v-for="(items, videoId) of groups"
      target="_blank"
      :href="`https://www.youtube.com/watch?v=${videoId}&t=${getSelectedItem(videoId).from}s`"
      @keydown.left="() => handleLeft(videoId)"
      @keydown.right="() => handleRight(videoId)"
    >
      <Card v-motion-slide-top class="group transition-shadow hover:shadow-lg hover:bg-primary/5">
        <CardHeader>
          <CardTitle>
            <div class="flex flex-col">
              <span class="text-ellipsis whitespace-nowrap overflow-hidden">{{ items[0].videoTitle }}</span>
              <a
                class="font-bold text-sm text-gray-500 ml-4"
                target="_blank"
                :href="`https://www.youtube.com${items[0].channelId}`"
                >{{ items[0].channelId.substring(1) }}</a
              >
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-2">
          <div class="relative flex justify-center">
            <img
              class="flex w-full h-36 object-cover transition-all blur-sm brightness-[25%] contrast-50 saturate-50 group-hover:filter-none"
              :src="`https://img.youtube.com/vi/${videoId}/0.jpg`"
              :alt="items[0].videoTitle"
            />
            <div class="absolute top-0 bottom-0 -left-4 -right-4 flex items-center">
              <div class="w-full h-24 flex items-center justify-center gap-px">
                <button
                  v-if="items.length > 1"
                  class="cursor-pointer bg-primary/90 enabled:hover:bg-primary disabled:opacity-20 disabled:cursor-default h-full text-primary-foreground flex items-center"
                  :disabled="selectedGroupItems[videoId] === 0"
                  @click.prevent.capture.stop="() => handleLeft(videoId)"
                >
                  <ArrowLeft />
                </button>
                <div
                  class="h-full flex-1 py-1 px-2 bg-primary/90 pointer-events-none flex items-center overflow-hidden"
                >
                  <TransitionGroup
                    :name="`slide-${animationDirection}`"
                    @after-leave="() => (runningAnimations[videoId] = false)"
                  >
                    <cite v-if="!runningAnimations[videoId]" class="text-primary-foreground w-full">{{
                      getSelectedItem(videoId).text
                    }}</cite>
                  </TransitionGroup>
                </div>
                <button
                  v-if="items.length > 1"
                  class="cursor-pointer bg-primary/90 enabled:hover:bg-primary disabled:opacity-20 disabled:cursor-default h-full text-primary-foreground flex items-center"
                  :disabled="selectedGroupItems[videoId] === items.length - 1"
                  @click.prevent.capture.stop="() => handleRight(videoId)"
                >
                  <ArrowRight />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </a>
  </div>
</template>

<style scoped>
.slide-right-enter-active,
.slide-right-leave-active,
.slide-left-enter-active,
.slide-left-leave-active {
  @apply transition-transform;
}

.slide-right-enter-from,
.slide-left-leave-to {
  @apply translate-x-full;
}
.slide-right-leave-to,
.slide-left-enter-from {
  @apply -translate-x-full;
}

.slide-right-enter-to .slide-right-leave-from,
.slide-left-enter-to .slide-left-leave-from {
  @apply translate-x-0;
}
</style>
