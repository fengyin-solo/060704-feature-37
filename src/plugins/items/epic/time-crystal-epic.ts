import type { Item } from '@/types'
import { ItemRarity } from '@/types'
import { globalTimeline } from '@/engine/Timeline'

const timeCrystalEpic: Item = {
  id: 'timeCrystal_epic',
  name: '高级时间水晶',
  rarity: ItemRarity.EPIC,
  description: '冻结日记，永久停止衰变',
  icon: '❄️',
  targetTypes: ['base', 'loveLetter', 'nightmare'],
  effectiveness: {
    base: 1,
    loveLetter: 0.8,
    nightmare: 1.2
  },
  effect: (diary) => {
    return {
      ...diary,
      frozen: true,
      createdAt: globalTimeline.getTime()
    }
  }
}

export default timeCrystalEpic
