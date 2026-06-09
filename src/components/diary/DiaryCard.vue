<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Diary } from '@/types'
import { STATE_NAMES, STATE_COLORS, DiaryState } from '@/types'
import { renderPipeline } from '@/engine/RenderPipeline'
import { globalTimeline } from '@/engine/Timeline'
import { pluginLoader } from '@/engine/PluginLoader'
import { StateMachine } from '@/engine/StateMachine'
import { useDiaryStore } from '@/stores/diary'

interface Props {
  diary: Diary
  isOwner: boolean
}

const props = defineProps<Props>()
const router = useRouter()
const diaryStore = useDiaryStore()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const isHovered = ref(false)
const showDeleteConfirm = ref(false)
const stateMachine = new StateMachine()

const scheduleStatus = computed(() => {
  return diaryStore.getDiaryScheduleStatus(props.diary)
})

const hasSchedule = computed(() => {
  return props.diary.schedule.publishAt !== null || 
         props.diary.schedule.decayStartAt !== null || 
         props.diary.schedule.autoArchiveAt !== null
})

const stateColor = computed(() => STATE_COLORS[props.diary.state])
const stateName = computed(() => STATE_NAMES[props.diary.state])

const diaryType = computed(() => {
  return pluginLoader.getDiaryType(props.diary.type)
})

const cardClass = computed(() => {
  return [
    'diary-card',
    {
      'frozen': props.diary.frozen,
      'dead': props.diary.state === 'dead',
      'scheduled': props.diary.state === DiaryState.SCHEDULED
    }
  ]
})

function render() {
  if (!canvasRef.value) return
  
  const ctx = canvasRef.value.getContext('2d')
  if (!ctx) return
  
  if (props.diary.state === DiaryState.SCHEDULED) {
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height)
    
    ctx.fillStyle = '#60a5fa'
    ctx.font = '48px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('⏰', canvasRef.value.width / 2, canvasRef.value.height / 2 - 20)
    
    ctx.fillStyle = '#94a3b8'
    ctx.font = '14px monospace'
    ctx.fillText('待发布', canvasRef.value.width / 2, canvasRef.value.height / 2 + 30)
    
    if (scheduleStatus.value.timeToPublish > 0) {
      ctx.fillStyle = '#60a5fa'
      ctx.font = '12px monospace'
      ctx.fillText(`+${Math.floor(scheduleStatus.value.timeToPublish)}`, canvasRef.value.width / 2, canvasRef.value.height / 2 + 50)
    }
    return
  }
  
  const decayRate = diaryType.value?.decayRate || 1
  renderPipeline.render(props.diary, ctx, undefined, decayRate)
}

let unsubscribe: (() => void) | null = null
let renderInterval: number | null = null

onMounted(() => {
  if (diaryType.value) {
    stateMachine.addTransitions(diaryType.value.transitions)
  }
  
  render()
  
  unsubscribe = globalTimeline.subscribe(() => {
    if (!props.diary.frozen) {
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

watch(() => props.diary, () => {
  render()
}, { deep: true })

function goToDetail() {
  router.push(`/diary/${props.diary.id}`)
}

function handleDelete(e: Event) {
  e.stopPropagation()
  diaryStore.deleteDiary(props.diary.id)
  showDeleteConfirm.value = false
}

function openDeleteConfirm(e: Event) {
  e.stopPropagation()
  showDeleteConfirm.value = true
}

function closeDeleteConfirm(e: Event) {
  e.stopPropagation()
  showDeleteConfirm.value = false
}
</script>

<template>
  <div 
    :class="cardClass"
    class="rounded-lg cursor-pointer"
    :style="{ borderColor: diary.frozen ? '#00d4ff' : stateColor }"
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
        v-if="diary.state === 'scheduled'"
        class="absolute top-2 right-2 bg-blue-500/80 text-white px-2 py-1 rounded text-xs font-vt323"
      >
        ⏰ 待发布
      </div>
      
      <div 
        v-if="diary.frozen"
        class="absolute top-2 right-2 bg-diary-frozen/80 text-white px-2 py-1 rounded text-xs font-vt323"
        :class="{ 'right-16': diary.state === 'scheduled' }"
      >
        ❄️ 已冻结
      </div>
      
      <div 
        v-if="diary.state === 'dead'"
        class="absolute inset-0 flex items-center justify-center bg-black/50"
      >
        <span class="text-4xl">🪦</span>
      </div>
      
      <div 
        v-if="hasSchedule && diary.state !== 'scheduled'"
        class="absolute bottom-2 left-2 right-2 flex items-center gap-1 flex-wrap"
      >
        <span 
          v-if="diary.schedule.publishAt"
          class="px-1.5 py-0.5 rounded text-xs font-vt323 bg-blue-500/30 text-blue-300 border border-blue-500/30"
          :class="{ 'opacity-50': scheduleStatus.isPublished }"
        >
          📅{{ scheduleStatus.isPublished ? '✓' : `+${Math.floor(scheduleStatus.timeToPublish)}` }}
        </span>
        <span 
          v-if="diary.schedule.decayStartAt"
          class="px-1.5 py-0.5 rounded text-xs font-vt323 bg-orange-500/30 text-orange-300 border border-orange-500/30"
          :class="{ 'opacity-50': scheduleStatus.isDecaying }"
        >
          ⏳{{ scheduleStatus.isDecaying ? '✓' : `+${Math.floor(scheduleStatus.timeToDecay)}` }}
        </span>
        <span 
          v-if="diary.schedule.autoArchiveAt"
          class="px-1.5 py-0.5 rounded text-xs font-vt323 bg-purple-500/30 text-purple-300 border border-purple-500/30"
        >
          📦+{{ Math.floor(scheduleStatus.timeToArchive) }}
        </span>
      </div>
    </div>
    
    <div class="p-3">
      <div class="flex items-center justify-between mb-2">
        <h3 
          class="font-vt323 text-lg truncate flex-1"
          :style="{ color: isHovered ? stateColor : '#fff' }"
        >
          {{ diary.title }}
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
          管线: {{ diary.pipeline.filter(p => p.enabled).length }} 种
        </span>
      </div>
      
      <div v-if="isOwner" class="mt-2 pt-2 border-t border-gray-800">
        <button
          class="w-full btn-pixel text-red-500 border-red-500 text-xs opacity-60 hover:opacity-100 transition-opacity"
          @click.stop="openDeleteConfirm"
        >
          🗑️ 移入档案馆
        </button>
      </div>
    </div>

    <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" @click.stop="closeDeleteConfirm">
      <div class="bg-gray-900 rounded-lg border-2 border-red-500 w-full max-w-sm" @click.stop>
        <div class="p-6">
          <h3 class="font-vt323 text-xl text-red-500 mb-4">
            🗑️ 确认移入档案馆
          </h3>
          <p class="text-gray-300 font-vt323 mb-6 text-sm">
            确定要将「{{ diary.title }}」移入旧档案馆吗？<br/>
            日记将被标记为「用户删除」并存档，你可以随时在旧档案馆中查看或恢复。
          </p>
          <div class="flex gap-3">
            <button
              class="flex-1 btn-pixel text-gray-400 border-gray-600 text-sm"
              @click.stop="closeDeleteConfirm"
            >
              取消
            </button>
            <button
              class="flex-1 btn-pixel text-red-500 border-red-500 text-sm"
              @click.stop="handleDelete"
            >
              确认移入
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
