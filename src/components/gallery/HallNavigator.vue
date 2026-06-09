<script setup lang="ts">
import { computed } from 'vue'
import type { GalleryHall, GallerySection } from '@/types'

interface Props {
  halls: GalleryHall[]
  currentHallId: string
  currentSectionId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'select-hall': [hallId: string]
  'select-section': [sectionId: string]
}>()

const currentHall = computed(() => {
  return props.halls.find(h => h.id === props.currentHallId) || props.halls[0]
})

function selectHall(hallId: string) {
  emit('select-hall', hallId)
}

function selectSection(sectionId: string) {
  emit('select-section', sectionId)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap gap-3">
      <button
        v-for="hall in halls"
        :key="hall.id"
        class="px-4 py-2 rounded font-vt323 text-lg transition-all border-2 flex items-center gap-2"
        :class="[
          currentHallId === hall.id
            ? 'bg-diary-fresh/20 border-diary-fresh text-diary-fresh glow-text'
            : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
        ]"
        @click="selectHall(hall.id)"
      >
        <span class="text-xl">{{ hall.icon }}</span>
        <span>{{ hall.name }}</span>
      </button>
    </div>

    <div 
      v-if="currentHall"
      class="bg-gray-900/50 rounded-lg border border-gray-800 p-4"
    >
      <div class="flex items-start gap-3 mb-4">
        <span class="text-3xl">{{ currentHall.icon }}</span>
        <div>
          <h2 class="font-vt323 text-2xl text-diary-fresh glow-text mb-1">
            {{ currentHall.name }}
          </h2>
          <p class="text-gray-400 font-vt323 text-sm">
            {{ currentHall.description }}
          </p>
        </div>
      </div>

      <div class="ascii-divider text-gray-700 text-sm mb-4">
        ----------------------------------------------------------------
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          v-for="section in currentHall.sections"
          :key="section.id"
          class="px-3 py-1.5 rounded font-vt323 text-sm transition-all border-2 flex items-center gap-1.5"
          :class="[
            currentSectionId === section.id
              ? 'bg-diary-fresh/20 border-diary-fresh text-diary-fresh'
              : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
          ]"
          @click="selectSection(section.id)"
        >
          <span>{{ section.icon }}</span>
          <span>{{ section.name }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
