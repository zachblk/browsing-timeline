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

const EASE    = [0.25, 0.46, 0.45, 0.94] as const
const LAYOUT  = { duration: 0.26, ease: EASE }
const FADE    = { duration: 0.18, ease: EASE }

// ─── ViewToggleButton ─────────────────────────────────────────────────────────

export function ViewToggleButton({ state, onClick }: ViewToggleButtonProps) {
  const [hovered, setHovered] = useState(false)

  // When hovering, preview the destination; actual state only changes on click
  const expanded = state === 'flow' ? hovered : !hovered

  const font = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

  return (
    <motion.button
      layout
      transition={{ layout: LAYOUT }}
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
        // Prevent content from jumping during layout animation
        whiteSpace: 'nowrap',
      }}
    >
      {/* ── Icon segment ─────────────────────────────────────────────────── */}
      {/*
        layout="position" keeps the icon pinned to the left edge of the button.
        Without it, Framer would also try to animate the icon's x-position as
        the button expands, causing it to drift.
      */}
      <motion.div
        layout="position"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px 11px',
          flexShrink: 0,
        }}
      >
        {/* Icon crossfade — both rendered simultaneously so there's no gap */}
        <div style={{ position: 'relative', width: 13, height: 13 }}>
          <motion.div
            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            animate={{ opacity: expanded ? 0 : 1, scale: expanded ? 0.6 : 1 }}
            transition={FADE}
          >
            <FlowDots />
          </motion.div>
          <motion.div
            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            animate={{ opacity: expanded ? 1 : 0, scale: expanded ? 1 : 0.6 }}
            transition={FADE}
          >
            <GridDots />
          </motion.div>
        </div>
      </motion.div>

      {/* ── Divider ──────────────────────────────────────────────────────── */}
      <motion.div
        layout="position"
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
        This is the core of the smooth expansion. We render an invisible sizer
        span that always shows the CURRENT target label. Framer's layout engine
        sees the button grow/shrink in the DOM and animates it via transform,
        so the expansion feels physically correct — no hardcoded pixel widths.

        Two visible motion spans sit absolutely on top of the sizer and
        crossfade simultaneously (no AnimatePresence gap / collapse).
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
          animate={{
            opacity: expanded ? 0 : 1,
            x: expanded ? -6 : 0,
          }}
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
          animate={{
            opacity: expanded ? 1 : 0,
            x: expanded ? 0 : 6,
          }}
          transition={FADE}
        >
          grid view
        </motion.span>
      </div>
    </motion.button>
  )
}
