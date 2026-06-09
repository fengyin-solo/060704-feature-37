import type { Item } from '@/types'
import { ItemRarity } from '@/types'

const timeCrystalRare: Item = {
  id: 'timeCrystal_rare',
  name: '中级时间水晶',
  rarity: ItemRarity.RARE,
  description: '将日记创建时间大幅延后',
  icon: '💠',
  targetTypes: ['base', 'loveLetter', 'nightmare'],
  effectiveness: {
    base: 1,
    loveLetter: 0.8,
    nightmare: 1.2
  },
  effect: (diary) => {
    return {
      ...diary,
      createdAt: diary.createdAt + 300
    }
  }
}

export default timeCrystalRare
