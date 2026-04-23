export type CardType = 'tab' | 'bookmark' | 'tab-group' | 'snippet' | 'image'
export type CardState = 'now' | 'later'
export type ZoomLevel = 'far' | 'mid' | 'close' | 'focused'
export type FilterState = 'now' | 'later' | 'all'
export type ActiveView = 'grid' | 'canvas' | 'flow'
export type EdgeType = 'sequence' | 'similarity'

export interface Edge {
  id: string
  sourceId: string
  targetId: string
  type: EdgeType
  strength?: number   // 0–1; how strong the relationship is
  createdAt?: string
}

export interface Cluster {
  id: string
  label: string
  cardIds: string[]
  color: string
}

export interface Card {
  id: string
  type: CardType
  title: string
  url?: string
  tags: string[]
  notes: string
  reminder?: number
  state: CardState
  createdAt: number
  updatedAt: number
}

export interface SpatialCard extends Card {
  x: number
  y: number
  zIndex?: number
}

export interface CanvasViewState {
  zoom: number             // 0.1–2.0; thresholds: <0.4 far, 0.4–0.9 mid, >0.9 close
  panX: number
  panY: number
  focusedCardId: string | null
  selectedCardIds: string[]
}

export interface Filters {
  state: FilterState
  types: CardType[]        // empty = all types shown
  tags: string[]           // empty = all tags shown
}
