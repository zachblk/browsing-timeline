import { SpatialCard } from '../types'
import { transitionToCanvas } from '../interactions/camera'

const TYPE_COLORS: Record<string, string> = {
  tab: '#3b82f6',
  bookmark: '#22c55e',
  'tab-group': '#a855f7',
  snippet: '#f97316',
  image: '#ec4899',
}

interface Props {
  card: SpatialCard
}

export function GridCard({ card }: Props) {
  const isLater = card.state === 'later'
  const color = TYPE_COLORS[card.type] ?? '#999'

  return (
    <div
      style={{
        ...styles.card,
        opacity: isLater ? 0.6 : 1,
      }}
      onClick={() => transitionToCanvas(card.id)}
    >
      <div style={styles.header}>
        <span style={{ ...styles.typeDot, background: color }} />
        <span style={styles.type}>{card.type}</span>
        <span style={{ ...styles.stateBadge, ...(isLater ? styles.stateLater : styles.stateNow) }}>
          {card.state}
        </span>
      </div>

      <div style={styles.title}>{card.title}</div>

      {card.url && (
        <div style={styles.url}>{new URL(card.url).hostname}</div>
      )}

      {card.tags.length > 0 && (
        <div style={styles.tags}>
          {card.tags.map((tag) => (
            <span key={tag} style={styles.tag}>{tag}</span>
          ))}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: '#fff',
    border: '1px solid #e8e8e8',
    borderRadius: 10,
    padding: '14px 16px',
    cursor: 'pointer',
    transition: 'box-shadow 0.15s, transform 0.15s',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  type: {
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    fontWeight: 600,
    flex: 1,
  },
  stateBadge: {
    fontSize: 10,
    fontWeight: 600,
    padding: '2px 7px',
    borderRadius: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  stateNow: {
    background: '#dcfce7',
    color: '#15803d',
  },
  stateLater: {
    background: '#f3f4f6',
    color: '#9ca3af',
  },
  title: {
    fontSize: 14,
    fontWeight: 500,
    color: '#111',
    lineHeight: 1.4,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  url: {
    fontSize: 12,
    color: '#9ca3af',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
  },
  tag: {
    fontSize: 11,
    padding: '2px 7px',
    background: '#f3f4f6',
    borderRadius: 4,
    color: '#555',
  },
}
