import { useRef, useState } from 'react'
import { useStore } from '../src/store'
import { selectVisibleCards, selectZoomLevel } from '../src/store/selectors'
import { SpatialCard } from '../src/types'
import { cn } from '../lib/utils'
import { Card } from './Card'

// ─── Constants ────────────────────────────────────────────────────────────────

const ZOOM_MIN = 0.1
const ZOOM_MAX = 2.0
const ZOOM_STEP       = 0.001   // scroll
const ZOOM_STEP_PINCH = 0.01    // pinch (ctrlKey on macOS)

// Static map — full class names so Tailwind doesn't purge them
const TYPE_DOT: Record<string, string> = {
  tab:         'bg-blue-400',
  bookmark:    'bg-emerald-400',
  'tab-group': 'bg-violet-400',
  snippet:     'bg-orange-400',
  image:       'bg-pink-400',
}

// ─── CanvasCardWrapper ────────────────────────────────────────────────────────
// Handles absolute positioning and canvas interaction (stopPropagation, focus).
// Delegates all visual rendering to the shared Card component.

interface CanvasCardWrapperProps {
  card: SpatialCard
  isFocused: boolean
  showDot: boolean       // true when zoom is far — render a dot instead of Card
  onFocus: (id: string | null) => void
}

function CanvasCardWrapper({ card, isFocused, showDot, onFocus }: CanvasCardWrapperProps) {
  const dot = TYPE_DOT[card.type] ?? 'bg-gray-400'
  const isLater = card.state === 'later'

  function handlePointerDown(e: React.PointerEvent) {
    // Prevent stage from starting a pan when clicking a card
    e.stopPropagation()
  }

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    onFocus(isFocused ? null : card.id)
  }

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: card.x, top: card.y, zIndex: isFocused ? 10 : (card.zIndex ?? 1) }}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
    >
      {showDot ? (
        // Far zoom — dot only, no Card rendered
        <div className={cn('h-3 w-3 rounded-full shadow-sm', dot, isLater && 'opacity-40')} />
      ) : (
        <Card
          card={card}
          mode={isFocused ? 'focused' : 'canvas'}
          // onClick is handled by the wrapper div above; Card is purely visual here
        />
      )}
    </div>
  )
}

// ─── CanvasView ───────────────────────────────────────────────────────────────

export function CanvasView() {
  const view      = useStore((s) => s.view)
  const cards     = useStore(selectVisibleCards)
  const zoomLevel = useStore(selectZoomLevel)
  const setCamera = useStore((s) => s.setCamera)
  const focusCard = useStore((s) => s.focusCard)

  const stageRef       = useRef<HTMLDivElement>(null)
  const isPanningRef   = useRef(false)
  const lastPointerRef = useRef({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)

  // ── Pan ──────────────────────────────────────────────────────────────────────
  // Cards call stopPropagation on pointerDown, so this only fires on background.

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    isPanningRef.current = true
    setIsPanning(true)
    lastPointerRef.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
    focusCard(null)
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

  // ── Zoom toward cursor ───────────────────────────────────────────────────────

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    e.preventDefault()
    const rect   = stageRef.current!.getBoundingClientRect()
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

  // Dot grid scales with zoom to feel spatially consistent
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
        background: '#f3f4f6',
        backgroundImage: `radial-gradient(circle, #d1d5db ${dotPx}px, transparent 1px)`,
        backgroundSize:     `${gridSpacing}px ${gridSpacing}px`,
        backgroundPosition: `${view.panX}px ${view.panY}px`,
      }}
    >
      {/* ── World container — single CSS transform ── */}
      <div
        className="absolute left-0 top-0 origin-top-left will-change-transform"
        style={{ transform: `translate(${view.panX}px, ${view.panY}px) scale(${view.zoom})` }}
      >
        {cards.map((card) => (
          <CanvasCardWrapper
            key={card.id}
            card={card}
            isFocused={view.focusedCardId === card.id}
            showDot={zoomLevel === 'far'}
            onFocus={focusCard}
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
