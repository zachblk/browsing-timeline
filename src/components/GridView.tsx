import { useStore } from '../store'
import { selectVisibleCards } from '../store/selectors'
import { GridCard } from './GridCard'

export function GridView() {
  const cards = useStore(selectVisibleCards)

  if (cards.length === 0) {
    return (
      <div style={styles.empty}>
        <p>No cards match the current filters.</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.grid}>
        {cards.map((card) => (
          <GridCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
    background: '#fafafa',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: 16,
    maxWidth: 1200,
    margin: '0 auto',
  },
  empty: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#999',
    fontSize: 14,
  },
}
