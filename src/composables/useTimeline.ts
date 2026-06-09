import { ref, computed, onMounted, onUnmounted } from 'vue'
import { globalTimeline } from '@/engine/Timeline'
import { formatTime } from '@/utils/id'

export function useTimeline() {
  const currentTime = ref(0)
  const displayTime = ref('0:00')
  const speed = ref(1)
  const isRunning = ref(true)
  const isFastForwarding = ref(false)
  const isRewinding = ref(false)

  const speedOptions = [0.25, 0.5, 1, 2, 5, 10, 50, 100]

  function setSpeed(newSpeed: number) {
    speed.value = newSpeed
    globalTimeline.setSpeed(newSpeed)
  }

  function togglePlayPause() {
    if (isRunning.value) {
      globalTimeline.pause()
    } else {
      globalTimeline.resume()
    }
    isRunning.value = globalTimeline.isRunning()
  }

  function fastForward(amount: number = 100) {
    isFastForwarding.value = true
    globalTimeline.fastForward(amount)
    setTimeout(() => {
      isFastForwarding.value = false
    }, 300)
  }

  function rewind(amount: number = 100) {
    isRewinding.value = true
    globalTimeline.rewind(amount)
    setTimeout(() => {
      isRewinding.value = false
    }, 300)
  }

  function jumpToTime(time: number) {
    globalTimeline.setTime(time)
  }

  function reset() {
    globalTimeline.setTime(0)
  }

  let unsubscribe: (() => void) | null = null

  onMounted(() => {
    currentTime.value = globalTimeline.getTime()
    displayTime.value = formatTime(currentTime.value)
    speed.value = globalTimeline.getSpeed()
    isRunning.value = globalTimeline.isRunning()

    unsubscribe = globalTimeline.subscribe((time) => {
      currentTime.value = time
      displayTime.value = formatTime(time)
    })
  })

  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe()
    }
  })

  return {
    currentTime,
    displayTime,
    speed,
    isRunning,
    isFastForwarding,
    isRewinding,
    speedOptions,
    setSpeed,
    togglePlayPause,
    fastForward,
    rewind,
    jumpToTime,
    reset
  }
}
