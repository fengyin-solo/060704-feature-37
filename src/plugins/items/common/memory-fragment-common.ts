import type { Item } from '@/types'
import { ItemRarity } from '@/types'

const memoryFragmentCommon: Item = {
  id: 'memoryFragment_common',
  name: '低级记忆碎片',
  rarity: ItemRarity.COMMON,
  description: '重置所有渲染管线参数为默认值',
  icon: '🧩',
  targetTypes: ['base', 'loveLetter', 'nightmare'],
  effectiveness: {
    base: 1,
    loveLetter: 1.2,
    nightmare: 2.0
  },
  effect: (diary) => {
    const resetPipeline = diary.pipeline.map(step => ({
      ...step,
      params: {}
    }))
    
    return {
      ...diary,
      pipeline: resetPipeline
    }
  }
}

export default memoryFragmentCommon
