# Zyntry Code — Landing Page

Marketing site for [Zyntry Code](https://github.com/devspak-s8/Zyntry-Code) — a VS Code engineering
agent that coordinates models and tools across the software development lifecycle, adapts its
execution strategy to the task, and verifies changes with evidence.

This site lives under `landing/` inside the main project and is a standalone Vite + React +
TypeScript app.

## Development

```sh
npm install
npm run dev      # start dev server
npm run build    # typecheck + production build
npm run preview  # preview the production build
```

## Structure

- `src/components/` — one component per section (Navbar, Hero, Walkthrough, Features,
  Environments, CTA, Footer) plus shared primitives (Badge, Button, Section)
- `src/styles/tokens.ts` — typed aliases for the CSS custom properties in `src/index.css`
- `src/index.css` — design tokens, fonts, and responsive rules

## Design system

Dark theme aligned with the main app: `#0D1217` base background, `#93C5FD` soft-blue accent,
and status colors amber `#F4C76A`, red `#FF7D7D`, blue `#82B9FF`. All colors are defined as CSS
custom properties in `src/index.css`.
