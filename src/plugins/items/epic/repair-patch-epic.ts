import type { Item } from '@/types'
import { ItemRarity, DiaryState } from '@/types'

const repairPatchEpic: Item = {
  id: 'repairPatch_epic',
  name: '高级修复补丁',
  rarity: ItemRarity.EPIC,
  description: '完全修复，直接恢复到新鲜状态',
  icon: '✨',
  targetTypes: ['base', 'loveLetter', 'nightmare'],
  effectiveness: {
    base: 1,
    loveLetter: 1.5,
    nightmare: 0.5
  },
  effect: (diary) => {
    return {
      ...diary,
      state: DiaryState.FRESH,
      frozen: false,
      tombstone: undefined
    }
  }
}

export default repairPatchEpic
