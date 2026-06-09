import { ref, computed } from 'vue'
import { useInventoryStore } from '@/stores/inventory'
import { pluginLoader } from '@/engine/PluginLoader'
import { ItemRarity, RARITY_NAMES, RARITY_COLORS } from '@/types'
import type { Item, Recipe } from '@/types'

export function useItems() {
  const inventoryStore = useInventoryStore()
  
  const itemsByRarity = computed(() => {
    const result: Record<ItemRarity, { item: Item; count: number }[]> = {
      [ItemRarity.COMMON]: [],
      [ItemRarity.RARE]: [],
      [ItemRarity.EPIC]: []
    }
    
    inventoryStore.inventory.forEach(invItem => {
      const item = pluginLoader.getItem(invItem.itemId)
      if (item) {
        result[item.rarity].push({ item, count: invItem.count })
      }
    })
    
    return result
  })
  
  const availableRecipes = computed(() => {
    return inventoryStore.getAvailableRecipes()
  })
  
  const allRecipes = computed(() => {
    return inventoryStore.recipes
  })
  
  const canCraftAny = computed(() => {
    return availableRecipes.value.length > 0
  })

  function getItemInfo(itemId: string): Item | undefined {
    return pluginLoader.getItem(itemId)
  }

  function getItemCount(itemId: string): number {
    return inventoryStore.getItemCount(itemId)
  }

  function canCraftRecipe(recipe: Recipe): boolean {
    return inventoryStore.canCraft(recipe)
  }

  function craftItem(recipe: Recipe): boolean {
    return inventoryStore.craft(recipe)
  }

  function useItem(itemId: string, diaryId: string): boolean {
    return inventoryStore.useItem(itemId, diaryId)
  }

  function getRarityName(rarity: ItemRarity): string {
    return RARITY_NAMES[rarity]
  }

  function getRarityColor(rarity: ItemRarity): string {
    return RARITY_COLORS[rarity]
  }

  function getRecipeInputNames(recipe: Recipe): string[] {
    return recipe.inputs.map(input => {
      const item = pluginLoader.getItem(input.itemId)
      return item ? `${item.name} x${input.count}` : input.itemId
    })
  }

  function getRecipeOutputName(recipe: Recipe): string {
    const item = pluginLoader.getItem(recipe.output.itemId)
    return item ? `${item.name} x${recipe.output.count}` : recipe.output.itemId
  }

  return {
    itemsByRarity,
    availableRecipes,
    allRecipes,
    canCraftAny,
    getItemInfo,
    getItemCount,
    canCraftRecipe,
    craftItem,
    useItem,
    getRarityName,
    getRarityColor,
    getRecipeInputNames,
    getRecipeOutputName
  }
}
