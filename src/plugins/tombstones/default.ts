import type { TombstoneStyle, Diary } from '@/types'
import { STATE_NAMES } from '@/types'

const defaultTombstone: TombstoneStyle = {
  id: 'default',
  name: '默认墓碑',
  render: (ctx: CanvasRenderingContext2D, diary: Diary) => {
    const width = ctx.canvas.width
    const height = ctx.canvas.height
    
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, width, height)
    
    ctx.fillStyle = '#333'
    ctx.beginPath()
    ctx.moveTo(width / 2 - 60, height - 20)
    ctx.lineTo(width / 2 - 50, height / 2)
    ctx.quadraticCurveTo(width / 2, height / 2 - 40, width / 2 + 50, height / 2)
    ctx.lineTo(width / 2 + 60, height - 20)
    ctx.closePath()
    ctx.fill()
    
    ctx.fillStyle = '#666'
    ctx.fillRect(width / 2 - 65, height - 25, 130, 10)
    
    ctx.fillStyle = '#888'
    ctx.font = 'bold 14px JetBrains Mono, monospace'
    ctx.textAlign = 'center'
    ctx.fillText('R.I.P', width / 2, height / 2 - 10)
    
    ctx.font = '12px JetBrains Mono, monospace'
    ctx.fillStyle = '#555'
    ctx.fillText(diary.title.substring(0, 12), width / 2, height / 2 + 10)
    
    ctx.font = '10px JetBrains Mono, monospace'
    ctx.fillStyle = '#444'
    ctx.fillText(`${STATE_NAMES[diary.state]} @ ${Math.floor(diary.createdAt)}`, width / 2, height / 2 + 30)
  }
}

export default defaultTombstone
