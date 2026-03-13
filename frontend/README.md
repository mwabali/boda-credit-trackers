# Boda Credit Tracker Frontend

This is the Vite + React frontend for Boda Credit Tracker. It is now fully wired to the backend API and no longer represents only a static scaffold.

## Current Frontend Scope

The frontend currently supports:

- Dashboard summary cards and quick-credit workflow
- Riders registry and rider status updates
- Station branch management, station creation, and station status updates
- Credit transaction history and transaction status updates
- Add Credit flow for both existing and new riders
- Company-aware station naming under `Total`

## Routes

- `/home`
- `/riders`
- `/stations`
- `/transactions`
- `/add-credit`

`/` and unknown routes redirect to `/home`.

## Local Run

Install dependencies:

```bash
npm install
```

Run the frontend:

```bash
npm run dev
```

## Environment Variable

Set the backend API base URL in `frontend/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:5050
```

For deployed frontend on Vercel, this should point to your Render backend URL instead.

## Project Structure

- `src/assets`: logos and metric icons
- `src/components`: reusable UI elements
- `src/layout`: shared app layout
- `src/lib`: API helpers, mappers, and formatters
- `src/pages`: route-level pages

## Main Frontend Behaviors

### Dashboard

- Loads riders, stations, transactions, and summary stats from the API
- Includes a quick-entry credit form
- Shows recent transactions and station directory snapshot

### Riders Page

- Loads live riders from the backend
- Displays live debt totals based on outstanding transactions
- Allows rider status toggling

### Stations Page

- Loads live station records
- Supports adding a new station branch
- Uses a collapsible station form
- Shows management phonelines
- Allows station status toggling

### Transactions Page

- Loads live transactions and dashboard stats
- Displays amount, litres, status, and transaction date
- Allows transaction status updates

### Add Credit

- Supports:
  - existing rider credit entry
  - new rider creation + immediate credit entry
- Blocks submission when no stations exist

## Styling

- CSS Modules are used throughout the frontend
- Shared visual language includes:
  - sidebar navigation
  - metric cards with icons
  - color-coded status tags/selects

## Deployment Notes

- Vercel should use `frontend/` as the root directory
- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`

Required Vercel environment variable:

```env
VITE_API_BASE_URL=https://your-render-backend-url.onrender.com
```

## Notes For Future Work

- The frontend currently expects the backend API to remain the source of truth
- Supabase should stay behind the backend rather than being called directly from the frontend
- Additional auth/role separation can be layered in later without replacing the current page structure
