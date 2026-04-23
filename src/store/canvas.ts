import { StateCreator } from 'zustand'
import { ActiveView, CanvasViewState, Filters } from '../types'

export interface CanvasSlice {
  view: CanvasViewState
  filters: Filters
  activeView: ActiveView

  setCamera: (update: Partial<Pick<CanvasViewState, 'zoom' | 'panX' | 'panY'>>) => void
  setZoom: (zoom: number) => void
  setPan: (panX: number, panY: number) => void
  focusCard: (id: string | null) => void
  selectCard: (id: string, additive?: boolean) => void
  clearSelection: () => void
  setFilter: (patch: Partial<Filters>) => void
  setActiveView: (view: ActiveView) => void
}

const defaultView: CanvasViewState = {
  zoom: 0.7,
  panX: 0,
  panY: 0,
  focusedCardId: null,
  selectedCardIds: [],
}

const defaultFilters: Filters = {
  state: 'all',
  types: [],
  tags: [],
}

export const createCanvasSlice: StateCreator<CanvasSlice> = (set) => ({
  view: defaultView,
  filters: defaultFilters,
  activeView: 'grid',

  setCamera: (update) =>
    set((state) => ({ view: { ...state.view, ...update } })),

  setZoom: (zoom) =>
    set((state) => ({ view: { ...state.view, zoom } })),

  setPan: (panX, panY) =>
    set((state) => ({ view: { ...state.view, panX, panY } })),

  focusCard: (id) =>
    set((state) => ({ view: { ...state.view, focusedCardId: id } })),

  selectCard: (id, additive = false) =>
    set((state) => ({
      view: {
        ...state.view,
        selectedCardIds: additive
          ? [...state.view.selectedCardIds, id]
          : [id],
      },
    })),

  clearSelection: () =>
    set((state) => ({ view: { ...state.view, selectedCardIds: [] } })),

  setFilter: (patch) =>
    set((state) => ({ filters: { ...state.filters, ...patch } })),

  setActiveView: (activeView) => set({ activeView }),
})
