import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CardsSlice, createCardsSlice } from './cards'
import { CanvasSlice, createCanvasSlice } from './canvas'
import { EdgesSlice, createEdgesSlice } from './edges'
import { mockCards } from '../data/mockCards'
import { mockEdges } from '../data/mockEdges'

export type Store = CardsSlice & CanvasSlice & EdgesSlice

export const useStore = create<Store>()(
  persist(
    (...args) => ({
      ...createCardsSlice(...args),
      ...createCanvasSlice(...args),
      ...createEdgesSlice(...args),
    }),
    {
      name: 'browsing-timeline',
      partialize: (state) => ({
        cards: state.cards,
        edges: state.edges,
        activeView: state.activeView,
        filters: state.filters,
        view: {
          zoom: state.view.zoom,
          panX: state.view.panX,
          panY: state.view.panY,
          focusedCardId: null,
          selectedCardIds: [],
        },
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.cards.length === 0) {
          state.cards = mockCards
          state.edges = mockEdges
        }
      },
    }
  )
)

// Seed mock data when localStorage is empty
const initialState = useStore.getState()
if (initialState.cards.length === 0) {
  useStore.setState({ cards: mockCards, edges: mockEdges })
}
