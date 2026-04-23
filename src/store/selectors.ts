import { Store } from './index'
import { SpatialCard, ZoomLevel } from '../types'

export const selectVisibleCards = (state: Store): SpatialCard[] => {
  const { cards, filters } = state
  return cards.filter((c) => {
    if (filters.state !== 'all' && c.state !== filters.state) return false
    if (filters.types.length && !filters.types.includes(c.type)) return false
    if (filters.tags.length && !filters.tags.some((t) => c.tags.includes(t))) return false
    return true
  })
}

export const selectZoomLevel = (state: Store): ZoomLevel => {
  const { zoom, focusedCardId } = state.view
  if (focusedCardId) return 'focused'
  if (zoom < 0.4) return 'far'
  if (zoom < 0.9) return 'mid'
  return 'close'
}
