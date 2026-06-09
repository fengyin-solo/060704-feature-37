import type { DiaryType, Diary } from '@/types'
import { DiaryState } from '@/types'
import { renderPipeline } from '@/engine/RenderPipeline'

const nightmare: DiaryType = {
  id: 'nightmare',
  name: '噩梦',
  extends: 'base',
  decayRate: 1.5,
  transitions: [
    {
      from: DiaryState.FRESH,
      to: DiaryState.ROTTING,
      condition: (_, elapsed) => elapsed >= 50
    },
    {
      from: DiaryState.ROTTING,
      to: DiaryState.ROTTED,
      condition: (_, elapsed) => elapsed >= 150
    },
    {
      from: DiaryState.ROTTED,
      to: DiaryState.DYING,
      condition: (_, elapsed) => elapsed >= 300
    },
    {
      from: DiaryState.DYING,
      to: DiaryState.DEAD,
      condition: (_, elapsed) => elapsed >= 500
    }
  ],
  deathEffect: (diary: Diary) => {
    const chroma = renderPipeline.getMethod('chroma')
    const pixelate = renderPipeline.getMethod('pixelate')
    
    if (chroma && !diary.pipeline.find(s => s.methodId === 'chroma')) {
      diary.pipeline.push({
        methodId: 'chroma',
        enabled: true,
        params: { offsetX: 15, offsetY: 8 },
        order: diary.pipeline.length
      })
    }
    
    if (pixelate && !diary.pipeline.find(s => s.methodId === 'pixelate')) {
      diary.pipeline.push({
        methodId: 'pixelate',
        enabled: true,
        params: { blockSize: 20 },
        order: diary.pipeline.length
      })
    }
  },
  itemEffectModifiers: {
    repairPatch: 0.5,
    timeCrystal: 1.2,
    memoryFragment: 2.0
  }
}

export default nightmare
