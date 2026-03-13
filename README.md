# Boda Credit Tracker

Boda Credit Tracker is a full-stack application for recording and tracking fuel credit transactions between boda riders and fuel station branches. It replaces informal paper records with a shared digital ledger for rider registration, station management, credit entry, balance tracking, and payment-status updates.

## Current Stack

- Frontend: React + Vite
- Backend: Flask
- ORM: Flask-SQLAlchemy
- Production database: Supabase Postgres
- Frontend hosting: Vercel
- Backend hosting: Render
- Local fallback database: SQLite

## MVP Coverage

The current app supports the core MVP flows:

- Register riders
- Register fuel station branches
- Record fuel credit transactions
- Track rider balances
- View transaction history
- Update payment status

The current station model assumes a single company using the platform and stores branches under `Total`.

## Data Model Relationships

The backend uses three core models:

- `Rider`
- `Station`
- `Transaction`

Relationship structure:

- One rider has many transactions
- One station has many transactions
- Riders and stations are also linked through a reciprocal many-to-many relationship using `Transaction` as the association table

`Transaction` is not just a join table. It stores user-submittable business data such as:

- `amount`
- `liters`
- `status`
- `notes`
- `paymentMethod`
- `paymentDate`

This makes the transaction ledger the source of truth for credit activity between riders and station branches.

## Repository Structure

- `backend/`: Flask API, SQLAlchemy models, SQL schema files, seed scripts
- `frontend/`: Vite React frontend
- `render.yaml`: Render blueprint for backend deployment

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

Local backend defaults:

- Port: `5050`
- SQLite file: `backend/database.sqlite`

If you need a custom local port, create `backend/.env`:

```env
PORT=5050
FLASK_DEBUG=1
```

### Frontend

From `frontend/`:

```bash
npm install
npm run dev
```

Frontend expects the backend at:

```env
VITE_API_BASE_URL=http://localhost:5050
```

You can set that in `frontend/.env.local`.

## Database Setup

### Local

Local development falls back to SQLite when `DATABASE_URL` is not set.

### Supabase

Supabase is now the intended persistent database for deployed environments.

Schema files live in:

- [backend/sql/001_create_enum_types.sql](/Users/brian.bett/.mounty/Transcend/2026%20Engagements/Engagements/Moringa_SE-Program/Development/code/se-prep/phase-4/Boda_Credit/backend/sql/001_create_enum_types.sql)
- [backend/sql/002_create_riders_table.sql](/Users/brian.bett/.mounty/Transcend/2026%20Engagements/Engagements/Moringa_SE-Program/Development/code/se-prep/phase-4/Boda_Credit/backend/sql/002_create_riders_table.sql)
- [backend/sql/003_create_stations_table.sql](/Users/brian.bett/.mounty/Transcend/2026%20Engagements/Engagements/Moringa_SE-Program/Development/code/se-prep/phase-4/Boda_Credit/backend/sql/003_create_stations_table.sql)
- [backend/sql/004_create_transactions_table.sql](/Users/brian.bett/.mounty/Transcend/2026%20Engagements/Engagements/Moringa_SE-Program/Development/code/se-prep/phase-4/Boda_Credit/backend/sql/004_create_transactions_table.sql)

One-time migration snapshot for the current local data:

- [backend/sql/006_import_current_sqlite_snapshot.sql](/Users/brian.bett/.mounty/Transcend/2026%20Engagements/Engagements/Moringa_SE-Program/Development/code/se-prep/phase-4/Boda_Credit/backend/sql/006_import_current_sqlite_snapshot.sql)

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
```

Notes:

- Use the Supabase session-pooler connection string on Render.
- The Flask backend automatically uses Postgres when `DATABASE_URL` is present.
- When `DATABASE_URL` is absent, the backend falls back to local SQLite.

### Frontend on Vercel

Deploy the `frontend/` directory as the Vite app and set:

```env
VITE_API_BASE_URL=https://your-render-backend-url.onrender.com
```

## Seed Data

Local seed scripts include:

- riders
- stations
- manager phonelines
- transactions with litres

Main local seed command:

```bash
cd backend
source venv/bin/activate
python run_seeds.py
```

## Notes

- Local database files and frontend cache folders should remain untracked.
- Supabase is now the source of truth for deployed data.
