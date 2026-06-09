export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

export const formatTime = (time: number): string => {
  const floorTime = Math.floor(time)
  const hours = Math.floor(floorTime / 3600)
  const minutes = Math.floor((floorTime % 3600) / 60)
  const seconds = floorTime % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
