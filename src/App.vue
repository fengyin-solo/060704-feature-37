<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useInventoryStore } from '@/stores/inventory'
import { pluginLoader } from '@/engine/PluginLoader'
import NavBar from '@/components/common/NavBar.vue'

const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

const showBoot = ref(true)
const bootProgress = ref(0)

const isLoggedIn = computed(() => !!userStore.currentUserId)
const isVisiting = computed(() => !!userStore.visitingUserId)
const showNav = computed(() => !route.path.startsWith('/login'))

onMounted(async () => {
  await pluginLoader.loadAll()
  
  const interval = setInterval(() => {
    bootProgress.value += Math.random() * 15
    if (bootProgress.value >= 100) {
      bootProgress.value = 100
      clearInterval(interval)
      setTimeout(() => {
        showBoot.value = false
      }, 500)
    }
  }, 100)
  
  if (!isLoggedIn.value && route.path !== '/login') {
    router.push('/login')
  }
})

function handleLogin(userName: string) {
  const user = userStore.registerUser(userName)
  userStore.login(user.id)
  
  const inventoryStore = useInventoryStore()
  inventoryStore.init(user.id)
  
  router.push('/')
}

function handleLogout() {
  userStore.logout()
  userStore.stopVisiting()
  router.push('/login')
}

function handleStopVisiting() {
  userStore.stopVisiting()
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-diary-bg relative overflow-hidden">
    <div class="scanline" v-if="!showBoot"></div>
    
    <div 
      v-if="showBoot" 
      class="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center"
    >
      <div class="text-diary-fresh font-vt323 text-4xl mb-8 glow-text">
        故障日记
      </div>
      <div class="text-diary-fresh font-vt323 text-xl mb-4">
        GLITCH_DIARY v0.1.0
      </div>
      <div class="w-64 h-4 bg-gray-800 rounded overflow-hidden border border-diary-fresh">
        <div 
          class="h-full bg-diary-fresh transition-all duration-100"
          :style="{ width: `${bootProgress}%` }"
        ></div>
      </div>
      <div class="text-diary-fresh font-vt323 mt-2">
        {{ Math.floor(bootProgress) }}%
      </div>
      <div class="text-gray-500 font-vt323 mt-4 text-sm">
        LOADING PLUGINS...
      </div>
    </div>
    
    <template v-else>
      <NavBar 
        v-if="showNav"
        :isLoggedIn="isLoggedIn"
        :isVisiting="isVisiting"
        :currentUser="userStore.currentUser"
        :visitingUser="userStore.visitingUser"
        @logout="handleLogout"
        @stop-visiting="handleStopVisiting"
      />
      
      <main class="container mx-auto px-4 py-6">
        <RouterView 
          v-slot="{ Component }"
        >
          <transition name="fade" mode="out-in">
            <component 
              :is="Component" 
              @login="handleLogin"
            />
          </transition>
        </RouterView>
      </main>
      
      <footer class="text-center py-4 text-gray-600 font-vt323 text-sm">
        <div class="ascii-divider">
          ========================================
        </div>
        <div class="mt-2">
          故障日记 | GLITCH_DIARY © 2026
        </div>
        <div class="text-xs text-gray-700 mt-1">
          「数字内容的腐朽，也是一种美」
        </div>
      </footer>
    </template>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
