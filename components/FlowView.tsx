import { useRef, useState, useMemo } from 'react'
import { useStore } from '../src/store'
import { selectVisibleCards } from '../src/store/selectors'
import { getEdgesForCard, getConnectedCardIds, filterEdges } from '../src/store/edgeHelpers'
import { SpatialCard, Cluster } from '../src/types'
import { mockClusters } from '../src/data/mockClusters'
import { cn } from '../lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const ZOOM_MIN       = 0.1
const ZOOM_MAX       = 2.0
const ZOOM_STEP      = 0.001
const ZOOM_STEP_PINCH = 0.01
const WORLD_W        = 3000
const WORLD_H        = 2500

// ─── Type visuals ─────────────────────────────────────────────────────────────

const TYPE_GRAD: Record<string, string> = {
  tab:         'from-blue-100 to-blue-200',
  bookmark:    'from-emerald-100 to-emerald-200',
  'tab-group': 'from-violet-100 to-violet-200',
  snippet:     'from-amber-100 to-amber-200',
  image:       'from-rose-100 to-rose-200',
}

const TYPE_DOT: Record<string, string> = {
  tab:         'bg-blue-400',
  bookmark:    'bg-emerald-400',
  'tab-group': 'bg-violet-400',
  snippet:     'bg-amber-400',
  image:       'bg-rose-400',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDomain(url?: string): string | null {
  if (!url) return null
  try { return new URL(url).hostname.replace('www.', '') }
  catch { return null }
}

// Cubic bezier path between two world-space points.
// sequence edges curve upward; similarity edges curve downward slightly.
function edgePath(src: SpatialCard, dst: SpatialCard, type: 'sequence' | 'similarity'): string {
  const dx = dst.x - src.x
  const sign = type === 'sequence' ? -1 : 1
  const cp1x = src.x + dx * 0.4
  const cp1y = src.y + sign * Math.abs(dst.y - src.y) * 0.15
  const cp2x = dst.x - dx * 0.4
  const cp2y = dst.y + sign * Math.abs(dst.y - src.y) * 0.15
  return `M ${src.x} ${src.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${dst.x} ${dst.y}`
}

// Midpoint of a bezier for arrowhead placement (approximated at t=0.5).
function bezierMidpoint(
  src: SpatialCard, dst: SpatialCard
): { x: number; y: number; angle: number } {
  const mx = (src.x + dst.x) / 2
  const my = (src.y + dst.y) / 2
  const angle = Math.atan2(dst.y - src.y, dst.x - src.x) * (180 / Math.PI)
  return { x: mx, y: my, angle }
}

// ─── Cluster geometry ─────────────────────────────────────────────────────────

interface ClusterGeometry extends Cluster {
  cx: number
  cy: number
  rx: number
  ry: number
  count: number
}

function computeClusterGeometry(clusters: Cluster[], cards: SpatialCard[]): ClusterGeometry[] {
  return clusters.flatMap((cluster) => {
    const members = cards.filter((c) => cluster.cardIds.includes(c.id))
    if (members.length === 0) return []
    const xs = members.map((c) => c.x)
    const ys = members.map((c) => c.y)
    const minX = Math.min(...xs), maxX = Math.max(...xs)
    const minY = Math.min(...ys), maxY = Math.max(...ys)
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    const rx = Math.max((maxX - minX) / 2 + 140, 170)
    const ry = Math.max((maxY - minY) / 2 + 140, 170)
    return [{ ...cluster, cx, cy, rx, ry, count: members.length }]
  })
}

// ─── FlowCard ─────────────────────────────────────────────────────────────────

interface FlowCardProps {
  card: SpatialCard
  isFocused: boolean
  isDimmed: boolean
  onFocus: (id: string | null) => void
}

function FlowCard({ card, isFocused, isDimmed, onFocus }: FlowCardProps) {
  const grad   = TYPE_GRAD[card.type] ?? 'from-gray-100 to-gray-200'
  const dot    = TYPE_DOT[card.type] ?? 'bg-gray-400'
  const domain = parseDomain(card.url)

  function handlePointerDown(e: React.PointerEvent) { e.stopPropagation() }
  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    onFocus(isFocused ? null : card.id)
  }

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: card.x, top: card.y, zIndex: isFocused ? 20 : (card.zIndex ?? 1) }}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
    >
      <div className={cn(
        'w-44 cursor-pointer overflow-hidden rounded-xl bg-white shadow-sm',
        'transition-all duration-200',
        isFocused  && 'shadow-xl ring-2 ring-indigo-400 ring-offset-2 scale-105',
        isDimmed   && 'opacity-20',
        card.state === 'later' && !isFocused && 'opacity-60',
      )}>
        {/* Thumbnail / gradient placeholder */}
        <div className={cn(
          'aspect-video overflow-hidden bg-gradient-to-br',
          grad,
        )}>
          <div className="flex h-full w-full items-center justify-center">
            <span className={cn('h-2.5 w-2.5 rounded-full', dot)} />
          </div>
        </div>

        {/* Content */}
        <div className="px-3 pb-3 pt-2.5">
          <p className="line-clamp-2 text-[11px] font-semibold leading-snug text-gray-800">
            {card.title}
          </p>
          {domain && (
            <p className="mt-1 truncate text-[10px] text-gray-400">{domain}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── FlowView ─────────────────────────────────────────────────────────────────

export function FlowView() {
  const cards     = useStore(selectVisibleCards)
  const edges     = useStore((s) => s.edges)
  const view      = useStore((s) => s.view)
  const setCamera = useStore((s) => s.setCamera)

  const stageRef       = useRef<HTMLDivElement>(null)
  const isPanningRef   = useRef(false)
  const lastPointerRef = useRef({ x: 0, y: 0 })
  const [isPanning, setIsPanning]   = useState(false)
  const [focusedId, setFocusedId]   = useState<string | null>(null)

  // Cluster geometry derived from card positions
  const clusterGeometry = useMemo(
    () => computeClusterGeometry(mockClusters, cards),
    [cards],
  )

  // Visible card IDs for edge filtering
  const visibleCardIds = useMemo(() => new Set(cards.map((c) => c.id)), [cards])

  // Only show edges where both endpoint cards are visible
  const visibleEdges = useMemo(
    () => filterEdges(edges, { visibleCardIds }),
    [edges, visibleCardIds],
  )

  // Card IDs connected to the focused card (for highlight / dim)
  const connectedIds = useMemo(
    () => focusedId ? getConnectedCardIds(focusedId, edges) : new Set<string>(),
    [focusedId, edges],
  )

  // Fast card lookup for edge rendering
  const cardMap = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards])

  // ── Pan ───────────────────────────────────────────────────────────────────────

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    isPanningRef.current = true
    setIsPanning(true)
    lastPointerRef.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
    setFocusedId(null)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isPanningRef.current) return
    const dx = e.clientX - lastPointerRef.current.x
    const dy = e.clientY - lastPointerRef.current.y
    lastPointerRef.current = { x: e.clientX, y: e.clientY }
    setCamera({ panX: view.panX + dx, panY: view.panY + dy })
  }

  function handlePointerUp() {
    isPanningRef.current = false
    setIsPanning(false)
  }

  // ── Zoom toward cursor ────────────────────────────────────────────────────────

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    e.preventDefault()
    const rect    = stageRef.current!.getBoundingClientRect()
    const cursorX = e.clientX - rect.left
    const cursorY = e.clientY - rect.top
    const step    = e.ctrlKey ? ZOOM_STEP_PINCH : ZOOM_STEP
    const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, view.zoom * (1 - e.deltaY * step)))
    const scale   = newZoom / view.zoom
    setCamera({
      zoom: newZoom,
      panX: cursorX - scale * (cursorX - view.panX),
      panY: cursorY - scale * (cursorY - view.panY),
    })
  }

  const dotPx      = view.zoom > 0.6 ? 1 : 0.5
  const gridSpacing = 24 * view.zoom

  return (
    <div
      ref={stageRef}
      className={cn(
        'relative flex-1 select-none overflow-hidden',
        isPanning ? 'cursor-grabbing' : 'cursor-default',
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      style={{
        background: '#f5f5fb',
        backgroundImage: `radial-gradient(circle, #d1d5db ${dotPx}px, transparent 1px)`,
        backgroundSize:     `${gridSpacing}px ${gridSpacing}px`,
        backgroundPosition: `${view.panX}px ${view.panY}px`,
      }}
    >
      {/* ── World container ── */}
      <div
        className="absolute left-0 top-0 origin-top-left will-change-transform"
        style={{ transform: `translate(${view.panX}px, ${view.panY}px) scale(${view.zoom})` }}
      >
        {/* ── SVG layer: clusters + edges ── */}
        <svg
          className="pointer-events-none absolute left-0 top-0"
          width={WORLD_W}
          height={WORLD_H}
          style={{ overflow: 'visible' }}
        >
          {/* Cluster blobs */}
          {clusterGeometry.map((cluster) => (
            <g key={cluster.id}>
              <ellipse
                cx={cluster.cx} cy={cluster.cy}
                rx={cluster.rx} ry={cluster.ry}
                fill={cluster.color}
                fillOpacity={0.4}
                stroke={cluster.color}
                strokeOpacity={0.7}
                strokeWidth={1.5}
              />
              <text
                x={cluster.cx}
                y={cluster.cy - cluster.ry - 16}
                textAnchor="middle"
                fontSize={20}
                fontWeight={700}
                fill="#1f2937"
                fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
              >
                {cluster.label}
              </text>
              <text
                x={cluster.cx}
                y={cluster.cy - cluster.ry + 6}
                textAnchor="middle"
                fontSize={12}
                fill="#9ca3af"
                fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
              >
                {cluster.count} cards
              </text>
            </g>
          ))}

          {/* Defs: arrowhead marker for sequence edges */}
          <defs>
            <marker
              id="arrow-default"
              markerWidth={6} markerHeight={6}
              refX={5} refY={3}
              orient="auto"
            >
              <path d="M0,0 L6,3 L0,6 Z" fill="#94a3b8" fillOpacity={0.5} />
            </marker>
            <marker
              id="arrow-highlight"
              markerWidth={6} markerHeight={6}
              refX={5} refY={3}
              orient="auto"
            >
              <path d="M0,0 L6,3 L0,6 Z" fill="#6366f1" />
            </marker>
          </defs>

          {/* Edges */}
          {visibleEdges.map((edge) => {
            const src = cardMap.get(edge.sourceId)
            const dst = cardMap.get(edge.targetId)
            if (!src || !dst) return null

            const isHighlighted = focusedId !== null &&
              (edge.sourceId === focusedId || edge.targetId === focusedId)
            const isFaded = focusedId !== null && !isHighlighted
            const isSequence = edge.type === 'sequence'

            const opacity = isFaded ? 0.06
              : isHighlighted ? 0.85
              : (edge.strength ?? 0.7) * 0.45

            return (
              <path
                key={edge.id}
                d={edgePath(src, dst, edge.type)}
                fill="none"
                stroke={isHighlighted ? '#6366f1' : '#94a3b8'}
                strokeOpacity={opacity}
                strokeWidth={isHighlighted ? 2 : 1.5}
                strokeDasharray={isSequence ? '8 5' : '4 4'}
                strokeLinecap="round"
                markerEnd={isSequence
                  ? (isHighlighted ? 'url(#arrow-highlight)' : 'url(#arrow-default)')
                  : undefined
                }
              />
            )
          })}
        </svg>

        {/* ── Cards ── */}
        {cards.map((card) => (
          <FlowCard
            key={card.id}
            card={card}
            isFocused={focusedId === card.id}
            isDimmed={focusedId !== null && focusedId !== card.id && !connectedIds.has(card.id)}
            onFocus={setFocusedId}
          />
        ))}
      </div>

      {/* ── Zoom HUD ── */}
      <div className="pointer-events-none absolute bottom-4 right-4">
        <div className="rounded-lg border border-gray-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-gray-500 shadow-sm backdrop-blur-sm">
          {Math.round(view.zoom * 100)}%
        </div>
      </div>
    </div>
  )
}
