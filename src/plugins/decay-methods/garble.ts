import type { DecayMethod, DiaryContent } from '@/types'

const garbleChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`abcdefghijklmnopqrstuvwxyz'

const garble: DecayMethod = {
  id: 'garble',
  name: '乱码',
  description: '文字被随机字符替换，信息逐渐丢失',
  version: '1.0.0',
  params: {
    replacementRate: { min: 0, max: 100, default: 30 }
  },
  render: (
    ctx: CanvasRenderingContext2D,
    content: DiaryContent,
    decayLevel: number,
    params: Record<string, number>
  ) => {
    const replacementRate = (params.replacementRate / 100) * decayLevel
    if (replacementRate <= 0) return
    
    const canvas = ctx.canvas
    const width = canvas.width
    const height = canvas.height
    
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, width, height)
    
    ctx.fillStyle = '#39ff14'
    ctx.font = '16px JetBrains Mono, monospace'
    ctx.textBaseline = 'top'
    
    const padding = 20
    const lineHeight = 24
    const maxWidth = width - padding * 2
    
    const originalChars = content.text.split('')
    const garbledChars = originalChars.map(char => {
      if (char === ' ' || char === '\n') return char
      if (Math.random() < replacementRate) {
        return garbleChars[Math.floor(Math.random() * garbleChars.length)]
      }
      return char
    })
    
    let line = ''
    let y = padding
    
    for (let i = 0; i < garbledChars.length; i++) {
      const testLine = line + garbledChars[i]
      const metrics = ctx.measureText(testLine)
      
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, padding, y)
        line = garbledChars[i]
        y += lineHeight
        
        if (y > height - padding) break
      } else {
        line = testLine
      }
    }
    
    if (y <= height - padding) {
      ctx.fillText(line, padding, y)
    }
  }
}

export default garble
