# BodaCredit

BodaCredit is a full-stack fuel credit management platform designed for boda boda ecosystems. It digitizes how fuel credit is requested, approved, and tracked across fuel companies, stations, SACCOs, and riders.

## 🚀 Features

### Company Dashboard
- Monitor overall credit activity and station performance
- Compare station health across the company
- Manage stations within the company
- Review company-level service signals and exposure trends

### Station Dashboard
- Review and approve rider credit requests
- Track station-level transactions
- Monitor riders linked to the station
- Handle branch-level operational oversight

### SACCO Dashboard
- Register a SACCO oversight account
- Monitor member riders and their access standing
- Review outstanding fuel-credit balances and repayments
- Track member transaction history across participating stations

### Rider Interface
- Request fuel credit
- View personal balance and transaction history
- Track request outcomes from station review

### Notifications
- Real-time updates on requests, approvals, and system activity
- Automated SMS alert outbox with optional provider webhook delivery
- Unread notification badges in the sidebar
- Role-aware notification delivery for company, station, and rider users

## 🧱 Tech Stack

- **Frontend:** React + Vite
- **Backend:** Flask
- **Database:** PostgreSQL (Supabase) / SQLite (local)
- **ORM:** Flask-SQLAlchemy
- **Deployment:** Vercel (frontend), Render (backend)

## 🏗️ System Overview

The platform uses a **multi-tenant architecture**.

- A **Company** has many **Stations**
- A **SACCO** has many member **Riders**
- A **Station** manages many **Transactions**
- A **Rider** interacts with Stations through **Transactions**

The **Transaction** model is the core of the system. It stores:
- credit amount
- litres requested
- status (`pending`, `approved`, `paid`, `cancelled`)
- payment details
- timestamps

This makes the transaction ledger the source of truth for credit activity across the platform.

## 🔐 Authentication

- Role-based authentication handled by Flask
- Supports four roles: `company`, `sacco`, `station`, `rider`
- Designed for simplicity during testing and grading
- **Not yet integrated with Supabase Auth by design**

### Why auth is not tied to Supabase Auth yet

During the current beta/testing stage, the project intentionally keeps authentication inside the Flask application instead of tying user profiles directly to Supabase Auth.

This decision was made to allow:
- lower-friction testing
- easier account reset and role testing
- simpler debugging of role-based flows
- less dependence on external password-reset and rate-limit constraints

Even without Supabase Auth integration, the application still enforces:
- authenticated access
- role-based route protection
- company/SACCO/station/rider access scoping

## 📁 Project Structure

```text
backend/        Flask API, models, SQL scripts, utilities
frontend/       React application
render.yaml     Render deployment blueprint
```

## ⚙️ Local Setup

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python run_seeds.py
python app.py
```

Runs on:
- [http://localhost:5050](http://localhost:5050)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Set the environment variable in `frontend/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:5050
```

## 🌍 Deployment

### Backend
- Hosted on Render
- Uses Supabase PostgreSQL in production
- Set `DATABASE_URL`, `SECRET_KEY`, and `CORS_ORIGINS`
- Apply the ordered scripts in `backend/sql`, including `010_add_saccos_module.sql`

### Frontend
- Hosted on Vercel
- Points to the deployed Flask backend through `VITE_API_BASE_URL`

## 📌 Key Concepts Demonstrated

- Full-stack architecture with React and Flask
- Role-based access control
- Multi-tenant system design
- Relational data modeling with SQLAlchemy
- RESTful API design
- Role-specific dashboards and workflows
- Notification-driven workflow support

## 🧪 Current Product Roles

### Company
- Reviews service health across company stations
- Manages stations within the company
- Approves station manager access requests
- Monitors rider and transaction portfolio signals

### Station
- Reviews rider fuel credit requests for one assigned station
- Tracks station-specific transactions
- Oversees rider standing within the branch workflow

### Rider
- Requests fuel credit
- Views personal transaction activity and balance
- Receives request outcome notifications

### SACCO
- Oversees member rider profiles
- Reviews repayment history and outstanding balances
- Tracks fuel-credit activity across participating stations

## 🔒 Security Notes

- The frontend does not call Supabase directly
- The Flask backend is the application access layer
- Supabase public-table access is hardened through Row Level Security policies applied through the SQL migration scripts

## 🔮 Future Improvements

1. Integrate Supabase Auth for production-ready authentication
2. Add background jobs for automated alerts and scheduled checks
3. Improve analytics and reporting dashboards with deeper trend views
4. Add richer audit trails and dispute-resolution workflows for credit requests
