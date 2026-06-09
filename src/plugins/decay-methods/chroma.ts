import type { DecayMethod, DiaryContent } from '@/types'

const chroma: DecayMethod = {
  id: 'chroma',
  name: '色差',
  description: 'RGB通道分离偏移，产生复古故障效果',
  version: '1.0.0',
  params: {
    offsetX: { min: 0, max: 20, default: 5 },
    offsetY: { min: 0, max: 10, default: 2 }
  },
  render: (
    ctx: CanvasRenderingContext2D,
    _content: DiaryContent,
    decayLevel: number,
    params: Record<string, number>
  ) => {
    const offsetX = params.offsetX * decayLevel
    const offsetY = params.offsetY * decayLevel
    
    if (offsetX <= 0 && offsetY <= 0) return
    
    const canvas = ctx.canvas
    const width = canvas.width
    const height = canvas.height
    
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data
    
    const rChannel = new Uint8ClampedArray(width * height)
    const gChannel = new Uint8ClampedArray(width * height)
    const bChannel = new Uint8ClampedArray(width * height)
    
    for (let i = 0; i < width * height; i++) {
      rChannel[i] = data[i * 4]
      gChannel[i] = data[i * 4 + 1]
      bChannel[i] = data[i * 4 + 2]
    }
    
    const ox = Math.round(offsetX)
    const oy = Math.round(offsetY)
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4
        
        const rx = Math.max(0, Math.min(width - 1, x - ox))
        const ry = Math.max(0, Math.min(height - 1, y - oy))
        const rIdx = ry * width + rx
        
        const bx = Math.max(0, Math.min(width - 1, x + ox))
        const by = Math.max(0, Math.min(height - 1, y + oy))
        const bIdx = by * width + bx
        
        data[idx] = rChannel[rIdx]
        data[idx + 1] = gChannel[y * width + x]
        data[idx + 2] = bChannel[bIdx]
      }
    }
    
    ctx.putImageData(imageData, 0, 0)
  }
}

export default chroma
