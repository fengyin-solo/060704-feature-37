import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'DiaryWall',
    component: () => import('@/views/DiaryWall.vue')
  },
  {
    path: '/diary/:id',
    name: 'DiaryDetail',
    component: () => import('@/views/DiaryDetail.vue')
  },
  {
    path: '/pipeline/:id',
    name: 'PipelineEditor',
    component: () => import('@/views/PipelineEditor.vue')
  },
  {
    path: '/inventory',
    name: 'Inventory',
    component: () => import('@/views/Inventory.vue')
  },
  {
    path: '/visit',
    name: 'VisitCenter',
    component: () => import('@/views/VisitCenter.vue')
  },
  {
    path: '/visit/:userId',
    name: 'VisitUser',
    component: () => import('@/views/DiaryWall.vue')
  },
  {
    path: '/user',
    name: 'UserCenter',
    component: () => import('@/views/UserCenter.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/archive',
    name: 'Archive',
    component: () => import('@/views/Archive.vue')
  },
  {
    path: '/gallery',
    name: 'Gallery',
    component: () => import('@/views/Gallery.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
