---
name: theming
description: How dark mode, light mode, and colors work in the DayMark frontend (Tailwind v4 CSS variables + data-theme). Load before changing index.css, adding a color or surface, fixing unreadable text or wrong backgrounds in dark mode, touching focus rings or borders, or adding a component that needs to look right in both themes. Triggers on dark mode, light mode, theme, colors, palette, bg-white, focus ring, double border, contrast, Tailwind.
---

# Theming

Dark mode is implemented by **remapping CSS variables**, not by adding `dark:` variants to
components. Every Tailwind v4 color utility compiles to `var(--color-*)`, so redefining those
variables under `:root[data-theme="dark"]` re-themes the whole app at once.

- `frontend/src/context/ThemeContext.jsx` — `light` | `dark` | `system`, **light is the default**,
  persisted in localStorage, sets `data-theme` on `<html>`.
- `frontend/src/index.css` — the palette and all overrides.

Light mode is a warm off-white canvas, **not pure white**. Don't "simplify" it to `#fff`.

The ramps are inverted **in role**, not flipped mechanically: light tints become deep tints and dark
accent text becomes light accent text, so an existing `bg-emerald-50 text-emerald-800` pair keeps its
contrast without being touched. Preserve that when adding colors.

## Three traps that have each cost a rework round

**1. Unlayered CSS beats every `@layer`, at any specificity.** Tailwind v4 puts utilities in
`@layer utilities`. An unlayered rule outranks all of them, so a bare `:focus-visible { outline: ... }`
can never be overridden by `focus-visible:outline-none` — the utility is powerless no matter how
specific it is. This is what produced persistent double borders on inputs.

> Base element styles go **inside `@layer base`**. Always.

**2. A variable with two jobs cannot be flipped.** `--color-white` backs both `bg-white` and
`text-white`, each used in hundreds of places. Remapping the variable fixed the surfaces and
simultaneously turned every white label dark — invisible headlines on colored buttons. Scope the override to the **utility class**,
not the variable:

```css
:root[data-theme="dark"] .bg-white { background-color: #151e30; }
```

**3. Each interaction variant compiles to its own class.** Overriding `.bg-white` leaves
`hover:bg-white`, `focus:bg-white`, `focus-within:bg-white`, and `group-hover:bg-white` untouched — so
inputs flash pure white on focus. They are listed explicitly in `index.css`; **if you add a variant of
an overridden utility anywhere, add it to that selector list too.**

## Adding a component

Use existing semantic utilities (`bg-surface`, `text-slate-700`, `border-slate-200`) and it themes for
free. Only reach for `data-theme` if the design genuinely differs between themes.

**Panels that are dark in both themes** (the auth panel) must not use inverting scales — `text-slate-200`
becomes near-black in dark mode. Use `text-white/85` and friends, which are theme-independent.

## Verify before claiming done

Lint and unit tests will not catch any of the above. Actually toggle the theme and look at:
form inputs focused and unfocused, hover states in the header and sidebar, the auth pages
(login / signup / OTP / forgot password), and any button with a colored background.

Then run `cd frontend && npm run lint && npm test && npm run build`.
