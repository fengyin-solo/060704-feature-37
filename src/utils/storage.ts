import type { Diary, User, InventoryItem, ArchivedDiary } from '@/types'

const STORAGE_KEYS = {
  CURRENT_USER: 'glitch_diary_current_user',
  USERS: 'glitch_diary_users',
  DIARIES: 'glitch_diary_diaries',
  INVENTORY: 'glitch_diary_inventory_',
  ARCHIVED_DIARIES: 'glitch_diary_archived_diaries'
}

export const storage = {
  getCurrentUser(): string | null {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
  },
  
  setCurrentUser(userId: string | null): void {
    if (userId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, userId)
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
    }
  },
  
  getUsers(): User[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS)
    return data ? JSON.parse(data) : []
  },
  
  saveUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
  },
  
  getDiaries(): Diary[] {
    const data = localStorage.getItem(STORAGE_KEYS.DIARIES)
    return data ? JSON.parse(data) : []
  },
  
  saveDiaries(diaries: Diary[]): void {
    localStorage.setItem(STORAGE_KEYS.DIARIES, JSON.stringify(diaries))
  },
  
  getInventory(userId: string): InventoryItem[] {
    const data = localStorage.getItem(STORAGE_KEYS.INVENTORY + userId)
    return data ? JSON.parse(data) : []
  },
  
  saveInventory(userId: string, inventory: InventoryItem[]): void {
    localStorage.setItem(STORAGE_KEYS.INVENTORY + userId, JSON.stringify(inventory))
  },

  getArchivedDiaries(): ArchivedDiary[] {
    const data = localStorage.getItem(STORAGE_KEYS.ARCHIVED_DIARIES)
    return data ? JSON.parse(data) : []
  },

  saveArchivedDiaries(archivedDiaries: ArchivedDiary[]): void {
    localStorage.setItem(STORAGE_KEYS.ARCHIVED_DIARIES, JSON.stringify(archivedDiaries))
  }
}
