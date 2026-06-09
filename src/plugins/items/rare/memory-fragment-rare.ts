import type { Item } from '@/types'
import { ItemRarity } from '@/types'

const memoryFragmentRare: Item = {
  id: 'memoryFragment_rare',
  name: '中级记忆碎片',
  rarity: ItemRarity.RARE,
  description: '移除一个随机的渲染管线效果',
  icon: '🔮',
  targetTypes: ['base', 'loveLetter', 'nightmare'],
  effectiveness: {
    base: 1,
    loveLetter: 1.2,
    nightmare: 2.0
  },
  effect: (diary) => {
    const enabledSteps = diary.pipeline.filter(s => s.enabled)
    if (enabledSteps.length === 0) return diary
    
    const randomIndex = Math.floor(Math.random() * enabledSteps.length)
    const methodToRemove = enabledSteps[randomIndex].methodId
    
    return {
      ...diary,
      pipeline: diary.pipeline
        .filter(s => s.methodId !== methodToRemove)
        .map((s, i) => ({ ...s, order: i }))
    }
  }
}

export default memoryFragmentRare
