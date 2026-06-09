import type { Item } from '@/types'
import { ItemRarity, DiaryState } from '@/types'

const repairPatchCommon: Item = {
  id: 'repairPatch_common',
  name: '低级修复补丁',
  rarity: ItemRarity.COMMON,
  description: '修复轻微损伤，回退一个状态阶段',
  icon: '🧵',
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
    
    return {
      ...diary,
      state: stateOrder[currentIndex - 1],
      frozen: false,
      tombstone: undefined
    }
  }
}

export default repairPatchCommon
