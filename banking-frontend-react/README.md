# Ledger — React + Tailwind frontend for Banking-System

A Vite + React + Tailwind frontend for [Banking-System](https://github.com/KushagarPathania/Banking-System). Built as a real project (multiple files, context providers, components), not one giant component.

## What it covers

| Screen | Backend endpoint(s) |
|---|---|
| Register / log in / log out | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout` |
| Account list + live balances | `POST /api/accounts`, `GET /api/accounts`, `GET /api/accounts/balance/:accountId` |
| Transfer between accounts | `POST /api/transactions` |
| Fund an account (system user) | `POST /api/transactions/system/initial-funds` |

Notes tied to how your backend actually behaves — this is the part that's easy to get wrong if you build against the README alone instead of the controller code:

- **Balances aren't stored.** `Account.getBalance()` aggregates the ledger (`totalCredit − totalDebit`) on every call, so `Dashboard.jsx` fetches `/accounts/balance/:id` once per account after listing them, rather than expecting a `balance` field on the account object.
- **Transfers take ~15 seconds.** `createTransaction` in `transaction.controller.js` has a real `setTimeout` between writing the debit ledger entry and the credit one. `TransferForm.jsx` inserts an optimistic "PENDING" row immediately and only turns it green once the response actually comes back — it doesn't fake a fast success.
- **Idempotency keys are generated client-side** (`crypto.randomUUID()`) on every submit in `api/client.js`, so retrying after a dropped connection won't create a duplicate transfer.
- **"Fund an account" only works for a `systemUser: true` user.** That field is `immutable` and `select: false` on the `User` schema — it can never be set through the API, only directly in MongoDB for a seed/admin account. Every other user will see the backend's real error message surfaced in `FundForm.jsx`, which is the correct behavior, not a bug.
- **There's no list-transactions endpoint.** The "Recent activity" table (`LedgerTable.jsx`) is in-memory React state — it shows transfers made during this browser session only, not history pulled from the database.

## Project structure

```
banking-frontend-react/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── api/
    │   └── client.js          # one function per backend endpoint
    ├── context/
    │   ├── AuthContext.jsx    # user/token state, login/register/logout
    │   └── ToastContext.jsx   # global toast notifications
    ├── components/
    │   ├── AuthScreen.jsx
    │   ├── Dashboard.jsx
    │   ├── AccountCard.jsx
    │   ├── TransferForm.jsx
    │   ├── FundForm.jsx
    │   └── LedgerTable.jsx
    └── utils/
        └── format.js
```

## 1. Enable CORS on the backend

Your `src/app.js` doesn't allow cross-origin requests yet, so the browser will block every call from `localhost:5173` (Vite's default port) until you add this:

```bash
npm install cors
```

```js
// src/app.js
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

## 2. Run the backend

```bash
node server.js   # listens on http://localhost:3000
```

Requires MongoDB running as a replica set (the transfer logic uses MongoDB transactions) and a valid `.env` — see the backend's own README for details.

## 3. Install and run this frontend

```bash
npm install
npm run dev
```

Vite will print a local URL, typically `http://localhost:5173`. Open it — that's the one you should register with.

## 4. Point it at a different API URL (optional)

If your backend isn't on `http://localhost:3000`, edit the one constant near the top of `src/api/client.js`:

```js
export const API_BASE_URL = "http://localhost:3000/api";
```

## Building for production

```bash
npm run build     # outputs to dist/
npm run preview   # serve the production build locally to sanity-check it
```

## For your placement prep

Things worth being able to speak to if this comes up in an interview:

- **Why context over prop-drilling here**: `AuthContext` and `ToastContext` hold state genuinely needed by many unrelated components (every form needs `showToast`; the whole app needs `user`). Everything else (`accounts`, `ledgerRows`) is lifted only as far as `Dashboard.jsx`, since it's only needed by its direct children — a common interview question is "when do you reach for context vs. lifting state," and this file split is a real example either way.
- **Optimistic UI with rollback**: `TransferForm.jsx` inserts a pending row before the 15s response returns, and removes it (`onSettleRow(key, null, false)`) if the request fails — worth explaining why that's safer than just disabling the button and waiting.
- **JWT in localStorage vs. httpOnly cookie**: the backend actually sets both. This frontend reads the token from `localStorage` for simplicity, which is vulnerable to XSS in a way a cookie-only flow isn't — a stronger version would drop `localStorage` entirely and rely on `credentials: 'include'` with the cookie.
- **Idempotency keys**: why the client generates one per request, and how the server uses it (`transaction.controller.js`) to make retries safe rather than creating duplicate transfers.
