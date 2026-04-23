import { useStore } from '../src/store'
import { selectVisibleCards } from '../src/store/selectors'
import { focusCardFromGrid } from '../src/interactions/camera'
import { SpatialCard } from '../src/types'
import { Card } from './Card'

interface GridViewProps {
  cards?: SpatialCard[]
}

export function GridView({ cards: cardsProp }: GridViewProps = {}) {
  const storeCards = useStore(selectVisibleCards)
  const cards = cardsProp ?? storeCards
  const selectedCardIds = useStore((s) => s.view.selectedCardIds)
  const selectCard = useStore((s) => s.selectCard)
  const clearSelection = useStore((s) => s.clearSelection)

  if (cards.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-1.5 text-gray-400">
        <p className="text-sm font-medium">No cards match the current filters</p>
        <p className="text-xs">Try adjusting the filters above</p>
      </div>
    )
  }

  return (
    <div
      className="flex-1 overflow-y-auto p-8" style={{ background: '#edeef8' }}
      onClick={(e) => { if (e.target === e.currentTarget) clearSelection() }}
    >
      <div className="mx-auto grid max-w-screen-lg grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card
            key={card.id}
            card={card}
            mode="grid"
            isSelected={selectedCardIds.includes(card.id)}
            onClick={focusCardFromGrid}
            onSelect={(id) => selectCard(id, false)}
          />
        ))}
      </div>
    </div>
  )
}
