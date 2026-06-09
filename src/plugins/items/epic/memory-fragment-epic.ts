import type { Item } from '@/types'
import { ItemRarity } from '@/types'

const memoryFragmentEpic: Item = {
  id: 'memoryFragment_epic',
  name: '高级记忆碎片',
  rarity: ItemRarity.EPIC,
  description: '清除所有渲染管线效果，恢复原始内容',
  icon: '🌟',
  targetTypes: ['base', 'loveLetter', 'nightmare'],
  effectiveness: {
    base: 1,
    loveLetter: 1.2,
    nightmare: 2.0
  },
  effect: (diary) => {
    return {
      ...diary,
      pipeline: []
    }
  }
}

export default memoryFragmentEpic
