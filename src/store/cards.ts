import { StateCreator } from 'zustand'
import { Card, CardState, SpatialCard } from '../types'

export interface CardsSlice {
  cards: SpatialCard[]
  addCard: (card: Omit<SpatialCard, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateCard: (id: string, patch: Partial<Card>) => void
  moveCard: (id: string, x: number, y: number) => void
  setCardState: (id: string, state: CardState) => void
  removeCard: (id: string) => void
}

export const createCardsSlice: StateCreator<CardsSlice> = (set) => ({
  cards: [],

  addCard: (card) =>
    set((state) => ({
      cards: [
        ...state.cards,
        {
          ...card,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
    })),

  updateCard: (id, patch) =>
    set((state) => ({
      cards: state.cards.map((c) =>
        c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c
      ),
    })),

  moveCard: (id, x, y) =>
    set((state) => ({
      cards: state.cards.map((c) => (c.id === id ? { ...c, x, y } : c)),
    })),

  setCardState: (id, cardState) =>
    set((state) => ({
      cards: state.cards.map((c) =>
        c.id === id ? { ...c, state: cardState, updatedAt: Date.now() } : c
      ),
    })),

  removeCard: (id) =>
    set((state) => ({ cards: state.cards.filter((c) => c.id !== id) })),
})
