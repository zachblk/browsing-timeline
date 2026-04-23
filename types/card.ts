export type CardType = 'tab' | 'bookmark' | 'tab-group' | 'snippet' | 'image'
export type CardState = 'now' | 'later'

export interface Card {
  id: string
  type: CardType
  title: string
  url?: string
  thumbnailUrl?: string
  tags: string[]
  notes: string
  state: CardState
  createdAt: number
  updatedAt: number
}

export interface SpatialCard extends Card {
  x: number
  y: number
  zIndex?: number
}
