# BodaCredit Deployment

## 1. Supabase PostgreSQL

1. Create a Supabase project.
2. Open the SQL editor.
3. Run the files in `backend/sql` in numeric order.
4. Copy the PostgreSQL connection string from Supabase and use the transaction pooler URL when deploying the Flask API.

The browser never connects directly to Supabase. The SQL scripts enable Row Level Security and deny direct `anon` and `authenticated` table access because the Flask API is the application access layer.

## 2. Render Backend

1. Create the service from `render.yaml`.
2. Set `DATABASE_URL` to the Supabase PostgreSQL connection string.
3. Set `CORS_ORIGINS` to the deployed frontend URL, for example `https://boda-credit.vercel.app`.
4. Let Render generate `SECRET_KEY`.
5. For Africa's Talking, set `AFRICASTALKING_API_KEY` and `AFRICASTALKING_USERNAME`. Keep `AFRICASTALKING_USERNAME=sandbox` while testing. You can alternatively set `SMS_WEBHOOK_URL` and `SMS_WEBHOOK_TOKEN` for another provider. Without either configuration, SMS alerts remain safely queued in `sms_outbox`.
6. Deploy and verify the API root URL returns `"status": "running"`.

## 3. Firebase Hosting Frontend

1. Set `VITE_API_BASE_URL` to the deployed Render API URL without a trailing slash.
2. Run `npm run build` inside `frontend`.
3. Authenticate with Firebase CLI using `npx firebase-tools login`.
4. Run `npx firebase-tools deploy --only hosting` from the repository root.

The Firebase Admin service-account JSON is not required for Hosting and must not be committed.

## 4. Production Check

1. Create a company account and its first fuel station.
2. Create a station manager account and approve it from the company notifications page.
3. Create a SACCO account.
4. Create a rider account and select the SACCO membership.
5. Submit a rider credit request.
6. Approve and mark the request as paid from the station portal.
7. Confirm the SACCO portal shows the member rider, outstanding balance, repayment value, and ledger history.
