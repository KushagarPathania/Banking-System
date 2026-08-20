# Ledger — Full-Stack Banking System

A ledger-based banking system: Node.js/Express/MongoDB backend with double-entry transaction logic, paired with a React + Tailwind frontend. Built as a placement-prep portfolio project.

> **Backend repo:** https://github.com/KushagarPathania/Banking-System
> **Frontend:** included alongside this README (`banking-frontend-react/`)

---

## What this project demonstrates

- REST API design with JWT authentication (dual delivery: httpOnly cookie + Bearer header)
- Double-entry ledger accounting — balances are never stored directly, only derived from debit/credit entries
- MongoDB transactions (multi-document ACID writes) for money transfers
- Idempotency keys to make retried requests safe
- A React frontend built on Context API for auth/toast state, with optimistic UI for a deliberately slow write path

---

## Architecture

```
┌─────────────────────────┐        HTTP / JSON        ┌──────────────────────────┐
│   React + Tailwind        │ ─────────────────────────▶ │   Express REST API        │
│   (banking-frontend-      │   JWT: Authorization       │   (Banking-System)        │
│   react/, port 5173)       │   header + cookie          │   port 3000               │
└─────────────────────────┘ ◀───────────────────────── └──────────────┬───────────┘
                                    JSON responses                     │
                                                                        ▼
                                                             ┌────────────────────┐
                                                             │   MongoDB            │
                                                             │   (replica set —     │
                                                             │   required for        │
                                                             │   transactions)        │
                                                             └────────────────────┘
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose), replica set (for multi-document transactions) |
| Auth | JWT (jsonwebtoken), bcrypt for password hashing |
| Email | Gmail OAuth2 (registration confirmation) |

---

## Project structure

```
project-root/
├── Banking-System/              # backend (separate repo)
│   ├── server.js
│   ├── src/
│   │   ├── app.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── account.controller.js
│   │   │   └── transaction.controller.js
│   │   ├── models/
│   │   │   ├── user.model.js
│   │   │   ├── account.model.js
│   │   │   └── transaction.model.js
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── db/db.js
│   └── .env                     # not committed — see Environment Variables below
│
└── banking-frontend-react/      # frontend
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx
        ├── api/client.js         # one function per backend endpoint
        ├── context/               # AuthContext, ToastContext
        ├── components/            # AuthScreen, Dashboard, TransferForm, etc.
        └── utils/format.js
```

---

## API reference

All routes are prefixed with `/api`.

### Auth

| Method | Route | Body | Response |
|---|---|---|---|
| POST | `/auth/register` | `{ name, email, password }` | `201` → `{ user, token }` |
| POST | `/auth/login` | `{ email, password }` | `201` → `{ user, token }` |
| POST | `/auth/logout` | — (auth required) | `200` → `{ message }` |

### Accounts (all require `Authorization: Bearer <token>`)

| Method | Route | Body | Response |
|---|---|---|---|
| POST | `/accounts` | — | `201` → `{ account }` |
| GET | `/accounts` | — | `200` → `{ accounts }` |
| GET | `/accounts/balance/:accountId` | — | `200` → `{ accountId, balance }` |

### Transactions (all require `Authorization: Bearer <token>`)

| Method | Route | Body | Response |
|---|---|---|---|
| POST | `/transactions` | `{ fromAccount, toAccount, amount, idempotencyKey }` | `201` → `{ message, transaction }` |
| POST | `/transactions/system/initial-funds` | `{ toAccount, amount, idempotencyKey }` | `201` → `{ message, transaction }` — **system users only** |

---

## Key design decisions (worth knowing cold for interviews)

- **Balance is never stored.** `Account.getBalance()` sums the ledger (`totalCredit − totalDebit`) live on every request. The frontend fetches `/accounts/balance/:id` per account rather than trusting a stored field — this avoids balance drift if a write ever fails halfway.
- **Transfers are deliberately slow (~15s).** `createTransaction` writes the debit entry, waits, then writes the credit entry — simulating a real settlement window. The frontend shows an optimistic "PENDING" row immediately and only confirms it once the response returns, rolling it back on failure.
- **Idempotency keys prevent duplicate transfers.** The client generates a UUID per submission; retrying a dropped request with the same key won't double-charge.
- **`systemUser` is immutable and hidden.** It's `immutable: true` and `select: false` on the `User` schema, so it can only ever be set directly in MongoDB, never through the API — the "fund account" feature is intentionally gated this way rather than checked in application code.
- **JWT delivery is dual-mode.** The backend sets both an httpOnly cookie and returns the token in the response body, so a client can use either `credentials: 'include'` or an `Authorization` header. The current frontend uses the header (stored in `localStorage`) for simplicity — a hardening step would be to drop `localStorage` and rely on the cookie alone.

---

## Running locally

### 1. Backend

```bash
cd Banking-System
npm install
npm install cors   # not in the repo by default — needed for the frontend to call it
```

Create `Banking-System/.env`:

```
MONGO_URL=mongodb://127.0.0.1:27017/banking-system?replicaSet=rs0
JWT_SECRET=your-secret-here
EMAIL_USER=...
CLIENT_ID=...
CLIENT_SECRET=...
REFRESH_TOKEN=...
```

Add CORS in `src/app.js`:

```js
const cors = require('cors');
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
```

MongoDB must run as a replica set (transfers use multi-document transactions):

```bash
mongod --replSet rs0 --dbpath <your-db-path>
# in a separate terminal, once:
mongosh --eval "rs.initiate()"
```

Start the backend:

```bash
node server.js
# → Server is running on port 3000
```

### 2. Frontend

```bash
cd banking-frontend-react
npm install
npm run dev
# → Local: http://localhost:5173
```

Open the printed URL, register a user, open an account, and try a transfer.

---

## Environment variables

| Variable | Used by | Required |
|---|---|---|
| `MONGO_URL` | backend DB connection | Yes |
| `JWT_SECRET` | signing auth tokens | Yes |
| `EMAIL_USER`, `CLIENT_ID`, `CLIENT_SECRET`, `REFRESH_TOKEN` | registration confirmation email (Gmail OAuth2) | No — fails silently if missing |

---

## Known limitations / possible next steps

- No transaction history endpoint — the frontend's "recent activity" is session-only, not persisted history from the DB. Adding `GET /api/transactions` would be a natural next feature.
- No pagination on `/accounts` or any list endpoint.
- No refresh-token flow — JWTs are long-lived rather than rotated.
- No automated tests (unit or integration) in either repo yet.
- Frontend stores the JWT in `localStorage`; moving to cookie-only auth would reduce XSS exposure.

---

## License

Add your license of choice here (MIT is a common default for portfolio projects).