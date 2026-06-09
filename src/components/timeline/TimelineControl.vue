<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTimeline } from '@/composables/useTimeline'

const {
  currentTime,
  displayTime,
  speed,
  isRunning,
  isFastForwarding,
  isRewinding,
  speedOptions,
  setSpeed,
  togglePlayPause,
  fastForward,
  rewind,
  jumpToTime
} = useTimeline()

const isDragging = ref(false)
const sliderRef = ref<HTMLDivElement | null>(null)
const maxTime = 2000

const progress = ref(0)

watch(currentTime, (time) => {
  progress.value = Math.min(100, (time / maxTime) * 100)
})

function handleSliderClick(e: MouseEvent) {
  if (!sliderRef.value) return
  
  const rect = sliderRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
  const time = (percentage / 100) * maxTime
  
  jumpToTime(time)
  progress.value = percentage
}

function handleSliderDrag(e: MouseEvent) {
  if (!isDragging.value) return
  handleSliderClick(e)
}

function startDrag() {
  isDragging.value = true
}

function stopDrag() {
  isDragging.value = false
}
</script>

<template>
  <div class="bg-gray-900/80 rounded-lg p-4 border border-gray-800">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span class="text-xl">⏱️</span>
        <span class="font-vt323 text-diary-fresh text-xl glow-text">
          {{ displayTime }}
        </span>
      </div>
      
      <div class="flex items-center gap-2">
        <span class="text-gray-400 font-vt323 text-sm">速度:</span>
        <select
          :value="speed"
          @change="setSpeed(Number(($event.target as HTMLSelectElement).value))"
          class="bg-gray-800 text-diary-fresh font-vt323 px-2 py-1 rounded border border-gray-700 outline-none focus:border-diary-fresh"
        >
          <option v-for="s in speedOptions" :key="s" :value="s">
            {{ s }}x
          </option>
        </select>
      </div>
    </div>
    
    <div 
      ref="sliderRef"
      class="timeline-track mb-3"
      @click="handleSliderClick"
      @mousedown="startDrag"
      @mousemove="handleSliderDrag"
      @mouseup="stopDrag"
      @mouseleave="stopDrag"
    >
      <div 
        class="timeline-progress"
        :style="{ width: `${progress}%` }"
      ></div>
      <div 
        class="timeline-thumb"
        :style="{ left: `${progress}%`, transform: 'translateX(-50%)' }"
      ></div>
    </div>
    
    <div class="flex items-center justify-center gap-3">
      <button
        class="btn-pixel text-gray-400 border-gray-600"
        :class="{ 'glitch-effect': isRewinding }"
        @click="rewind(100)"
        title="后退 100 单位"
      >
        ⏪ 快退
      </button>
      
      <button
        class="btn-pixel text-diary-fresh border-diary-fresh px-6"
        @click="togglePlayPause"
      >
        {{ isRunning ? '⏸️ 暂停' : '▶️ 播放' }}
      </button>
      
      <button
        class="btn-pixel text-gray-400 border-gray-600"
        :class="{ 'glitch-effect': isFastForwarding }"
        @click="fastForward(100)"
        title="快进 100 单位"
      >
        快进 ⏩
      </button>
    </div>
    
    <div class="mt-3 text-center text-gray-500 font-vt323 text-xs">
      独立时间轴 · 不依赖系统时间 · {{ isRunning ? '运行中' : '已暂停' }}
    </div>
  </div>
</template>
