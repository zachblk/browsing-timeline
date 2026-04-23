import { useRef, useState, useMemo, useReducer, useCallback, forwardRef, useImperativeHandle } from 'react'

export interface CanvasFlowViewHandle {
  zoomIn(): void
  zoomOut(): void
  getZoomPct(): number
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ZoomLevel = 'far' | 'mid' | 'close'

interface FlowCard {
  id: string
  type: 'tab' | 'bookmark' | 'tab-group' | 'snippet' | 'image'
  title: string
  url?: string
  tags: string[]
  state: 'now' | 'later'
  x: number
  y: number
  description?: string
  relatedCardIds?: string[]
}

interface FlowCluster {
  id: string
  label: string
  cardIds: string[]
  fill: string   // blob fill color
  seed: number   // deterministic blob shape variance
}

interface FlowEdge {
  id: string
  sourceId: string
  targetId: string
  type: 'sequence' | 'similarity'
  strength: number
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const CARDS: FlowCard[] = [
  // Research cluster — upper left
  { id: '1',  type: 'tab',       title: 'Spatial UI Patterns – Nielsen Norman Group', url: 'https://nngroup.com',                     tags: ['research'],    state: 'now',   x: 210,  y: 180, description: 'Guidelines for spatial interfaces — proximity, scale, and chunking for canvas-based UIs.', relatedCardIds: ['2', '3'] },
  { id: '2',  type: 'bookmark',  title: 'Infinite Canvas – Maggie Appleton',          url: 'https://maggieappleton.com',              tags: ['research'],    state: 'now',   x: 390,  y: 150, description: 'Essay on why infinite canvases feel natural — spatial memory and cognitive load reduction.', relatedCardIds: ['1', '9'] },
  { id: '3',  type: 'tab',       title: 'Zoom UI Heuristics – Raskin',                url: 'https://humanpowered.org',                tags: ['research'],    state: 'later', x: 270,  y: 340, description: 'Zooming as a navigation primitive — when semantic zoom adds clarity vs. confusion.', relatedCardIds: ['1'] },
  { id: '4',  type: 'tab-group', title: 'Firefox Tab Architecture Docs',              url: 'https://firefox-source-docs.mozilla.org', tags: ['engineering'], state: 'now',   x: 450,  y: 265, description: 'Internal tab session model — how Firefox tracks tab groups, states, and history.', relatedCardIds: ['8'] },

  // Active Now cluster — center
  { id: '5',  type: 'tab',       title: 'MDN – Pointer Events API',                   url: 'https://developer.mozilla.org',           tags: ['engineering'], state: 'now',   x: 680,  y: 420, description: 'Pointer capture, coalesced events, and pressure — needed for smooth canvas dragging.', relatedCardIds: ['6', '7'] },
  { id: '6',  type: 'snippet',   title: 'easeInOutCubic – animation utility',                                                          tags: ['engineering'], state: 'now',   x: 800,  y: 530, description: 'Single cubic ease function used across camera animations and card transitions.', relatedCardIds: ['5', '8'] },
  { id: '7',  type: 'tab',       title: 'PRD Review – Browsing Timeline v2',                                                           tags: ['project'],     state: 'now',   x: 720,  y: 305, description: 'Latest PRD draft with semantic zoom spec, card model, and cluster layout requirements.', relatedCardIds: ['5'] },
  { id: '8',  type: 'bookmark',  title: 'CSS Transform Performance',                  url: 'https://web.dev',                         tags: ['engineering'], state: 'now',   x: 890,  y: 385, description: 'Why transform: translate is GPU-composited and avoids layout thrash on scroll.', relatedCardIds: ['4', '6'] },

  // Inspiration cluster — upper right
  { id: '9',  type: 'bookmark',  title: 'Muse App – Spatial Thinking Tool',           url: 'https://museapp.com',                     tags: ['inspiration'], state: 'later', x: 1140, y: 195, description: 'iPad-native infinite canvas for research — strong precedent for cluster grouping.', relatedCardIds: ['2', '10'] },
  { id: '10', type: 'bookmark',  title: 'Figma – How we built multiplayer',           url: 'https://figma.com',                       tags: ['inspiration'], state: 'later', x: 1300, y: 290, description: 'Operational transforms and canvas state sync — relevant for eventual tab sync.', relatedCardIds: ['9', '11'] },
  { id: '11', type: 'image',     title: 'Canvas UI Sketch – v1 wireframe',                                                            tags: ['design'],      state: 'later', x: 1175, y: 365, description: 'Original hand-drawn wireframe for the spatial timeline — cluster layout reference.', relatedCardIds: ['10'] },
  { id: '12', type: 'snippet',   title: 'Zustand slice pattern – devtools',                                                           tags: ['engineering'], state: 'later', x: 1370, y: 195, description: 'Store slice pattern for canvas state — pan, zoom, focus, and card positions.', relatedCardIds: [] },
]

const CLUSTERS: FlowCluster[] = [
  { id: 'c1', label: 'Research',    cardIds: ['1', '2', '3', '4'],          fill: '#bbf7d0', seed: 1.2 },
  { id: 'c2', label: 'Active now',  cardIds: ['5', '6', '7', '8'],          fill: '#c7d2fe', seed: 2.7 },
  { id: 'c3', label: 'Inspiration', cardIds: ['9', '10', '11', '12'],       fill: '#e9d5ff', seed: 4.1 },
]

const EDGES: FlowEdge[] = [
  { id: 'e1',  sourceId: '1',  targetId: '2',  type: 'sequence',   strength: 0.9 },
  { id: 'e2',  sourceId: '2',  targetId: '3',  type: 'sequence',   strength: 0.7 },
  { id: 'e3',  sourceId: '7',  targetId: '5',  type: 'sequence',   strength: 0.8 },
  { id: 'e4',  sourceId: '5',  targetId: '6',  type: 'sequence',   strength: 0.95 },
  { id: 'e5',  sourceId: '1',  targetId: '3',  type: 'similarity', strength: 0.75 },
  { id: 'e6',  sourceId: '2',  targetId: '9',  type: 'similarity', strength: 0.8 },
  { id: 'e7',  sourceId: '4',  targetId: '8',  type: 'similarity', strength: 0.65 },
  { id: 'e8',  sourceId: '9',  targetId: '10', type: 'similarity', strength: 0.7 },
  { id: 'e9',  sourceId: '6',  targetId: '8',  type: 'similarity', strength: 0.6 },
  { id: 'e10', sourceId: '10', targetId: '11', type: 'similarity', strength: 0.55 },
]

// ─── Palette ──────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, { gradA: string; gradB: string; dot: string }> = {
  tab:         { gradA: '#dbeafe', gradB: '#bfdbfe', dot: '#3b82f6' },
  bookmark:    { gradA: '#d1fae5', gradB: '#a7f3d0', dot: '#10b981' },
  'tab-group': { gradA: '#ede9fe', gradB: '#ddd6fe', dot: '#8b5cf6' },
  snippet:     { gradA: '#fef3c7', gradB: '#fde68a', dot: '#f59e0b' },
  image:       { gradA: '#fee2e2', gradB: '#fecaca', dot: '#ef4444' },
}

// ─── Zoom level ───────────────────────────────────────────────────────────────

const NEARBY_THRESHOLD = 450

function getZoomLevel(zoom: number): ZoomLevel {
  if (zoom < 0.8)  return 'far'
  if (zoom < 1.4)  return 'mid'
  return 'close'
}

// Determine the effective detail level for a single card.
// At close zoom, only the focused card shows full detail; nearby cards show mid.
function getCardDetail(
  zl: ZoomLevel,
  isFocused: boolean,
  isNearby: boolean,
): 'far' | 'mid' | 'close' {
  if (zl === 'far') return 'far'
  if (zl === 'mid') return 'mid'
  if (isFocused)    return 'close'
  if (isNearby)     return 'mid'
  return 'far'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDomain(url?: string): string | null {
  if (!url) return null
  try { return new URL(url).hostname.replace('www.', '') }
  catch { return null }
}

function dist(a: FlowCard, b: FlowCard): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// Organic blob path using Catmull-Rom → cubic bezier conversion.
// The seed drives deterministic per-cluster shape variation.
function organicBlob(cx: number, cy: number, rx: number, ry: number, seed: number): string {
  const N = 9
  const pts = Array.from({ length: N }, (_, i) => {
    const angle = (i / N) * Math.PI * 2 - Math.PI / 2
    // Deterministic variation per point — sin gives smooth undulations
    const jitter = 0.78 + 0.28 * Math.abs(Math.sin(seed * 4.3 + i * 2.1 + 0.7))
    return {
      x: cx + Math.cos(angle) * rx * jitter,
      y: cy + Math.sin(angle) * ry * jitter,
    }
  })

  // Convert Catmull-Rom spline to cubic beziers (closed loop)
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} `
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % N]
    const p3 = pts[(i + 2) % N]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += `C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)} `
  }
  return d + 'Z'
}

// Gentle quadratic bezier edge — curves perpendicular to midpoint
function edgePath(src: FlowCard, dst: FlowCard, type: 'sequence' | 'similarity'): string {
  const mx = (src.x + dst.x) / 2
  const my = (src.y + dst.y) / 2
  const dx = dst.x - src.x
  const dy = dst.y - src.y
  const len = Math.sqrt(dx * dx + dy * dy)
  // Perpendicular offset — sequence curves one way, similarity the other
  const perp = type === 'sequence' ? 1 : -1
  const offset = len * 0.18 * perp
  const cpx = mx - (dy / len) * offset
  const cpy = my + (dx / len) * offset
  return `M ${src.x} ${src.y} Q ${cpx} ${cpy} ${dst.x} ${dst.y}`
}

// Compute bounding ellipse for a cluster from its member card positions
function clusterBounds(cluster: FlowCluster, cards: FlowCard[]) {
  const members = cards.filter(c => cluster.cardIds.includes(c.id))
  if (members.length === 0) return null
  const xs = members.map(c => c.x)
  const ys = members.map(c => c.y)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const rx = Math.max((maxX - minX) / 2 + 150, 190)
  const ry = Math.max((maxY - minY) / 2 + 160, 190)
  return { cx, cy, rx, ry, count: members.length }
}

// ─── CanvasCard ───────────────────────────────────────────────────────────────

interface CanvasCardProps {
  card: FlowCard
  detail: 'far' | 'mid' | 'close'
  isFocused: boolean
  isDimmed: boolean
  onFocus: (id: string | null) => void
}

function Thumbnail({ colors, aspect }: { colors: { gradA: string; gradB: string; dot: string }; aspect: string }) {
  return (
    <div style={{
      aspectRatio: aspect,
      background: `linear-gradient(135deg, ${colors.gradA}, ${colors.gradB})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
    }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', background: colors.dot, opacity: 0.22, position: 'absolute' }} />
      <div style={{ width: 9,  height: 9,  borderRadius: '50%', background: colors.dot, opacity: 0.75 }} />
    </div>
  )
}

function CanvasCard({ card, detail, isFocused, isDimmed, onFocus }: CanvasCardProps) {
  const colors  = TYPE_COLORS[card.type] ?? TYPE_COLORS.tab
  const domain  = parseDomain(card.url)
  const isLater = card.state === 'later'

  const width = detail === 'far' ? 72 : detail === 'mid' ? 160 : 220
  const opacity = isDimmed ? 0.12 : isLater && !isFocused ? 0.62 : 1

  // ── Far: thumbnail dot only, no text ──────────────────────────────────────
  if (detail === 'far') {
    return (
      <div
        style={{
          position: 'absolute', left: card.x, top: card.y,
          transform: 'translate(-50%, -50%)',
          zIndex: isFocused ? 20 : 1,
          transition: 'opacity 0.25s ease, transform 0.25s ease',
          width,
          cursor: 'pointer',
          opacity,
        }}
        onPointerDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); onFocus(isFocused ? null : card.id) }}
      >
        <div style={{
          background: '#fff', borderRadius: 8, overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        }}>
          <Thumbnail colors={colors} aspect="4/3" />
        </div>
      </div>
    )
  }

  // ── Mid: thumbnail + title + domain + tag ─────────────────────────────────
  if (detail === 'mid') {
    return (
      <div
        style={{
          position: 'absolute', left: card.x, top: card.y,
          transform: `translate(-50%, -50%) ${isFocused ? 'scale(1.06)' : 'scale(1)'}`,
          zIndex: isFocused ? 20 : 1,
          transition: 'transform 0.22s ease, opacity 0.22s ease',
          width,
          cursor: 'pointer',
          opacity,
        }}
        onPointerDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); onFocus(isFocused ? null : card.id) }}
      >
        <div style={{
          background: '#fff', borderRadius: 12, overflow: 'hidden',
          boxShadow: isFocused
            ? '0 6px 24px rgba(109,40,217,0.18), 0 2px 8px rgba(0,0,0,0.07)'
            : '0 2px 8px rgba(0,0,0,0.07)',
          outline: isFocused ? '2px solid #7c3aed' : 'none',
          outlineOffset: 2,
        }}>
          <Thumbnail colors={colors} aspect="16/9" />
          <div style={{ padding: '9px 11px 11px' }}>
            <p style={{
              margin: 0, fontSize: 11, fontWeight: 600, color: '#111827', lineHeight: 1.4,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {card.title}
            </p>
            {domain && (
              <p style={{ margin: '5px 0 0', fontSize: 10, color: '#9ca3af', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {domain}
              </p>
            )}
            {card.tags[0] && (
              <span style={{
                display: 'inline-block', marginTop: 8, fontSize: 10, fontWeight: 500,
                background: '#f3f0ff', color: '#6d28d9', borderRadius: 999, padding: '3px 8px',
              }}>
                {card.tags[0]}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Close: full detail ────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: 'absolute', left: card.x, top: card.y,
        transform: `translate(-50%, -50%) ${isFocused ? 'scale(1.04)' : 'scale(1)'}`,
        zIndex: isFocused ? 20 : 1,
        transition: 'transform 0.22s ease, opacity 0.22s ease',
        width,
        cursor: 'pointer',
        opacity,
      }}
      onPointerDown={e => e.stopPropagation()}
      onClick={e => { e.stopPropagation(); onFocus(isFocused ? null : card.id) }}
    >
      <div style={{
        background: '#fff', borderRadius: 14, overflow: 'hidden',
        boxShadow: isFocused
          ? '0 12px 40px rgba(109,40,217,0.22), 0 3px 10px rgba(0,0,0,0.09)'
          : '0 4px 16px rgba(0,0,0,0.09)',
        outline: isFocused ? '2.5px solid #7c3aed' : 'none',
        outlineOffset: 2,
      }}>
        <Thumbnail colors={colors} aspect="4/3" />
        <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {card.tags[0] && (
            <span style={{
              display: 'inline-block', fontSize: 10, fontWeight: 600, letterSpacing: '0.04em',
              textTransform: 'uppercase', color: '#7c3aed', marginBottom: 6,
            }}>
              {card.tags[0]}
            </span>
          )}
          <p style={{
            margin: 0, fontSize: 13, fontWeight: 700, color: '#111827', lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {card.title}
          </p>
          {card.description && (
            <p style={{
              margin: '7px 0 0', fontSize: 11, color: '#6b7280', lineHeight: 1.5,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {card.description}
            </p>
          )}
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {domain ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <img
                  src={`https://www.google.com/s2/favicons?domain=${domain}&sz=14`}
                  alt="" width={12} height={12} style={{ borderRadius: 2, flexShrink: 0 }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <span style={{ fontSize: 10, color: '#9ca3af', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 100 }}>
                  {domain}
                </span>
              </div>
            ) : <span />}
            <span style={{ fontSize: 11, fontWeight: 600, color: '#7c3aed', whiteSpace: 'nowrap' }}>
              View →
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── CanvasFlowView ───────────────────────────────────────────────────────────

const ZOOM_MIN = 0.15
const ZOOM_MAX = 2.5
const INITIAL_PAN = { x: 130, y: 95 }
const INITIAL_ZOOM = 0.78

export const CanvasFlowView = forwardRef<CanvasFlowViewHandle>(function CanvasFlowView(_props, ref) {
  const stageRef     = useRef<HTMLDivElement>(null)
  const isPanningRef = useRef(false)
  const lastPtrRef   = useRef({ x: 0, y: 0 })
  const panRef       = useRef(INITIAL_PAN)
  const zoomRef      = useRef(INITIAL_ZOOM)
  const [, forceUpdate] = useReducer(n => n + 1, 0)

  const [isPanning, setIsPanning]   = useState(false)
  const [focusedId, setFocusedId]   = useState<string | null>(null)

  useImperativeHandle(ref, () => ({
    getZoomPct() { return Math.round(zoomRef.current * 100) },
    zoomIn() {
      const stage = stageRef.current
      if (!stage) return
      const { width, height } = stage.getBoundingClientRect()
      const cx = width / 2, cy = height / 2
      const newZoom = Math.min(ZOOM_MAX, zoomRef.current * 1.2)
      const scale   = newZoom / zoomRef.current
      panRef.current  = { x: cx - scale * (cx - panRef.current.x), y: cy - scale * (cy - panRef.current.y) }
      zoomRef.current = newZoom
      forceUpdate()
    },
    zoomOut() {
      const stage = stageRef.current
      if (!stage) return
      const { width, height } = stage.getBoundingClientRect()
      const cx = width / 2, cy = height / 2
      const newZoom = Math.max(ZOOM_MIN, zoomRef.current / 1.2)
      const scale   = newZoom / zoomRef.current
      panRef.current  = { x: cx - scale * (cx - panRef.current.x), y: cy - scale * (cy - panRef.current.y) }
      zoomRef.current = newZoom
      forceUpdate()
    },
  }))

  // Derived
  const cardMap = useMemo(() => new Map(CARDS.map(c => [c.id, c])), [])

  // IDs within NEARBY_THRESHOLD world-units of focused card (for close-zoom detail)
  const nearbyIds = useMemo<Set<string>>(() => {
    if (!focusedId) return new Set()
    const focused = cardMap.get(focusedId)
    if (!focused) return new Set()
    return new Set(CARDS.filter(c => c.id !== focusedId && dist(c, focused) <= NEARBY_THRESHOLD).map(c => c.id))
  }, [focusedId, cardMap])

  const clusterData = useMemo(
    () => CLUSTERS.map(c => ({ ...c, bounds: clusterBounds(c, CARDS) })).filter(c => c.bounds),
    [],
  )

  // ── Camera animation ────────────────────────────────────────────────────────

  const animateTo = useCallback((targetPan: { x: number; y: number }, targetZoom: number) => {
    const startPan  = { ...panRef.current }
    const startZoom = zoomRef.current
    const startTime = performance.now()
    const duration  = 380

    function tick(now: number) {
      const t = easeInOutCubic(Math.min((now - startTime) / duration, 1))
      panRef.current  = {
        x: startPan.x + (targetPan.x - startPan.x) * t,
        y: startPan.y + (targetPan.y - startPan.y) * t,
      }
      zoomRef.current = startZoom + (targetZoom - startZoom) * t
      forceUpdate()
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [forceUpdate])

  const handleFocus = useCallback((id: string | null) => {
    setFocusedId(id)
    if (!id) return

    const card  = cardMap.get(id)
    if (!card)  return
    const stage = stageRef.current
    if (!stage) return

    const { width, height } = stage.getBoundingClientRect()
    const targetZoom = Math.max(zoomRef.current, 1.4)
    const targetPan  = {
      x: width  / 2 - card.x * targetZoom,
      y: height / 2 - card.y * targetZoom,
    }
    animateTo(targetPan, targetZoom)
  }, [cardMap, animateTo])

  // ── Pan ─────────────────────────────────────────────────────────────────────

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    isPanningRef.current = true
    setIsPanning(true)
    lastPtrRef.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
    setFocusedId(null)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isPanningRef.current) return
    const dx = e.clientX - lastPtrRef.current.x
    const dy = e.clientY - lastPtrRef.current.y
    lastPtrRef.current = { x: e.clientX, y: e.clientY }
    panRef.current = { x: panRef.current.x + dx, y: panRef.current.y + dy }
    forceUpdate()
  }

  function handlePointerUp() {
    isPanningRef.current = false
    setIsPanning(false)
  }

  // ── Zoom toward cursor ───────────────────────────────────────────────────────

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    e.preventDefault()
    const rect    = stageRef.current!.getBoundingClientRect()
    const cx      = e.clientX - rect.left
    const cy      = e.clientY - rect.top
    const step    = e.ctrlKey ? 0.012 : 0.0012
    const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoomRef.current * (1 - e.deltaY * step)))
    const scale   = newZoom / zoomRef.current
    panRef.current  = {
      x: cx - scale * (cx - panRef.current.x),
      y: cy - scale * (cy - panRef.current.y),
    }
    zoomRef.current = newZoom
    forceUpdate()
  }

  const pan       = panRef.current
  const zoom      = zoomRef.current
  const zoomLevel = getZoomLevel(zoom)

  // Dot-grid background scales with zoom
  const dotPx       = zoom > 0.5 ? 1.2 : 0.8
  const gridSpacing = 32 * zoom

  return (
    <div
      ref={stageRef}
      style={{
        position: 'relative',
        flex: 1,
        overflow: 'hidden',
        userSelect: 'none',
        cursor: isPanning ? 'grabbing' : 'default',
        background: '#edeef8',
        backgroundImage: `radial-gradient(circle, rgba(180,182,210,0.55) ${dotPx}px, transparent 1px)`,
        backgroundSize: `${gridSpacing}px ${gridSpacing}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
    >
      {/* ── World ── */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transformOrigin: 'top left',
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        willChange: 'transform',
      }}>
        {/* ── SVG: blobs + edges ── */}
        <svg
          style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', overflow: 'visible' }}
          width={2000}
          height={900}
        >
          <defs>
            {/* Soft glow filter for cluster blobs */}
            <filter id="blob-soft" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="22" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Arrow marker for sequence edges */}
            <marker id="seq-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
              <path d="M0,1 L6,3.5 L0,6 Z" fill="#94a3b8" fillOpacity="0.6" />
            </marker>
            <marker id="seq-arrow-hi" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
              <path d="M0,1 L6,3.5 L0,6 Z" fill="#6366f1" />
            </marker>
          </defs>

          {/* ── Cluster blobs ── */}
          {clusterData.map(cluster => {
            const b = cluster.bounds!
            const blobD = organicBlob(b.cx, b.cy, b.rx, b.ry, cluster.seed)
            return (
              <g key={cluster.id}>
                {/* Soft outer glow */}
                <path
                  d={blobD}
                  fill={cluster.fill}
                  fillOpacity={0.55}
                  filter="url(#blob-soft)"
                />
                {/* Crisp inner fill */}
                <path
                  d={blobD}
                  fill={cluster.fill}
                  fillOpacity={0.28}
                />

                {/* Cluster label */}
                <text
                  x={b.cx}
                  y={b.cy - b.ry - 18}
                  textAnchor="middle"
                  fontSize={22}
                  fontWeight={700}
                  fill="#1f2937"
                  fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                >
                  {cluster.label}
                </text>
                <text
                  x={b.cx}
                  y={b.cy - b.ry + 6}
                  textAnchor="middle"
                  fontSize={13}
                  fill="#9ca3af"
                  fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                >
                  {b.count} cards
                </text>
              </g>
            )
          })}

          {/* ── Edges — hidden at far zoom ── */}
          {zoomLevel !== 'far' && EDGES.map(edge => {
            const src = cardMap.get(edge.sourceId)
            const dst = cardMap.get(edge.targetId)
            if (!src || !dst) return null

            const touchesFocused = focusedId !== null &&
              (edge.sourceId === focusedId || edge.targetId === focusedId)
            const hasFocus = focusedId !== null

            // At mid zoom: subtle dashed lines, no focus emphasis
            // At close zoom: emphasize focused connections, fade others
            let strokeColor = '#6d28d9'
            let strokeOpacity: number
            let strokeWidth: number
            let dashArray: string

            if (zoomLevel === 'mid') {
              strokeOpacity = 0.10
              strokeWidth   = 1
              dashArray     = '5 6'
            } else {
              // close zoom
              strokeOpacity = hasFocus
                ? (touchesFocused ? 0.50 : 0.06)
                : 0.22
              strokeWidth   = touchesFocused && hasFocus ? 1.5 : 1
              dashArray     = touchesFocused && hasFocus ? 'none' : '4 5'
            }

            return (
              <path
                key={edge.id}
                d={edgePath(src, dst, edge.type)}
                fill="none"
                stroke={strokeColor}
                strokeOpacity={strokeOpacity}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray === 'none' ? undefined : dashArray}
                strokeLinecap="round"
              />
            )
          })}
        </svg>

        {/* ── Cards ── */}
        {CARDS.map(card => {
          const isFocused = focusedId === card.id
          const isNearby  = nearbyIds.has(card.id)
          const detail    = getCardDetail(zoomLevel, isFocused, isNearby)
          const isDimmed  = zoomLevel === 'close' && focusedId !== null && !isFocused && !isNearby
          return (
            <CanvasCard
              key={card.id}
              card={card}
              detail={detail}
              isFocused={isFocused}
              isDimmed={isDimmed}
              onFocus={handleFocus}
            />
          )
        })}
      </div>

    </div>
  )
})
