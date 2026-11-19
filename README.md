# BakiGuard AI

A credit ledger (বাকি খাতা) for Bangladeshi shops that helps owners **get their baki back**:
record credit and payments in seconds, always know who owes what, and get
AI-driven advice on who to collect from and who to stop giving credit to.

## Architecture

| Service | Stack | Port | Notes |
|---|---|---|---|
| `frontend/` | Next.js 16, React 19, Tailwind 4 | 3000 | Web app for shop owners |
| `backend/` | Node 22, Express 5, Mongoose 9, Zod | 5000 | REST API, auth, ledger |
| `ai-service/` | Python 3.13, FastAPI | 8000 | Internal; called only by the backend |
| MongoDB | Atlas or Docker (replica set) | 27017 | Transactions require a replica set |

```
Browser ──► frontend ──► backend (/api) ──► MongoDB
                              └──► ai-service (X-API-Key)
```

## Run with Docker (whole stack)

```bash
cp .env.example .env   # fill in JWT_SECRET and AI_SERVICE_API_KEY
docker compose up --build
```

Open http://localhost:3000. Login codes appear in `docker compose logs backend`
until a real SMS provider is configured.

## Run for development

Each service has a `.env.example`; copy it to `.env` (`.env.local` for the frontend).

```bash
# Database: Atlas URI, or a local replica set:
docker compose up -d mongo
# MONGODB_URI=mongodb://localhost:27017/bakiguard?replicaSet=rs0&directConnection=true

cd backend && npm install && npm run dev
cd ai-service && python -m venv venv && venv/Scripts/pip install -r requirements-dev.txt \
  && venv/Scripts/uvicorn app.main:app --reload --port 8000
cd frontend && npm install && npm run dev
```

## Tests

```bash
cd backend && npm test            # API tests on an in-memory MongoDB replica set
cd ai-service && python -m pytest
```

CI (`.github/workflows/ci.yml`) runs type checks, tests, builds and Docker builds on every PR.

## Key design decisions

- **Money is whole Taka (integers).** No floating point in the ledger.
- **A customer's balance (`totalDue`) changes only through transactions**, inside a
  MongoDB transaction, using a conditional update so concurrent payments can never
  push a balance below zero.
- **Customers are archived, never deleted**, so ledger history and shop totals stay
  correct. A customer who still owes money cannot be removed.
- **Phone numbers are normalized** to `01XXXXXXXXX`.
- **Login is "Sign in with Google"** for now (backend verifies the Google ID token
  against `GOOGLE_CLIENT_ID`; an existing email account with the same verified address
  is linked). **Phone + OTP is built but off** (`PHONE_LOGIN_ENABLED`,
  `NEXT_PUBLIC_PHONE_LOGIN`): (6-digit SMS code, stored only as an HMAC, single use,
  5 attempts, 60s resend cooldown, 5 codes/hour/number). Email login remains for
  older accounts. SMS goes through a pluggable provider (`backend/src/services/sms/`);
  `console` prints codes to the log for development.
- **Sessions:** a short-lived access token (15 min) kept in memory, plus a rotating
  refresh token in an httpOnly cookie. Sessions are stored hashed and can be revoked.
- **Due dates and aging.** Every credit has a due date (picked, or the shop's default
  term). Payments settle the oldest credit first, so each credit knows what is still
  unpaid and the app can show who is 1-30, 31-60, 61-90 or 90+ days late.
- **Bangla first.** The UI defaults to Bangla with an English switch, Bangla digits
  and lakh grouping. Translations live side by side in
  `frontend/src/i18n/messages/`; a missing translation is a compile error.
- **Installable PWA** with an offline page. The service worker never caches API data.
- **The AI service is optional at runtime.** If it is down, the dashboard still works
  and insights come back empty with `available: false`.

## API overview

All responses: `{ success, data?, message?, code?, errors? }`.

| Method | Path | |
|---|---|---|
| POST | `/api/auth/otp/request`, `/api/auth/otp/verify` | Phone login/sign-up; rate-limited |
| POST | `/api/auth/register`, `/api/auth/login` | Email accounts; rate-limited |
| POST | `/api/auth/refresh`, `/api/auth/logout` | Cookie-based |
| GET/PATCH | `/api/auth/me` | Profile: shop name, language, default credit days |
| GET/POST | `/api/customers` | `?search=`, `?status=due` or `overdue` |
| GET/PATCH/DELETE | `/api/customers/:id` | DELETE archives |
| GET/POST | `/api/transactions` | `?page=&limit=&type=&search=&from=&to=`; credits take `dueDate` |
| GET | `/api/transactions/customer/:customerId` | History + summary |
| GET | `/api/dashboard/stats`, `/api/dashboard/aging` | Totals; overdue buckets |
| GET | `/api/ai/dashboard-insights` | |
| GET | `/api/health`, `/api/health/ready` | Liveness / readiness |

## Roadmap

- **Phase 0 (done):** security, error handling, tests, Docker, CI
- **Phase 1 (done):** Bangla + English UI, installable PWA, phone + OTP login, due dates and aging
- **Phase 2:** automatic SMS/WhatsApp reminders, daily collection list, shareable customer statement
- **Phase 3:** AI risk score and credit-limit suggestions per customer
- **Phase 4:** subscriptions, multiple shops and staff, reports
