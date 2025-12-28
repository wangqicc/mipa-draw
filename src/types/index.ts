export interface Sticker {
  id: string
  type: 'image' | 'svg'
  src: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  zIndex: number
  name: string
}

export interface CanvasSettings {
  width: number
  height: number
  backgroundColor: string
  backgroundGradient?: string
  backgroundImage?: string
  showGrid: boolean
  gridSize: number
  gridColor: string
}

export interface HistoryState {
  stickers: Sticker[]
  selectedStickerIds: string[]
  timestamp: number
}

export interface OptimizedHistoryState {
  type: 'full' | 'delta'
  stickers?: Sticker[]
  delta?: StickerDelta[]
  timestamp: number
  operation: string
  groupId?: string
}

export interface StickerDelta {
  id: string
  action: 'add' | 'update' | 'remove'
  before?: Sticker
  after?: Sticker
}

export type BackgroundType = 'solid' | 'gradient' | 'image'

export interface BackgroundOption {
  type: BackgroundType
  value: string
  name: string
}
