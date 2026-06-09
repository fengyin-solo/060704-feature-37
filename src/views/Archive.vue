<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDiaryStore } from '@/stores/diary'
import { useUserStore } from '@/stores/user'
import { useItems } from '@/composables/useItems'
import { pluginLoader } from '@/engine/PluginLoader'
import { renderPipeline } from '@/engine/RenderPipeline'
import { globalTimeline } from '@/engine/Timeline'
import ArchiveCard from '@/components/diary/ArchiveCard.vue'
import TimelineSummary from '@/components/timeline/TimelineSummary.vue'
import { 
  STATE_NAMES, 
  STATE_COLORS, 
  ARCHIVE_REASON_NAMES,
  ArchiveReason
} from '@/types'
import type { ArchivedDiary } from '@/types'

const router = useRouter()
const diaryStore = useDiaryStore()
const userStore = useUserStore()
const { itemsByRarity, useItem } = useItems()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const selectedArchivedId = ref<string | null>(null)
const showRestoreConfirm = ref(false)
const showRepairSelector = ref(false)
const keyword = ref('')
const filterOwner = ref<string>('')
const filterType = ref<string>('')
const filterReason = ref<string>('')
const filterArchivedStart = ref<number | null>(null)
const filterArchivedEnd = ref<number | null>(null)
const filterRepairedStart = ref<number | null>(null)
const filterRepairedEnd = ref<number | null>(null)

const diaryTypes = computed(() => {
  return Array.from(pluginLoader.getDiaryTypes().entries()).map(([id, type]) => ({
    id,
    name: type.name
  }))
})

const owners = computed(() => {
  const ownerIds = new Set(diaryStore.archivedDiaries.map(ad => ad.diary.ownerId))
  return Array.from(ownerIds).map(id => {
    const user = userStore.getUserById(id)
    return { id, name: user?.name || '未知用户' }
  })
})

const currentTime = computed(() => globalTimeline.getTime())

const filteredArchives = computed(() => {
  const filters: any = {}
  
  if (filterOwner.value) {
    filters.ownerId = filterOwner.value
  }
  if (filterType.value) {
    filters.diaryType = filterType.value
  }
  if (filterReason.value) {
    filters.archiveReason = filterReason.value as ArchiveReason
  }
  if (filterArchivedStart.value !== null) {
    filters.archivedAfter = filterArchivedStart.value
  }
  if (filterArchivedEnd.value !== null) {
    filters.archivedBefore = filterArchivedEnd.value
  }
  if (filterRepairedStart.value !== null) {
    filters.repairedAfter = filterRepairedStart.value
  }
  if (filterRepairedEnd.value !== null) {
    filters.repairedBefore = filterRepairedEnd.value
  }
  if (keyword.value.trim()) {
    filters.keyword = keyword.value.trim()
  }

  const userStore = useUserStore()
  if (userStore.visitingUserId) {
    filters.ownerId = userStore.visitingUserId
  } else if (!filters.ownerId && userStore.currentUserId) {
    filters.ownerId = userStore.currentUserId
  }

  return diaryStore.searchArchivedDiaries(filters)
})

const selectedArchive = computed((): ArchivedDiary | null => {
  if (!selectedArchivedId.value) return null
  return filteredArchives.value.find(ad => ad.id === selectedArchivedId.value) || null
})

const selectedDiaryType = computed(() => {
  if (!selectedArchive.value) return null
  return pluginLoader.getDiaryType(selectedArchive.value.diary.type)
})

const selectedOwner = computed(() => {
  if (!selectedArchive.value) return null
  return userStore.getUserById(selectedArchive.value.diary.ownerId)
})

const stateColor = computed(() => {
  if (!selectedArchive.value) return '#000'
  return STATE_COLORS[selectedArchive.value.diary.state]
})

const stateName = computed(() => {
  if (!selectedArchive.value) return ''
  return STATE_NAMES[selectedArchive.value.diary.state]
})

const availableRepairItems = computed(() => {
  const items: { item: any; count: number }[] = []
  if (!selectedArchive.value) return items

  Object.values(itemsByRarity.value).forEach(rarityItems => {
    rarityItems.forEach(({ item, count }) => {
      if (item.targetTypes.includes(selectedArchive.value!.diary.type) && count > 0) {
        items.push({ item, count })
      }
    })
  })
  return items
})

function renderPreview() {
  if (!canvasRef.value || !selectedArchive.value) return
  const ctx = canvasRef.value.getContext('2d')
  if (!ctx) return
  
  const decayRate = selectedDiaryType.value?.decayRate || 1
  renderPipeline.render(selectedArchive.value.diary, ctx, undefined, decayRate)
}

let renderInterval: number | null = null

onMounted(async () => {
  await pluginLoader.loadAll()
  if (filteredArchives.value.length > 0) {
    selectedArchivedId.value = filteredArchives.value[0].id
  }
  renderInterval = window.setInterval(renderPreview, 1000)
})

watch(selectedArchivedId, () => {
  setTimeout(renderPreview, 50)
})

watch(filteredArchives, (newArchives) => {
  if (selectedArchivedId.value) {
    const stillExists = newArchives.some(ad => ad.id === selectedArchivedId.value)
    if (!stillExists) {
      selectedArchivedId.value = newArchives[0]?.id || null
    }
  } else if (newArchives.length > 0) {
    selectedArchivedId.value = newArchives[0].id
  }
}, { deep: true })

function handleSelectArchive(archivedId: string) {
  selectedArchivedId.value = archivedId
}

function handleRestore() {
  if (!selectedArchivedId.value) return
  const restored = diaryStore.restoreDiary(selectedArchivedId.value)
  if (restored) {
    showRestoreConfirm.value = false
    selectedArchivedId.value = filteredArchives.value[0]?.id || null
    if (restored) {
      router.push(`/diary/${restored.id}`)
    }
  }
}

function handleUseItem(itemId: string) {
  if (!selectedArchivedId.value || !selectedArchive.value) return
  
  const success = useItem(itemId, selectedArchive.value.diary.id)
  if (success) {
    const item = availableRepairItems.value.find(i => i.item.id === itemId)?.item
    if (item) {
      const fromState = selectedArchive.value.diary.state
      const toStateIndex = Math.max(0, Object.values(STATE_NAMES).indexOf(stateName.value) - 1)
      const toState = Object.keys(STATE_NAMES)[toStateIndex] as any
      
      diaryStore.addRepairRecord(selectedArchivedId.value, {
        itemId: item.id,
        itemName: item.name,
        fromState,
        toState
      })
    }
    showRepairSelector.value = false
  }
}

function clearFilters() {
  keyword.value = ''
  filterOwner.value = ''
  filterType.value = ''
  filterReason.value = ''
  filterArchivedStart.value = null
  filterArchivedEnd.value = null
  filterRepairedStart.value = null
  filterRepairedEnd.value = null
}

function formatTime(timestamp: number | null): string {
  if (timestamp === null) return '无'
  return `#${Math.floor(timestamp)}`
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="min-h-screen">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-4">
        <button
          class="btn-pixel text-gray-400 border-gray-600 text-sm"
          @click="goBack"
        >
          ← 返回
        </button>
        <h1 class="font-vt323 text-3xl text-diary-gold glow-text">
          🏛️ 旧档案馆
        </h1>
      </div>
      <div class="text-sm text-gray-500 font-vt323">
        当前时间: #{{ Math.floor(currentTime) }} | 馆藏: {{ filteredArchives.length }} 件
      </div>
    </div>

    <div class="bg-gray-900/60 rounded-lg p-4 mb-6 border border-gray-800">
      <div class="flex flex-wrap gap-4 items-end">
        <div class="flex-1 min-w-48">
          <label class="block text-sm font-vt323 text-gray-400 mb-1">
            🔍 关键词搜索
          </label>
          <input
            v-model="keyword"
            type="text"
            placeholder="搜索标题或内容..."
            class="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-vt323 focus:border-diary-gold focus:outline-none"
          />
        </div>

        <div class="min-w-36">
          <label class="block text-sm font-vt323 text-gray-400 mb-1">
            👤 主人
          </label>
          <select
            v-model="filterOwner"
            class="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-vt323 focus:border-diary-gold focus:outline-none"
          >
            <option value="">全部</option>
            <option v-for="owner in owners" :key="owner.id" :value="owner.id">
              {{ owner.name }}
            </option>
          </select>
        </div>

        <div class="min-w-36">
          <label class="block text-sm font-vt323 text-gray-400 mb-1">
            📝 日记类型
          </label>
          <select
            v-model="filterType"
            class="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-vt323 focus:border-diary-gold focus:outline-none"
          >
            <option value="">全部</option>
            <option v-for="type in diaryTypes" :key="type.id" :value="type.id">
              {{ type.name }}
            </option>
          </select>
        </div>

        <div class="min-w-36">
          <label class="block text-sm font-vt323 text-gray-400 mb-1">
            📦 归档原因
          </label>
          <select
            v-model="filterReason"
            class="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-vt323 focus:border-diary-gold focus:outline-none"
          >
            <option value="">全部</option>
            <option value="dead">自然死亡</option>
            <option value="deleted">用户删除</option>
            <option value="scheduled_archive">定时撤回</option>
          </select>
        </div>

        <button
          class="btn-pixel text-gray-400 border-gray-600 text-sm"
          @click="clearFilters"
        >
            重置筛选
        </button>
      </div>

      <div class="flex flex-wrap gap-4 items-end mt-4 pt-4 border-t border-gray-800">
        <div class="flex gap-2 items-center">
          <span class="text-sm font-vt323 text-gray-400">封存时间:</span>
          <input
            v-model.number="filterArchivedStart"
            type="number"
            placeholder="起始"
            class="w-28 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm font-vt323 focus:border-diary-gold focus:outline-none"
          />
          <span class="text-gray-500">~</span>
          <input
            v-model.number="filterArchivedEnd"
            type="number"
            placeholder="结束"
            class="w-28 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm font-vt323 focus:border-diary-gold focus:outline-none"
          />
        </div>

        <div class="flex gap-2 items-center">
          <span class="text-sm font-vt323 text-gray-400">修复时间:</span>
          <input
            v-model.number="filterRepairedStart"
            type="number"
            placeholder="起始"
            class="w-28 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm font-vt323 focus:border-diary-gold focus:outline-none"
          />
          <span class="text-gray-500">~</span>
          <input
            v-model.number="filterRepairedEnd"
            type="number"
            placeholder="结束"
            class="w-28 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm font-vt323 focus:border-diary-gold focus:outline-none"
          />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-1">
        <div class="bg-gray-900/40 rounded-lg p-4 border border-gray-800 max-h-[70vh] overflow-y-auto">
          <h3 class="font-vt323 text-lg text-diary-fresh mb-4 sticky top-0 bg-gray-900/90 py-2 -mt-2 z-10">
            📚 档案列表 ({{ filteredArchives.length }})
          </h3>

          <div v-if="filteredArchives.length === 0" class="text-center py-12">
            <div class="text-6xl mb-4">📭</div>
            <p class="text-gray-500 font-vt323">
              暂无档案记录
            </p>
            <p class="text-gray-600 text-sm font-vt323 mt-2">
              死亡或被删除的日记会自动归档到这里
            </p>
          </div>

          <div v-else class="grid grid-cols-1 gap-3">
            <ArchiveCard
              v-for="archived in filteredArchives"
              :key="archived.id"
              :archived-diary="archived"
              :selected="selectedArchivedId === archived.id"
              @select="handleSelectArchive"
            />
          </div>
        </div>
      </div>

      <div class="lg:col-span-2 space-y-6">
        <div v-if="!selectedArchive" class="bg-gray-900/40 rounded-lg p-12 border border-gray-800 text-center">
          <div class="text-8xl mb-6 opacity-30">🏛️</div>
          <p class="text-gray-500 font-vt323 text-xl">
            选择一份档案查看详情
          </p>
          <p class="text-gray-600 font-vt323 mt-2">
            点击左侧档案卡片即可预览内容
          </p>
        </div>

        <template v-else>
          <div class="crt-container rounded-lg overflow-hidden border-2" :style="{ borderColor: stateColor }">
            <canvas
              ref="canvasRef"
              width="800"
              height="450"
              class="w-full h-auto block"
            ></canvas>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-gray-900/80 rounded-lg p-4 border border-gray-800">
              <div class="flex items-center justify-between mb-4">
                <h2 class="font-vt323 text-xl">{{ selectedArchive.diary.title }}</h2>
                <span 
                  class="state-indicator"
                  :style="{ color: stateColor, borderColor: stateColor }"
                >
                  {{ stateName }}
                </span>
              </div>

              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500 font-vt323">归档原因:</span>
                  <span class="font-vt323" :class="selectedArchive.archiveReason === 'dead' ? 'text-diary-dying' : 'text-diary-rotted'">
                    {{ ARCHIVE_REASON_NAMES[selectedArchive.archiveReason] }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 font-vt323">主人:</span>
                  <span class="font-vt323">{{ selectedOwner?.name || '未知' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 font-vt323">类型:</span>
                  <span class="font-vt323">{{ selectedDiaryType?.name || '未知' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 font-vt323">创建时间:</span>
                  <span class="font-vt323">{{ formatTime(selectedArchive.diary.createdAt) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 font-vt323">封存时间:</span>
                  <span class="font-vt323">{{ formatTime(selectedArchive.archivedAt) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 font-vt323">修复次数:</span>
                  <span class="font-vt323 text-diary-gold">{{ selectedArchive.repairCount }} 次</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 font-vt323">最近修复:</span>
                  <span class="font-vt323 text-diary-gold">{{ formatTime(selectedArchive.lastRepairAt) }}</span>
                </div>
              </div>

              <div class="flex gap-2 mt-6">
                <button
                  class="flex-1 btn-pixel text-diary-fresh border-diary-fresh"
                  @click="showRepairSelector = true"
                  :disabled="availableRepairItems.length === 0"
                >
                  🛠️ 修复档案
                </button>
                <button
                  class="flex-1 btn-pixel text-diary-gold border-diary-gold"
                  @click="showRestoreConfirm = true"
                >
                  🔄 恢复档案
                </button>
              </div>
            </div>

            <div class="bg-gray-900/80 rounded-lg p-4 border border-gray-800">
              <h4 class="font-vt323 text-lg text-diary-fresh mb-3">
                🧪 渲染管线 ({{ selectedArchive.diary.pipeline.filter(p => p.enabled).length }})
              </h4>
              
              <div v-if="selectedArchive.diary.pipeline.length === 0" class="text-gray-500 text-sm font-vt323">
                没有应用任何烂法
              </div>
              
              <div v-else class="space-y-2">
                <div
                  v-for="(step, index) in [...selectedArchive.diary.pipeline].sort((a, b) => a.order - b.order)"
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
          </div>

          <TimelineSummary
            :diary="selectedArchive.diary"
            :archived-at="selectedArchive.archivedAt"
            :last-repair-at="selectedArchive.lastRepairAt"
            :repair-records="selectedArchive.repairRecords"
          />
        </template>
      </div>
    </div>

    <div v-if="showRestoreConfirm" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div class="bg-gray-900 rounded-lg border-2 border-diary-gold w-full max-w-md">
        <div class="p-6">
          <h3 class="font-vt323 text-xl text-diary-gold glow-text mb-4">
            🔄 确认恢复档案
          </h3>
          <p class="text-gray-300 font-vt323 mb-6">
            确定要恢复「{{ selectedArchive?.diary.title }}」吗？<br/>
            恢复后日记将回到「快死」状态，可以继续腐烂或被修复。
          </p>
          <div class="flex gap-3">
            <button
              class="flex-1 btn-pixel text-gray-400 border-gray-600"
              @click="showRestoreConfirm = false"
            >
              取消
            </button>
            <button
              class="flex-1 btn-pixel text-diary-gold border-diary-gold"
              @click="handleRestore"
            >
              确认恢复
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showRepairSelector" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div class="bg-gray-900 rounded-lg border-2 border-diary-gold w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-vt323 text-xl text-diary-gold glow-text">
              🛠️ 选择修复道具
            </h3>
            <button
              class="text-gray-400 hover:text-white text-xl"
              @click="showRepairSelector = false"
            >
              ✕
            </button>
          </div>
          
          <div v-if="availableRepairItems.length === 0" class="text-center py-8">
            <p class="text-gray-500 font-vt323">
              没有可用的修复道具
            </p>
            <p class="text-gray-600 text-sm font-vt323 mt-2">
              去背包看看有什么道具吧
            </p>
          </div>
          
          <div v-else class="space-y-2">
            <div
              v-for="{ item, count } in availableRepairItems"
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
  </div>
</template>
