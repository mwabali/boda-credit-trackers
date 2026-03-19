# BodaCredit

BodaCredit is a full-stack fuel credit management platform for boda boda ecosystems. It replaces ad hoc station ledgers and informal follow-up with a role-based digital workflow that lets companies, station managers, and riders interact with the same service from different perspectives.

The current product supports:
- company-level oversight of enrolled stations and overall portfolio health
- station-level review of rider requests and branch activity
- rider-side credit requests and personal balance/activity tracking
- in-app notifications for approvals, requests, and service-health events

This repository now reflects a multi-company product. It is no longer built around a single hard-coded company such as `Total`.

## Project Purpose

The application was built to solve a practical operational problem: fuel credit is often extended to riders across multiple stations, but the tracking of requests, approvals, balances, and settlements is usually fragmented.

BodaCredit provides a shared platform where:
- a company admin can monitor the health of the company’s fuel credit service across its stations
- a station manager can review and act on requests tied only to their assigned station
- a rider can request fuel credit and monitor only their own activity

## Current Tech Stack

- Frontend: React + Vite
- Backend: Flask
- ORM: Flask-SQLAlchemy
- Production database: Supabase Postgres
- Local fallback database: SQLite
- Frontend hosting: Vercel
- Backend hosting: Render

## Current Product Model

### Roles

The app currently supports three role-based account types:

1. `company`
- manages one company account
- views company-wide summaries, service health, portfolio risk, and station performance
- can create and edit stations belonging only to their own company
- can approve or decline pending station manager access requests for stations in their company

2. `station`
- belongs to one specific station under one company
- can only access data for the station they manage
- works primarily from approval and rider-oversight views
- receives notifications when riders submit credit requests awaiting review

3. `rider`
- accesses a mobile-friendly rider view
- can submit credit requests
- can monitor only their own activity, balances, and request outcomes
- receives notifications when a station manager updates request status

### Multi-Tenant Company Structure

The app now uses a proper company model instead of relying on a single shared company name.

Core tenant relationships:
- one `Company` has many `Stations`
- one `Company` has many `AuthAccount` records for company and station users
- one `Station` belongs to one `Company`
- one `Station` has many `Transactions`
- one `Rider` has many `Transactions`
- `Transaction` acts as the association model between riders and stations

This structure is what now supports company isolation, station isolation, and role-correct dashboard behavior.

## Data Model

The backend models currently include:
- `Company`
- `AuthAccount`
- `Rider`
- `Station`
- `Transaction`
- `Notification`

### Relationship Summary

- `Company -> Station`: one-to-many
- `Company -> AuthAccount`: one-to-many
- `Station -> Transaction`: one-to-many
- `Rider -> Transaction`: one-to-many
- `Rider <-> Station`: many-to-many through `Transaction`

### Why `Transaction` Matters

`Transaction` is not only a join table. It stores the business data that makes the platform meaningful:
- credit amount
- litres requested
- payment method
- payment date
- status
- notes
- timestamps

This makes the transaction ledger the source of truth for credit service activity.

## Auth Architecture

The current auth layer is role-based and is managed by the Flask backend.

### Important Implementation Decision

We intentionally did **not** tie application profiles to Supabase Auth users at this stage.

Reason:
- the team prioritized low-friction testing during beta and grading
- tying profiles to Supabase Auth would add extra coordination between auth users, profile records, RLS ownership, password reset flows, and rate-limited external auth operations
- the current Flask-managed auth layer still allows robust role-based access control, route protection, and tenant scoping without adding that testing friction

In practice, this means:
- authentication is still enforced
- role-based access is still enforced
- company/station/rider scoping is still enforced
- testing and resetting accounts is easier during this phase of the project

This is a deliberate beta-stage tradeoff, not an omission by accident.

## Current Feature Set

### Company Accounts

Company users currently get management-focused views rather than raw operational tables.

Current company capabilities:
- view company dashboard with service-health summaries
- compare station performance across the company
- view rider portfolio posture and transaction signals
- create and edit stations in their own company only
- approve or reject station manager access requests
- receive notifications for:
  - station manager approval requests
  - quiet stations
  - high pending exposure conditions

### Station Accounts

Station managers currently get station-specific operational views.

Current station capabilities:
- access only their assigned station
- review branch transaction activity
- handle rider requests awaiting review
- update rider-facing request outcomes
- oversee station riders and rider status issues
- receive notifications when riders submit new credit requests

### Rider Accounts

Rider users currently get a rider-focused experience.

Current rider capabilities:
- request credit from available stations
- view personal credit activity
- view personal balance state
- receive notifications when requests are approved, cancelled, or settled

## Validation and Data Protection

The backend currently protects invalid or unsafe data through a combination of:
- SQLAlchemy `nullable=False` constraints
- uniqueness constraints
- foreign keys
- `CheckConstraint` rules
- model-level validators
- route-level validation
- friendlier integrity-error responses

Examples of protected invalid cases:
- invalid statuses
- invalid payment methods
- missing required fields
- non-positive credit amounts
- invalid phone formats
- duplicate unique values where prohibited

## Notifications

Notifications are now first-class in the product.

Examples of current notifications:
- station access pending / approved
- rider credit request submitted to station manager
- rider request approved or declined
- company service-health alerts

Unread counts are surfaced in the sidebar so the notification channel works as an active workflow cue instead of a passive inbox.

## Security Notes

The frontend does not call Supabase directly. The Flask backend is the access layer.

Because of that, we hardened the public tables in Supabase using safe RLS policies that deny direct anonymous and authenticated API access to exposed tables while still allowing the backend service to function through its configured database connection.

Relevant SQL hardening file:
- [backend/sql/008_harden_public_rls.sql](/Users/brian.bett/.mounty/Transcend/2026%20Engagements/Engagements/Moringa_SE-Program/Development/code/se-prep/phase-4/Boda_Credit/backend/sql/008_harden_public_rls.sql)

## Repository Structure

- `backend/`: Flask app, SQLAlchemy models, SQL scripts, seed/bootstrap utilities
- `frontend/`: React + Vite application
- `render.yaml`: backend deployment blueprint

## Local Development

### Backend

From `backend/`:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python run_seeds.py
python3 app.py
```

Default local behavior:
- Port: `5050`
- Local database: `backend/database.sqlite`
- Falls back to SQLite when `DATABASE_URL` is not set

Optional `backend/.env` for local development:

```env
PORT=5050
FLASK_DEBUG=1
SECRET_KEY=replace-this-locally
AUTH_TOKEN_MAX_AGE_SECONDS=604800
```

### Frontend

From `frontend/`:

```bash
npm install
npm run dev
```

Local frontend environment:

```env
VITE_API_BASE_URL=http://localhost:5050
```

Set that in `frontend/.env.local`.

## Database Setup

### Local

Local development uses SQLite when no production database URL is provided.

### Production / Supabase

Supabase Postgres is the persistent database for deployed environments.

Important SQL files:
- [backend/sql/001_create_enum_types.sql](/Users/brian.bett/.mounty/Transcend/2026%20Engagements/Engagements/Moringa_SE-Program/Development/code/se-prep/phase-4/Boda_Credit/backend/sql/001_create_enum_types.sql)
- [backend/sql/002_create_riders_table.sql](/Users/brian.bett/.mounty/Transcend/2026%20Engagements/Engagements/Moringa_SE-Program/Development/code/se-prep/phase-4/Boda_Credit/backend/sql/002_create_riders_table.sql)
- [backend/sql/003_create_stations_table.sql](/Users/brian.bett/.mounty/Transcend/2026%20Engagements/Engagements/Moringa_SE-Program/Development/code/se-prep/phase-4/Boda_Credit/backend/sql/003_create_stations_table.sql)
- [backend/sql/004_create_transactions_table.sql](/Users/brian.bett/.mounty/Transcend/2026%20Engagements/Engagements/Moringa_SE-Program/Development/code/se-prep/phase-4/Boda_Credit/backend/sql/004_create_transactions_table.sql)
- [backend/sql/007_create_auth_accounts_table.sql](/Users/brian.bett/.mounty/Transcend/2026%20Engagements/Engagements/Moringa_SE-Program/Development/code/se-prep/phase-4/Boda_Credit/backend/sql/007_create_auth_accounts_table.sql)
- [backend/sql/008_harden_public_rls.sql](/Users/brian.bett/.mounty/Transcend/2026%20Engagements/Engagements/Moringa_SE-Program/Development/code/se-prep/phase-4/Boda_Credit/backend/sql/008_harden_public_rls.sql)
- [backend/sql/009_add_companies_table.sql](/Users/brian.bett/.mounty/Transcend/2026%20Engagements/Engagements/Moringa_SE-Program/Development/code/se-prep/phase-4/Boda_Credit/backend/sql/009_add_companies_table.sql)

## Deployment

### Backend on Render

Use:
- Runtime: `Python`
- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `gunicorn 'app:create_app()'`

Required environment variables:

```env
DATABASE_URL=your_supabase_postgres_connection_string
FLASK_DEBUG=0
SECRET_KEY=your-production-secret
AUTH_TOKEN_MAX_AGE_SECONDS=604800
```

Notes:
- use the Supabase session-pooler connection string on Render
- when `DATABASE_URL` is present, the backend uses Postgres
- when `DATABASE_URL` is absent, the backend falls back to local SQLite

### Frontend on Vercel

Deploy `frontend/` as the Vite app and set:

```env
VITE_API_BASE_URL=https://your-render-backend-url.onrender.com
```

## Seed and Bootstrap Utilities

### Local reset-and-seed

```bash
cd backend
source venv/bin/activate
python run_seeds.py
```

This is appropriate for local development because it rebuilds local test data.

### Auth/account bootstrap

```bash
cd backend
source venv/bin/activate
python bootstrap_auth_accounts.py
```

This utility is intended for environments where auth accounts need to be created without wiping existing application data.

## Examiner Notes

This project now demonstrates:
- a Flask + React full-stack architecture
- role-based access control for three user types
- a multi-tenant company model
- a reciprocal many-to-many relationship through an association model (`Transaction`)
- SQLAlchemy validation and constraint-based invalid-data handling
- company/station/rider-specific views rather than one shared admin dashboard
- backend-enforced tenant scoping and workflow-specific notifications

## Future Iterations

1. Tie application accounts to Supabase Auth once the product moves beyond beta testing.
   - This would support production-grade password reset and identity lifecycle management.

2. Introduce background jobs for scheduled alerting.
   - Company health notifications are currently generated safely at request time; a job queue would make this more scalable.

3. Add richer dispute-resolution workflow for station managers and riders.
   - For example, request comments, evidence, escalation states, and audit trails.

4. Add deeper analytics and export tools for company admins.
   - For example, period comparisons, CSV exports, approval trend lines, and station benchmarking over time.

## Notes

Local-only artifacts should remain untracked, including:
- `backend/.env`
- `backend/database.sqlite`
- `database.sqlite`
- `frontend/.vite/`
