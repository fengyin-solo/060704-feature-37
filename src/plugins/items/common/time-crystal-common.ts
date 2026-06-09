import type { Item } from '@/types'
import { ItemRarity } from '@/types'

const timeCrystalCommon: Item = {
  id: 'timeCrystal_common',
  name: '低级时间水晶',
  rarity: ItemRarity.COMMON,
  description: '将日记创建时间延后，减少已流逝时间',
  icon: '💎',
  targetTypes: ['base', 'loveLetter', 'nightmare'],
  effectiveness: {
    base: 1,
    loveLetter: 0.8,
    nightmare: 1.2
  },
  effect: (diary) => {
    return {
      ...diary,
      createdAt: diary.createdAt + 100
    }
  }
}

export default timeCrystalCommon
