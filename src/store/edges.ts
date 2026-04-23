import { StateCreator } from 'zustand'
import { Edge } from '../types'

export interface EdgesSlice {
  edges: Record<string, Edge>
  addEdge: (edge: Omit<Edge, 'id'>) => void
  removeEdge: (id: string) => void
  setEdges: (edges: Record<string, Edge>) => void
}

export const createEdgesSlice: StateCreator<EdgesSlice> = (set) => ({
  edges: {},

  addEdge: (edge) => {
    const id = crypto.randomUUID()
    set((state) => ({
      edges: { ...state.edges, [id]: { ...edge, id } },
    }))
  },

  removeEdge: (id) =>
    set((state) => {
      const next = { ...state.edges }
      delete next[id]
      return { edges: next }
    }),

  setEdges: (edges) => set({ edges }),
})
