<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { useDiaryStore } from '@/stores/diary'
import { useInventoryStore } from '@/stores/inventory'
import { pluginLoader } from '@/engine/PluginLoader'
import { globalTimeline } from '@/engine/Timeline'
import { DiaryState, STATE_NAMES, STATE_COLORS } from '@/types'
import type { TombstoneStyle } from '@/types'

const userStore = useUserStore()
const diaryStore = useDiaryStore()
const inventoryStore = useInventoryStore()

const editMode = ref(false)
const editName = ref('')
const editBio = ref('')
const editIsPublic = ref(true)
const editTombstoneStyle = ref('default')

const tombstoneStyles = computed<TombstoneStyle[]>(() => {
  return Array.from(pluginLoader.getTombstones().values())
})

const userDiaries = computed(() => {
  return diaryStore.currentUserDiaries
})

const diaryStats = computed(() => {
  const stats: Record<string, number> = {
    total: userDiaries.value.length
  }
  
  Object.values(DiaryState).forEach(state => {
    stats[state] = userDiaries.value.filter(d => d.state === state).length
  })
  
  return stats
})

const totalItems = computed(() => {
  return inventoryStore.inventory.reduce((sum, item) => sum + item.count, 0)
})

const currentTimelineTime = computed(() => {
  return globalTimeline.getCurrentTime()
})

const formattedTime = computed(() => {
  const days = Math.floor(currentTimelineTime.value / (24 * 60 * 60 * 1000))
  const hours = Math.floor((currentTimelineTime.value % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  const minutes = Math.floor((currentTimelineTime.value % (60 * 60 * 1000)) / (60 * 1000))
  return `第 ${days} 天 ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
})

function startEdit() {
  if (!userStore.currentUser) return
  editName.value = userStore.currentUser.name
  editBio.value = userStore.currentUser.bio || ''
  editIsPublic.value = userStore.currentUser.isPublic
  editTombstoneStyle.value = userStore.currentUser.tombstoneStyle
  editMode.value = true
}

function cancelEdit() {
  editMode.value = false
}

function saveEdit() {
  if (!userStore.currentUser || !editName.value.trim()) return
  
  userStore.updateUser(userStore.currentUser.id, {
    name: editName.value.trim(),
    bio: editBio.value.trim() || undefined,
    isPublic: editIsPublic.value,
    tombstoneStyle: editTombstoneStyle.value
  })
  
  editMode.value = false
}

function getTombstonePreview(styleId: string): string {
  const style = pluginLoader.getTombstone(styleId)
  return style?.name || styleId
}

onMounted(() => {
  if (userStore.currentUser) {
    editTombstoneStyle.value = userStore.currentUser.tombstoneStyle
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="font-vt323 text-3xl text-diary-fresh glow-text mb-1">
          👤 用户中心
        </h1>
        <p class="text-gray-400 font-vt323">
          管理你的账户和偏好设置
        </p>
      </div>
    </div>

    <div class="ascii-divider">
      ----------------------------------------------------------------
    </div>

    <div v-if="!userStore.currentUser" class="text-center py-16 bg-gray-800/30 rounded border border-gray-700 border-dashed">
      <div class="text-6xl mb-4">👤</div>
      <p class="text-gray-500 font-vt323 text-xl">请先登录</p>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-1 space-y-4">
        <div class="p-6 rounded-lg border-2 border-gray-700 bg-gray-800/50">
          <div class="text-center mb-6">
            <div class="w-24 h-24 rounded-lg bg-gray-700/50 flex items-center justify-center text-5xl mx-auto mb-4 border-2 border-diary-fresh/30">
              👤
            </div>
            
            <div v-if="!editMode">
              <h2 class="font-vt323 text-2xl text-diary-fresh glow-text">
                {{ userStore.currentUser.name }}
              </h2>
              <p class="text-gray-400 font-vt323 mt-1">
                {{ userStore.currentUser.bio || '这个人很懒，什么都没写...' }}
              </p>
              <div class="mt-3">
                <span
                  :class="[
                    'px-3 py-1 rounded text-sm font-vt323',
                    userStore.currentUser.isPublic
                      ? 'bg-diary-fresh/20 text-diary-fresh border border-diary-fresh/30'
                      : 'bg-gray-700/50 text-gray-400 border border-gray-600'
                  ]"
                >
                  {{ userStore.currentUser.isPublic ? '🌐 公开' : '🔒 私密' }}
                </span>
              </div>
            </div>

            <div v-else class="space-y-4 text-left">
              <div>
                <label class="block font-vt323 text-diary-fresh mb-1">用户名</label>
                <input
                  v-model="editName"
                  type="text"
                  class="terminal-input w-full px-3 py-2 border-2 border-gray-700 rounded focus:border-diary-fresh transition-colors bg-gray-800/50 font-vt323"
                  maxlength="20"
                />
              </div>
              <div>
                <label class="block font-vt323 text-diary-fresh mb-1">个人简介</label>
                <textarea
                  v-model="editBio"
                  class="terminal-input w-full px-3 py-2 border-2 border-gray-700 rounded focus:border-diary-fresh transition-colors bg-gray-800/50 font-vt323 resize-none"
                  rows="3"
                  maxlength="100"
                  placeholder="介绍一下自己..."
                />
              </div>
              <div class="flex items-center gap-2">
                <input
                  v-model="editIsPublic"
                  type="checkbox"
                  id="isPublic"
                  class="w-4 h-4 accent-diary-fresh"
                />
                <label for="isPublic" class="font-vt323 text-gray-300">
                  公开主页（允许其他人串门）
                </label>
              </div>
              <div>
                <label class="block font-vt323 text-diary-fresh mb-1">墓碑样式</label>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    v-for="style in tombstoneStyles"
                    :key="style.id"
                    class="p-2 rounded border-2 font-vt323 text-sm transition-all"
                    :class="[
                      editTombstoneStyle === style.id
                        ? 'border-diary-fresh bg-diary-fresh/10 text-diary-fresh'
                        : 'border-gray-700 bg-gray-800/30 text-gray-400 hover:border-gray-500'
                    ]"
                    @click="editTombstoneStyle = style.id"
                  >
                    {{ style.name }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="ascii-divider">
            ----------------------------------------------------------------
          </div>

          <div class="flex gap-2">
            <button
              v-if="!editMode"
              class="flex-1 btn-pixel text-diary-fresh border-diary-fresh"
              @click="startEdit"
            >
              ✏️ 编辑资料
            </button>
            <template v-else>
              <button
                class="flex-1 btn-pixel text-gray-400 border-gray-600"
                @click="cancelEdit"
              >
                取消
              </button>
              <button
                class="flex-1 btn-pixel text-diary-fresh border-diary-fresh"
                :disabled="!editName.trim()"
                @click="saveEdit"
              >
                保存
              </button>
            </template>
          </div>
        </div>

        <div class="p-4 rounded-lg border-2 border-gray-700 bg-gray-800/50">
          <h3 class="font-vt323 text-lg text-diary-fresh mb-3">⏱️ 时间轴状态</h3>
          <div class="space-y-2 font-vt323">
            <div class="flex justify-between">
              <span class="text-gray-400">当前虚拟时间</span>
              <span class="text-diary-fresh">{{ formattedTime }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">播放速度</span>
              <span class="text-diary-fresh">{{ globalTimeline.getSpeed().toFixed(2) }}x</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">运行状态</span>
              <span :class="globalTimeline.isPaused() ? 'text-diary-frozen' : 'text-diary-fresh'">
                {{ globalTimeline.isPaused() ? '⏸️ 暂停' : '▶️ 运行中' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="lg:col-span-2 space-y-4">
        <div class="p-6 rounded-lg border-2 border-gray-700 bg-gray-800/50">
          <h3 class="font-vt323 text-xl text-diary-fresh mb-4">📊 数据统计</h3>
          
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="text-center p-3 rounded bg-gray-700/30">
              <div class="font-vt323 text-3xl text-diary-fresh">{{ diaryStats.total }}</div>
              <div class="text-gray-400 font-vt323 text-sm">总日记数</div>
            </div>
            <div class="text-center p-3 rounded bg-gray-700/30">
              <div class="font-vt323 text-3xl" :style="{ color: STATE_COLORS[DiaryState.FRESH] }">
                {{ diaryStats[DiaryState.FRESH] }}
              </div>
              <div class="text-gray-400 font-vt323 text-sm">新鲜</div>
            </div>
            <div class="text-center p-3 rounded bg-gray-700/30">
              <div class="font-vt323 text-3xl" :style="{ color: STATE_COLORS[DiaryState.DEAD] }">
                {{ diaryStats[DiaryState.DEAD] }}
              </div>
              <div class="text-gray-400 font-vt323 text-sm">已逝世</div>
            </div>
            <div class="text-center p-3 rounded bg-gray-700/30">
              <div class="font-vt323 text-3xl text-diary-fresh">{{ totalItems }}</div>
              <div class="text-gray-400 font-vt323 text-sm">道具数量</div>
            </div>
          </div>

          <div class="ascii-divider">
            ----------------------------------------------------------------
          </div>

          <h4 class="font-vt323 text-lg text-diary-fresh mb-3">📈 状态分布</h4>
          <div class="space-y-3">
            <div
              v-for="state in Object.values(DiaryState)"
              :key="state"
              class="space-y-1"
            >
              <div class="flex justify-between font-vt323 text-sm">
                <span :style="{ color: STATE_COLORS[state] }">{{ STATE_NAMES[state] }}</span>
                <span class="text-gray-400">{{ diaryStats[state] || 0 }}</span>
              </div>
              <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  class="h-full transition-all duration-500"
                  :style="{
                    width: `${diaryStats.total > 0 ? ((diaryStats[state] || 0) / diaryStats.total) * 100 : 0}%`,
                    backgroundColor: STATE_COLORS[state]
                  }"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="p-6 rounded-lg border-2 border-gray-700 bg-gray-800/50">
          <h3 class="font-vt323 text-xl text-diary-fresh mb-4">⚙️ 高级设置</h3>
          
          <div class="space-y-4">
            <div class="flex items-start gap-3 p-3 rounded bg-gray-700/30">
              <span class="text-2xl">🪦</span>
              <div class="flex-1">
                <h4 class="font-vt323 text-lg text-diary-fresh">
                  当前墓碑样式: {{ getTombstonePreview(userStore.currentUser.tombstoneStyle) }}
                </h4>
                <p class="text-gray-400 font-vt323 text-sm mt-1">
                  当日记死亡时，会使用你选择的墓碑样式来展示。可以在上方编辑资料中修改。
                </p>
              </div>
            </div>

            <div class="flex items-start gap-3 p-3 rounded bg-gray-700/30">
              <span class="text-2xl">🔌</span>
              <div class="flex-1">
                <h4 class="font-vt323 text-lg text-diary-fresh">插件系统</h4>
                <p class="text-gray-400 font-vt323 text-sm mt-1">
                  本应用支持插件扩展。在 <code class="bg-gray-800 px-1 rounded">src/plugins/</code> 目录下添加新文件即可扩展：
                </p>
                <ul class="text-gray-500 font-vt323 text-xs mt-2 space-y-1">
                  <li>• <code class="bg-gray-800 px-1 rounded">decay-methods/</code> - 新的烂法</li>
                  <li>• <code class="bg-gray-800 px-1 rounded">diary-types/</code> - 新的日记类型</li>
                  <li>• <code class="bg-gray-800 px-1 rounded">items/</code> - 新的道具</li>
                  <li>• <code class="bg-gray-800 px-1 rounded">tombstones/</code> - 新的墓碑样式</li>
                </ul>
              </div>
            </div>

            <div class="flex items-start gap-3 p-3 rounded bg-gray-700/30">
              <span class="text-2xl">⚠️</span>
              <div class="flex-1">
                <h4 class="font-vt323 text-lg text-diary-rotted">危险操作</h4>
                <p class="text-gray-400 font-vt323 text-sm mt-1">
                  数据存储在浏览器本地。清除浏览器数据将导致所有日记和道具丢失。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
