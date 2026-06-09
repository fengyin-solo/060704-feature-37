<script setup lang="ts">
import { ref, computed } from 'vue'
import { useItems } from '@/composables/useItems'
import { ItemRarity, RARITY_NAMES, RARITY_COLORS } from '@/types'
import type { Item, Recipe } from '@/types'
import { pluginLoader } from '@/engine/PluginLoader'

const {
  itemsByRarity,
  allRecipes,
  canCraftRecipe,
  craftItem,
  getRecipeInputNames,
  getRecipeOutputName
} = useItems()

const activeTab = ref<'items' | 'craft'>('items')
const craftingMessage = ref<string | null>(null)
const messageType = ref<'success' | 'error'>('success')

const rarityOrder: ItemRarity[] = [
  ItemRarity.EPIC,
  ItemRarity.RARE,
  ItemRarity.COMMON
]

const totalItems = computed(() => {
  let count = 0
  Object.values(itemsByRarity.value).forEach(items => {
    items.forEach(i => count += i.count)
  })
  return count
})

function showMessage(msg: string, type: 'success' | 'error') {
  craftingMessage.value = msg
  messageType.value = type
  setTimeout(() => {
    craftingMessage.value = null
  }, 2000)
}

function handleCraft(recipe: Recipe) {
  const success = craftItem(recipe)
  if (success) {
    const outputName = getRecipeOutputName(recipe)
    showMessage(`✓ 合成成功: ${outputName}`, 'success')
  } else {
    showMessage('✗ 合成失败：材料不足', 'error')
  }
}

function getItemEffectivenessText(item: Item): string {
  const entries = Object.entries(item.effectiveness)
  return entries.map(([type, val]) => {
    const diaryType = pluginLoader.getDiaryType(type)
    const typeName = diaryType?.name || type
    return `${typeName}: ${val}x`
  }).join(' | ')
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="font-vt323 text-3xl text-diary-fresh glow-text mb-1">
          🎒 道具仓库
        </h1>
        <p class="text-gray-400 font-vt323">
          总道具数量: <span class="text-diary-fresh">{{ totalItems }}</span>
        </p>
      </div>
    </div>

    <div class="flex gap-2 border-b border-gray-700">
      <button
        class="px-6 py-2 font-vt323 text-lg transition-all border-b-2 -mb-px"
        :class="[
          activeTab === 'items'
            ? 'text-diary-fresh border-diary-fresh'
            : 'text-gray-500 border-transparent hover:text-gray-300'
        ]"
        @click="activeTab = 'items'"
      >
        📦 我的道具
      </button>
      <button
        class="px-6 py-2 font-vt323 text-lg transition-all border-b-2 -mb-px"
        :class="[
          activeTab === 'craft'
            ? 'text-diary-fresh border-diary-fresh'
            : 'text-gray-500 border-transparent hover:text-gray-300'
        ]"
        @click="activeTab = 'craft'"
      >
        ⚗️ 合成台
      </button>
    </div>

    <transition name="fade">
      <div
        v-if="craftingMessage"
        class="p-3 rounded font-vt323 text-center"
        :class="[
          messageType === 'success'
            ? 'bg-green-900/30 border border-green-500 text-green-400'
            : 'bg-red-900/30 border border-red-500 text-red-400'
        ]"
      >
        {{ craftingMessage }}
      </div>
    </transition>

    <div v-if="activeTab === 'items'" class="space-y-8">
      <div
        v-for="rarity in rarityOrder"
        :key="rarity"
        class="space-y-3"
      >
        <div class="flex items-center gap-2">
          <div
            class="w-3 h-3 rounded-full"
            :style="{ backgroundColor: RARITY_COLORS[rarity] }"
          />
          <h2
            class="font-vt323 text-xl"
            :style="{ color: RARITY_COLORS[rarity] }"
          >
            {{ RARITY_NAMES[rarity] }}道具
          </h2>
          <span class="text-gray-500 font-vt323">
            ({{ itemsByRarity[rarity].reduce((sum, i) => sum + i.count, 0) }})
          </span>
        </div>

        <div v-if="itemsByRarity[rarity].length === 0" class="text-center py-8 bg-gray-800/30 rounded border border-gray-700 border-dashed">
          <p class="text-gray-500 font-vt323">暂无此类道具</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="{ item, count } in itemsByRarity[rarity]"
            :key="item.id"
            class="p-4 rounded-lg border-2 bg-gray-800/50 transition-all hover:scale-[1.02]"
            :style="{ borderColor: RARITY_COLORS[item.rarity] + '40' }"
          >
            <div class="flex items-start gap-3">
              <div class="text-4xl">{{ item.icon }}</div>
              <div class="flex-1">
                <div class="flex items-center justify-between">
                  <h3
                    class="font-vt323 text-lg"
                    :style="{ color: RARITY_COLORS[item.rarity] }"
                  >
                    {{ item.name }}
                  </h3>
                  <span
                    class="px-2 py-0.5 rounded text-sm font-vt323"
                    :style="{ 
                      backgroundColor: RARITY_COLORS[item.rarity] + '20',
                      color: RARITY_COLORS[item.rarity]
                    }"
                  >
                    x{{ count }}
                  </span>
                </div>
                <p class="text-gray-400 text-sm mt-1 font-mono">
                  {{ item.description }}
                </p>
                <div class="mt-3 pt-3 border-t border-gray-700">
                  <p class="text-xs text-gray-500 font-vt323">
                    适用类型: {{ item.targetTypes.map(t => {
                      const dt = pluginLoader.getDiaryType(t)
                      return dt?.name || t
                    }).join(', ') }}
                  </p>
                  <p class="text-xs text-gray-500 font-vt323 mt-1">
                    效果倍率: {{ getItemEffectivenessText(item) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="space-y-4">
      <div class="ascii-divider">
        ----------------------------------------------------------------
      </div>
      <p class="text-gray-400 font-vt323 text-center mb-6">
        合成规则：3个低级 → 1个中级 | 3个中级 → 1个高级
      </p>

      <div v-if="allRecipes.length === 0" class="text-center py-16 bg-gray-800/30 rounded border border-gray-700 border-dashed">
        <div class="text-6xl mb-4">⚗️</div>
        <p class="text-gray-500 font-vt323 text-xl">暂无可用配方</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="recipe in allRecipes"
          :key="recipe.output.itemId"
          class="p-4 rounded-lg border-2 bg-gray-800/50 transition-all"
          :class="[
            canCraftRecipe(recipe)
              ? 'border-diary-fresh/40 hover:border-diary-fresh'
              : 'border-gray-700 opacity-60'
          ]"
        >
          <div class="flex items-center justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-gray-400 font-vt323">配方:</span>
              </div>
              <div class="flex items-center gap-2 flex-wrap">
                <template v-for="(input, idx) in recipe.inputs" :key="input.itemId">
                  <span class="text-gray-300 font-vt323">
                    {{ getRecipeInputNames(recipe)[idx] }}
                  </span>
                  <span v-if="idx < recipe.inputs.length - 1" class="text-gray-500">+</span>
                </template>
              </div>
              <div class="flex items-center gap-2 mt-2">
                <span class="text-diary-fresh font-vt323 text-xl">→</span>
                <span class="text-diary-fresh font-vt323 text-lg glow-text">
                  {{ getRecipeOutputName(recipe) }}
                </span>
              </div>
            </div>
            <button
              class="btn-pixel px-4 py-2 font-vt323 whitespace-nowrap"
              :class="[
                canCraftRecipe(recipe)
                  ? 'text-diary-fresh border-diary-fresh'
                  : 'text-gray-600 border-gray-700 cursor-not-allowed'
              ]"
              :disabled="!canCraftRecipe(recipe)"
              @click="handleCraft(recipe)"
            >
              {{ canCraftRecipe(recipe) ? '⚗️ 合成' : '材料不足' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="ascii-divider mt-8">
      ----------------------------------------------------------------
    </div>

    <div class="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
      <h3 class="font-vt323 text-lg text-diary-fresh mb-2">💡 道具使用说明</h3>
      <ul class="text-gray-400 font-vt323 text-sm space-y-1">
        <li>• <span class="text-diary-fresh">修复补丁</span>：回退日记的腐烂状态</li>
        <li>• <span class="text-diary-frozen">时间水晶</span>：延后日记创建时间，相当于冻结一段时间</li>
        <li>• <span class="text-diary-rotted">记忆碎片</span>：清除渲染管线效果，让日记恢复清晰</li>
        <li>• 不同日记类型对道具的敏感度不同，情书对修复道具更敏感</li>
        <li>• 道具可在日记详情页中使用</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
