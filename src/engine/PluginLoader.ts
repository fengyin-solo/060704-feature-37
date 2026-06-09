import type { DecayMethod, DiaryType, Item, TombstoneStyle, Recipe } from '@/types'
import { renderPipeline } from './RenderPipeline'

const kebabToCamel = (str: string): string => {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
}

const getFileNameFromPath = (path: string): string => {
  const parts = path.split('/')
  const fileName = parts[parts.length - 1]
  return fileName.replace(/\.(ts|js)$/, '')
}

export class PluginLoader {
  private loadedDecayMethods: Map<string, DecayMethod> = new Map()
  private loadedDiaryTypes: Map<string, DiaryType> = new Map()
  private loadedItems: Map<string, Item> = new Map()
  private loadedTombstones: Map<string, TombstoneStyle> = new Map()
  private recipes: Recipe[] = []
  private isLoaded: boolean = false

  async loadAll(): Promise<void> {
    if (this.isLoaded) return
    
    await Promise.all([
      this.loadDecayMethods(),
      this.loadDiaryTypes(),
      this.loadItems(),
      this.loadTombstones()
    ])
    
    this.generateRecipes()
    this.isLoaded = true
  }

  async loadDecayMethods(): Promise<Map<string, DecayMethod>> {
    const modules = import.meta.glob('/src/plugins/decay-methods/*.ts', {
      import: 'default',
      eager: false
    }) as Record<string, () => Promise<DecayMethod>>
    
    const promises = Object.entries(modules).map(async ([path, loader]) => {
      try {
        const method = await loader()
        const fileName = getFileNameFromPath(path)
        const id = method.id || kebabToCamel(fileName)
        const finalMethod = { ...method, id }
        
        this.loadedDecayMethods.set(id, finalMethod)
        renderPipeline.registerMethod(finalMethod)
        
        return finalMethod
      } catch (e) {
        console.error(`Failed to load decay method ${path}:`, e)
        return null
      }
    })
    
    await Promise.all(promises)
    return this.loadedDecayMethods
  }

  async loadDiaryTypes(): Promise<Map<string, DiaryType>> {
    const modules = import.meta.glob('/src/plugins/diary-types/*.ts', {
      import: 'default',
      eager: false
    }) as Record<string, () => Promise<DiaryType>>
    
    const tempTypes: Map<string, DiaryType> = new Map()
    
    const promises = Object.entries(modules).map(async ([path, loader]) => {
      try {
        const type = await loader()
        const fileName = getFileNameFromPath(path)
        const id = type.id || kebabToCamel(fileName)
        const finalType = { ...type, id }
        
        tempTypes.set(id, finalType)
        return finalType
      } catch (e) {
        console.error(`Failed to load diary type ${path}:`, e)
        return null
      }
    })
    
    await Promise.all(promises)
    
    this.loadedDiaryTypes = this.resolveInheritance(tempTypes)
    return this.loadedDiaryTypes
  }

  private resolveInheritance(types: Map<string, DiaryType>): Map<string, DiaryType> {
    const resolved = new Map<string, DiaryType>()
    
    const resolve = (id: string, visited: Set<string> = new Set()): DiaryType | null => {
      if (visited.has(id)) {
        console.error(`Circular inheritance detected for type ${id}`)
        return null
      }
      
      if (resolved.has(id)) {
        return resolved.get(id)!
      }
      
      const type = types.get(id)
      if (!type) return null
      
      if (!type.extends) {
        resolved.set(id, type)
        return type
      }
      
      visited.add(id)
      const parent = resolve(type.extends, visited)
      visited.delete(id)
      
      if (!parent) {
        resolved.set(id, type)
        return type
      }
      
      const merged: DiaryType = {
        ...type,
        id: type.id,
        name: type.name,
        decayRate: type.decayRate ?? parent.decayRate,
        transitions: type.transitions.length > 0 ? type.transitions : parent.transitions,
        deathEffect: type.deathEffect ?? parent.deathEffect,
        itemEffectModifiers: {
          ...parent.itemEffectModifiers,
          ...type.itemEffectModifiers
        }
      }
      
      resolved.set(id, merged)
      return merged
    }
    
    for (const id of types.keys()) {
      resolve(id)
    }
    
    return resolved
  }

  async loadItems(): Promise<Map<string, Item>> {
    const modules = import.meta.glob('/src/plugins/items/**/*.ts', {
      import: 'default',
      eager: false
    }) as Record<string, () => Promise<Item>>
    
    const promises = Object.entries(modules).map(async ([path, loader]) => {
      try {
        const item = await loader()
        const fileName = getFileNameFromPath(path)
        const id = item.id || kebabToCamel(fileName)
        const finalItem = { ...item, id }
        
        this.loadedItems.set(id, finalItem)
        return finalItem
      } catch (e) {
        console.error(`Failed to load item ${path}:`, e)
        return null
      }
    })
    
    await Promise.all(promises)
    return this.loadedItems
  }

  async loadTombstones(): Promise<Map<string, TombstoneStyle>> {
    const modules = import.meta.glob('/src/plugins/tombstones/*.ts', {
      import: 'default',
      eager: false
    }) as Record<string, () => Promise<TombstoneStyle>>
    
    const promises = Object.entries(modules).map(async ([path, loader]) => {
      try {
        const tombstone = await loader()
        const fileName = getFileNameFromPath(path)
        const id = tombstone.id || kebabToCamel(fileName)
        const finalTombstone = { ...tombstone, id }
        
        this.loadedTombstones.set(id, finalTombstone)
        return finalTombstone
      } catch (e) {
        console.error(`Failed to load tombstone ${path}:`, e)
        return null
      }
    })
    
    await Promise.all(promises)
    return this.loadedTombstones
  }

  private generateRecipes(): void {
    const recipes: Recipe[] = []
    const commonItems = Array.from(this.loadedItems.values())
    
    const baseNames = new Set<string>()
    commonItems.forEach(item => {
      const baseName = item.id.replace(/_(common|rare|epic)$/, '')
      baseNames.add(baseName)
    })
    
    baseNames.forEach(baseName => {
      const common = this.loadedItems.get(`${baseName}_common`)
      const rare = this.loadedItems.get(`${baseName}_rare`)
      const epic = this.loadedItems.get(`${baseName}_epic`)
      
      if (common && rare) {
        recipes.push({
          inputs: [{ itemId: common.id, count: 3 }],
          output: { itemId: rare.id, count: 1 }
        })
      }
      
      if (rare && epic) {
        recipes.push({
          inputs: [{ itemId: rare.id, count: 3 }],
          output: { itemId: epic.id, count: 1 }
        })
      }
    })
    
    this.recipes = recipes
  }

  getDecayMethods(): Map<string, DecayMethod> {
    return this.loadedDecayMethods
  }

  getDiaryTypes(): Map<string, DiaryType> {
    return this.loadedDiaryTypes
  }

  getItems(): Map<string, Item> {
    return this.loadedItems
  }

  getTombstones(): Map<string, TombstoneStyle> {
    return this.loadedTombstones
  }

  getRecipes(): Recipe[] {
    return this.recipes
  }

  getDiaryType(id: string): DiaryType | undefined {
    return this.loadedDiaryTypes.get(id)
  }

  getItem(id: string): Item | undefined {
    return this.loadedItems.get(id)
  }

  getTombstone(id: string): TombstoneStyle | undefined {
    return this.loadedTombstones.get(id)
  }

  async hotReload(): Promise<void> {
    this.isLoaded = false
    this.loadedDecayMethods.clear()
    this.loadedDiaryTypes.clear()
    this.loadedItems.clear()
    this.loadedTombstones.clear()
    this.recipes = []
    
    await this.loadAll()
  }
}

export const pluginLoader = new PluginLoader()
