import type { TombstoneStyle, Diary } from '@/types'

const retro: TombstoneStyle = {
  id: 'retro',
  name: '复古终端墓碑',
  render: (ctx: CanvasRenderingContext2D, diary: Diary) => {
    const width = ctx.canvas.width
    const height = ctx.canvas.height
    
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, width, height)
    
    ctx.strokeStyle = '#00ff00'
    ctx.lineWidth = 1
    ctx.strokeRect(5, 5, width - 10, height - 10)
    
    ctx.fillStyle = '#00ff00'
    ctx.font = '14px VT323, monospace'
    ctx.textAlign = 'left'
    
    const lines = [
      '> SYSTEM FAILURE',
      '> -------------',
      `> DIARY: ${diary.title.substring(0, 15)}`,
      `> TYPE: ${diary.type}`,
      `> STATUS: TERMINATED`,
      '> -------------',
      '> CONNECTION LOST',
      '> PRESS ANY KEY TO CONTINUE...',
      '> _'
    ]
    
    const lineHeight = 20
    let y = 20
    
    lines.forEach(line => {
      ctx.fillText(line, 15, y)
      y += lineHeight
    })
    
    ctx.fillStyle = 'rgba(0, 255, 0, 0.03)'
    for (let y2 = 0; y2 < height; y2 += 3) {
      ctx.fillRect(0, y2, width, 1)
    }
  }
}

export default retro
