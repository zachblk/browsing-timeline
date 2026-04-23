import { useState } from 'react'
import { cn } from '../lib/utils'
import type { Card as CardData, CardType } from '../types/card'

// ─── Types ────────────────────────────────────────────────────────────────────

export type CardMode = 'grid' | 'canvas' | 'focused'

export interface CardProps {
  card: CardData
  mode: CardMode
  isSelected?: boolean
  onSelect?: (id: string) => void
  onClick?: (id: string) => void
  className?: string
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<CardType, {
  label: string
  // Chip / dot
  dot: string
  // Tag pill (canvas / focused)
  tagBg: string
  tagText: string
  // Gradient placeholder
  gradFrom: string
  gradTo: string
  // Grid card — outer shell
  cardBg: string
  cardBorder: string
  // Grid card — accent bar at top of inner card
  accent: string
}> = {
  tab: {
    label: 'Tab',
    dot: 'bg-blue-400', tagBg: 'bg-blue-50', tagText: 'text-blue-600',
    gradFrom: 'from-blue-100', gradTo: 'to-blue-200',
    cardBg: 'bg-blue-50', cardBorder: 'border-blue-100', accent: 'bg-blue-500',
  },
  bookmark: {
    label: 'Bookmark',
    dot: 'bg-emerald-400', tagBg: 'bg-emerald-50', tagText: 'text-emerald-600',
    gradFrom: 'from-emerald-100', gradTo: 'to-emerald-200',
    cardBg: 'bg-emerald-50', cardBorder: 'border-emerald-100', accent: 'bg-emerald-500',
  },
  'tab-group': {
    label: 'Group',
    dot: 'bg-violet-400', tagBg: 'bg-violet-50', tagText: 'text-violet-600',
    gradFrom: 'from-violet-100', gradTo: 'to-violet-200',
    cardBg: 'bg-violet-50', cardBorder: 'border-violet-100', accent: 'bg-violet-500',
  },
  snippet: {
    label: 'Snippet',
    dot: 'bg-amber-400', tagBg: 'bg-amber-50', tagText: 'text-amber-700',
    gradFrom: 'from-amber-100', gradTo: 'to-amber-200',
    cardBg: 'bg-amber-50', cardBorder: 'border-amber-100', accent: 'bg-amber-500',
  },
  image: {
    label: 'Image',
    dot: 'bg-rose-400', tagBg: 'bg-rose-50', tagText: 'text-rose-600',
    gradFrom: 'from-rose-100', gradTo: 'to-rose-200',
    cardBg: 'bg-rose-50', cardBorder: 'border-rose-100', accent: 'bg-rose-500',
  },
}

// ─── Shared utilities ─────────────────────────────────────────────────────────

function parseDomain(url?: string): string | null {
  if (!url) return null
  try { return new URL(url).hostname.replace('www.', '') }
  catch { return null }
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function Favicon({ domain }: { domain: string }) {
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`}
      alt=""
      className="h-3 w-3 shrink-0"
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
    />
  )
}

function TypeIcon({ type }: { type: CardType }) {
  const cls = 'h-10 w-10 opacity-40'
  const icons: Record<CardType, React.ReactNode> = {
    tab: (
      <svg className={cn(cls, 'text-blue-500')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582" />
      </svg>
    ),
    bookmark: (
      <svg className={cn(cls, 'text-emerald-500')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
      </svg>
    ),
    'tab-group': (
      <svg className={cn(cls, 'text-violet-500')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
    snippet: (
      <svg className={cn(cls, 'text-amber-500')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
    image: (
      <svg className={cn(cls, 'text-rose-500')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
  }
  return <>{icons[type]}</>
}

// ─── Grid mode ────────────────────────────────────────────────────────────────

function GridCard({ card, isSelected = false, onSelect, onClick, className }: Omit<CardProps, 'mode'>) {
  const [hovered, setHovered] = useState(false)
  const cfg    = TYPE_CONFIG[card.type]
  const domain = parseDomain(card.url)
  const isLater = card.state === 'later'

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-2xl bg-white',
        'shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all duration-200 ease-out',
        hovered && !isSelected && '-translate-y-1 shadow-[0_4px_16px_rgba(0,0,0,0.10),0_1px_4px_rgba(0,0,0,0.06)]',
        isSelected && 'ring-2 ring-violet-400 ring-offset-2',
        isLater && !isSelected && 'opacity-60',
        className,
      )}
      onClick={() => onClick?.(card.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(card.id)}
    >
      {/* Image */}
      <div className="relative aspect-video overflow-hidden bg-gray-100">
        {card.thumbnailUrl ? (
          <img
            src={card.thumbnailUrl}
            alt={card.title}
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className={cn('flex h-full w-full items-center justify-center bg-gradient-to-br', cfg.gradFrom, cfg.gradTo)}>
            <TypeIcon type={card.type} />
          </div>
        )}

        {/* Checkbox */}
        <div className={cn(
          'absolute left-2.5 top-2.5 transition-opacity duration-150',
          hovered || isSelected ? 'opacity-100' : 'opacity-0',
        )}>
          <button
            onClick={(e) => { e.stopPropagation(); onSelect?.(card.id) }}
            aria-label={isSelected ? 'Deselect card' : 'Select card'}
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-md border-2 shadow-sm transition-all duration-150',
              isSelected
                ? 'border-blue-500 bg-blue-500'
                : 'border-white/80 bg-white/80 backdrop-blur-sm hover:bg-white',
            )}
          >
            {isSelected && (
              <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className={cn(
          'line-clamp-2 text-[15px] font-semibold leading-snug',
          isLater ? 'text-gray-400' : 'text-gray-900',
        )}>
          {card.title}
        </h3>

        {domain && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <Favicon domain={domain} />
            <span className="truncate text-xs text-gray-400">{domain}</span>
          </div>
        )}

        {card.tags[0] && (
          <div className="mt-3">
            <span className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-[5px] text-xs font-medium',
              cfg.tagBg, cfg.tagText,
            )}>
              <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', cfg.dot)} />
              {card.tags[0]}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Canvas mode (compact chip) ───────────────────────────────────────────────

function CanvasCard({ card, onClick, className }: Omit<CardProps, 'mode'>) {
  const cfg     = TYPE_CONFIG[card.type]
  const isLater = card.state === 'later'

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(card.id)}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(card.id)}
      className={cn(
        'flex cursor-pointer items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 shadow-sm',
        'border-gray-200 transition-all duration-150 hover:border-gray-300 hover:shadow-md',
        isLater && 'opacity-50',
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', cfg.dot)} />
      <span className="max-w-[140px] truncate text-[11px] font-semibold text-gray-700">
        {card.title}
      </span>
    </div>
  )
}

// ─── Focused mode (expanded canvas card) ─────────────────────────────────────

function FocusedCard({ card, onClick, className }: Omit<CardProps, 'mode'>) {
  const cfg    = TYPE_CONFIG[card.type]
  const domain = parseDomain(card.url)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(card.id)}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(card.id)}
      className={cn(
        'w-64 cursor-pointer overflow-hidden rounded-3xl border shadow-2xl ring-2 ring-blue-400 ring-offset-2',
        cfg.cardBg, cfg.cardBorder,
        'transition-all duration-200',
        className,
      )}
    >
      {/* Inner white card */}
      <div className="mx-3 mt-3 overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className={cn('h-2 w-full', cfg.accent)} />
        <div className="px-3.5 pb-4 pt-3">
          <div className="mb-1.5 flex items-center gap-2">
            <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', cfg.dot)} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{cfg.label}</span>
            <span className={cn(
              'ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
              card.state === 'now' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400',
            )}>
              {card.state}
            </span>
          </div>
          <p className="line-clamp-3 text-sm font-bold leading-snug text-gray-900">{card.title}</p>
        </div>
      </div>

      {/* Outer content */}
      <div className="px-4 pb-4 pt-3.5">
        {card.tags[0] && (
          <div className="flex items-center gap-2">
            <svg className="h-3 w-3 shrink-0 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-700">{card.tags[0]}</span>
          </div>
        )}
        {card.notes && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-gray-500">{card.notes}</p>
        )}
        {domain && (
          <div className="mt-2.5 flex items-center gap-1.5">
            <Favicon domain={domain} />
            <span className="truncate text-[11px] text-gray-400">{domain}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Card (entry point) ───────────────────────────────────────────────────────

export function Card(props: CardProps) {
  const { mode, ...rest } = props
  if (mode === 'grid')    return <GridCard    {...rest} />
  if (mode === 'focused') return <FocusedCard {...rest} />
  return                         <CanvasCard  {...rest} />
}
