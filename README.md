# Boda_Credit
A full-stack web application for recording and tracking fuel credit transactions between boda riders and fuel stations.

## Backend Deployment on Render

The backend can be deployed to Render as a Node web service from the `backend` directory.

Important:
- The current backend uses SQLite.
- On Render, SQLite must be stored on a persistent disk or the data will be lost on redeploy/restart.
- This repo includes a [`render.yaml`](/Users/brian.bett/.mounty/Transcend/2026%20Engagements/Engagements/Moringa_SE-Program/Development/code/se-prep/phase-4/Boda_Credit/render.yaml) blueprint that mounts a persistent disk at `/var/data` and points SQLite there with `SQLITE_STORAGE_PATH=/var/data/database.sqlite`.

Manual Render settings if you do not use the blueprint:
- Service type: `Web Service`
- Runtime: `Node`
- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/`
- Disk mount path: `/var/data`
- Environment variable: `SQLITE_STORAGE_PATH=/var/data/database.sqlite`

Recommended next infrastructure step:
- Keep Render for the backend service
- Move the database to Supabase when you are ready to stop relying on SQLite
