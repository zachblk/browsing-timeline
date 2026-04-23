import { useEffect, useRef, useState } from 'react'
import { BrowserBar } from './components/BrowserBar'
import { CanvasFlowView, CanvasFlowViewHandle } from './components/CanvasFlowView'
import { ViewToggleButton } from './components/ViewToggleButton'
import { CanvasZoomControls } from './components/CanvasZoomControls'

// ─── Types ────────────────────────────────────────────────────────────────────

type CardType  = 'tab' | 'bookmark' | 'tab-group' | 'snippet' | 'image'
type CardState = 'now' | 'later'
type ActiveView = 'flow' | 'grid'

interface MockCard {
  id: string
  type: CardType
  title: string
  url?: string
  tags: string[]
  notes: string
  state: CardState
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_CARDS: MockCard[] = [
  { id: '1', type: 'tab',       title: 'Spatial UI Patterns – Nielsen Norman Group', url: 'https://nngroup.com',                     tags: ['Research'],         notes: '', state: 'now'   },
  { id: '2', type: 'bookmark',  title: 'Infinite Canvas – Maggie Appleton',          url: 'https://maggieappleton.com',              tags: ['Design inspiration'], notes: '', state: 'now'   },
  { id: '3', type: 'tab-group', title: 'Firefox Tab Architecture Docs',              url: 'https://firefox-source-docs.mozilla.org', tags: ['Engineering'],      notes: '', state: 'now'   },
  { id: '4', type: 'bookmark',  title: 'Muse App – Spatial Thinking Tool',           url: 'https://museapp.com',                     tags: ['Design inspiration'], notes: '', state: 'later' },
  { id: '5', type: 'snippet',   title: 'easeInOutCubic – animation utility',                                                          tags: ['Engineering'],      notes: '', state: 'now'   },
  { id: '6', type: 'image',     title: 'Canvas UI Sketch – v1 wireframe',                                                             tags: ['Design'],           notes: '', state: 'later' },
  { id: '7', type: 'tab',       title: 'MDN – Pointer Events API',                   url: 'https://developer.mozilla.org',           tags: ['Engineering'],      notes: '', state: 'now'   },
  { id: '8', type: 'bookmark',  title: 'Zoom UI Heuristics – Raskin Interface',      url: 'https://humanpowered.org',                tags: ['Research'],         notes: '', state: 'later' },
  { id: '9', type: 'tab',       title: 'Figma – How we built multiplayer editing',   url: 'https://figma.com',                       tags: ['Design inspiration'], notes: '', state: 'now'   },
]

// ─── Palette ──────────────────────────────────────────────────────────────────

const TYPE_STYLE: Record<CardType, { gradA: string; gradB: string; dot: string; tagBg: string; tagText: string }> = {
  tab:         { gradA: '#dbeafe', gradB: '#bfdbfe', dot: '#3b82f6', tagBg: '#eff6ff', tagText: '#1d4ed8' },
  bookmark:    { gradA: '#d1fae5', gradB: '#a7f3d0', dot: '#10b981', tagBg: '#ecfdf5', tagText: '#065f46' },
  'tab-group': { gradA: '#ede9fe', gradB: '#ddd6fe', dot: '#8b5cf6', tagBg: '#f5f3ff', tagText: '#5b21b6' },
  snippet:     { gradA: '#fef3c7', gradB: '#fde68a', dot: '#f59e0b', tagBg: '#fffbeb', tagText: '#92400e' },
  image:       { gradA: '#fee2e2', gradB: '#fecaca', dot: '#ef4444', tagBg: '#fff1f2', tagText: '#9f1239' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDomain(url?: string): string | null {
  if (!url) return null
  try { return new URL(url).hostname.replace('www.', '') }
  catch { return null }
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <line x1="2" y1="4"  x2="14" y2="4"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="4" y1="8"  x2="12" y2="8"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6" y1="12" x2="10" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function FirefoxIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#FF9500" />
      <circle cx="12" cy="12" r="6"  fill="#FF6611" />
      <circle cx="12" cy="12" r="3"  fill="#FFD700" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Card (grid view) ─────────────────────────────────────────────────────────

function Card({ card }: { card: MockCard }) {
  const [hovered, setHovered]   = useState(false)
  const [selected, setSelected] = useState(false)
  const style   = TYPE_STYLE[card.type]
  const domain  = parseDomain(card.url)
  const isLater = card.state === 'later'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: hovered
          ? '0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)'
          : '0 1px 4px rgba(0,0,0,0.06)',
        transform: hovered ? 'translateY(-2px)' : 'none',
        transition: 'box-shadow 0.18s ease, transform 0.18s ease',
        opacity: isLater ? 0.65 : 1,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden',
        background: `linear-gradient(135deg, ${style.gradA}, ${style.gradB})` }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: style.dot, opacity: 0.25 }} />
          <div style={{ position: 'absolute', width: 12, height: 12, borderRadius: '50%', background: style.dot, opacity: 0.7 }} />
        </div>
        <div style={{ position: 'absolute', top: 10, left: 10, opacity: hovered || selected ? 1 : 0, transition: 'opacity 0.15s' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setSelected(s => !s) }}
            style={{
              width: 20, height: 20, borderRadius: 5,
              border: selected ? '2px solid #7c3aed' : '1.5px solid rgba(255,255,255,0.85)',
              background: selected ? '#7c3aed' : 'rgba(255,255,255,0.85)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', backdropFilter: 'blur(4px)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            }}
          >
            {selected && <CheckIcon />}
          </button>
        </div>
      </div>
      <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
        <p style={{
          margin: 0, fontSize: 15, fontWeight: 600, color: '#111', lineHeight: 1.45,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {card.title}
        </p>
        {domain && (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <img
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`}
              alt="" width={14} height={14}
              style={{ borderRadius: 3, flexShrink: 0 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <span style={{ fontSize: 12, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {domain}
            </span>
          </div>
        )}
        {card.tags[0] && (
          <div style={{ marginTop: 14 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: style.tagBg, borderRadius: 999, padding: '5px 12px',
              fontSize: 12, color: style.tagText, fontWeight: 500,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: style.dot, flexShrink: 0 }} />
              {card.tags[0]}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export function App() {
  const [activeView, setActiveView] = useState<ActiveView>('flow')
  const flowRef = useRef<CanvasFlowViewHandle>(null)

  useEffect(() => {
    console.log('[BrowsingTimeline] Rendering', MOCK_CARDS.length, 'cards:', MOCK_CARDS)
  }, [])

  const font = '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'

  return (
    <div style={{ height: '100vh', background: '#edeef8', fontFamily: font, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Browser chrome ── */}
      <div style={{ padding: '4px 4px 0', flexShrink: 0 }}>
        <BrowserBar />
      </div>

      {/* ── Top chrome ── */}
      <header style={{
        display: 'flex', alignItems: 'center', padding: '0 20px',
        height: 52, background: '#edeef8', flexShrink: 0,
      }}>
        {/* Left: Firefox View branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 160 }}>
          <FirefoxIcon />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>Firefox View</span>
        </div>

        {/* Center: view toggle */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <ViewToggleButton
            state={activeView}
            onClick={() => setActiveView(v => v === 'flow' ? 'grid' : 'flow')}
          />
        </div>

        {/* Right: zoom controls (flow view only) */}
        <div style={{ minWidth: 160, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          {activeView === 'flow' && (
            <CanvasZoomControls
              onZoomIn={() => flowRef.current?.zoomIn()}
              onZoomOut={() => flowRef.current?.zoomOut()}
            />
          )}
        </div>
      </header>

      {/* ── Content ── */}
      {activeView === 'flow' ? (
        <CanvasFlowView ref={flowRef} />
      ) : (
        <main style={{ flex: 1, overflow: 'auto', padding: '24px 32px 100px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1f2937' }}>
                Browsing Timeline Demo
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9ca3af' }}>
                {MOCK_CARDS.length} cards
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {MOCK_CARDS.map((card) => (
                <Card key={card.id} card={card} />
              ))}
            </div>
          </div>
        </main>
      )}

      {/* ── Floating filter button ── */}
      <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
        <button style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#6d28d9', color: '#fff', border: 'none',
          borderRadius: 999, padding: '13px 26px',
          fontSize: 15, fontWeight: 600, cursor: 'pointer',
          fontFamily: font, boxShadow: '0 4px 16px rgba(109,40,217,0.35)',
          letterSpacing: '-0.01em',
        }}>
          <FilterIcon />
          filter
        </button>
      </div>

    </div>
  )
}
