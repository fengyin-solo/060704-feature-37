import type { Item } from '@/types'
import { ItemRarity, DiaryState } from '@/types'

const repairPatchRare: Item = {
  id: 'repairPatch_rare',
  name: '中级修复补丁',
  rarity: ItemRarity.RARE,
  description: '修复中等损伤，回退两个状态阶段',
  icon: '🪡',
  targetTypes: ['base', 'loveLetter', 'nightmare'],
  effectiveness: {
    base: 1,
    loveLetter: 1.5,
    nightmare: 0.5
  },
  effect: (diary) => {
    const stateOrder = [
      DiaryState.FRESH,
      DiaryState.ROTTING,
      DiaryState.ROTTED,
      DiaryState.DYING,
      DiaryState.DEAD
    ]
    
    const currentIndex = stateOrder.indexOf(diary.state)
    if (currentIndex <= 0) {
      return diary
    }
    
    const newIndex = Math.max(0, currentIndex - 2)
    
    return {
      ...diary,
      state: stateOrder[newIndex],
      frozen: false,
      tombstone: undefined
    }
  }
}

export default repairPatchRare
