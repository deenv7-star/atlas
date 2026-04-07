---
name: emil-design-eng
description: >-
  Design engineering for production UIs. Use with stitch-design-taste or
  design-taste-frontend when implementing screens: RTL-aware motion, valid DOM,
  accessibility, performance, and Hebrew-first product patterns for ATLAS-style apps.
---

# Emil — Design Engineering

Use this skill **together** with a taste skill (semantic palette/typography/motion philosophy). Emil owns **how** those choices ship: structure, motion math, RTL, a11y, and performance.

## 1. Pairing with taste dials

When the user sets `DESIGN_VARIANCE`, `MOTION_INTENSITY`, or `VISUAL_DENSITY`, treat taste skills as the **what** and Emil as the **how**:

- **Variance (layout):** Prefer CSS Grid with explicit tracks over flex `calc()` widths. Asymmetry must **collapse** to a single column below `md` with no horizontal overflow.
- **Motion (intensity):** Spring defaults: `stiffness` 90–130, `damping` 22–28, `mass` 0.85–1. Obey `prefers-reduced-motion` (Framer: `useReducedMotion()`; CSS: `@media (prefers-reduced-motion: reduce)`).
- **Density (data):** Tabular numerals for KPIs, money, IDs, dates in tables. Use a single utility class (e.g. `.atlas-tabular`) project-wide.

## 2. RTL-first (Hebrew / `dir="rtl"`)

- Prefer **`gap`**, **`padding-inline`**, **`margin-inline`**, and logical properties over hardcoded `left`/`right` for layout.
- **Horizontal slide transitions** are ambiguous in RTL (screen X vs reading direction). For wizards and steppers, prefer **vertical** enter/exit (`y` + opacity, optional light blur) unless you explicitly mirror X based on `dir`.
- Icons that imply “back” / “forward” must match **visual** direction (e.g. chevrons) for RTL; do not assume LTR muscle memory.

## 3. DOM validity and semantics

- Never nest **`<button>` inside `<a>`** or `<a>` inside `<button>`. Use **`<Link>` + classes**, or **`Button asChild`** with `Link` as the child (Radix Slot).
- Section headings: one clear **`h1` per view** inside main content; cards use **`h2`/`h3`** consistently.
- Loaders: prefer **skeletons** that match final layout; avoid orphan spinners without a label where the UI is non-obvious.
- Decorative motion (blobs, gradients): **`aria-hidden="true"`** or `pointer-events: none` so screen readers and clicks are unaffected.

## 4. Focus and interaction

- Every custom interactive surface (card-as-link, pill, icon button) needs **`focus-visible`** styles (ring + offset) at least as visible as native controls.
- **Touch targets:** minimum **44×44px** for primary actions on mobile; keep `touch-manipulation` on dense tap regions where appropriate.
- **`:active` feedback:** subtle `scale` or opacity on `transform`/`opacity` only—no layout-thrashing properties.

## 5. Motion performance

- Animate only **`transform`** and **`opacity`** for high-frequency transitions. Avoid animating `width`/`height`/`top`/`left` except for low-frequency cases (e.g. progress bars) where spring **width** is acceptable.
- Isolate **perpetual** or **layout** animations in small client subtrees; avoid re-rendering large parents every frame.
- Heavy blur filters: cap blur on **large scrolling** surfaces; keep decorative blur on **fixed** or **hero** layers only.

## 6. Forms and density

- **Label above field**, error below, single vertical rhythm (`space-y-*` from the project scale—do not mix arbitrary gaps).
- Numeric inputs: **`dir="ltr"`** on the field when value is Western numerals, even in RTL pages.
- Validation: show errors **after** touch/submit; keep success checkmarks from crowding focus order.

## 7. Pre-ship checklist (Emil)

- [ ] No invalid interactive nesting (`a`/`button`).
- [ ] Reduced motion path tested or explicitly disabled with `duration: 0`.
- [ ] RTL step transitions do not fight reading flow (prefer vertical or mirrored X).
- [ ] Focus visible on all custom controls.
- [ ] KPIs / money use tabular or mono numerals.
- [ ] Full-height shell uses **`min-h-[100dvh]`** (and safe viewport pairing), not raw `h-screen` alone for primary app chrome.

When in doubt, ship **clarity and correctness** over extra decoration.
