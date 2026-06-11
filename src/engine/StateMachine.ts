import { DiaryState, type Diary, type StateTransition, STATE_ORDER } from '@/types'

export class StateMachine {
  private transitions: Map<DiaryState, StateTransition[]> = new Map()

  addTransition(transition: StateTransition): void {
    const existing = this.transitions.get(transition.from) || []
    existing.push(transition)
    this.transitions.set(transition.from, existing)
  }

  addTransitions(transitions: StateTransition[]): void {
    transitions.forEach(t => this.addTransition(t))
  }

  canTransition(diary: Diary, elapsed: number): boolean {
    if (diary.state === DiaryState.SCHEDULED) return false
    const transitions = this.transitions.get(diary.state) || []
    return transitions.some(t => t.condition(diary, elapsed))
  }

  transition(diary: Diary, elapsed: number, currentTime: number): Diary {
    if (diary.state === DiaryState.SCHEDULED) return diary
    
    const transitions = this.transitions.get(diary.state) || []
    
    for (const t of transitions) {
      if (t.condition(diary, elapsed)) {
        const newDiary = { ...diary }
        newDiary.state = t.to
        newDiary.stateTimestamps = {
          ...diary.stateTimestamps,
          [t.to]: currentTime
        }
        
        if (t.onTransition) {
          t.onTransition(newDiary)
        }
        
        return newDiary
      }
    }
    
    return diary
  }

  getAvailableTransitions(state: DiaryState): StateTransition[] {
    return this.transitions.get(state) || []
  }

  canRewind(diary: Diary): boolean {
    const currentIndex = STATE_ORDER.indexOf(diary.state)
    return currentIndex > 1
  }

  rewindState(diary: Diary, currentTime: number): Diary {
    if (!this.canRewind(diary)) {
      return diary
    }

    const currentIndex = STATE_ORDER.indexOf(diary.state)
    const prevState = STATE_ORDER[currentIndex - 1]
    
    return {
      ...diary,
      state: prevState,
      frozen: false,
      stateTimestamps: {
        ...diary.stateTimestamps,
        [diary.state]: currentTime
      }
    }
  }

  getDecayLevel(diary: Diary, elapsed: number, decayRate: number = 1): number {
    if (diary.state === DiaryState.SCHEDULED) return 0

    const stateIndex = STATE_ORDER.indexOf(diary.state) - 1
    const baseLevel = stateIndex * 0.25

    const thresholds = [0, 100, 300, 500, 1000]
    const currentThreshold = thresholds[stateIndex] || 0
    const nextThreshold = thresholds[stateIndex + 1] || thresholds[stateIndex]

    const adjustedElapsed = elapsed * decayRate
    const progress = nextThreshold > currentThreshold 
      ? Math.min(1, Math.max(0, (adjustedElapsed - currentThreshold) / (nextThreshold - currentThreshold)))
      : 0

    return Math.min(1, Math.max(0, baseLevel + progress * 0.25))
  }

  getDecayCountdown(diary: Diary, elapsed: number, decayRate: number = 1): {
    timeToNext: number | null
    timeToDeath: number | null
    nextState: DiaryState | null
  } {
    if (diary.state === DiaryState.SCHEDULED || diary.state === DiaryState.DEAD) {
      return { timeToNext: null, timeToDeath: null, nextState: null }
    }

    const adjustedElapsed = elapsed * decayRate

    const currentTransitions = this.transitions.get(diary.state) || []
    const nextTransition = currentTransitions[0]
    if (!nextTransition || nextTransition.threshold === undefined) {
      return { timeToNext: null, timeToDeath: null, nextState: null }
    }

    const adjustedTimeToNext = Math.max(0, nextTransition.threshold - adjustedElapsed)
    const timeToNext = adjustedTimeToNext / decayRate

    let deathThreshold: number | null = null
    let currentState: DiaryState = nextTransition.to
    const visited = new Set<DiaryState>()

    while (currentState !== DiaryState.DEAD && !visited.has(currentState)) {
      visited.add(currentState)
      const transitions = this.transitions.get(currentState) || []
      if (transitions.length === 0) break
      const t = transitions[0]
      if (t.threshold !== undefined) {
        deathThreshold = t.threshold
      }
      currentState = t.to
    }

    let timeToDeath: number | null = null
    if (deathThreshold !== null) {
      const adjustedTimeToDeath = Math.max(0, deathThreshold - adjustedElapsed)
      timeToDeath = adjustedTimeToDeath / decayRate
    }

    return {
      timeToNext,
      timeToDeath,
      nextState: nextTransition.to
    }
  }
}

export const createDefaultTransitions = (): StateTransition[] => [
  {
    from: DiaryState.FRESH,
    to: DiaryState.ROTTING,
    condition: (_, elapsed) => elapsed >= 100,
    threshold: 100
  },
  {
    from: DiaryState.ROTTING,
    to: DiaryState.ROTTED,
    condition: (_, elapsed) => elapsed >= 300,
    threshold: 300
  },
  {
    from: DiaryState.ROTTED,
    to: DiaryState.DYING,
    condition: (_, elapsed) => elapsed >= 500,
    threshold: 500
  },
  {
    from: DiaryState.DYING,
    to: DiaryState.DEAD,
    condition: (_, elapsed) => elapsed >= 1000,
    threshold: 1000
  }
]
