<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useDiaryStore } from '@/stores/diary'
import { pluginLoader } from '@/engine/PluginLoader'
import { renderPipeline } from '@/engine/RenderPipeline'
import { globalTimeline } from '@/engine/Timeline'
import type { PipelineStep, DiaryType, DiarySchedule } from '@/types'

const emit = defineEmits<{
  close: []
  created: []
}>()

const userStore = useUserStore()
const diaryStore = useDiaryStore()

const title = ref('')
const content = ref('')
const selectedType = ref('base')
const selectedMethods = ref<string[]>(['blur', 'chroma'])
const isCreating = ref(false)
const showSchedule = ref(false)

const enablePublishAt = ref(false)
const enableDecayStartAt = ref(false)
const enableAutoArchiveAt = ref(false)

const publishAtOffset = ref(100)
const decayStartAtOffset = ref(50)
const autoArchiveAtOffset = ref(500)

const diaryTypes = ref<[string, DiaryType][]>([])
const decayMethods = computed(() => Array.from(pluginLoader.getDecayMethods().entries()))

onMounted(async () => {
  await pluginLoader.loadAll()
  diaryTypes.value = Array.from(pluginLoader.getDiaryTypes().entries())
})

const canCreate = computed(() => {
  return title.value.trim() && content.value.trim()
})

const schedulePreview = computed(() => {
  const result: string[] = []
  
  if (enablePublishAt.value) {
    result.push(`发布: +${publishAtOffset.value}`)
  }
  if (enableDecayStartAt.value) {
    result.push(`开始腐烂: +${decayStartAtOffset.value}`)
  }
  if (enableAutoArchiveAt.value) {
    result.push(`撤回: +${autoArchiveAtOffset.value}`)
  }
  
  return result.length > 0 ? result.join(' → ') : '无定时'
})

function getSchedule(): Partial<DiarySchedule> {
  const now = globalTimeline.getTime()
  const schedule: Partial<DiarySchedule> = {}
  
  if (enablePublishAt.value) {
    schedule.publishAt = now + publishAtOffset.value
  }
  if (enableDecayStartAt.value) {
    schedule.decayStartAt = now + decayStartAtOffset.value
  }
  if (enableAutoArchiveAt.value) {
    schedule.autoArchiveAt = now + autoArchiveAtOffset.value
  }
  
  return schedule
}

async function handleCreate() {
  if (!canCreate.value || !userStore.currentUserId) return
  
  isCreating.value = true
  
  const pipeline: PipelineStep[] = selectedMethods.value.map((methodId, index) => {
    const methodEntry = decayMethods.value.find(([id]) => id === methodId)
    const method = methodEntry ? methodEntry[1] : null
    if (!method) return null
    
    const params: Record<string, number> = {}
    Object.entries(method.params).forEach(([key, def]) => {
      params[key] = (def as { default: number }).default
    })
    
    return {
      methodId,
      enabled: true,
      params,
      order: index
    }
  }).filter(Boolean) as PipelineStep[]
  
  const schedule = getSchedule()
  
  diaryStore.createDiary(
    userStore.currentUserId,
    selectedType.value,
    title.value.trim(),
    content.value.trim(),
    pipeline,
    schedule
  )
  
  setTimeout(() => {
    emit('created')
  }, 300)
}

function toggleMethod(methodId: string) {
  const index = selectedMethods.value.indexOf(methodId)
  if (index === -1) {
    selectedMethods.value.push(methodId)
  } else {
    selectedMethods.value.splice(index, 1)
  }
}

function formatTime(offset: number): string {
  if (offset < 100) return `${offset} 单位`
  if (offset < 1000) return `${(offset / 100).toFixed(1)} 百单位`
  return `${(offset / 1000).toFixed(1)} 千单位`
}
</script>

<template>
  <div class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
    <div class="bg-gray-900 rounded-lg border-2 border-diary-fresh w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="font-vt323 text-2xl text-diary-fresh glow-text">
            ✏️ 写新日记
          </h2>
          <button
            class="text-gray-400 hover:text-white text-2xl"
            @click="emit('close')"
          >
            ✕
          </button>
        </div>
        
        <div class="space-y-4">
          <div>
            <label class="block font-vt323 text-diary-fresh mb-2">
              > 标题
            </label>
            <input
              v-model="title"
              type="text"
              class="w-full bg-gray-800 border-2 border-gray-700 rounded px-4 py-2 text-white font-jetbrains outline-none focus:border-diary-fresh transition-colors"
              placeholder="给日记起个名字..."
              maxlength="50"
            />
          </div>
          
          <div>
            <label class="block font-vt323 text-diary-fresh mb-2">
              > 日记类型
            </label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="[id, type] in diaryTypes"
                :key="id"
                class="px-4 py-2 rounded font-vt323 transition-all border-2"
                :class="[
                  selectedType === id 
                    ? 'bg-diary-fresh/20 border-diary-fresh text-diary-fresh' 
                    : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-500'
                ]"
                @click="selectedType = id"
              >
                {{ type.name }}
                <span class="text-xs ml-1 opacity-60">
                  (x{{ type.decayRate }})
                </span>
              </button>
            </div>
            <p class="text-gray-500 text-xs mt-1 font-vt323">
              不同类型的日记衰变速率不同
            </p>
          </div>
          
          <div>
            <label class="block font-vt323 text-diary-fresh mb-2">
              > 内容
            </label>
            <textarea
              v-model="content"
              class="w-full bg-gray-800 border-2 border-gray-700 rounded px-4 py-3 text-white font-jetbrains outline-none focus:border-diary-fresh transition-colors resize-none"
              placeholder="写下你想记录的内容..."
              rows="6"
              maxlength="1000"
            ></textarea>
            <p class="text-right text-gray-500 text-xs mt-1 font-vt323">
              {{ content.length }}/1000
            </p>
          </div>
          
          <div>
            <label class="block font-vt323 text-diary-fresh mb-2">
              > 选择烂法 (可多选，按顺序渲染)
            </label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="[id, method] in decayMethods"
                :key="id"
                class="px-3 py-1 rounded font-vt323 text-sm transition-all border-2"
                :class="[
                  selectedMethods.includes(id)
                    ? 'bg-diary-fresh/20 border-diary-fresh text-diary-fresh' 
                    : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-500'
                ]"
                @click="toggleMethod(id)"
              >
                {{ method.name }}
              </button>
            </div>
            <p class="text-gray-500 text-xs mt-1 font-vt323">
              渲染顺序会影响最终效果，之后可以在管线编辑器中调整
            </p>
          </div>
          
          <div class="border-t border-gray-700 pt-4">
            <button
              class="flex items-center gap-2 font-vt323 text-lg transition-colors"
              :class="showSchedule ? 'text-blue-400' : 'text-gray-400 hover:text-white'"
              @click="showSchedule = !showSchedule"
            >
              <span>{{ showSchedule ? '▼' : '▶' }}</span>
              <span>⏰ 定时发布设置</span>
              <span class="text-sm text-gray-500 ml-2">({{ schedulePreview }})</span>
            </button>
            
            <div v-show="showSchedule" class="mt-4 space-y-4 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <p class="text-gray-400 text-sm font-vt323 mb-2">
                设置日记的生命周期时间线，让它按设定的时间自动完成发布、展示与归档。
              </p>
              
              <div class="flex items-center gap-4">
                <label class="flex items-center gap-2 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    v-model="enablePublishAt"
                    class="w-4 h-4 accent-blue-500"
                  />
                  <span class="font-vt323 text-blue-400">📅 预约公开时间</span>
                </label>
                <div v-if="enablePublishAt" class="flex items-center gap-2">
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
              <p v-if="enablePublishAt" class="text-gray-500 text-xs font-vt323 ml-6">
                在此时间之前，日记仅你自己可见，显示为「待发布」状态
              </p>
              
              <div class="flex items-center gap-4">
                <label class="flex items-center gap-2 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    v-model="enableDecayStartAt"
                    class="w-4 h-4 accent-orange-500"
                  />
                  <span class="font-vt323 text-orange-400">⏳ 预约开始腐烂</span>
                </label>
                <div v-if="enableDecayStartAt" class="flex items-center gap-2">
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
              <p v-if="enableDecayStartAt" class="text-gray-500 text-xs font-vt323 ml-6">
                在此时间之前，日记保持「新鲜」状态，不会开始腐烂
              </p>
              
              <div class="flex items-center gap-4">
                <label class="flex items-center gap-2 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    v-model="enableAutoArchiveAt"
                    class="w-4 h-4 accent-purple-500"
                  />
                  <span class="font-vt323 text-purple-400">📦 预约自动撤回</span>
                </label>
                <div v-if="enableAutoArchiveAt" class="flex items-center gap-2">
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
              <p v-if="enableAutoArchiveAt" class="text-gray-500 text-xs font-vt323 ml-6">
                到达此时间后，日记将自动撤回并存档，原因标记为「定时撤回」
              </p>
              
              <div v-if="enablePublishAt || enableDecayStartAt || enableAutoArchiveAt" class="mt-4 p-3 bg-gray-900/50 rounded border border-gray-600">
                <p class="font-vt323 text-diary-fresh text-sm mb-2">📊 生命周期预览：</p>
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="px-2 py-1 rounded text-xs font-vt323 bg-blue-500/20 text-blue-400 border border-blue-500/50">
                    创建
                  </span>
                  <template v-if="enablePublishAt">
                    <span class="text-gray-600">→</span>
                    <span class="px-2 py-1 rounded text-xs font-vt323 bg-blue-500/20 text-blue-400 border border-blue-500/50">
                      待发布 (+{{ publishAtOffset }})
                    </span>
                  </template>
                  <span class="text-gray-600">→</span>
                  <span class="px-2 py-1 rounded text-xs font-vt323 bg-green-500/20 text-green-400 border border-green-500/50">
                    公开发布
                  </span>
                  <template v-if="enableDecayStartAt">
                    <span class="text-gray-600">→</span>
                    <span class="px-2 py-1 rounded text-xs font-vt323 bg-orange-500/20 text-orange-400 border border-orange-500/50">
                      开始腐烂 (+{{ decayStartAtOffset }})
                    </span>
                  </template>
                  <span class="text-gray-600">→</span>
                  <span class="px-2 py-1 rounded text-xs font-vt323 bg-red-500/20 text-red-400 border border-red-500/50">
                    自然死亡
                  </span>
                  <template v-if="enableAutoArchiveAt">
                    <span class="text-gray-600">→</span>
                    <span class="px-2 py-1 rounded text-xs font-vt323 bg-purple-500/20 text-purple-400 border border-purple-500/50">
                      自动撤回 (+{{ autoArchiveAtOffset }})
                    </span>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="ascii-divider text-center my-6">
          ----------------------------------------------------------------
        </div>
        
        <div class="flex gap-3 justify-end">
          <button
            class="btn-pixel text-gray-400 border-gray-600"
            @click="emit('close')"
          >
            取消
          </button>
          <button
            class="btn-pixel text-diary-fresh border-diary-fresh"
            :disabled="!canCreate || isCreating"
            @click="handleCreate"
          >
            {{ isCreating ? '保存中...' : '💾 保存日记' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
