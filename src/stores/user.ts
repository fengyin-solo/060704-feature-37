import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { storage } from '@/utils/storage'
import { generateId } from '@/utils/id'

export const useUserStore = defineStore('user', () => {
  const users = ref<User[]>([])
  const currentUserId = ref<string | null>(null)
  const visitingUserId = ref<string | null>(null)

  const currentUser = computed(() => {
    if (!currentUserId.value) return null
    return users.value.find(u => u.id === currentUserId.value) || null
  })

  const visitingUser = computed(() => {
    if (!visitingUserId.value) return null
    return users.value.find(u => u.id === visitingUserId.value) || null
  })

  const publicUsers = computed(() => {
    return users.value.filter(u => u.isPublic && u.id !== currentUserId.value)
  })

  function init() {
    users.value = storage.getUsers()
    currentUserId.value = storage.getCurrentUser()
    
    if (users.value.length === 0) {
      createDefaultUsers()
    }
  }

  function createDefaultUsers() {
    const defaultUsers: User[] = [
      {
        id: generateId(),
        name: '故障收藏家',
        bio: '收集各种数字腐朽之美',
        isPublic: true,
        tombstoneStyle: 'default'
      },
      {
        id: generateId(),
        name: '时间旅人',
        bio: '在时间轴上漫步的陌生人',
        isPublic: true,
        tombstoneStyle: 'retro'
      }
    ]
    users.value = defaultUsers
    storage.saveUsers(users.value)
  }

  function registerUser(name: string, isPublic: boolean = true): User {
    const existingUser = users.value.find(u => u.name === name)
    if (existingUser) {
      return existingUser
    }
    
    const newUser: User = {
      id: generateId(),
      name,
      isPublic,
      tombstoneStyle: 'default'
    }
    
    users.value.push(newUser)
    storage.saveUsers(users.value)
    
    return newUser
  }

  function login(userId: string): void {
    currentUserId.value = userId
    storage.setCurrentUser(userId)
  }

  function logout(): void {
    currentUserId.value = null
    storage.setCurrentUser(null)
  }

  function updateUser(userId: string, updates: Partial<User>): void {
    const index = users.value.findIndex(u => u.id === userId)
    if (index !== -1) {
      users.value[index] = { ...users.value[index], ...updates }
      storage.saveUsers(users.value)
    }
  }

  function startVisiting(userId: string): void {
    visitingUserId.value = userId
  }

  function stopVisiting(): void {
    visitingUserId.value = null
  }

  function getUserById(userId: string): User | undefined {
    return users.value.find(u => u.id === userId)
  }

  return {
    users,
    currentUserId,
    currentUser,
    visitingUserId,
    visitingUser,
    publicUsers,
    init,
    registerUser,
    login,
    logout,
    updateUser,
    startVisiting,
    stopVisiting,
    getUserById
  }
})
