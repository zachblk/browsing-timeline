import { useStore } from '../store'

const ANIMATION_DURATION = 350

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function animateCameraTo(
  target: { zoom?: number; panX?: number; panY?: number },
  duration = 350
): void {
  const start = { ...useStore.getState().view }
  const startTime = performance.now()

  function tick(now: number): void {
    const t = easeInOutCubic(Math.min((now - startTime) / duration, 1))
    useStore.getState().setCamera({
      zoom: lerp(start.zoom, target.zoom ?? start.zoom, t),
      panX: lerp(start.panX, target.panX ?? start.panX, t),
      panY: lerp(start.panY, target.panY ?? start.panY, t),
    })
    if (t < 1) requestAnimationFrame(tick)
  }

  requestAnimationFrame(tick)
}

export function focusCard(id: string | null): void {
  const store = useStore.getState()
  if (!id) {
    store.focusCard(null)
    return
  }
  const card = store.cards.find((c) => c.id === id)
  if (!card) return

  const { zoom } = store.view
  const targetPanX = -card.x * zoom + window.innerWidth / 2
  const targetPanY = -card.y * zoom + window.innerHeight / 2

  animateCameraTo({ panX: targetPanX, panY: targetPanY })
  store.focusCard(id)
}

// Called specifically when a card is clicked from Grid view.
// Switches to canvas, animates camera to the card, then focuses it.
export function focusCardFromGrid(cardId: string): void {
  transitionToCanvas(cardId)
}

export function transitionToCanvas(cardId: string): void {
  const store = useStore.getState()
  const card = store.cards.find((c) => c.id === cardId)
  if (!card) return

  const targetZoom = 0.95
  const targetPanX = -card.x * targetZoom + window.innerWidth / 2
  const targetPanY = -card.y * targetZoom + window.innerHeight / 2

  store.setActiveView('canvas')
  animateCameraTo({ zoom: targetZoom, panX: targetPanX, panY: targetPanY })

  // Focus after animation completes
  setTimeout(() => useStore.getState().focusCard(cardId), ANIMATION_DURATION)
}
