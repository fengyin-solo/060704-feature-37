<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDiaryStore } from '@/stores/diary'
import { pluginLoader } from '@/engine/PluginLoader'
import HallNavigator from '@/components/gallery/HallNavigator.vue'
import SectionIntro from '@/components/gallery/SectionIntro.vue'
import ExhibitCard from '@/components/gallery/ExhibitCard.vue'
import type { GalleryHall, GallerySection } from '@/types'

const diaryStore = useDiaryStore()

const halls = ref<GalleryHall[]>([])
const currentHallId = ref('theme-hall')
const currentSectionId = ref('love-letters')
const isLoading = ref(true)

const currentHall = computed(() => {
  return halls.value.find(h => h.id === currentHallId.value) || halls.value[0]
})

const currentSection = computed((): GallerySection | null => {
  if (!currentHall.value) return null
  return currentHall.value.sections.find(s => s.id === currentSectionId.value) || currentHall.value.sections[0] || null
})

const exhibits = computed(() => {
  if (!currentSection.value) return []
  return diaryStore.getExhibitsBySection(currentSection.value)
})

const totalExhibitCount = computed(() => {
  return diaryStore.publicDiaries.length
})

async function init() {
  isLoading.value = true
  await pluginLoader.loadAll()
  halls.value = diaryStore.getGalleryHalls()
  
  if (halls.value.length > 0) {
    currentHallId.value = halls.value[0].id
    if (halls.value[0].sections.length > 0) {
      currentSectionId.value = halls.value[0].sections[0].id
    }
  }
  
  isLoading.value = false
}

function handleSelectHall(hallId: string) {
  currentHallId.value = hallId
  const hall = halls.value.find(h => h.id === hallId)
  if (hall && hall.sections.length > 0) {
    currentSectionId.value = hall.sections[0].id
  }
}

function handleSelectSection(sectionId: string) {
  currentSectionId.value = sectionId
}

onMounted(() => {
  init()
})
</script>

<template>
  <div class="space-y-6">
    <div class="text-center py-8 bg-gradient-to-b from-gray-900/50 to-transparent rounded-lg">
      <div class="text-6xl mb-4">🏛️</div>
      <h1 class="font-vt323 text-4xl text-diary-fresh glow-text mb-2">
        公开展陈馆
      </h1>
      <p class="text-gray-400 font-vt323 text-lg mb-2">
        漫步于数字腐朽的艺术殿堂，感受时间赋予的独特美学
      </p>
      <p class="text-gray-500 font-vt323 text-sm">
        目前馆内共展出 <span class="text-diary-fresh">{{ totalExhibitCount }}</span> 件公开作品
      </p>
    </div>

    <div class="ascii-divider text-gray-700">
      ================================================================================
    </div>

    <div v-if="isLoading" class="text-center py-16">
      <div class="text-4xl mb-4 animate-pulse">🎨</div>
      <p class="text-gray-500 font-vt323 text-xl">正在布置展厅...</p>
    </div>

    <template v-else>
      <HallNavigator
        :halls="halls"
        :current-hall-id="currentHallId"
        :current-section-id="currentSectionId"
        @select-hall="handleSelectHall"
        @select-section="handleSelectSection"
      />

      <SectionIntro
        :section="currentSection"
        :exhibit-count="exhibits.length"
      />

      <div v-if="exhibits.length === 0" class="text-center py-16 bg-gray-900/30 rounded-lg border border-gray-800">
        <div class="text-6xl mb-4 opacity-50">🖼️</div>
        <p class="text-gray-500 font-vt323 text-xl mb-2">
          此展区暂无展品
        </p>
        <p class="text-gray-600 font-vt323 text-sm">
          试试切换到其他展区，也许会有惊喜发现
        </p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <ExhibitCard
          v-for="exhibit in exhibits"
          :key="exhibit.diary.id"
          :exhibit="exhibit"
        />
      </div>
    </template>

    <div class="ascii-divider text-gray-700 mt-12">
      ================================================================================
    </div>

    <div class="text-center text-gray-600 font-vt323 text-sm py-4">
      <p>💡 小贴士：每篇日记都在随时间不断变化，现在看到的样子，下次再来可能就不同了</p>
    </div>
  </div>
</template>
