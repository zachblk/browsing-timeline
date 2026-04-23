import { Edge } from '../types'

// sequence = directional (A → B), browsing order
// similarity = undirected, shared tags/domain/topic

export const mockEdges: Record<string, Edge> = {
  e1:  { id: 'e1',  sourceId: '1',  targetId: '2',  type: 'sequence',   strength: 0.9 },
  e2:  { id: 'e2',  sourceId: '2',  targetId: '3',  type: 'sequence',   strength: 0.7 },
  e3:  { id: 'e3',  sourceId: '4',  targetId: '9',  type: 'sequence',   strength: 0.8 },
  e4:  { id: 'e4',  sourceId: '9',  targetId: '10', type: 'sequence',   strength: 0.95 },
  e5:  { id: 'e5',  sourceId: '1',  targetId: '11', type: 'similarity', strength: 0.75 },
  e6:  { id: 'e6',  sourceId: '2',  targetId: '5',  type: 'similarity', strength: 0.8 },
  e7:  { id: 'e7',  sourceId: '3',  targetId: '10', type: 'similarity', strength: 0.65 },
  e8:  { id: 'e8',  sourceId: '5',  targetId: '8',  type: 'similarity', strength: 0.7 },
  e9:  { id: 'e9',  sourceId: '6',  targetId: '3',  type: 'similarity', strength: 0.6 },
  e10: { id: 'e10', sourceId: '12', targetId: '1',  type: 'similarity', strength: 0.55 },
}
