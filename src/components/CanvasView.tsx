import { CanvasStage } from './CanvasStage'

export function CanvasView() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <CanvasStage />
    </div>
  )
}
