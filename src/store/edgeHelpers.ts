import { Edge, SpatialCard } from '../types'

// ─── getEdgesForCard ──────────────────────────────────────────────────────────
// Returns all edges touching a card.
// When directed=true, sequence edges only return if card is the source.
// Similarity edges are always undirected.

export function getEdgesForCard(
  cardId: string,
  edges: Record<string, Edge>,
  directed = false,
): Edge[] {
  return Object.values(edges).filter((e) => {
    if (e.sourceId === cardId) return true
    if (e.type === 'sequence' && directed) return false
    return e.targetId === cardId
  })
}

// ─── getConnectedCardIds ──────────────────────────────────────────────────────
// Returns the set of card IDs reachable from cardId via edges.

export function getConnectedCardIds(
  cardId: string,
  edges: Record<string, Edge>,
  directed = false,
): Set<string> {
  const ids = new Set<string>()
  for (const edge of getEdgesForCard(cardId, edges, directed)) {
    ids.add(edge.sourceId === cardId ? edge.targetId : edge.sourceId)
  }
  return ids
}

// ─── getConnectedCards ────────────────────────────────────────────────────────
// Same as above but returns the full SpatialCard objects.

export function getConnectedCards(
  cardId: string,
  edges: Record<string, Edge>,
  cards: SpatialCard[],
  directed = false,
): SpatialCard[] {
  const ids = getConnectedCardIds(cardId, edges, directed)
  return cards.filter((c) => ids.has(c.id))
}

// ─── filterEdges ─────────────────────────────────────────────────────────────

interface FilterEdgesOptions {
  types?: Array<'sequence' | 'similarity'>
  minStrength?: number
  visibleCardIds?: Set<string>
  maxDistance?: number
  cardMap?: Map<string, SpatialCard>
}

export function filterEdges(
  edges: Record<string, Edge>,
  options: FilterEdgesOptions,
): Edge[] {
  const { types, minStrength, visibleCardIds, maxDistance, cardMap } = options
  return Object.values(edges).filter((e) => {
    if (types && !types.includes(e.type)) return false
    if (minStrength !== undefined && (e.strength ?? 1) < minStrength) return false
    if (visibleCardIds && (!visibleCardIds.has(e.sourceId) || !visibleCardIds.has(e.targetId))) return false
    if (maxDistance !== undefined && cardMap) {
      const src = cardMap.get(e.sourceId)
      const dst = cardMap.get(e.targetId)
      if (src && dst) {
        const dx = dst.x - src.x
        const dy = dst.y - src.y
        if (Math.sqrt(dx * dx + dy * dy) > maxDistance) return false
      }
    }
    return true
  })
}
