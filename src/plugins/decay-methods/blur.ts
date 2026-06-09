import type { DecayMethod, DiaryContent } from '@/types'

const blur: DecayMethod = {
  id: 'blur',
  name: '糊掉',
  description: '内容逐渐模糊，文字变得难以辨认',
  version: '1.0.0',
  params: {
    intensity: { min: 0, max: 20, default: 5 }
  },
  render: (
    ctx: CanvasRenderingContext2D,
    _content: DiaryContent,
    decayLevel: number,
    params: Record<string, number>
  ) => {
    const intensity = params.intensity * decayLevel
    if (intensity <= 0) return
    
    const canvas = ctx.canvas
    const width = canvas.width
    const height = canvas.height
    
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data
    const tempData = new Uint8ClampedArray(data)
    
    const radius = Math.floor(intensity)
    const kernelSize = radius * 2 + 1
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, count = 0
        
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx
            const ny = y + dy
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const idx = (ny * width + nx) * 4
              r += tempData[idx]
              g += tempData[idx + 1]
              b += tempData[idx + 2]
              count++
            }
          }
        }
        
        const idx = (y * width + x) * 4
        data[idx] = Math.round(r / count)
        data[idx + 1] = Math.round(g / count)
        data[idx + 2] = Math.round(b / count)
      }
    }
    
    ctx.putImageData(imageData, 0, 0)
  }
}

export default blur
