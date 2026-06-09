<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useDiaryStore } from '@/stores/diary'
import { useDiary } from '@/composables/useDiary'
import { pluginLoader } from '@/engine/PluginLoader'
import { globalTimeline } from '@/engine/Timeline'
import TimelineControl from '@/components/timeline/TimelineControl.vue'
import DiaryCard from '@/components/diary/DiaryCard.vue'
import CreateDiaryModal from '@/components/diary/CreateDiaryModal.vue'
import type { DiaryState } from '@/types'
import { STATE_NAMES, STATE_COLORS } from '@/types'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const diaryStore = useDiaryStore()

const showCreateModal = ref(false)
const filterState = ref<DiaryState | 'all'>('all')
const { isOwner } = useDiary()

const isVisiting = computed(() => !!route.params.userId)

const wallOwner = computed(() => {
  if (route.params.userId) {
    return userStore.getUserById(route.params.userId as string)
  }
  return userStore.currentUser
})

const diaries = computed(() => {
  if (route.params.userId) {
    const now = globalTimeline.getTime()
    return diaryStore.getDiariesByUser(route.params.userId as string)
      .filter(d => {
        if (!d.isPublic) return false
        if (d.state === 'scheduled') return false
        if (d.schedule.publishAt && d.schedule.publishAt > now) return false
        return true
      })
  }
  return diaryStore.currentUserDiaries
})

const filteredDiaries = computed(() => {
  if (filterState.value === 'all') {
    return diaries.value
  }
  return diaries.value.filter(d => d.state === filterState.value)
})

const stateStats = computed(() => {
  const stats: Record<string, number> = {
    all: diaries.value.length
  }
  
  diaries.value.forEach(d => {
    stats[d.state] = (stats[d.state] || 0) + 1
  })
  
  return stats
})

const canCreate = computed(() => {
  return !isVisiting.value && userStore.currentUserId
})

function startVisiting() {
  if (route.params.userId) {
    userStore.startVisiting(route.params.userId as string)
  }
}

function handleDiaryCreated() {
  showCreateModal.value = false
}

watch(() => route.params.userId, () => {
  startVisiting()
}, { immediate: true })

onMounted(() => {
  startVisiting()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="font-vt323 text-3xl text-diary-fresh glow-text mb-1">
          {{ isVisiting ? `${wallOwner?.name} 的日记墙` : '我的日记墙' }}
        </h1>
        <p class="text-gray-400 font-vt323">
          {{ isVisiting ? '正在串门，轻手轻脚...' : '每篇日记都有自己的生命周期' }}
        </p>
      </div>
      
      <button
        v-if="canCreate"
        class="btn-pixel text-diary-fresh border-diary-fresh"
        @click="showCreateModal = true"
      >
        ✏️ 写新日记
      </button>
    </div>
    
    <TimelineControl />
    
    <div class="flex flex-wrap gap-2">
      <button
        v-for="(count, state) in stateStats"
        :key="state"
        class="px-3 py-1 rounded font-vt323 text-sm transition-all border-2"
        :class="[
          filterState === state 
            ? 'bg-diary-fresh/20 border-diary-fresh text-diary-fresh' 
            : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-500'
        ]"
        :style="state !== 'all' ? { 
          color: filterState === state ? STATE_COLORS[state as DiaryState] : undefined,
          borderColor: filterState === state ? STATE_COLORS[state as DiaryState] : undefined 
        } : {}"
        @click="filterState = state as any"
      >
        {{ state === 'all' ? '全部' : STATE_NAMES[state as DiaryState] }} ({{ count }})
      </button>
    </div>
    
    <div class="ascii-divider">
      ----------------------------------------------------------------
    </div>
    
    <div v-if="filteredDiaries.length === 0" class="text-center py-16">
      <div class="text-6xl mb-4">📭</div>
      <p class="text-gray-500 font-vt323 text-xl">
        {{ canCreate ? '还没有日记，开始写第一篇吧' : '这里还没有公开的日记' }}
      </p>
    </div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <DiaryCard
        v-for="diary in filteredDiaries"
        :key="diary.id"
        :diary="diary"
        :isOwner="!isVisiting"
      />
    </div>
    
    <CreateDiaryModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @created="handleDiaryCreated"
    />
  </div>
</template>
