import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { InventoryItem, Recipe } from '@/types'
import { storage } from '@/utils/storage'
import { pluginLoader } from '@/engine/PluginLoader'
import { useDiaryStore } from './diary'

let _currentUserId: string | null = null

export const useInventoryStore = defineStore('inventory', () => {
  const inventory = ref<InventoryItem[]>([])
  const recipes = ref<Recipe[]>([])

  function init(userId: string) {
    _currentUserId = userId
    inventory.value = storage.getInventory(userId)
    recipes.value = pluginLoader.getRecipes()
    
    if (inventory.value.length === 0) {
      createInitialInventory()
    }
  }

  function createInitialInventory() {
    inventory.value = [
      { itemId: 'repairPatch_common', count: 5 },
      { itemId: 'timeCrystal_common', count: 3 },
      { itemId: 'memoryFragment_common', count: 4 },
      { itemId: 'repairPatch_rare', count: 1 },
      { itemId: 'timeCrystal_rare', count: 1 }
    ]
    saveInventory()
  }

  function saveInventory() {
    if (_currentUserId) {
      storage.saveInventory(_currentUserId, inventory.value)
    }
  }

  function getItemCount(itemId: string): number {
    const item = inventory.value.find(i => i.itemId === itemId)
    return item ? item.count : 0
  }

  function addItem(itemId: string, count: number = 1) {
    const existing = inventory.value.find(i => i.itemId === itemId)
    if (existing) {
      existing.count += count
    } else {
      inventory.value.push({ itemId, count })
    }
    saveInventory()
  }

  function removeItem(itemId: string, count: number = 1): boolean {
    const existing = inventory.value.find(i => i.itemId === itemId)
    if (!existing || existing.count < count) return false
    
    existing.count -= count
    if (existing.count <= 0) {
      inventory.value = inventory.value.filter(i => i.itemId !== itemId)
    }
    saveInventory()
    return true
  }

  function canCraft(recipe: Recipe): boolean {
    return recipe.inputs.every(input => 
      getItemCount(input.itemId) >= input.count
    )
  }

  function craft(recipe: Recipe): boolean {
    if (!canCraft(recipe)) return false
    
    recipe.inputs.forEach(input => {
      removeItem(input.itemId, input.count)
    })
    
    addItem(recipe.output.itemId, recipe.output.count)
    return true
  }

  function getAvailableRecipes(): Recipe[] {
    return recipes.value.filter(r => canCraft(r))
  }

  function useItem(itemId: string, diaryId: string): boolean {
    if (!removeItem(itemId, 1)) return false
    
    const item = pluginLoader.getItem(itemId)
    const diaryStore = useDiaryStore()
    
    let diary = diaryStore.getDiaryById(diaryId)
    let isArchived = false
    let archivedId: string | null = null
    
    if (!diary) {
      const archived = diaryStore.archivedDiaries.find(ad => ad.diary.id === diaryId)
      if (archived) {
        diary = archived.diary
        isArchived = true
        archivedId = archived.id
      }
    }
    
    if (!item || !diary) return false
    
    if (!item.targetTypes.includes(diary.type)) return false
    
    const effectiveness = item.effectiveness[diary.type] || 1
    const newDiary = item.effect(diary)
    
    const diaryType = pluginLoader.getDiaryType(diary.type)
    const modifier = diaryType?.itemEffectModifiers[itemId.replace(/_(common|rare|epic)$/, '')] || 1
    
    if (effectiveness * modifier > 0.5) {
      if (isArchived && archivedId) {
        const archived = diaryStore.getArchivedById(archivedId)
        if (archived) {
          archived.diary = newDiary
          storage.saveArchivedDiaries(diaryStore.archivedDiaries)
        }
      } else {
        diaryStore.updateDiary(diaryId, newDiary)
      }
      return true
    }
    
    return false
  }

  return {
    inventory,
    recipes,
    init,
    getItemCount,
    addItem,
    removeItem,
    canCraft,
    craft,
    getAvailableRecipes,
    useItem
  }
})
