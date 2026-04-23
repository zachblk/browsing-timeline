import { useRef } from 'react'
import { useStore } from '../store'
import { selectVisibleCards, selectZoomLevel } from '../store/selectors'
import { CanvasCard } from './CanvasCard'

const ZOOM_MIN = 0.1
const ZOOM_MAX = 2.0

export function CanvasStage() {
  const view = useStore((s) => s.view)
  const cards = useStore(selectVisibleCards)
  const zoomLevel = useStore(selectZoomLevel)
  const setCamera = useStore((s) => s.setCamera)
  const focusCard = useStore((s) => s.focusCard)

  const stageRef = useRef<HTMLDivElement>(null)
  const isPanningRef = useRef(false)
  const lastPointerRef = useRef({ x: 0, y: 0 })

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.target !== stageRef.current && e.target !== e.currentTarget) return
    isPanningRef.current = true
    lastPointerRef.current = { x: e.clientX, y: e.clientY }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
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
  }

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    e.preventDefault()
    const rect = stageRef.current!.getBoundingClientRect()
    const cursorX = e.clientX - rect.left
    const cursorY = e.clientY - rect.top

    const delta = e.ctrlKey ? e.deltaY * 0.01 : e.deltaY * 0.001
    const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, view.zoom * (1 - delta)))
    const scale = newZoom / view.zoom

    setCamera({
      zoom: newZoom,
      panX: cursorX - scale * (cursorX - view.panX),
      panY: cursorY - scale * (cursorY - view.panY),
    })
  }

  return (
    <div
      ref={stageRef}
      style={styles.stage}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
    >
      {/* Dot-grid background */}
      <div style={{
        ...styles.grid,
        backgroundPosition: `${view.panX}px ${view.panY}px`,
        backgroundSize: `${20 * view.zoom}px ${20 * view.zoom}px`,
      }} />

      {/* Canvas world — single transformed container */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          transformOrigin: '0 0',
          transform: `translate(${view.panX}px, ${view.panY}px) scale(${view.zoom})`,
          willChange: 'transform',
        }}
      >
        {cards.map((card) => (
          <CanvasCard key={card.id} card={card} zoomLevel={zoomLevel} />
        ))}
      </div>

      {/* Zoom indicator */}
      <div style={styles.zoomBadge}>{Math.round(view.zoom * 100)}%</div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  stage: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    background: '#f0f0f0',
    cursor: 'default',
  },
  grid: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'radial-gradient(circle, #ccc 1px, transparent 1px)',
    pointerEvents: 'none',
  },
  zoomBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(4px)',
    border: '1px solid #e5e5e5',
    borderRadius: 6,
    padding: '4px 10px',
    fontSize: 12,
    fontWeight: 500,
    color: '#555',
    pointerEvents: 'none',
  },
}
