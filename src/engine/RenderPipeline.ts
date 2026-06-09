import type { Diary, DiaryContent, DecayMethod, PipelineStep } from '@/types'
import { globalTimeline } from './Timeline'
import { StateMachine } from './StateMachine'

export class RenderPipeline {
  private methods: Map<string, DecayMethod> = new Map()
  private offscreenCanvas: HTMLCanvasElement
  private offscreenCtx: CanvasRenderingContext2D
  private stateMachine: StateMachine

  constructor() {
    this.offscreenCanvas = document.createElement('canvas')
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')!
    this.stateMachine = new StateMachine()
  }

  registerMethod(method: DecayMethod): void {
    this.methods.set(method.id, method)
  }

  unregisterMethod(id: string): void {
    this.methods.delete(id)
  }

  getMethod(id: string): DecayMethod | undefined {
    return this.methods.get(id)
  }

  getAllMethods(): DecayMethod[] {
    return Array.from(this.methods.values())
  }

  private drawBaseContent(
    ctx: CanvasRenderingContext2D,
    content: DiaryContent,
    width: number,
    height: number
  ): void {
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, width, height)
    
    ctx.fillStyle = '#39ff14'
    ctx.font = '16px JetBrains Mono, monospace'
    ctx.textBaseline = 'top'
    
    const padding = 20
    const lineHeight = 24
    const maxWidth = width - padding * 2
    
    const words = content.text.split('')
    let line = ''
    let y = padding
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i]
      const metrics = ctx.measureText(testLine)
      
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, padding, y)
        line = words[i]
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

  render(
    diary: Diary,
    ctx: CanvasRenderingContext2D,
    targetTime?: number,
    decayRate: number = 1
  ): void {
    const width = ctx.canvas.width
    const height = ctx.canvas.height
    
    this.offscreenCanvas.width = width
    this.offscreenCanvas.height = height
    
    const offCtx = this.offscreenCtx
    const currentTime = targetTime ?? globalTimeline.getTime()
    const elapsed = Math.max(0, currentTime - diary.createdAt)
    
    const decayLevel = this.stateMachine.getDecayLevel(diary, elapsed, decayRate)
    
    this.drawBaseContent(offCtx, diary.content, width, height)
    
    if (diary.state === 'dead' && diary.tombstone) {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, width, height)
      return
    }
    
    const sortedPipeline = [...diary.pipeline]
      .filter(step => step.enabled)
      .sort((a, b) => a.order - b.order)
    
    for (const step of sortedPipeline) {
      const method = this.methods.get(step.methodId)
      if (method) {
        try {
          method.render(offCtx, diary.content, decayLevel, step.params)
        } catch (e) {
          console.error(`Error in decay method ${method.id}:`, e)
        }
      }
    }
    
    if (diary.frozen) {
      offCtx.fillStyle = 'rgba(0, 212, 255, 0.15)'
      offCtx.fillRect(0, 0, width, height)
      
      offCtx.strokeStyle = 'rgba(0, 212, 255, 0.5)'
      offCtx.lineWidth = 3
      offCtx.strokeRect(5, 5, width - 10, height - 10)
    }
    
    ctx.drawImage(this.offscreenCanvas, 0, 0)
    
    this.drawCRTEffect(ctx, width, height)
  }

  private drawCRTEffect(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.03)'
    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 2)
    }
    
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) / 1.5
    )
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }

  renderPreview(
    content: DiaryContent,
    pipeline: PipelineStep[],
    decayLevel: number,
    ctx: CanvasRenderingContext2D
  ): void {
    const width = ctx.canvas.width
    const height = ctx.canvas.height
    
    this.offscreenCanvas.width = width
    this.offscreenCanvas.height = height
    
    const offCtx = this.offscreenCtx
    this.drawBaseContent(offCtx, content, width, height)
    
    const sortedPipeline = [...pipeline]
      .filter(step => step.enabled)
      .sort((a, b) => a.order - b.order)
    
    for (const step of sortedPipeline) {
      const method = this.methods.get(step.methodId)
      if (method) {
        try {
          method.render(offCtx, content, decayLevel, step.params)
        } catch (e) {
          console.error(`Error in decay method ${method.id}:`, e)
        }
      }
    }
    
    ctx.drawImage(this.offscreenCanvas, 0, 0)
  }

  reorderPipeline(diary: Diary, newOrder: string[]): PipelineStep[] {
    return diary.pipeline.map(step => ({
      ...step,
      order: newOrder.indexOf(step.methodId)
    })).sort((a, b) => a.order - b.order)
  }

  updateParams(
    diary: Diary,
    methodId: string,
    params: Record<string, number>
  ): PipelineStep[] {
    return diary.pipeline.map(step => 
      step.methodId === methodId
        ? { ...step, params: { ...step.params, ...params } }
        : step
    )
  }

  toggleMethod(diary: Diary, methodId: string): PipelineStep[] {
    return diary.pipeline.map(step =>
      step.methodId === methodId
        ? { ...step, enabled: !step.enabled }
        : step
    )
  }

  addMethodToPipeline(diary: Diary, methodId: string): PipelineStep[] {
    const method = this.methods.get(methodId)
    if (!method) return diary.pipeline
    
    const existing = diary.pipeline.find(s => s.methodId === methodId)
    if (existing) return diary.pipeline
    
    const defaultParams: Record<string, number> = {}
    Object.entries(method.params).forEach(([key, def]) => {
      defaultParams[key] = def.default
    })
    
    return [
      ...diary.pipeline,
      {
        methodId,
        enabled: true,
        params: defaultParams,
        order: diary.pipeline.length
      }
    ]
  }

  removeMethodFromPipeline(diary: Diary, methodId: string): PipelineStep[] {
    return diary.pipeline
      .filter(s => s.methodId !== methodId)
      .map((s, i) => ({ ...s, order: i }))
  }
}

export const renderPipeline = new RenderPipeline()
