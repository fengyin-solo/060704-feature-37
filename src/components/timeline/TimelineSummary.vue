<script setup lang="ts">
import { computed } from 'vue'
import type { Diary, ArchivedDiary, RepairRecord } from '@/types'
import { STATE_ORDER, STATE_NAMES, STATE_COLORS } from '@/types'

interface Props {
  diary: Diary
  archivedAt?: number
  lastRepairAt?: number | null
  repairRecords?: RepairRecord[]
}

const props = defineProps<Props>()

interface TimelineEvent {
  timestamp: number
  label: string
  type: 'state' | 'archive' | 'repair'
  state?: string
  color: string
  icon: string
}

const timelineEvents = computed((): TimelineEvent[] => {
  const events: TimelineEvent[] = []

  events.push({
    timestamp: props.diary.createdAt,
    label: '创建',
    type: 'state',
    state: 'fresh',
    color: STATE_COLORS.fresh,
    icon: '📝'
  })

  for (const state of STATE_ORDER) {
    const ts = props.diary.stateTimestamps[state]
    if (ts > 0 && state !== 'fresh') {
      events.push({
        timestamp: ts,
        label: `进入「${STATE_NAMES[state]}」`,
        type: 'state',
        state: state,
        color: STATE_COLORS[state],
        icon: state === 'dead' ? '💀' : '⏱️'
      })
    }
  }

  if (props.archivedAt) {
    events.push({
      timestamp: props.archivedAt,
      label: '封存入馆',
      type: 'archive',
      color: '#9ca3af',
      icon: '📦'
    })
  }

  if (props.repairRecords && props.repairRecords.length > 0) {
    props.repairRecords.forEach(record => {
      events.push({
        timestamp: record.timestamp,
        label: `修复: ${record.itemName} (${STATE_NAMES[record.fromState]} → ${STATE_NAMES[record.toState]})`,
        type: 'repair',
        color: '#ffd700',
        icon: '🛠️'
      })
    })
  }

  return events.sort((a, b) => a.timestamp - b.timestamp)
})

function formatTime(timestamp: number): string {
  return `#${Math.floor(timestamp)}`
}

function getTimeOffset(timestamp: number): number {
  const first = timelineEvents.value[0]?.timestamp || 0
  const last = timelineEvents.value[timelineEvents.value.length - 1]?.timestamp || 1
  const range = last - first || 1
  return ((timestamp - first) / range) * 100
}
</script>

<template>
  <div class="bg-gray-900/80 rounded-lg p-4 border border-gray-800">
    <h4 class="font-vt323 text-lg text-diary-fresh mb-4">
      📊 时间线摘要
    </h4>

    <div class="relative mb-6">
      <div class="absolute top-4 left-0 right-0 h-1 bg-gray-700 rounded-full"></div>
      
      <div class="relative flex justify-between">
        <div
          v-for="event in timelineEvents"
          :key="event.timestamp + event.type"
          class="flex flex-col items-center"
          :style="{ left: `${getTimeOffset(event.timestamp)}%`, position: 'absolute' }"
        >
          <div 
            class="w-8 h-8 rounded-full flex items-center justify-center text-sm z-10 border-2 border-gray-900"
            :style="{ backgroundColor: event.color }"
            :title="event.label"
          >
            {{ event.icon }}
          </div>
          <div class="mt-1 text-xs font-vt323 text-gray-400 whitespace-nowrap">
            {{ formatTime(event.timestamp) }}
          </div>
        </div>
      </div>
    </div>

    <div class="space-y-2 max-h-60 overflow-y-auto">
      <div
        v-for="event in timelineEvents"
        :key="event.timestamp + event.type + '-detail'"
        class="flex items-start gap-3 p-2 rounded hover:bg-gray-800/50 transition-colors"
      >
        <div 
          class="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5"
          :style="{ backgroundColor: event.color + '30', color: event.color }"
        >
          {{ event.icon }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-vt323 text-sm" :style="{ color: event.color }">
            {{ event.label }}
          </div>
          <div class="text-xs text-gray-500 font-vt323">
            {{ formatTime(event.timestamp) }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="repairRecords && repairRecords.length > 0" class="mt-4 pt-4 border-t border-gray-800">
      <div class="text-xs text-gray-500 font-vt323">
        共 {{ repairRecords.length }} 次修复记录
      </div>
    </div>
  </div>
</template>
