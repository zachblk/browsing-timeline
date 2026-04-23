# Component Spec
## Browsing Timeline – Spatial Canvas

Derived from PRD v2. Each component maps to a defined feature or interaction pattern.

---

## Card

The atomic unit of the product. Renders in two contexts — Grid and Canvas — and in Canvas adjusts its presentation based on the current zoom level.

### Props

```ts
interface CardProps {
  card: SpatialCard

  // Grid variant: static layout, full detail always visible
  // Canvas variant: zoom-aware, draggable, positionally aware
  variant: 'grid' | 'canvas'

  // Canvas only — drives which detail level to render
  zoomLevel?: 'far' | 'mid' | 'close' | 'focused'

  // Canvas only — true when this card is the focusedCardId in store
  isFocused?: boolean
}
```

### Responsibilities

**In Grid variant:**
- Render full card detail: type badge, title, domain, tags, state indicator
- Visually de-emphasize `later` cards (reduced opacity, softer contrast)
- On click → call `transitionToCanvas(card.id)` from camera interactions

**In Canvas variant, by zoom level:**
- `far` — colored dot only (8px). No text. Conveys density and type.
- `mid` — type dot + truncated title in a compact chip (160px wide)
- `close` — full card: title, domain, tags, notes preview, state badge
- `focused` — `close` layout + elevation shadow + scale(1.03–1.05) + highlight ring

**Always:**
- Show Now/Later distinction visually (not just via filter)
- Support drag to reposition (canvas only) using pointer events
- Distinguish click (focus) from drag (move) via movement threshold

### Store connections

| Direction | What |
|---|---|
| Reads | `cards` (own card data), `view.focusedCardId` |
| Writes | `focusCard(id)` on click, `moveCard(id, x, y)` on drag end |
| Reads (canvas) | `view.zoom` (indirectly via zoomLevel prop) |

---

## GridView

The structured, scannable view. Entry point for users who want fast access without spatial navigation.

### Props

```ts
interface GridViewProps {
  // No props — fully store-driven
}
```

### Responsibilities

- Subscribe to `selectVisibleCards` — renders only cards matching current filters
- Render cards in a responsive auto-fill grid (min ~240px columns)
- Each card uses `variant="grid"`
- Clicking any card calls `transitionToCanvas(id)`, switching to canvas view and centering the camera on that card
- Show an empty state when filters produce zero results
- No drag, no zoom — read-only layout

### Store connections

| Direction | What |
|---|---|
| Reads | `selectVisibleCards` (filtered card list) |
| Reads | `filters` (to react to filter changes) |
| Writes (via Card) | `setActiveView('canvas')`, `setCamera(...)`, `focusCard(id)` via `transitionToCanvas` |

---

## CanvasView

The spatial view. An infinite, pannable, zoomable space where cards are freely positioned and space encodes meaning.

### Props

```ts
interface CanvasViewProps {
  // No props — fully store-driven
}
```

### Responsibilities

**Stage (pan + zoom):**
- Owns a single CSS-transformed container: `translate(panX, panY) scale(zoom)`
- `pointermove` on stage background → pan (update panX/panY)
- `wheel` → zoom toward cursor (recalculate panX/panY to keep cursor-point fixed)
- Distinguishes stage pan from card drag via `stopPropagation` on card pointer events
- Clicking empty canvas → `focusCard(null)` (deselects)

**Semantic zoom:**
- Derives `zoomLevel` from `selectZoomLevel` and passes it to every `CanvasCard`
- Zoom thresholds: `<0.4` far, `0.4–0.9` mid, `≥0.9` close
- `focusedCardId !== null` → `focused` level for that card only

**Background:**
- Dot-grid pattern that scales with zoom, positioned with panX/panY offset to feel infinite
- Communicates "this is a spatial canvas" without heavy UI chrome

**Rendering:**
- All visible cards rendered as absolutely-positioned `CanvasCard` inside the transform container
- Canvas coords are the source of truth — screen coords converted on interaction

### Store connections

| Direction | What |
|---|---|
| Reads | `view` (zoom, panX, panY, focusedCardId) |
| Reads | `selectVisibleCards` |
| Reads | `selectZoomLevel` |
| Writes | `setCamera({zoom, panX, panY})` — batched, single action |
| Writes | `focusCard(null)` on stage click |

---

## FilterBar

Controls visibility across both views. Filters are non-destructive — they affect what's shown, not the underlying data.

### Props

```ts
interface FilterBarProps {
  // No props — fully store-driven
}
```

### Responsibilities

**State filter (Now / Later / All):**
- Segmented control, single-select
- `All` is the default — shows complete dataset
- Maps to `filters.state: 'now' | 'later' | 'all'`

**Type filter (pill group):**
- Multi-select pills: Tab · Bookmark · Group · Snippet · Image
- Empty selection = all types shown
- Toggling a pill adds/removes from `filters.types[]`

**Tag filter (pill group):**
- Derived from all unique tags across the card dataset
- Multi-select; empty = all tags shown
- Maps to `filters.tags[]`

**Behavior:**
- All filters are additive AND logic within a category, OR across categories
- Changing any filter immediately updates both Grid and Canvas views
- Filter state persists across view switches and sessions (via store persist)

### Store connections

| Direction | What |
|---|---|
| Reads | `filters` (current filter state) |
| Reads | `cards` (to derive available tag list) |
| Writes | `setFilter(patch)` on any filter change |

---

## TopNavigation

The browser-level chrome bar. Persistent across both views. Acts as the primary orientation anchor for the product — tells the user where they are and gives them the controls to switch contexts.

### Props

```ts
interface TopNavigationProps {
  // No props — fully store-driven
}
```

### Responsibilities

**Identity:**
- Product wordmark / title ("Browsing Timeline") — left-anchored
- Minimal — does not compete with content

**View toggle:**
- Grid ↔ Canvas switcher (segmented control or tab-style)
- Reflects and sets `activeView` in store
- Switching view is instant — no data change, only layout change
- Preserves filter state and canvas camera state across switches

**Filter bar:**
- Hosts `FilterBar` inline — filters are always accessible regardless of active view
- Position: center or right of nav, after the view toggle

**Future surface:**
- Search input (out of scope V1 but reserved space)
- Profile / settings (out of scope V1)

### Store connections

| Direction | What |
|---|---|
| Reads | `activeView` (to reflect current view in toggle) |
| Writes | `setActiveView('grid' \| 'canvas')` on toggle |
| Delegates | `FilterBar` handles its own store reads/writes |

---

## ZoomControls

A lightweight HUD overlay on the Canvas view. Gives users explicit zoom control as an alternative to trackpad/scroll gestures — important for accessibility and discoverability.

### Props

```ts
interface ZoomControlsProps {
  // No props — fully store-driven
}
```

### Responsibilities

**Zoom in / Zoom out buttons:**
- Each step: multiply zoom by 1.25 (in) or 0.8 (out)
- Zoom is centered on the canvas viewport center (not cursor)
- Clamp to `[0.1, 2.0]`
- Calls `animateCameraTo` for smooth transition, not an instant jump

**Zoom level display:**
- Shows current zoom as a percentage: `70%`, `100%`, etc.
- Updates live as user pans/zooms
- Read-only — not an input field

**Fit to content button:**
- Computes bounding box of all visible cards
- Animates camera to show all cards with padding
- Useful after spatial organization or on first load

**Placement:**
- Bottom-right corner of the canvas, floating above the canvas surface
- `pointer-events: none` on the container except the buttons themselves so it doesn't block canvas interaction

### Store connections

| Direction | What |
|---|---|
| Reads | `view.zoom` (display + clamp checks) |
| Reads | `view.panX`, `view.panY` (for fit-to-content calc) |
| Reads | `selectVisibleCards` (for fit-to-content bounding box) |
| Writes | `setCamera(...)` via `animateCameraTo` |

---

## Component Relationships

```
TopNavigation
  └── FilterBar

GridView
  └── Card (variant="grid") ×N
        └── on click → transitionToCanvas(id)

CanvasView
  ├── CanvasStage (pan/zoom container)
  │     └── Card (variant="canvas") ×N
  │           ├── zoomLevel from selectZoomLevel
  │           └── isFocused from view.focusedCardId
  └── ZoomControls (HUD overlay)
```

## Shared invariants

- **Filters are always active** — both views read `selectVisibleCards`, never raw `cards[]`
- **One focused card at a time** — `view.focusedCardId` is the single source of truth
- **Card data is never mutated by view** — moving a card on canvas updates `x/y`, not content
- **State (Now/Later) is a property of the card** — filters surface it, they don't create it
