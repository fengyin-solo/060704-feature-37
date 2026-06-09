export enum DiaryState {
  SCHEDULED = 'scheduled',
  FRESH = 'fresh',
  ROTTING = 'rotting',
  ROTTED = 'rotted',
  DYING = 'dying',
  DEAD = 'dead'
}

export const STATE_NAMES: Record<DiaryState, string> = {
  [DiaryState.SCHEDULED]: '待发布',
  [DiaryState.FRESH]: '新鲜',
  [DiaryState.ROTTING]: '烂中',
  [DiaryState.ROTTED]: '已烂',
  [DiaryState.DYING]: '快死',
  [DiaryState.DEAD]: '死了'
}

export const STATE_COLORS: Record<DiaryState, string> = {
  [DiaryState.SCHEDULED]: '#60a5fa',
  [DiaryState.FRESH]: '#39ff14',
  [DiaryState.ROTTING]: '#ff6b35',
  [DiaryState.ROTTED]: '#6b3fa0',
  [DiaryState.DYING]: '#ff0040',
  [DiaryState.DEAD]: '#000000'
}

export const STATE_ORDER: DiaryState[] = [
  DiaryState.SCHEDULED,
  DiaryState.FRESH,
  DiaryState.ROTTING,
  DiaryState.ROTTED,
  DiaryState.DYING,
  DiaryState.DEAD
]

export enum ItemRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic'
}

export const RARITY_NAMES: Record<ItemRarity, string> = {
  [ItemRarity.COMMON]: '低级',
  [ItemRarity.RARE]: '中级',
  [ItemRarity.EPIC]: '高级'
}

export const RARITY_COLORS: Record<ItemRarity, string> = {
  [ItemRarity.COMMON]: '#9ca3af',
  [ItemRarity.RARE]: '#3b82f6',
  [ItemRarity.EPIC]: '#ffd700'
}

export interface DiaryContent {
  text: string
  images?: string[]
}

export interface StateTransition {
  from: DiaryState
  to: DiaryState
  condition: (diary: Diary, elapsed: number) => boolean
  onTransition?: (diary: Diary) => void
}

export interface DecayMethod {
  id: string
  name: string
  description: string
  version: string
  render: (
    ctx: CanvasRenderingContext2D,
    content: DiaryContent,
    decayLevel: number,
    params: Record<string, number>
  ) => void
  params: Record<string, { min: number; max: number; default: number }>
}

export interface DiaryType {
  id: string
  name: string
  extends?: string
  decayRate: number
  transitions: StateTransition[]
  deathEffect?: (diary: Diary) => void
  itemEffectModifiers: Record<string, number>
}

export interface Item {
  id: string
  name: string
  rarity: ItemRarity
  description: string
  icon: string
  effect: (diary: Diary) => Diary
  targetTypes: string[]
  effectiveness: Record<string, number>
}

export interface TombstoneStyle {
  id: string
  name: string
  render: (ctx: CanvasRenderingContext2D, diary: Diary) => void
}

export interface PipelineStep {
  methodId: string
  enabled: boolean
  params: Record<string, number>
  order: number
}

export interface DiarySchedule {
  publishAt: number | null
  decayStartAt: number | null
  autoArchiveAt: number | null
}

export interface Diary {
  id: string
  ownerId: string
  type: string
  title: string
  content: DiaryContent
  state: DiaryState
  frozen: boolean
  createdAt: number
  stateTimestamps: Record<DiaryState, number>
  pipeline: PipelineStep[]
  tombstone?: string
  isPublic: boolean
  schedule: DiarySchedule
  decayStartTime: number | null
}

export interface User {
  id: string
  name: string
  avatar?: string
  bio?: string
  isPublic: boolean
  tombstoneStyle: string
}

export interface Recipe {
  inputs: { itemId: string; count: number }[]
  output: { itemId: string; count: number }
}

export interface InventoryItem {
  itemId: string
  count: number
}

export enum ArchiveReason {
  DEAD = 'dead',
  DELETED = 'deleted',
  SCHEDULED_ARCHIVE = 'scheduled_archive'
}

export const ARCHIVE_REASON_NAMES: Record<ArchiveReason, string> = {
  [ArchiveReason.DEAD]: '自然死亡',
  [ArchiveReason.DELETED]: '用户删除',
  [ArchiveReason.SCHEDULED_ARCHIVE]: '定时撤回'
}

export interface RepairRecord {
  timestamp: number
  itemId: string
  itemName: string
  fromState: DiaryState
  toState: DiaryState
}

export interface ArchivedDiary {
  id: string
  diary: Diary
  archiveReason: ArchiveReason
  archivedAt: number
  lastRepairAt: number | null
  repairCount: number
  repairRecords: RepairRecord[]
}

export enum GalleryCategory {
  THEME = 'theme',
  STYLE = 'style',
  TIME = 'time'
}

export const GALLERY_CATEGORY_NAMES: Record<GalleryCategory, string> = {
  [GalleryCategory.THEME]: '主题展厅',
  [GalleryCategory.STYLE]: '风格展厅',
  [GalleryCategory.TIME]: '时间展厅'
}

export interface GallerySection {
  id: string
  name: string
  description: string
  icon: string
  category: GalleryCategory
  filter: (diary: Diary) => boolean
}

export interface GalleryHall {
  id: string
  name: string
  description: string
  icon: string
  sections: GallerySection[]
}

export interface Exhibit {
  diary: Diary
  authorName: string
  authorId: string
}

export enum TimePeriod {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  SEASON = 'season',
  YEAR = 'year',
  ALL = 'all'
}

export const TIME_PERIOD_NAMES: Record<TimePeriod, string> = {
  [TimePeriod.TODAY]: '今日展品',
  [TimePeriod.WEEK]: '本周新品',
  [TimePeriod.MONTH]: '本月精选',
  [TimePeriod.SEASON]: '季度典藏',
  [TimePeriod.YEAR]: '年度珍藏',
  [TimePeriod.ALL]: '全部时光'
}
