# BodaCredit Frontend

This is the Vite + React frontend for BodaCredit. It is no longer a static shell or a single-company prototype. The frontend now supports a role-based, multi-company product experience for company admins, station managers, and riders.

## Frontend Purpose

The frontend is responsible for:
- rendering role-specific navigation and protected routes
- presenting company, station, and rider workflows differently
- surfacing notifications, approval states, and service-health summaries
- giving each account type a focused view of only the data relevant to them

## Current Frontend Scope

### Shared capabilities
- role-aware routing
- login and sign-up portal flow
- profile page for all roles
- notifications page for all roles
- branded toast feedback for errors and successes
- unread notification badge in sidebar navigation

### Company account experience
- management-focused dashboard
- company rider portfolio analytics
- company transaction flow analytics
- company station comparison modules
- company station creation and editing
- company approval of pending station manager access requests

### Station account experience
- station-specific dashboard
- approval-queue style transaction view
- rider-oversight view
- notifications for incoming rider credit requests
- no access to other stations in the same company

### Rider account experience
- mobile-friendly dashboard and request flow
- request credit page
- personal activity tracking
- personal notification stream for request outcomes

## Current Routes

The route set is now role-aware. The same route path can render differently depending on the signed-in account type.

Main routes include:
- `/login`
- `/home`
- `/riders`
- `/stations`
- `/transactions`
- `/add-credit`
- `/notifications`
- `/profile`

The frontend redirects and guards access based on the current role and approval state.

## UI Approach

The frontend uses a shared visual system, but account types no longer share identical page structures.

Examples:
- company pages are management dashboards rather than row-level operational tables
- station pages are operational and approval-oriented
- rider pages are simplified and mobile-aware

This was an intentional design direction so the product feels role-correct instead of like one reused admin panel.

## Frontend Project Structure

- `src/assets`: logos and UI icons
- `src/auth`: auth provider and protected route logic
- `src/components`: reusable UI elements and shared forms
- `src/lib`: API helpers and formatting utilities
- `src/pages`: route-level account experiences

## Local Run

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

## Environment Variable

Set the backend API base URL in `frontend/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:5050
```

For Vercel deployment, this should point to the live Render backend.

## Build

```bash
npm run build
```

## Deployment Notes

Recommended Vercel setup:
- Root directory: `frontend`
- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`

Required environment variable:

```env
VITE_API_BASE_URL=https://your-render-backend-url.onrender.com
```

## Auth Note

The frontend currently works with the Flask-managed role-based auth layer rather than Supabase Auth.

This is intentional for the current beta/testing phase because it keeps account setup and testing friction low while still allowing:
- protected routes
- role-aware navigation
- approval states
- tenant-scoped UI experiences

## Frontend-Focused Future Improvements

1. Add richer visual analytics for company users, including line and trend charts.
2. Replace native selects in a few mobile-heavy flows with more resilient custom combobox components.
3. Add deeper loading skeletons and optimistic UI treatment for long-running actions.
4. Introduce accessibility and keyboard-navigation refinements across the role-based dashboards.
