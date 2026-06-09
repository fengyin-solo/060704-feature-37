<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, computed } from 'vue'
import type { ArchivedDiary } from '@/types'
import { STATE_NAMES, STATE_COLORS, ARCHIVE_REASON_NAMES } from '@/types'
import { renderPipeline } from '@/engine/RenderPipeline'
import { globalTimeline } from '@/engine/Timeline'
import { pluginLoader } from '@/engine/PluginLoader'
import { useUserStore } from '@/stores/user'

interface Props {
  archivedDiary: ArchivedDiary
  selected?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'select', archivedId: string): void
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const isHovered = ref(false)
const userStore = useUserStore()

const diary = computed(() => props.archivedDiary.diary)

const stateColor = computed(() => STATE_COLORS[diary.value.state])
const stateName = computed(() => STATE_NAMES[diary.value.state])
const archiveReasonName = computed(() => ARCHIVE_REASON_NAMES[props.archivedDiary.archiveReason])

const diaryType = computed(() => {
  return pluginLoader.getDiaryType(diary.value.type)
})

const owner = computed(() => {
  return userStore.getUserById(diary.value.ownerId)
})

const cardClass = computed(() => {
  return [
    'archive-card',
    {
      'selected': props.selected
    }
  ]
})

function render() {
  if (!canvasRef.value) return
  
  const ctx = canvasRef.value.getContext('2d')
  if (!ctx) return
  
  const decayRate = diaryType.value?.decayRate || 1
  renderPipeline.render(diary.value, ctx, undefined, decayRate)
}

let renderInterval: number | null = null

onMounted(() => {
  render()
  renderInterval = window.setInterval(render, 1000)
})

onUnmounted(() => {
  if (renderInterval) {
    clearInterval(renderInterval)
  }
})

watch(() => props.archivedDiary, () => {
  render()
}, { deep: true })

function handleClick() {
  emit('select', props.archivedDiary.id)
}

function formatTime(timestamp: number | null): string {
  if (timestamp === null) return '无'
  return `#${Math.floor(timestamp)}`
}
</script>

<template>
  <div 
    :class="cardClass"
    class="rounded-lg cursor-pointer transition-all"
    :style="{ 
      borderColor: selected ? '#ffd700' : (diary.frozen ? '#00d4ff' : stateColor) 
    }"
    @click="handleClick"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div class="relative">
      <canvas 
        ref="canvasRef"
        width="320"
        height="180"
        class="w-full h-40 block"
      ></canvas>
      
      <div 
        class="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-vt323"
        :class="archivedDiary.archiveReason === 'dead' ? 'text-diary-dying' : 'text-diary-rotted'"
      >
        {{ archiveReasonName }}
      </div>
      
      <div 
        v-if="diary.frozen"
        class="absolute top-2 right-2 bg-diary-frozen/80 text-white px-2 py-1 rounded text-xs font-vt323"
      >
        ❄️
      </div>
      
      <div 
        v-if="archivedDiary.repairCount > 0"
        class="absolute bottom-2 right-2 bg-diary-gold/80 text-black px-2 py-1 rounded text-xs font-vt323"
      >
        🛠️ x{{ archivedDiary.repairCount }}
      </div>
    </div>
    
    <div class="p-3">
      <div class="flex items-center justify-between mb-2">
        <h3 
          class="font-vt323 text-base truncate flex-1"
          :style="{ color: isHovered || selected ? '#ffd700' : '#fff' }"
        >
          {{ diary.title }}
        </h3>
        <span 
          class="state-indicator ml-2 whitespace-nowrap text-xs"
          :style="{ color: stateColor, borderColor: stateColor }"
        >
          {{ stateName }}
        </span>
      </div>
      
      <div class="space-y-1 text-xs text-gray-500 font-vt323">
        <div class="flex justify-between">
          <span>主人:</span>
          <span>{{ owner?.name || '未知' }}</span>
        </div>
        <div class="flex justify-between">
          <span>类型:</span>
          <span>{{ diaryType?.name || '未知' }}</span>
        </div>
        <div class="flex justify-between">
          <span>封存时间:</span>
          <span>{{ formatTime(archivedDiary.archivedAt) }}</span>
        </div>
        <div v-if="archivedDiary.lastRepairAt" class="flex justify-between">
          <span>最近修复:</span>
          <span class="text-diary-gold">{{ formatTime(archivedDiary.lastRepairAt) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.archive-card {
  @apply bg-gray-900/60 border-2;
  opacity: 0.85;
}

.archive-card:hover,
.archive-card.selected {
  opacity: 1;
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(255, 215, 0, 0.2);
}

.archive-card.selected {
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
}
</style>
