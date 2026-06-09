<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Exhibit } from '@/types'
import { STATE_NAMES, STATE_COLORS } from '@/types'
import { renderPipeline } from '@/engine/RenderPipeline'
import { globalTimeline } from '@/engine/Timeline'
import { pluginLoader } from '@/engine/PluginLoader'
import { StateMachine } from '@/engine/StateMachine'

interface Props {
  exhibit: Exhibit
}

const props = defineProps<Props>()
const router = useRouter()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const isHovered = ref(false)
const stateMachine = new StateMachine()

const stateColor = computed(() => STATE_COLORS[props.exhibit.diary.state])
const stateName = computed(() => STATE_NAMES[props.exhibit.diary.state])

const diaryType = computed(() => {
  return pluginLoader.getDiaryType(props.exhibit.diary.type)
})

const cardClass = computed(() => {
  return [
    'exhibit-card',
    {
      'frozen': props.exhibit.diary.frozen,
      'dead': props.exhibit.diary.state === 'dead'
    }
  ]
})

function render() {
  if (!canvasRef.value) return
  
  const ctx = canvasRef.value.getContext('2d')
  if (!ctx) return
  
  const decayRate = diaryType.value?.decayRate || 1
  renderPipeline.render(props.exhibit.diary, ctx, undefined, decayRate)
}

let unsubscribe: (() => void) | null = null
let renderInterval: number | null = null

onMounted(() => {
  if (diaryType.value) {
    stateMachine.addTransitions(diaryType.value.transitions)
  }
  
  render()
  
  unsubscribe = globalTimeline.subscribe(() => {
    if (!props.exhibit.diary.frozen) {
      render()
    }
  })
  
  renderInterval = window.setInterval(render, 500)
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
  if (renderInterval) {
    clearInterval(renderInterval)
  }
})

watch(() => props.exhibit, () => {
  render()
}, { deep: true })

function goToDetail(e: Event) {
  e.stopPropagation()
  router.push(`/diary/${props.exhibit.diary.id}`)
}

function visitAuthor(e: Event) {
  e.stopPropagation()
  router.push(`/visit/${props.exhibit.authorId}`)
}
</script>

<template>
  <div 
    :class="cardClass"
    class="rounded-lg cursor-pointer bg-gray-900/50"
    :style="{ borderColor: exhibit.diary.frozen ? '#00d4ff' : stateColor }"
    @click="goToDetail"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div class="relative">
      <canvas 
        ref="canvasRef"
        width="320"
        height="200"
        class="w-full h-48 block"
      ></canvas>
      
      <div 
        v-if="exhibit.diary.frozen"
        class="absolute top-2 right-2 bg-diary-frozen/80 text-white px-2 py-1 rounded text-xs font-vt323"
      >
        ❄️ 已冻结
      </div>
      
      <div 
        v-if="exhibit.diary.state === 'dead'"
        class="absolute inset-0 flex items-center justify-center bg-black/50"
      >
        <span class="text-4xl">🪦</span>
      </div>

      <div 
        class="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs font-vt323 flex items-center gap-1 cursor-pointer hover:bg-black/80 transition-colors"
        @click="visitAuthor"
      >
        <span>👤</span>
        <span class="text-diary-fresh">{{ exhibit.authorName }}</span>
        <span class="text-gray-400 ml-1">→</span>
      </div>
    </div>
    
    <div class="p-3">
      <div class="flex items-center justify-between mb-2">
        <h3 
          class="font-vt323 text-lg truncate flex-1"
          :style="{ color: isHovered ? stateColor : '#fff' }"
        >
          {{ exhibit.diary.title }}
        </h3>
        <span 
          class="state-indicator ml-2 whitespace-nowrap"
          :style="{ color: stateColor, borderColor: stateColor }"
        >
          {{ stateName }}
        </span>
      </div>
      
      <div class="flex items-center justify-between text-xs text-gray-500">
        <span class="font-vt323">
          {{ diaryType?.name || '未知类型' }}
        </span>
        <span class="font-vt323">
          管线: {{ exhibit.diary.pipeline.filter(p => p.enabled).length }} 种
        </span>
      </div>
      
      <div class="mt-2 pt-2 border-t border-gray-800">
        <button
          class="w-full btn-pixel text-diary-fresh border-diary-fresh text-xs opacity-70 hover:opacity-100 transition-opacity"
          @click.stop="visitAuthor"
        >
          🏠 参观 {{ exhibit.authorName }} 的日记墙
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.exhibit-card {
  @apply border-2 transition-all duration-300;
}

.exhibit-card:hover {
  @apply transform -translate-y-1 shadow-lg;
  box-shadow: 0 0 20px rgba(57, 255, 20, 0.3);
}
</style>
