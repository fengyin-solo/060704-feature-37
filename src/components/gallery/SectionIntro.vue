<script setup lang="ts">
import { computed } from 'vue'
import type { GallerySection } from '@/types'

interface Props {
  section: GallerySection | null
  exhibitCount: number
}

const props = defineProps<Props>()

const hasExhibits = computed(() => props.exhibitCount > 0)
</script>

<template>
  <div v-if="section" class="bg-gradient-to-r from-gray-900 via-gray-800/50 to-gray-900 rounded-lg border border-gray-700 p-6 mb-6">
    <div class="flex items-start gap-4">
      <div class="text-5xl flex-shrink-0">{{ section.icon }}</div>
      <div class="flex-1">
        <div class="flex items-center gap-3 mb-2">
          <h3 class="font-vt323 text-2xl text-diary-fresh glow-text">
            {{ section.name }}
          </h3>
          <span 
            class="px-2 py-0.5 rounded text-xs font-vt323 border"
            :class="[
              hasExhibits 
                ? 'bg-diary-fresh/20 text-diary-fresh border-diary-fresh/50' 
                : 'bg-gray-800 text-gray-500 border-gray-700'
            ]"
          >
            {{ exhibitCount }} 件展品
          </span>
        </div>
        <p class="text-gray-400 font-vt323 text-sm leading-relaxed">
          {{ section.description }}
        </p>
        
        <div class="mt-3 flex items-center gap-2 text-xs text-gray-500 font-vt323">
          <span>📌</span>
          <span>
            <span v-if="hasExhibits">点击展品卡片查看详情，或点击作者头像前往其日记墙</span>
            <span v-else class="text-gray-600">当前展区暂无展品，欢迎继续探索其他展区</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
