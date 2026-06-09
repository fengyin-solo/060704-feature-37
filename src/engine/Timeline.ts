type Subscriber = (time: number) => void

export class Timeline {
  private virtualTime: number = 0
  private speed: number = 1
  private lastTick: number = 0
  private running: boolean = true
  private subscribers: Set<Subscriber> = new Set()
  private animationFrameId: number | null = null
  private minSpeed: number = 0.25
  private maxSpeed: number = 100

  constructor(initialTime: number = 0) {
    this.virtualTime = initialTime
    this.start()
  }

  private tick = (timestamp: number): void => {
    if (!this.running) {
      this.lastTick = timestamp
      this.animationFrameId = requestAnimationFrame(this.tick)
      return
    }

    if (this.lastTick === 0) {
      this.lastTick = timestamp
    }

    const delta = (timestamp - this.lastTick) / 1000
    this.virtualTime += delta * this.speed * 10
    this.lastTick = timestamp

    this.subscribers.forEach(callback => callback(this.virtualTime))
    this.animationFrameId = requestAnimationFrame(this.tick)
  }

  start(): void {
    if (this.animationFrameId === null) {
      this.lastTick = 0
      this.animationFrameId = requestAnimationFrame(this.tick)
    }
  }

  pause(): void {
    this.running = false
  }

  resume(): void {
    this.running = true
    this.lastTick = 0
  }

  setSpeed(speed: number): void {
    this.speed = Math.max(this.minSpeed, Math.min(this.maxSpeed, speed))
  }

  getSpeed(): number {
    return this.speed
  }

  fastForward(amount: number): void {
    this.virtualTime += amount
    this.subscribers.forEach(callback => callback(this.virtualTime))
  }

  rewind(amount: number): void {
    this.virtualTime = Math.max(0, this.virtualTime - amount)
    this.subscribers.forEach(callback => callback(this.virtualTime))
  }

  setTime(time: number): void {
    this.virtualTime = Math.max(0, time)
    this.subscribers.forEach(callback => callback(this.virtualTime))
  }

  getTime(): number {
    return this.virtualTime
  }

  getElapsedSince(timestamp: number): number {
    return Math.max(0, this.virtualTime - timestamp)
  }

  subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback)
    return () => {
      this.subscribers.delete(callback)
    }
  }

  destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
    this.subscribers.clear()
  }

  isRunning(): boolean {
    return this.running
  }

  isPaused(): boolean {
    return !this.running
  }

  getCurrentTime(): number {
    return this.virtualTime
  }
}

export const globalTimeline = new Timeline()
