# Clawbaby Backend (ready-to-deploy)

## What this includes
- Express server with routes:
  - POST `/api/auth/login` (returns JWT)
  - GET `/api/categories` (requires Bearer token)
  - GET `/api/redemptions` (requires Bearer token)
- MySQL connection using `mysql2`
- JWT auth middleware
- `.env.example` provided (do **not** commit real secrets)

## Setup
1. Unzip the package
2. `npm install`
3. Copy `.env.example` to `.env` and set your DB credentials
4. Import the provided SQL (you already have `clawbaby_admin` schema)
5. `npm start`

## Notes
- Refresh-token support and Docker were omitted per your request.
- DB host assumed to be `localhost`.
