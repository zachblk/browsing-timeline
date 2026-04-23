import { useRef } from 'react'
import { SpatialCard, ZoomLevel } from '../types'
import { useStore } from '../store'
import { focusCard } from '../interactions/camera'
import { computeDragPosition, DragState } from '../interactions/drag'

const TYPE_COLORS: Record<string, string> = {
  tab: '#3b82f6',
  bookmark: '#22c55e',
  'tab-group': '#a855f7',
  snippet: '#f97316',
  image: '#ec4899',
}

interface Props {
  card: SpatialCard
  zoomLevel: ZoomLevel
}

export function CanvasCard({ card, zoomLevel }: Props) {
  const moveCard = useStore((s) => s.moveCard)
  const focusedCardId = useStore((s) => s.view.focusedCardId)
  const isFocused = focusedCardId === card.id
  const isLater = card.state === 'later'
  const color = TYPE_COLORS[card.type] ?? '#999'

  const dragRef = useRef<DragState | null>(null)
  const didMoveRef = useRef(false)

  function handlePointerDown(e: React.PointerEvent) {
    e.stopPropagation()
    dragRef.current = {
      startScreenX: e.clientX,
      startScreenY: e.clientY,
      startCardX: card.x,
      startCardY: card.y,
    }
    didMoveRef.current = false
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return
    const dx = Math.abs(e.clientX - dragRef.current.startScreenX)
    const dy = Math.abs(e.clientY - dragRef.current.startScreenY)
    if (dx > 4 || dy > 4) didMoveRef.current = true

    if (didMoveRef.current) {
      const { x, y } = computeDragPosition(dragRef.current, e.clientX, e.clientY)
      moveCard(card.id, x, y)
    }
  }

  function handlePointerUp(e: React.PointerEvent) {
    e.stopPropagation()
    dragRef.current = null
    if (!didMoveRef.current) {
      focusCard(isFocused ? null : card.id)
    }
    didMoveRef.current = false
  }

  const cardStyle = getCardStyle(zoomLevel, isFocused, isLater, color)

  return (
    <div
      style={{
        position: 'absolute',
        left: card.x,
        top: card.y,
        transform: 'translate(-50%, -50%)',
        zIndex: isFocused ? 10 : (card.zIndex ?? 1),
        cursor: 'grab',
        userSelect: 'none',
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div style={cardStyle.container}>
        {zoomLevel === 'far' && <FarCard color={color} />}
        {zoomLevel === 'mid' && <MidCard card={card} color={color} />}
        {(zoomLevel === 'close' || zoomLevel === 'focused') && (
          <CloseCard card={card} color={color} isFocused={isFocused} />
        )}
      </div>
    </div>
  )
}

function FarCard({ color }: { color: string }) {
  return <div style={{ width: 12, height: 12, borderRadius: '50%', background: color }} />
}

function MidCard({ card, color }: { card: SpatialCard; color: string }) {
  return (
    <div style={midStyles.card}>
      <div style={{ ...midStyles.dot, background: color }} />
      <span style={midStyles.title}>{card.title}</span>
    </div>
  )
}

function CloseCard({ card, color, isFocused }: { card: SpatialCard; color: string; isFocused: boolean }) {
  return (
    <div style={{ ...closeStyles.card, ...(isFocused ? closeStyles.focused : {}) }}>
      <div style={closeStyles.header}>
        <div style={{ ...closeStyles.dot, background: color }} />
        <span style={closeStyles.type}>{card.type}</span>
        <span style={{
          ...closeStyles.badge,
          ...(card.state === 'now' ? closeStyles.badgeNow : closeStyles.badgeLater),
        }}>
          {card.state}
        </span>
      </div>
      <div style={closeStyles.title}>{card.title}</div>
      {card.url && (
        <div style={closeStyles.url}>{new URL(card.url).hostname}</div>
      )}
      {card.tags.length > 0 && (
        <div style={closeStyles.tags}>
          {card.tags.map((t) => (
            <span key={t} style={closeStyles.tag}>{t}</span>
          ))}
        </div>
      )}
      {card.notes && <div style={closeStyles.notes}>{card.notes}</div>}
    </div>
  )
}

function getCardStyle(_zoomLevel: ZoomLevel, isFocused: boolean, isLater: boolean, _color: string) {
  return {
    container: {
      opacity: isLater && !isFocused ? 0.55 : 1,
      transition: 'opacity 0.2s, transform 0.2s, box-shadow 0.2s',
      transform: isFocused ? 'scale(1.04)' : 'scale(1)',
    } as React.CSSProperties,
  }
}

const midStyles: Record<string, React.CSSProperties> = {
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: 7,
    padding: '6px 10px',
    width: 160,
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  title: {
    fontSize: 12,
    fontWeight: 500,
    color: '#222',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}

const closeStyles: Record<string, React.CSSProperties> = {
  card: {
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: 10,
    padding: '12px 14px',
    width: 220,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
    transition: 'box-shadow 0.2s',
  },
  focused: {
    boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
    border: '1px solid #d0d0d0',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  type: {
    fontSize: 10,
    color: '#aaa',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    fontWeight: 600,
    flex: 1,
  },
  badge: {
    fontSize: 10,
    fontWeight: 600,
    padding: '2px 6px',
    borderRadius: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  },
  badgeNow: {
    background: '#dcfce7',
    color: '#15803d',
  },
  badgeLater: {
    background: '#f3f4f6',
    color: '#9ca3af',
  },
  title: {
    fontSize: 13,
    fontWeight: 500,
    color: '#111',
    lineHeight: 1.4,
  },
  url: {
    fontSize: 11,
    color: '#bbb',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 4,
  },
  tag: {
    fontSize: 10,
    padding: '2px 6px',
    background: '#f3f4f6',
    borderRadius: 4,
    color: '#666',
  },
  notes: {
    fontSize: 11,
    color: '#888',
    fontStyle: 'italic',
    borderTop: '1px solid #f0f0f0',
    paddingTop: 6,
    marginTop: 2,
    lineHeight: 1.4,
  },
}
