# Mark.it

## Developers

- Noah Miller
- Jacob Pellini
- Marc Sulsenti
- Jared Soiferman

## Overview

Mark.it is a crowdsourced financial labeling platform for creating high-quality labeled datasets from financial assets (for example: chart images, transcript snippets, and market snapshots).

The platform supports three user roles:

- Owner: Creates jobs/tasks, uploads assets, monitors progress, and downloads labeled outputs.
- Labeler: Labels assigned assets using the task schema.
- Reviewer: Reviews labeler outputs and confirms or corrects labels.

The application uses a multi-step quality flow where labelers produce initial labels and reviewers validate them before assets are considered complete.

## Hosting

The app is deployed to AWS ECS.

- Production URL: `https://<AWS-ECS-URL-PLACEHOLDER>`

Note: This URL is a placeholder for now because the deployment endpoint changes while the pipeline is active.

## Repository Structure

- `frontend/`: React + Vite + TypeScript client
- `backend/`: Express + TypeScript API
- `backend/Seed.ts`: Database/Firebase seed script and seeded account generation

## Tech Stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Database: MongoDB
- Auth: Firebase Authentication
- Storage: AWS S3 (asset upload/download and ZIP packaging)
- Deployment: AWS ECS

## Local Development Setup

### 1) Prerequisites

- Node.js 20+ (recommended)
- npm
- MongoDB instance (local or remote)
- Firebase project/service account
- AWS S3 bucket + IAM credentials (required for asset upload/serve/download)

### 2) Install dependencies

Run these from the repository root:

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3) Configure environment variables

Create the following files:

- `backend/.env` (copy from `backend/.env.example`)
- `frontend/.env` (copy from `frontend/.env.example`)

Backend variables (required):

```env
MONGO_DB_URI=
MONGO_DB_NAME=
FIREBASE_ADMIN_SDK=
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=
```

Important: `FIREBASE_ADMIN_SDK` must be a JSON string (not a file path) that matches the Firebase Admin service account credentials.

Frontend variables (required):

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### 4) (Optional) Seed demo data

The project is typically already seeded, so this step is not usually necessary.

If seeded accounts are not working for any reason, run the seed script to recreate demo users/jobs/tasks/assets.

Important: The seed script clears the configured MongoDB database and clears Firebase users before recreating demo data.

```bash
cd backend
npm run seed
```

### 5) Start backend

```bash
cd backend
npm run dev
```

Backend runs on `http://localhost:3001`.

### 6) Start frontend

In a second terminal:

```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173` (default Vite port). API calls to `/api/*` are proxied to `http://localhost:3001`.

## Seeded Test Accounts

These accounts are created by `backend/Seed.ts`:

### Owners

- `quant@alphariver.com` / `AlphaRiver!12`
- `data@meridianquant.com` / `Meridian!13`
- `research@ironledger.com` / `IronLedger!14`

### Labelers

- `labeler1@markit.com` / `Thornton!2`
- `labeler2@markit.com` / `Reyes!3`
- `labeler3@markit.com` / `Chen!4`

### Reviewers

- `reviewer1@markit.com` / `Novak!7`
- `reviewer2@markit.com` / `Hassan!8`
- `reviewer3@markit.com` / `Fontaine!9`

Note: The seed script creates additional labeler/reviewer accounts as well.

## Downloaded ZIP Output (Owner)

When an owner downloads labeled assets:

- Only assets with status `REVIEWED` are included.
- ZIP filename is `labeled_assets.zip`.
- Each file inside the ZIP is named using the dominant label and asset id: `<dominantLabel>_<assetId>`.
- The dominant label is selected by majority vote across the labeler label plus reviewer labels.

## Useful Scripts

Backend (`backend/package.json`):

- `npm run dev`: Start backend in development mode
- `npm run build`: Compile TypeScript
- `npm run start`: Run compiled backend
- `npm run seed`: Reset and seed demo users/jobs/tasks/assets

Frontend (`frontend/package.json`):

- `npm run dev`: Start Vite dev server
- `npm run build`: Build production frontend
- `npm run preview`: Preview production build

## Notes

- If login fails in local development, double-check Firebase config in both frontend and backend.
- If asset upload/download fails, verify AWS credentials and bucket settings.
- Seeding is destructive for the configured database and Firebase user pool for that project environment.
