<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useDiaryStore } from '@/stores/diary'
import { pluginLoader } from '@/engine/PluginLoader'

const router = useRouter()
const userStore = useUserStore()
const diaryStore = useDiaryStore()

const searchQuery = ref('')

const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) {
    return userStore.publicUsers
  }
  const query = searchQuery.value.toLowerCase()
  return userStore.publicUsers.filter(u => 
    u.name.toLowerCase().includes(query) ||
    (u.bio && u.bio.toLowerCase().includes(query))
  )
})

function getUserDiaryCount(userId: string): number {
  return diaryStore.getDiariesByUser(userId).filter(d => d.isPublic).length
}

function getUserDiaryStates(userId: string): Record<string, number> {
  const diaries = diaryStore.getDiariesByUser(userId).filter(d => d.isPublic)
  const states: Record<string, number> = {}
  diaries.forEach(d => {
    states[d.state] = (states[d.state] || 0) + 1
  })
  return states
}

function getTombstoneName(styleId: string): string {
  const style = pluginLoader.getTombstone(styleId)
  return style?.name || styleId
}

function visitUser(userId: string) {
  userStore.startVisiting(userId)
  router.push(`/visit/${userId}`)
}

onMounted(() => {
  userStore.stopVisiting()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="font-vt323 text-3xl text-diary-fresh glow-text mb-1">
          🚪 串门中心
        </h1>
        <p class="text-gray-400 font-vt323">
          发现其他用户的日记墙，轻手轻脚地串门...
        </p>
      </div>
    </div>

    <div class="ascii-divider">
      ----------------------------------------------------------------
    </div>

    <div class="relative">
      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-diary-fresh font-vt323 text-xl">
        🔍
      </span>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索用户名或简介..."
        class="terminal-input w-full pl-10 py-3 border-2 border-gray-700 rounded focus:border-diary-fresh transition-colors bg-gray-800/50 font-vt323"
      />
    </div>

    <div v-if="filteredUsers.length === 0" class="text-center py-16 bg-gray-800/30 rounded border border-gray-700 border-dashed">
      <div class="text-6xl mb-4">🚪</div>
      <p class="text-gray-500 font-vt323 text-xl">
        {{ searchQuery ? '没有找到匹配的用户' : '暂无公开用户' }}
      </p>
      <p class="text-gray-600 font-vt323 mt-2">
        可以在用户中心设置自己的主页为公开
      </p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="user in filteredUsers"
        :key="user.id"
        class="p-5 rounded-lg border-2 border-gray-700 bg-gray-800/50 hover:border-diary-fresh/50 transition-all cursor-pointer group"
        @click="visitUser(user.id)"
      >
        <div class="flex items-start gap-4">
          <div class="w-16 h-16 rounded-lg bg-gray-700/50 flex items-center justify-center text-3xl border-2 border-gray-600 group-hover:border-diary-fresh/50 transition-all">
            👤
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="font-vt323 text-xl text-diary-fresh group-hover:glow-text transition-all truncate">
                {{ user.name }}
              </h3>
              <span
                v-if="user.isPublic"
                class="px-2 py-0.5 rounded text-xs font-vt323 bg-diary-fresh/20 text-diary-fresh border border-diary-fresh/30"
              >
                公开
              </span>
            </div>
            <p class="text-gray-400 font-vt323 text-sm mt-1 line-clamp-2">
              {{ user.bio || '这个人很懒，什么都没写...' }}
            </p>
          </div>
        </div>

        <div class="mt-4 pt-4 border-t border-gray-700">
          <div class="flex items-center justify-between mb-2">
            <span class="text-gray-500 font-vt323 text-sm">公开日记</span>
            <span class="text-diary-fresh font-vt323 text-lg">{{ getUserDiaryCount(user.id) }}</span>
          </div>
          
          <div v-if="getUserDiaryCount(user.id) > 0" class="space-y-1">
            <div
              v-for="(count, state) in getUserDiaryStates(user.id)"
              :key="state"
              class="flex items-center gap-2 text-xs"
            >
              <div
                class="w-2 h-2 rounded-full"
                :style="{ backgroundColor: {
                  fresh: '#39ff14',
                  rotting: '#ff6b35',
                  rotted: '#6b3fa0',
                  dying: '#ff0040',
                  dead: '#000000'
                }[state] || '#666' }"
              />
              <span class="text-gray-400 font-vt323">{{ {
                fresh: '新鲜',
                rotting: '烂中',
                rotted: '已烂',
                dying: '快死',
                dead: '死了'
              }[state] || state }}</span>
              <span class="text-gray-500 font-vt323">({{ count }})</span>
            </div>
          </div>
        </div>

        <div class="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
          <span class="text-gray-500 font-vt323 text-xs">
            墓碑样式: {{ getTombstoneName(user.tombstoneStyle) }}
          </span>
          <button
            class="btn-pixel text-diary-fresh border-diary-fresh text-sm px-3 py-1"
            @click.stop="visitUser(user.id)"
          >
            👀 去看看
          </button>
        </div>
      </div>
    </div>

    <div class="ascii-divider mt-8">
      ----------------------------------------------------------------
    </div>

    <div class="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
      <h3 class="font-vt323 text-lg text-diary-fresh mb-2">💡 串门说明</h3>
      <ul class="text-gray-400 font-vt323 text-sm space-y-1">
        <li>• 只能查看其他用户设置为公开的日记</li>
        <li>• 串门时可以使用时间轴预览不同时间点的日记状态</li>
        <li>• 不能修改或删除他人的日记</li>
        <li>• 不能对他人的日记使用道具</li>
        <li>• 想要让别人看到你的日记？在用户中心设置为公开</li>
      </ul>
    </div>
  </div>
</template>
