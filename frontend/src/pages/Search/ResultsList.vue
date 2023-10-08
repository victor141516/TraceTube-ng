<script setup lang="ts">
import { Card } from '@/components/ui/card'
import { SearchResponse } from '@/requests/backend'

const props = defineProps<{ items: SearchResponse }>()
</script>

<template>
  <div class="flex flex-col gap-4 w-full">
    <a
      v-for="item of props.items"
      target="_blank"
      :href="`https://www.youtube.com/watch?v=${item.videoId}&t=${item.from}s`"
    >
      <Card class="flex overflow-hidden transition-shadow hover:shadow hover:bg-primary/5">
        <img
          class="h-14 object-cover aspect-[16/9]"
          :src="`https://img.youtube.com/vi/${item.videoId}/0.jpg`"
          :alt="item.videoTitle"
        />
        <div class="px-2 py-1 flex flex-col my-auto overflow-hidden">
          <h2 class="flex items-center gap-1 max-w-full">
            <b class="text-ellipsis whitespace-nowrap overflow-hidden">{{ item.videoTitle }}</b>
            <a target="_blank" :href="`https://www.youtube.com${item.channelId}`" class="text-xs">{{
              item.channelId.substring(1)
            }}</a>
          </h2>
          <cite class="text-xs">{{ item.text }}</cite>
        </div>
      </Card>
    </a>
  </div>
</template>
