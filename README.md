# VIU Backend (Vercel + Firebase)

This adds a secure serverless backend for your existing frontend without changing any frontend files.

## Overview

- API routes under `/api` are Vercel Serverless Functions.
- Uses Firebase Admin SDK (Firestore) via environment variables.
- DTO validation is handled with Zod.
- Admin listing endpoint protected with Basic Auth (`adminalea` / `alea12345`).

## API Endpoints

- `POST /api/survey` — Submit survey JSON payload. Returns `{ id }`.
- `GET /api/admin/list?limit=50` — List latest survey entries. Requires Basic Auth.

## Setup

1. Create a Firebase service account with Firestore access.
2. In Vercel project settings, add these Environment Variables:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (copy the key and ensure newlines are escaped as `\n`).
3. Optionally test locally with `vercel dev` and a `.env` file.

## Local Dev

```powershell
npm install
$env:FIREBASE_PROJECT_ID="your-project-id"
$env:FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxx@your-project-id.iam.gserviceaccount.com"
$env:FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
npm run dev
```

## Using From Frontend

- Submit survey: `fetch('/api/survey', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })`.
- Admin list: `fetch('/api/admin/list?limit=50', { headers: { Authorization: 'Basic ' + btoa('adminalea:alea12345') } })`.

## Deploy

```powershell
npm install -g vercel
vercel
vercel --prod
```

## Notes

- CORS is permissive (`*`) for simplicity; tighten if needed.
- DTOs are generic; adjust `lib/dto.js` fields if your frontend submits named fields.
- Credentials are only used for admin listing; do not expose in frontend code.
