import { useState } from 'react'
import { motion } from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CanvasZoomControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  className?: string
}

// ─── Icons ────────────────────────────────────────────────────────────────────

// 4-way drag / move icon — thin strokes, muted, feels secondary
function DragIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M7 1.5V12.5"       stroke="#8B7EA8" strokeWidth="1.05" strokeLinecap="round" />
      <path d="M1.5 7H12.5"       stroke="#8B7EA8" strokeWidth="1.05" strokeLinecap="round" />
      <path d="M5 3.5L7 1.5L9 3.5"   stroke="#8B7EA8" strokeWidth="1.05" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M5 10.5L7 12.5L9 10.5" stroke="#8B7EA8" strokeWidth="1.05" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M3.5 5L1.5 7L3.5 9"   stroke="#8B7EA8" strokeWidth="1.05" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M10.5 5L12.5 7L10.5 9" stroke="#8B7EA8" strokeWidth="1.05" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

// ─── Circular zoom buttons ────────────────────────────────────────────────────
// Paths lifted directly from the design-file SVGs (zoom in.svg / zoom out.svg).
// Circle fill and stroke are driven by hover/press state to give a soft,
// non-jarring hover emphasis. Border stays thin at 1 px in all states.

interface ButtonSvgProps {
  hovered: boolean
  pressed: boolean
}

function ZoomOutSvg({ hovered, pressed }: ButtonSvgProps) {
  const fill = pressed ? '#ECE3FD' : hovered ? '#F3EDFF' : '#FAF6FF'
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" fill="none" aria-hidden>
      <rect x="0.5" y="0.5" width="37" height="37" rx="18.5" fill={fill} />
      <rect x="0.5" y="0.5" width="37" height="37" rx="18.5" stroke="#7C3AED" />
      {/* Minus bar — from zoom out.svg */}
      <rect x="13" y="18.335" width="12" height="1.33" rx="0.665" fill="#271732" />
    </svg>
  )
}

function ZoomInSvg({ hovered, pressed }: ButtonSvgProps) {
  const fill = pressed ? '#ECE3FD' : hovered ? '#F3EDFF' : '#FAF6FF'
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" fill="none" aria-hidden>
      <rect x="0.5" y="0.5" width="37" height="37" rx="18.5" fill={fill} />
      <rect x="0.5" y="0.5" width="37" height="37" rx="18.5" stroke="#7C3AED" />
      {/* Plus icon — from zoom in.svg */}
      <path
        d="M18.9994 12.9987C19.3675 12.9987 19.6659 13.2973 19.666 13.6654V17.6667C19.666 17.9809 19.666 18.1381 19.7637 18.2357C19.8613 18.3333 20.0184 18.3333 20.3327 18.3333H24.3333C24.7015 18.3333 25 18.6318 25 19C25 19.3682 24.7015 19.6667 24.3333 19.6667H20.3327C20.0184 19.6667 19.8613 19.6667 19.7637 19.7643C19.666 19.8619 19.666 20.0191 19.666 20.3333V24.3333C19.666 24.7015 19.3675 25 18.9994 25C18.6312 25 18.3327 24.7015 18.3327 24.3333V20.3333C18.3327 20.0191 18.3327 19.8619 18.2351 19.7643C18.1374 19.6667 17.9803 19.6667 17.666 19.6667H13.6654C13.2973 19.6666 12.9987 19.3681 12.9987 19C12.9987 18.6319 13.2973 18.3334 13.6654 18.3333H17.666C17.9803 18.3333 18.1374 18.3333 18.2351 18.2357C18.3327 18.1381 18.3327 17.9809 18.3327 17.6667V13.6654C18.3328 13.2973 18.6313 12.9987 18.9994 12.9987Z"
        fill="#271732"
      />
    </svg>
  )
}

// ─── Shared spring config ─────────────────────────────────────────────────────

const SPRING = { type: 'spring', stiffness: 420, damping: 30 } as const

// ─── CanvasZoomControls ───────────────────────────────────────────────────────

export function CanvasZoomControls({ onZoomIn, onZoomOut, className = '' }: CanvasZoomControlsProps) {
  const [outHovered, setOutHovered] = useState(false)
  const [outPressed, setOutPressed] = useState(false)
  const [inHovered,  setInHovered]  = useState(false)
  const [inPressed,  setInPressed]  = useState(false)

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 28,   // generous breathing room between label and buttons
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        userSelect: 'none',
      }}
    >
      {/* ── Drag hint — soft helper label, not a button ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.75 }}>
        <DragIcon />
        <span style={{ fontSize: 12.5, fontWeight: 450, color: '#574D76', whiteSpace: 'nowrap', lineHeight: 1, letterSpacing: '0.005em' }}>
          Drag to navigate
        </span>
      </div>

      {/* ── Zoom buttons ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

        {/* Minus */}
        <motion.button
          aria-label="Zoom out"
          onClick={onZoomOut}
          onHoverStart={() => setOutHovered(true)}
          onHoverEnd={() => { setOutHovered(false); setOutPressed(false) }}
          onTapStart={() => setOutPressed(true)}
          onTap={() => setOutPressed(false)}
          onTapCancel={() => setOutPressed(false)}
          whileHover={{ scale: 1.09 }}
          whileTap={{ scale: 0.88 }}
          transition={SPRING}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', lineHeight: 0 }}
        >
          <ZoomOutSvg hovered={outHovered} pressed={outPressed} />
        </motion.button>

        {/* Plus */}
        <motion.button
          aria-label="Zoom in"
          onClick={onZoomIn}
          onHoverStart={() => setInHovered(true)}
          onHoverEnd={() => { setInHovered(false); setInPressed(false) }}
          onTapStart={() => setInPressed(true)}
          onTap={() => setInPressed(false)}
          onTapCancel={() => setInPressed(false)}
          whileHover={{ scale: 1.09 }}
          whileTap={{ scale: 0.88 }}
          transition={SPRING}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', lineHeight: 0 }}
        >
          <ZoomInSvg hovered={inHovered} pressed={inPressed} />
        </motion.button>

      </div>
    </div>
  )
}
