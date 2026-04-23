# Product Requirements Document (PRD)

**Product Name:** Browsing Timeline – Spatial Canvas  
**Status:** Draft (v2 – Spatial + Canvas-first)  
**Author:** Zachery Sutton (Mozilla)  
**Last Updated:** April 2026

---

## 1. Overview

Browsing Timeline is a spatial browsing system that helps users manage active and deferred web content without relying on open tabs as memory.

The product introduces a **shared card-based system** with two primary views:

- **Grid View** → fast scanning and selection
- **Infinite Canvas View** → spatial exploration, organization, and sense-making

Instead of separating "Now" and "Saved for Later" into different pages, this system treats them as **filters on a single dataset**, allowing users to interact with all content in one continuous space.

---

## 2. Problem Statement

Users currently:

- Keep many tabs open as reminders
- Lose track of important content over time
- Underutilize bookmarks due to poor visibility
- Lack tools to organize information in a meaningful, contextual way

This results in:

- Cognitive overload
- Fragmented workflows
- Loss of context between sessions

---

## 3. Vision

Create a system where users can:

> See, organize, and return to their information through **space, context, and time** — not just lists.

---

## 4. Core Principles

- **One dataset, multiple views**
- **Now / Later are filters, not destinations**
- **Canvas = spatial meaning**
- **Grid = fast scanning**
- **Positions persist over time (spatial memory)**
- **Zoom changes level of detail (semantic zoom)**
- **Low friction, non-disruptive to existing behavior**

---

## 5. Goals

### Primary Goals

- Reduce reliance on open tabs as reminders
- Enable users to organize information spatially
- Improve re-engagement with saved content

### Secondary Goals

- Maintain compatibility with existing browsing behavior
- Avoid forced behavior change
- Provide lightweight context (notes, tags, reminders)

---

## 6. Key Concepts

### Cards (Core Unit)

All content is represented as a **card**:

- Tab
- Bookmark
- Tab group
- Snippet
- Image

### State (Filter-Based)

- **Now** → active / in-progress
- **Later** → deferred / saved

State is:
- filterable
- not tied to layout

### Spatial Canvas

- Infinite pan + zoom space
- Cards can be freely positioned
- Positions persist across sessions
- Space conveys meaning (clusters, intent, context)

### Grid View

- Structured, scannable layout
- Entry point for quick browsing
- Clicking a card transitions to canvas

---

## 7. Experience Overview

### Entry (Canvas-first)

- Users land on infinite canvas
- Slight zoomed-out overview
- Clusters and regions visible
- No card selected by default

### Interaction Flow

1. User explores canvas (pan/zoom)
2. User clicks a card
3. Canvas centers and focuses on that card
4. Nearby cards remain visible
5. User can:
6. move card
7. group cards
8. add notes/reminders

### Grid → Canvas Transition

- User clicks card in grid
- Canvas opens
- Card is centered and slightly elevated
- Surrounding cards fade in

---

## 8. Core Features

### 8.1 Infinite Canvas

Capabilities:

- Pan
- Zoom (trackpad, mouse, controls)
- Persistent card positioning
- Smooth camera transitions

### 8.2 Semantic Zoom Levels

**Far Zoom (Overview)**
- Clusters / regions visible
- Card density indicators
- Minimal detail

**Mid Zoom (Context)**
- Card thumbnails + titles
- Nearby relationships

**Close Zoom (Detail)**
- Full card content
- Notes, tags, actions

**Focused State**
- Selected card centered
- Elevated visually
- Nearby items remain visible

### 8.3 Spatial Organization

Users can:

- Drag and position cards
- Create clusters implicitly by proximity
- Organize by intent (e.g. inspiration, research)

System supports:

- Soft regions (non-rigid zones)
- Cluster labeling (optional)

### 8.4 Filters

Filters affect visibility only (not data):

- State (Now / Later / All)
- Type (tab, group, snippet, image)
- Tags

### 8.5 Card Interactions

- Select (checkbox or click)
- Multi-select (future)
- Move
- Add note
- Add reminder
- Change state (Now ↔ Later)

### 8.6 Visual State Distinction

Later items are visually distinct via:

- lower emphasis
- softer contrast
- subtle indicators (e.g. timestamp or icon)

### 8.7 Grid View

- Displays cards in structured layout
- Optimized for scanning
- Clicking card → opens canvas and centers it

---

## 9. Data Model (High Level)

### Card

- id
- type
- title
- url (optional)
- tags
- notes
- reminder (optional)
- state (now | later)
- createdAt / updatedAt

### Spatial

- x, y position
- z-index (optional)

### Canvas

- zoom
- panX, panY
- focusedCardId
- selectedCardIds

### Filters

- state
- type
- tags

---

## 10. Animation & Motion

### Principles

- Motion reinforces spatial understanding
- No abrupt transitions
- Movement should preserve context

### Key Animations

**Grid → Canvas**
- Smooth zoom transition
- Card scales slightly
- Camera centers on card

**Card Focus**
- Elevation increase
- Subtle scale (1.02–1.05)
- Nearby cards fade slightly

**Pan & Zoom**
- Inertial scrolling
- Smooth easing

**Hover**
- Slight lift
- Image scale (subtle)

---

## 11. MVP Scope

### Must Have

- Shared card data model
- Grid view
- Infinite canvas view
- Pan + zoom
- Click card → center in canvas
- Persistent positions
- Basic filters

### Nice to Have

- Notes
- Tags
- Reminders
- Cluster labels

---

## 12. Out of Scope (V1)

- AI grouping
- Cross-device sync improvements
- Advanced relationship mapping
- Complex automation

---

## 13. Risks

- Canvas may feel overwhelming without structure
- Users may not understand spatial model
- Performance issues with many cards

---

## 14. Success Metrics

### Quantitative

- Reduction in open tab count
- Increased re-engagement with saved items
- Canvas interaction frequency

### Qualitative

- Perceived clarity of workspace
- Ease of returning to tasks
- Sense of control over information

---

## 15. Future Opportunities

- Smart clustering
- AI-assisted organization
- Timeline overlays
- Relationship mapping
- Cross-device spatial sync

---

## 16. Summary

Browsing Timeline evolves from a tab/bookmark system into a:

**Spatial knowledge workspace**

Where:

- cards represent information
- space represents meaning
- filters represent intent
- and motion connects everything together
