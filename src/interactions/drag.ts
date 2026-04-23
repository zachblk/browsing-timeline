import { useStore } from '../store'

export function screenToCanvas(screenX: number, screenY: number): { x: number; y: number } {
  const { zoom, panX, panY } = useStore.getState().view
  return {
    x: (screenX - panX) / zoom,
    y: (screenY - panY) / zoom,
  }
}

export interface DragState {
  startScreenX: number
  startScreenY: number
  startCardX: number
  startCardY: number
}

export function computeDragPosition(
  drag: DragState,
  currentScreenX: number,
  currentScreenY: number
): { x: number; y: number } {
  const { zoom } = useStore.getState().view
  return {
    x: drag.startCardX + (currentScreenX - drag.startScreenX) / zoom,
    y: drag.startCardY + (currentScreenY - drag.startScreenY) / zoom,
  }
}
