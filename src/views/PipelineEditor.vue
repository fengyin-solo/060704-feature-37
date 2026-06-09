<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDiary } from '@/composables/useDiary'
import { pluginLoader } from '@/engine/PluginLoader'
import { renderPipeline } from '@/engine/RenderPipeline'
import type { DecayMethod, PipelineStep } from '@/types'

const route = useRoute()
const router = useRouter()
const diaryId = computed(() => route.params.id as string)

const {
  currentDiary,
  renderToCanvas,
  reorderPipeline,
  updateMethodParams,
  toggleMethod,
  addMethodToPipeline,
  removeMethodFromPipeline
} = useDiary(diaryId.value)

const canvasRef = ref<HTMLCanvasElement | null>(null)
const previewDecayLevel = ref(0.5)
const draggedItem = ref<string | null>(null)
const selectedMethodId = ref<string | null>(null)

const allMethods = computed(() => pluginLoader.getDecayMethods())

const pipelineMethods = computed(() => {
  if (!currentDiary.value) return []
  return [...currentDiary.value.pipeline]
    .sort((a, b) => a.order - b.order)
    .map(step => ({
      ...step,
      method: allMethods.value.get(step.methodId)
    }))
    .filter(step => step.method) as (PipelineStep & { method: DecayMethod })[]
})

const availableMethods = computed(() => {
  const pipelineIds = new Set(currentDiary.value?.pipeline.map(s => s.methodId) || [])
  return Array.from(allMethods.value.entries())
    .filter(([id]) => !pipelineIds.has(id))
    .map(([id, method]) => ({ id, method }))
})

const selectedMethod = computed(() => {
  if (!selectedMethodId.value) return null
  return currentDiary.value?.pipeline.find(s => s.methodId === selectedMethodId.value)
})

const selectedMethodInfo = computed(() => {
  if (!selectedMethodId.value) return null
  return allMethods.value.get(selectedMethodId.value)
})

function render() {
  if (!canvasRef.value || !currentDiary.value) return
  
  const ctx = canvasRef.value.getContext('2d')
  if (!ctx) return
  
  renderPipeline.renderPreview(
    currentDiary.value.content,
    currentDiary.value.pipeline,
    previewDecayLevel.value,
    ctx
  )
}

let renderInterval: number | null = null

onMounted(() => {
  render()
  renderInterval = window.setInterval(render, 100)
})

watch(() => currentDiary.value?.pipeline, () => {
  render()
}, { deep: true })

watch(previewDecayLevel, () => {
  render()
})

function handleDragStart(methodId: string) {
  draggedItem.value = methodId
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
}

function handleDrop(targetMethodId: string) {
  if (!draggedItem.value || draggedItem.value === targetMethodId || !currentDiary.value) {
    draggedItem.value = null
    return
  }
  
  const currentOrder = pipelineMethods.value.map(s => s.methodId)
  const draggedIndex = currentOrder.indexOf(draggedItem.value)
  const targetIndex = currentOrder.indexOf(targetMethodId)
  
  if (draggedIndex === -1 || targetIndex === -1) {
    draggedItem.value = null
    return
  }
  
  const newOrder = [...currentOrder]
  newOrder.splice(draggedIndex, 1)
  newOrder.splice(targetIndex, 0, draggedItem.value)
  
  reorderPipeline(newOrder)
  draggedItem.value = null
}

function handleAddMethod(methodId: string) {
  addMethodToPipeline(methodId)
}

function handleRemoveMethod(methodId: string) {
  removeMethodFromPipeline(methodId)
  if (selectedMethodId.value === methodId) {
    selectedMethodId.value = null
  }
}

function handleToggleMethod(methodId: string) {
  toggleMethod(methodId)
}

function handleParamChange(methodId: string, paramName: string, value: number) {
  updateMethodParams(methodId, { [paramName]: value })
}

function goBack() {
  router.back()
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
      <h1 class="font-vt323 text-2xl text-diary-fresh glow-text">
        ⚙️ 渲染管线编辑器 - {{ currentDiary.title }}
      </h1>
      <div class="w-20"></div>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="space-y-4">
        <div class="bg-gray-900/80 rounded-lg p-4 border border-gray-800">
          <h3 class="font-vt323 text-lg text-diary-fresh mb-3">
            📺 实时预览
          </h3>
          
          <div class="crt-container rounded overflow-hidden border border-gray-700">
            <canvas
              ref="canvasRef"
              width="500"
              height="350"
              class="w-full h-auto block"
            ></canvas>
          </div>
          
          <div class="mt-3">
            <label class="block font-vt323 text-gray-400 mb-1 text-sm">
              衰变等级预览: {{ Math.floor(previewDecayLevel * 100) }}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              v-model.number="previewDecayLevel"
              class="w-full accent-diary-fresh"
            />
          </div>
        </div>
        
        <div class="bg-gray-900/80 rounded-lg p-4 border border-gray-800">
          <h3 class="font-vt323 text-lg text-diary-fresh mb-3">
            ➕ 可用烂法
          </h3>
          
          <div v-if="availableMethods.length === 0" class="text-gray-500 text-sm font-vt323 py-4 text-center">
            所有烂法都已添加到管线中
          </div>
          
          <div v-else class="grid grid-cols-2 gap-2">
            <button
              v-for="{ id, method } in availableMethods"
              :key="id"
              class="p-3 rounded border-2 border-gray-700 bg-gray-800/50 hover:border-diary-fresh hover:bg-diary-fresh/10 transition-all text-left"
              @click="handleAddMethod(id)"
            >
              <div class="font-vt323 text-sm">{{ method.name }}</div>
              <div class="text-xs text-gray-500 mt-1">{{ method.description }}</div>
            </button>
          </div>
        </div>
      </div>
      
      <div class="space-y-4">
        <div class="bg-gray-900/80 rounded-lg p-4 border border-gray-800">
          <h3 class="font-vt323 text-lg text-diary-fresh mb-3">
            🔗 当前管线 (拖拽排序)
          </h3>
          
          <div v-if="pipelineMethods.length === 0" class="text-gray-500 text-sm font-vt323 py-8 text-center">
            管线为空，添加一些烂法吧
          </div>
          
          <div v-else class="space-y-2">
            <div
              v-for="(step, index) in pipelineMethods"
              :key="step.methodId"
              class="pipeline-node flex items-center gap-3"
              :class="{ 
                'dragging': draggedItem === step.methodId,
                'enabled': step.enabled
              }"
              draggable="true"
              @dragstart="handleDragStart(step.methodId)"
              @dragover="handleDragOver"
              @drop="handleDrop(step.methodId)"
              @click="selectedMethodId = step.methodId"
            >
              <div class="cursor-grab text-gray-500 text-lg">
                ⋮⋮
              </div>
              <div class="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-vt323">
                {{ index + 1 }}
              </div>
              <div class="flex-1">
                <div class="font-vt323">{{ step.method.name }}</div>
                <div class="text-xs text-gray-500">{{ step.method.description }}</div>
              </div>
              <div class="flex items-center gap-2">
                <button
                  class="w-8 h-8 rounded flex items-center justify-center transition-all"
                  :class="step.enabled ? 'bg-diary-fresh/20 text-diary-fresh' : 'bg-gray-700 text-gray-500'"
                  @click.stop="handleToggleMethod(step.methodId)"
                  title="启用/禁用"
                >
                  {{ step.enabled ? '✓' : '✕' }}
                </button>
                <button
                  class="w-8 h-8 rounded bg-red-900/50 text-red-400 hover:bg-red-900 flex items-center justify-center transition-all"
                  @click.stop="handleRemoveMethod(step.methodId)"
                  title="移除"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
          
          <p class="text-xs text-gray-500 mt-3 font-vt323">
            提示: 拖拽调整渲染顺序，点击编辑参数
          </p>
        </div>
        
        <div 
          v-if="selectedMethod && selectedMethodInfo"
          class="bg-gray-900/80 rounded-lg p-4 border border-diary-fresh"
        >
          <h3 class="font-vt323 text-lg text-diary-fresh mb-3">
            🎛️ 参数调节 - {{ selectedMethodInfo.name }}
          </h3>
          
          <div class="space-y-4">
            <div v-for="(def, paramName) in selectedMethodInfo.params" :key="paramName">
              <div class="flex justify-between mb-1">
                <label class="font-vt323 text-sm text-gray-300">
                  {{ paramName }}
                </label>
                <span class="font-vt323 text-sm text-diary-fresh">
                  {{ selectedMethod.params[paramName] ?? def.default }}
                </span>
              </div>
              <input
                type="range"
                :min="def.min"
                :max="def.max"
                :step="(def.max - def.min) / 100"
                :value="selectedMethod.params[paramName] ?? def.default"
                class="w-full accent-diary-fresh"
                @input="handleParamChange(selectedMethod.methodId, paramName, Number(($event.target as HTMLInputElement).value))"
              />
              <div class="flex justify-between text-xs text-gray-600 font-vt323 mt-1">
                <span>{{ def.min }}</span>
                <span>默认: {{ def.default }}</span>
                <span>{{ def.max }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
