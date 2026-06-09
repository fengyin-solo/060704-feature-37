import type { DecayMethod, DiaryContent } from '@/types'

const wave: DecayMethod = {
  id: 'wave',
  name: '波浪扭',
  description: '画面产生波浪扭曲变形',
  version: '1.0.0',
  params: {
    amplitude: { min: 0, max: 30, default: 8 },
    frequency: { min: 0.01, max: 0.2, default: 0.05 }
  },
  render: (
    ctx: CanvasRenderingContext2D,
    _content: DiaryContent,
    decayLevel: number,
    params: Record<string, number>
  ) => {
    const amplitude = params.amplitude * decayLevel
    const frequency = params.frequency
    
    if (amplitude <= 0) return
    
    const canvas = ctx.canvas
    const width = canvas.width
    const height = canvas.height
    
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = width
    tempCanvas.height = height
    const tempCtx = tempCanvas.getContext('2d')!
    
    tempCtx.drawImage(canvas, 0, 0)
    
    const imageData = tempCtx.getImageData(0, 0, width, height)
    const srcData = imageData.data
    
    const resultData = ctx.createImageData(width, height)
    const dstData = resultData.data
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const offset = Math.sin(y * frequency) * amplitude
        const srcX = Math.round(x + offset)
        
        let srcXClamped = Math.max(0, Math.min(width - 1, srcX))
        const srcIdx = (y * width + srcXClamped) * 4
        const dstIdx = (y * width + x) * 4
        
        dstData[dstIdx] = srcData[srcIdx]
        dstData[dstIdx + 1] = srcData[srcIdx + 1]
        dstData[dstIdx + 2] = srcData[srcIdx + 2]
        dstData[dstIdx + 3] = srcData[srcIdx + 3]
      }
    }
    
    ctx.putImageData(resultData, 0, 0)
  }
}

export default wave
