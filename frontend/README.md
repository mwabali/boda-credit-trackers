# Boda Credit Tracker Frontend

React + Vite frontend foundation for the Boda Credit Tracker project.

## Current Scope (Frontend Lead Phase)

This frontend is intentionally prepared for handoff and later expansion:

- Vite React app scaffold with clean starter cleanup
- React Router configured for core routes
- Shared layout and navigation foundation
- Page skeletons with intentional placeholder content
- CSS Modules structure for component/page styling
- Home dashboard skeleton with static navigation cards

No live backend integration is included yet.

## Routes

- `/home`
- `/riders`
- `/stations`
- `/transactions`
- `/add-credit`

`/` and unknown routes redirect to `/home`.

## Structure

- `src/components`: shared UI building blocks (e.g., navbar)
- `src/layout`: shared route layout wrapper
- `src/pages`: route-level page components
- `src/styles`: reserved for shared styling tokens/utilities
- `src/assets`: reserved for static assets used by future components

## Run

```bash
npm install
npm run dev
```

## Handoff Notes For Taran

- Keep route pages in `src/pages` and place reusable UI in `src/components`.
- Continue using CSS Modules for page/component styling.
- API service wiring should be added in a later integration phase.
