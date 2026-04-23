import { useStore } from '../store'
import { ActiveView, FilterState } from '../types'

const TYPE_LABELS = {
  tab: 'Tab',
  bookmark: 'Bookmark',
  'tab-group': 'Group',
  snippet: 'Snippet',
  image: 'Image',
} as const

export function Toolbar() {
  const activeView = useStore((s) => s.activeView)
  const filters = useStore((s) => s.filters)
  const setActiveView = useStore((s) => s.setActiveView)
  const setFilter = useStore((s) => s.setFilter)

  function handleStateFilter(value: FilterState) {
    setFilter({ state: value })
  }

  return (
    <div style={styles.toolbar}>
      <div style={styles.brand}>Browsing Timeline</div>

      <div style={styles.viewToggle}>
        {(['grid', 'canvas', 'flow'] as ActiveView[]).map((v) => (
          <button
            key={v}
            onClick={() => setActiveView(v)}
            style={{
              ...styles.toggleBtn,
              ...(activeView === v ? styles.toggleBtnActive : {}),
            }}
          >
            {v === 'grid' ? 'Grid' : v === 'canvas' ? 'Canvas' : 'Flow'}
          </button>
        ))}
      </div>

      <div style={styles.filters}>
        {(['all', 'now', 'later'] as FilterState[]).map((s) => (
          <button
            key={s}
            onClick={() => handleStateFilter(s)}
            style={{
              ...styles.pill,
              ...(filters.state === s ? styles.pillActive : {}),
            }}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}

        <div style={styles.divider} />

        {(Object.keys(TYPE_LABELS) as Array<keyof typeof TYPE_LABELS>).map((type) => {
          const active = filters.types.includes(type)
          return (
            <button
              key={type}
              onClick={() =>
                setFilter({
                  types: active
                    ? filters.types.filter((t) => t !== type)
                    : [...filters.types, type],
                })
              }
              style={{
                ...styles.pill,
                ...(active ? styles.pillActive : {}),
              }}
            >
              {TYPE_LABELS[type]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '0 20px',
    height: 52,
    background: '#fff',
    borderBottom: '1px solid #e5e5e5',
    flexShrink: 0,
    zIndex: 100,
  },
  brand: {
    fontWeight: 600,
    fontSize: 15,
    color: '#111',
    marginRight: 8,
    whiteSpace: 'nowrap',
  },
  viewToggle: {
    display: 'flex',
    background: '#f0f0f0',
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  toggleBtn: {
    padding: '4px 14px',
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    background: 'transparent',
    color: '#666',
    transition: 'all 0.15s',
  },
  toggleBtnActive: {
    background: '#fff',
    color: '#111',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  filters: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
  },
  pill: {
    padding: '3px 10px',
    border: '1px solid #e0e0e0',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    background: '#fff',
    color: '#555',
    transition: 'all 0.15s',
  },
  pillActive: {
    background: '#111',
    color: '#fff',
    borderColor: '#111',
  },
  divider: {
    width: 1,
    height: 18,
    background: '#e0e0e0',
    margin: '0 4px',
  },
}
