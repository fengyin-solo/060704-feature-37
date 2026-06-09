import type { DecayMethod, DiaryContent } from '@/types'

const pixelate: DecayMethod = {
  id: 'pixelate',
  name: '碎像素',
  description: '画面像素化，细节逐渐丢失',
  version: '1.0.0',
  params: {
    blockSize: { min: 1, max: 30, default: 4 }
  },
  render: (
    ctx: CanvasRenderingContext2D,
    _content: DiaryContent,
    decayLevel: number,
    params: Record<string, number>
  ) => {
    const blockSize = Math.max(1, Math.floor(params.blockSize * decayLevel))
    if (blockSize <= 1) return
    
    const canvas = ctx.canvas
    const width = canvas.width
    const height = canvas.height
    
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = width
    tempCanvas.height = height
    const tempCtx = tempCanvas.getContext('2d')!
    
    tempCtx.drawImage(canvas, 0, 0)
    
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, width, height)
    
    for (let y = 0; y < height; y += blockSize) {
      for (let x = 0; x < width; x += blockSize) {
        const sampleX = Math.min(x, width - 1)
        const sampleY = Math.min(y, height - 1)
        
        const pixel = tempCtx.getImageData(sampleX, sampleY, 1, 1).data
        
        ctx.fillStyle = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`
        ctx.fillRect(x, y, blockSize, blockSize)
      }
    }
  }
}

export default pixelate
