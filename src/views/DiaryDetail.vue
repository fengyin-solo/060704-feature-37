<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDiary } from '@/composables/useDiary'
import { useItems } from '@/composables/useItems'
import { useDiaryStore } from '@/stores/diary'
import { pluginLoader } from '@/engine/PluginLoader'
import { globalTimeline } from '@/engine/Timeline'
import { STATE_ORDER, STATE_COLORS } from '@/types'
import type { Item, DiarySchedule } from '@/types'

const route = useRoute()
const router = useRouter()
const diaryStore = useDiaryStore()

const diaryId = computed(() => route.params.id as string)

const {
  currentDiary,
  decayLevel,
  stateName,
  stateColor,
  diaryType,
  isOwner,
  isDead,
  isFrozen,
  isScheduled,
  scheduleStatus,
  renderToCanvas,
  toggleFreeze,
  rewindState,
  updateSchedule
} = useDiary(diaryId.value)

const { itemsByRarity, useItem } = useItems()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const showItemSelector = ref(false)
const showDeleteConfirm = ref(false)
const showScheduleEditor = ref(false)
const itemTargetDiaryId = ref<string | null>(null)
const previewTime = ref<number | null>(null)

const editPublishAt = ref(false)
const editDecayStartAt = ref(false)
const editAutoArchiveAt = ref(false)
const publishAtOffset = ref(0)
const decayStartAtOffset = ref(0)
const autoArchiveAtOffset = ref(0)

const stateProgress = computed(() => {
  if (!currentDiary.value) return 0
  const currentIndex = STATE_ORDER.indexOf(currentDiary.value.state)
  return (currentIndex / (STATE_ORDER.length - 1)) * 100
})

const availableItems = computed(() => {
  const items: { item: Item; count: number }[] = []
  Object.values(itemsByRarity.value).forEach(rarityItems => {
    rarityItems.forEach(({ item, count }) => {
      if (currentDiary.value && item.targetTypes.includes(currentDiary.value.type)) {
        items.push({ item, count })
      }
    })
  })
  return items
})

const hasSchedule = computed(() => {
  if (!currentDiary.value) return false
  return currentDiary.value.schedule.publishAt !== null || 
         currentDiary.value.schedule.decayStartAt !== null || 
         currentDiary.value.schedule.autoArchiveAt !== null
})

function openScheduleEditor() {
  if (!currentDiary.value) return
  
  const now = globalTimeline.getTime()
  editPublishAt.value = currentDiary.value.schedule.publishAt !== null
  editDecayStartAt.value = currentDiary.value.schedule.decayStartAt !== null
  editAutoArchiveAt.value = currentDiary.value.schedule.autoArchiveAt !== null
  
  publishAtOffset.value = currentDiary.value.schedule.publishAt 
    ? currentDiary.value.schedule.publishAt - now
    : 100
  
  decayStartAtOffset.value = currentDiary.value.schedule.decayStartAt
    ? currentDiary.value.schedule.decayStartAt - now
    : 50
  
  autoArchiveAtOffset.value = currentDiary.value.schedule.autoArchiveAt
    ? currentDiary.value.schedule.autoArchiveAt - now
    : 500
  
  showScheduleEditor.value = true
}

function saveSchedule() {
  if (!currentDiary.value) return
  
  const now = globalTimeline.getTime()
  const schedule: Partial<DiarySchedule> = {}
  
  if (editPublishAt.value) {
    schedule.publishAt = now + publishAtOffset.value
  } else {
    schedule.publishAt = null
  }
  
  if (editDecayStartAt.value) {
    schedule.decayStartAt = now + decayStartAtOffset.value
  } else {
    schedule.decayStartAt = null
  }
  
  if (editAutoArchiveAt.value) {
    schedule.autoArchiveAt = now + autoArchiveAtOffset.value
  } else {
    schedule.autoArchiveAt = null
  }
  
  updateSchedule(schedule)
  showScheduleEditor.value = false
}

function render() {
  if (!canvasRef.value || !currentDiary.value) return
  
  if (isScheduled.value) {
    const ctx = canvasRef.value.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height)
      
      ctx.fillStyle = '#60a5fa'
      ctx.font = '80px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('⏰', canvasRef.value.width / 2, canvasRef.value.height / 2 - 40)
      
      ctx.fillStyle = '#94a3b8'
      ctx.font = '20px monospace'
      ctx.fillText('日记尚未发布', canvasRef.value.width / 2, canvasRef.value.height / 2 + 20)
      
      if (scheduleStatus.value && scheduleStatus.value.timeToPublish > 0) {
        ctx.fillStyle = '#60a5fa'
        ctx.font = '16px monospace'
        ctx.fillText(`距离发布还有 ${Math.floor(scheduleStatus.value.timeToPublish)} 时间单位`, canvasRef.value.width / 2, canvasRef.value.height / 2 + 60)
      }
    }
    return
  }
  
  renderToCanvas(canvasRef.value, previewTime.value ?? undefined)
}

let renderInterval: number | null = null

onMounted(() => {
  render()
  renderInterval = window.setInterval(render, 500)
})

watch(() => currentDiary.value, () => {
  render()
}, { deep: true })

watch([previewTime, diaryId], () => {
  render()
})

function handleRewind() {
  if (!currentDiary.value) return
  rewindState()
}

function handleUseItem(itemId: string) {
  if (!currentDiary.value) return
  const success = useItem(itemId, currentDiary.value.id)
  if (success) {
    showItemSelector.value = false
  }
}

function goToPipelineEditor() {
  router.push(`/pipeline/${diaryId.value}`)
}

function goBack() {
  router.back()
}

function handleTimePreview(time: number | null) {
  previewTime.value = time
}

function handleDelete() {
  if (!currentDiary.value) return
  diaryStore.deleteDiary(currentDiary.value.id)
  showDeleteConfirm.value = false
  router.push('/archive')
}

function formatTime(offset: number): string {
  if (offset < 100) return `${offset} 单位`
  if (offset < 1000) return `${(offset / 100).toFixed(1)} 百单位`
  return `${(offset / 1000).toFixed(1)} 千单位`
}
</script>

<template>
  <div class="space-y-6" v-if="currentDiary">
    <div class="flex items-center justify-between">
      <button
        class="btn-pixel text-gray-400 border-gray-600 text-sm"
        @click="goBack"
      >
        ← 返回
      </button>
      
      <div class="flex items-center gap-2" v-if="isOwner">
        <button
          v-if="!isDead"
          class="btn-pixel text-diary-fresh border-diary-fresh text-sm"
          @click="goToPipelineEditor"
        >
          ⚙️ 编辑管线
        </button>
        <button
          v-if="!isDead"
          class="btn-pixel text-blue-400 border-blue-400 text-sm"
          @click="openScheduleEditor"
        >
          ⏰ {{ hasSchedule ? '编辑定时' : '设置定时' }}
        </button>
        <button
          v-if="!isDead && !isScheduled"
          class="btn-pixel text-sm"
          :class="isFrozen ? 'text-diary-frozen border-diary-frozen' : 'text-gray-400 border-gray-600'"
          @click="toggleFreeze"
        >
          {{ isFrozen ? '❄️ 已冻结' : '🥶 冻结' }}
        </button>
        <button
          v-if="isDead"
          class="btn-pixel text-diary-dying border-diary-dying text-sm"
          @click="handleRewind"
        >
          🔄 捞回
        </button>
        <button
          v-if="!isDead && !isScheduled"
          class="btn-pixel text-diary-rotted border-diary-rotted text-sm"
          @click="handleRewind"
        >
          ⏪ 回退
        </button>
        <button
          class="btn-pixel text-diary-gold border-diary-gold text-sm"
          :disabled="!availableItems.length"
          @click="showItemSelector = true"
        >
          🎒 {{ isDead ? '🛠️ 维修' : '使用道具' }}
        </button>
        <button
          class="btn-pixel text-red-500 border-red-500 text-sm"
          @click="showDeleteConfirm = true"
        >
          🗑️ 移入档案馆
        </button>
      </div>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2">
        <div class="crt-container rounded-lg overflow-hidden border-2" :style="{ borderColor: stateColor }">
          <canvas
            ref="canvasRef"
            width="800"
            height="500"
            class="w-full h-auto block"
          ></canvas>
        </div>
        
        <div v-if="isOwner && !isScheduled" class="mt-4">
          <label class="block font-vt323 text-gray-400 mb-2 text-sm">
            {{ isDead ? '时间回溯: 拖动滑块查看过去的状态' : '时间预览: 拖动滑块查看过去或未来的状态' }}
          </label>
          <input
            type="range"
            :min="currentDiary.createdAt - 200"
            :max="isDead ? currentDiary.createdAt + 1000 : currentDiary.createdAt + 2000"
            :value="previewTime ?? currentDiary.createdAt"
            class="w-full accent-diary-fresh"
            @input="handleTimePreview(Number(($event.target as HTMLInputElement).value))"
            @mouseup="handleTimePreview(null)"
            @touchend="handleTimePreview(null)"
          />
          <div class="flex justify-between text-xs text-gray-500 font-vt323 mt-1">
            <span>过去</span>
            <span>{{ previewTime ? `预览时间: ${Math.floor(previewTime)}` : '当前时间' }}</span>
            <span>{{ isDead ? '死亡时间' : '未来' }}</span>
          </div>
        </div>
      </div>
      
      <div class="space-y-4">
        <div class="bg-gray-900/80 rounded-lg p-4 border border-gray-800">
          <h2 class="font-vt323 text-2xl mb-2">{{ currentDiary.title }}</h2>
          
          <div class="flex items-center gap-2 mb-4">
            <span 
              class="state-indicator"
              :style="{ color: stateColor, borderColor: stateColor }"
            >
              {{ stateName }}
            </span>
            <span 
              v-if="isFrozen"
              class="px-2 py-1 rounded text-xs font-vt323 bg-diary-frozen/20 text-diary-frozen border border-diary-frozen"
            >
              ❄️ 已冻结
            </span>
          </div>
          
          <div class="mb-4">
            <div class="flex justify-between text-xs font-vt323 text-gray-500 mb-1">
              <span>状态进度</span>
              <span>{{ Math.floor(stateProgress) }}%</span>
            </div>
            <div class="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div 
                class="h-full transition-all duration-500"
                :style="{ width: `${stateProgress}%`, backgroundColor: stateColor }"
              ></div>
            </div>
            <div class="flex justify-between mt-1">
              <span 
                v-for="state in STATE_ORDER" 
                :key="state"
                class="text-xs font-vt323"
                :style="{ 
                  color: STATE_ORDER.indexOf(state) <= STATE_ORDER.indexOf(currentDiary.state) 
                    ? STATE_COLORS[state] 
                    : '#666' 
                }"
              >
                ●
              </span>
            </div>
          </div>
          
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500 font-vt323">类型:</span>
              <span class="font-vt323">{{ diaryType?.name || '未知' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 font-vt323">衰变率:</span>
              <span class="font-vt323">x{{ diaryType?.decayRate || 1 }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 font-vt323">创建时间:</span>
              <span class="font-vt323">{{ Math.floor(currentDiary.createdAt) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 font-vt323">衰变等级:</span>
              <span class="font-vt323">{{ Math.floor(decayLevel * 100) }}%</span>
            </div>
          </div>
          
          <div v-if="hasSchedule" class="mt-4 pt-4 border-t border-gray-700">
            <h4 class="font-vt323 text-blue-400 mb-3 text-sm">⏰ 定时设置</h4>
            <div class="space-y-2 text-sm">
              <div v-if="currentDiary.schedule.publishAt" class="flex justify-between items-center">
                <span class="text-gray-500 font-vt323">📅 公开时间:</span>
                <span 
                  class="font-vt323"
                  :class="scheduleStatus?.isPublished ? 'text-green-400' : 'text-blue-400'"
                >
                  {{ scheduleStatus?.isPublished ? '✓ 已公开' : `+${Math.floor(scheduleStatus?.timeToPublish || 0)}` }}
                </span>
              </div>
              <div v-if="currentDiary.schedule.decayStartAt" class="flex justify-between items-center">
                <span class="text-gray-500 font-vt323">⏳ 开始腐烂:</span>
                <span 
                  class="font-vt323"
                  :class="scheduleStatus?.isDecaying ? 'text-green-400' : 'text-orange-400'"
                >
                  {{ scheduleStatus?.isDecaying ? '✓ 已开始' : `+${Math.floor(scheduleStatus?.timeToDecay || 0)}` }}
                </span>
              </div>
              <div v-if="currentDiary.schedule.autoArchiveAt" class="flex justify-between items-center">
                <span class="text-gray-500 font-vt323">📦 自动撤回:</span>
                <span class="font-vt323 text-purple-400">
                  +{{ Math.floor(scheduleStatus?.timeToArchive || 0) }}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="bg-gray-900/80 rounded-lg p-4 border border-gray-800">
          <h3 class="font-vt323 text-lg text-diary-fresh mb-3">
            🧪 渲染管线 ({{ currentDiary.pipeline.filter(p => p.enabled).length }})
          </h3>
          
          <div v-if="currentDiary.pipeline.length === 0" class="text-gray-500 text-sm font-vt323">
            没有应用任何烂法
          </div>
          
          <div v-else class="space-y-2">
            <div
              v-for="(step, index) in [...currentDiary.pipeline].sort((a, b) => a.order - b.order)"
              :key="step.methodId"
              class="flex items-center gap-2 p-2 rounded bg-gray-800/50"
              :class="{ 'opacity-50': !step.enabled }"
            >
              <span class="text-gray-500 font-vt323 text-xs w-6">
                {{ index + 1 }}
              </span>
              <span class="text-sm flex-1">
                {{ pluginLoader.getDecayMethods().get(step.methodId)?.name || step.methodId }}
              </span>
              <span 
                class="w-2 h-2 rounded-full"
                :class="step.enabled ? 'bg-diary-fresh' : 'bg-gray-600'"
              ></span>
            </div>
          </div>
        </div>
        
        <div v-if="isOwner && !isDead && !isScheduled" class="space-y-2">
          <button
            class="w-full btn-pixel text-diary-rotting border-diary-rotting"
            :disabled="currentDiary.state === 'fresh'"
            @click="handleRewind"
          >
            🔄 捞一下 (回退状态)
          </button>
        </div>
      </div>
    </div>
    
    <div v-if="showItemSelector" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div class="bg-gray-900 rounded-lg border-2 border-diary-gold w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-vt323 text-xl text-diary-gold glow-text">
              🎒 选择道具
            </h3>
            <button
              class="text-gray-400 hover:text-white text-xl"
              @click="showItemSelector = false"
            >
              ✕
            </button>
          </div>
          
          <div v-if="availableItems.length === 0" class="text-center py-8">
            <p class="text-gray-500 font-vt323">
              没有可用的道具
            </p>
          </div>
          
          <div v-else class="space-y-2">
            <div
              v-for="{ item, count } in availableItems"
              :key="item.id"
              class="flex items-center justify-between p-3 rounded border-2 cursor-pointer transition-all hover:bg-gray-800/50"
              :class="`item-card ${item.rarity}`"
              @click="handleUseItem(item.id)"
            >
              <div class="flex items-center gap-3">
                <span class="text-2xl">{{ item.icon }}</span>
                <div>
                  <div class="font-vt323">{{ item.name }}</div>
                  <div class="text-xs text-gray-500">{{ item.description }}</div>
                </div>
              </div>
              <div class="text-right">
                <div class="font-vt323 text-lg">x{{ count }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div class="bg-gray-900 rounded-lg border-2 border-red-500 w-full max-w-md">
        <div class="p-6">
          <h3 class="font-vt323 text-xl text-red-500 mb-4">
            🗑️ 确认移入档案馆
          </h3>
          <p class="text-gray-300 font-vt323 mb-6">
            确定要将「{{ currentDiary?.title }}」移入旧档案馆吗？<br/>
            日记将被标记为「用户删除」并存档，你可以随时在旧档案馆中查看或恢复。
          </p>
          <div class="flex gap-3">
            <button
              class="flex-1 btn-pixel text-gray-400 border-gray-600"
              @click="showDeleteConfirm = false"
            >
              取消
            </button>
            <button
              class="flex-1 btn-pixel text-red-500 border-red-500"
              @click="handleDelete"
            >
              确认移入
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showScheduleEditor" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div class="bg-gray-900 rounded-lg border-2 border-blue-500 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="font-vt323 text-xl text-blue-400 glow-text">
              ⏰ 定时发布设置
            </h3>
            <button
              class="text-gray-400 hover:text-white text-xl"
              @click="showScheduleEditor = false"
            >
              ✕
            </button>
          </div>
          
          <p class="text-gray-400 text-sm font-vt323 mb-6">
            设置日记的生命周期时间线，让它按设定的时间自动完成发布、展示与归档。
          </p>
          
          <div class="space-y-4">
            <div class="flex items-center gap-4">
              <label class="flex items-center gap-2 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  v-model="editPublishAt"
                  class="w-4 h-4 accent-blue-500"
                />
                <span class="font-vt323 text-blue-400">📅 预约公开时间</span>
              </label>
              <div v-if="editPublishAt" class="flex items-center gap-2">
                <input
                  type="range"
                  v-model.number="publishAtOffset"
                  :min="10"
                  :max="500"
                  class="w-32 accent-blue-500"
                />
                <span class="font-vt323 text-sm text-gray-300 w-24">
                  +{{ formatTime(publishAtOffset) }}
                </span>
              </div>
            </div>
            <p v-if="editPublishAt" class="text-gray-500 text-xs font-vt323 ml-6">
              在此时间之前，日记仅你自己可见，显示为「待发布」状态
            </p>
            
            <div class="flex items-center gap-4">
              <label class="flex items-center gap-2 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  v-model="editDecayStartAt"
                  class="w-4 h-4 accent-orange-500"
                />
                <span class="font-vt323 text-orange-400">⏳ 预约开始腐烂</span>
              </label>
              <div v-if="editDecayStartAt" class="flex items-center gap-2">
                <input
                  type="range"
                  v-model.number="decayStartAtOffset"
                  :min="10"
                  :max="500"
                  class="w-32 accent-orange-500"
                />
                <span class="font-vt323 text-sm text-gray-300 w-24">
                  +{{ formatTime(decayStartAtOffset) }}
                </span>
              </div>
            </div>
            <p v-if="editDecayStartAt" class="text-gray-500 text-xs font-vt323 ml-6">
              在此时间之前，日记保持「新鲜」状态，不会开始腐烂
            </p>
            
            <div class="flex items-center gap-4">
              <label class="flex items-center gap-2 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  v-model="editAutoArchiveAt"
                  class="w-4 h-4 accent-purple-500"
                />
                <span class="font-vt323 text-purple-400">📦 预约自动撤回</span>
              </label>
              <div v-if="editAutoArchiveAt" class="flex items-center gap-2">
                <input
                  type="range"
                  v-model.number="autoArchiveAtOffset"
                  :min="100"
                  :max="2000"
                  class="w-32 accent-purple-500"
                />
                <span class="font-vt323 text-sm text-gray-300 w-24">
                  +{{ formatTime(autoArchiveAtOffset) }}
                </span>
              </div>
            </div>
            <p v-if="editAutoArchiveAt" class="text-gray-500 text-xs font-vt323 ml-6">
              到达此时间后，日记将自动撤回并存档，原因标记为「定时撤回」
            </p>
          </div>
          
          <div v-if="editPublishAt || editDecayStartAt || editAutoArchiveAt" class="mt-6 p-3 bg-gray-800/50 rounded border border-gray-700">
            <p class="font-vt323 text-diary-fresh text-sm mb-2">📊 生命周期预览：</p>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2 py-1 rounded text-xs font-vt323 bg-blue-500/20 text-blue-400 border border-blue-500/50">
                创建
              </span>
              <template v-if="editPublishAt">
                <span class="text-gray-600">→</span>
                <span class="px-2 py-1 rounded text-xs font-vt323 bg-blue-500/20 text-blue-400 border border-blue-500/50">
                  待发布 (+{{ publishAtOffset }})
                </span>
              </template>
              <span class="text-gray-600">→</span>
              <span class="px-2 py-1 rounded text-xs font-vt323 bg-green-500/20 text-green-400 border border-green-500/50">
                公开发布
              </span>
              <template v-if="editDecayStartAt">
                <span class="text-gray-600">→</span>
                <span class="px-2 py-1 rounded text-xs font-vt323 bg-orange-500/20 text-orange-400 border border-orange-500/50">
                  开始腐烂 (+{{ decayStartAtOffset }})
                </span>
              </template>
              <span class="text-gray-600">→</span>
              <span class="px-2 py-1 rounded text-xs font-vt323 bg-red-500/20 text-red-400 border border-red-500/50">
                自然死亡
              </span>
              <template v-if="editAutoArchiveAt">
                <span class="text-gray-600">→</span>
                <span class="px-2 py-1 rounded text-xs font-vt323 bg-purple-500/20 text-purple-400 border border-purple-500/50">
                  自动撤回 (+{{ autoArchiveAtOffset }})
                </span>
              </template>
            </div>
          </div>
          
          <div class="ascii-divider text-center my-6">
            ----------------------------------------------------------------
          </div>
          
          <div class="flex gap-3 justify-end">
            <button
              class="btn-pixel text-gray-400 border-gray-600"
              @click="showScheduleEditor = false"
            >
              取消
            </button>
            <button
              class="btn-pixel text-blue-400 border-blue-400"
              @click="saveSchedule"
            >
              💾 保存设置
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
