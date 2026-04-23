import { useState } from 'react'
import { motion } from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewState = 'flow' | 'grid'

export interface ViewToggleButtonProps {
  state: ViewState
  onClick?: () => void
}

// ─── Icons ────────────────────────────────────────────────────────────────────

// 2 × 3 dot grid — "flow" view icon
function FlowDots() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      {[3.5, 9.5].flatMap(cx =>
        [2, 6.5, 11].map(cy => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.4" fill="currentColor" />
        ))
      )}
    </svg>
  )
}

// 3 × 3 dot grid — "grid view" icon
function GridDots() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      {[2, 6.5, 11].flatMap(cx =>
        [2, 6.5, 11].map(cy => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.4" fill="currentColor" />
        ))
      )}
    </svg>
  )
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EASE = [0.25, 0.46, 0.45, 0.94] as const
const FADE = { duration: 0.2, ease: EASE }

// ─── ViewToggleButton ─────────────────────────────────────────────────────────

export function ViewToggleButton({ state, onClick }: ViewToggleButtonProps) {
  const [hovered, setHovered] = useState(false)

  // When hovering, preview the destination; actual state only changes on click
  const expanded = state === 'flow' ? hovered : !hovered

  const font = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

  return (
    <motion.button
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={onClick}
      aria-label={`Switch to ${expanded ? 'grid' : 'flow'} view`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        border: '1.5px solid #c4b5fd',
        borderRadius: 12,
        background: '#ffffff',
        color: '#5b21b6',
        cursor: 'pointer',
        padding: 0,
        outline: 'none',
        fontFamily: font,
        whiteSpace: 'nowrap',
        // Clip crossfades / icon scale so nothing paints past the rounded border.
        // (Parent `layout` used a scale transform for width, which made the flip look like it spilled out.)
        overflow: 'hidden',
      }}
    >
      {/* ── Icon segment ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px 11px',
          flexShrink: 0,
        }}
      >
        {/* Icon crossfade — opacity only so nothing grows past the clip rect */}
        <div style={{ position: 'relative', width: 13, height: 13, overflow: 'hidden' }}>
          <motion.div
            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            animate={{ opacity: expanded ? 0 : 1 }}
            transition={FADE}
          >
            <FlowDots />
          </motion.div>
          <motion.div
            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            animate={{ opacity: expanded ? 1 : 0 }}
            transition={FADE}
          >
            <GridDots />
          </motion.div>
        </div>
      </div>

      {/* ── Divider ──────────────────────────────────────────────────────── */}
      <div
        style={{
          width: 1,
          alignSelf: 'stretch',
          background: '#c4b5fd',
          opacity: 0.7,
          margin: '7px 0',
          flexShrink: 0,
        }}
      />

      {/* ── Label segment ────────────────────────────────────────────────── */}
      {/*
        Invisible sizer span sets width from the active label string. Width
        updates with layout (no Framer `layout` on the button — that used a
        scale transform and made the toggle look like it spilled past the border).
        Two spans crossfade on top (opacity only).
      */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Invisible sizer — drives the actual layout width */}
        <span
          aria-hidden
          style={{
            opacity: 0,
            pointerEvents: 'none',
            fontSize: 14,
            fontWeight: 600,
            fontFamily: font,
            whiteSpace: 'nowrap',
            padding: '8px 14px 8px 10px',
            display: 'block',
          }}
        >
          {expanded ? 'grid view' : 'flow'}
        </span>

        {/* "flow" label */}
        <motion.span
          aria-hidden={expanded}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 10,
            paddingRight: 14,
            fontSize: 14,
            fontWeight: 600,
            fontFamily: font,
            whiteSpace: 'nowrap',
            color: '#5b21b6',
          }}
          animate={{ opacity: expanded ? 0 : 1 }}
          transition={FADE}
        >
          flow
        </motion.span>

        {/* "grid view" label */}
        <motion.span
          aria-hidden={!expanded}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 10,
            paddingRight: 14,
            fontSize: 14,
            fontWeight: 600,
            fontFamily: font,
            whiteSpace: 'nowrap',
            color: '#5b21b6',
          }}
          animate={{ opacity: expanded ? 1 : 0 }}
          transition={FADE}
        >
          grid view
        </motion.span>
      </div>
    </motion.button>
  )
}
