import type { DiaryType } from '@/types'
import { createDefaultTransitions } from '@/engine/StateMachine'

const base: DiaryType = {
  id: 'base',
  name: '基础日记',
  decayRate: 1,
  transitions: createDefaultTransitions(),
  itemEffectModifiers: {
    repairPatch: 1,
    timeCrystal: 1,
    memoryFragment: 1
  }
}

export default base
