# Ledger — Full-Stack Banking & Transaction System

A full-stack banking application built with **React, Tailwind CSS, Node.js, Express.js, and MongoDB**, designed around a ledger-based transaction architecture.

The system demonstrates secure authentication, double-entry ledger accounting, atomic money transfers, idempotent transaction processing, and a responsive React frontend.

> **Portfolio and placement-preparation project focused on backend engineering, financial transaction processing, database consistency, and full-stack development.**

---

## Features

### Authentication & Security

- User registration and login using **JWT authentication**
- JWT support through:
  - `httpOnly` cookies
  - `Authorization: Bearer <token>` header
- Password hashing using **bcrypt**
- Protected account and transaction routes
- Logout support
- System-only operations protected using a dedicated `systemUser` flag

### Account Management

- Create bank accounts for authenticated users
- Retrieve accounts belonging to the logged-in user
- Calculate account balances directly from ledger entries
- Support for account-to-account fund transfers

### Double-Entry Ledger

The application does not store account balances directly.

Instead, balances are derived from debit and credit ledger entries:

```text
Balance = Total Credits - Total Debits
```

For a transfer:

```text
Sender Account
      |
      | Debit
      v
   Ledger
      |
      | Credit
      v
Receiver Account
```

The ledger acts as the source of truth for account balances and transaction activity.

### Reliable Money Transfers

- MongoDB multi-document transactions
- ACID transaction handling
- Atomic debit and credit operations
- Idempotency keys to prevent duplicate transfers
- Transaction rollback when an operation fails
- Simulated settlement delay for demonstrating asynchronous transaction states

### React Frontend

- React 18
- Vite
- Tailwind CSS
- React Context API
- Authentication state management
- Toast/notification state management
- Optimistic UI for transaction requests
- Pending transaction state
- Rollback handling when a transaction fails
- Responsive banking interface

---

# Architecture

```text
                         HTTP / JSON
┌───────────────────────────────┐
│                               │
│       React + Tailwind        │
│                               │
│  ┌─────────────────────────┐  │
│  │ Authentication Context  │  │
│  ├─────────────────────────┤  │
│  │ Toast / UI Context      │  │
│  ├─────────────────────────┤  │
│  │ Dashboard               │  │
│  ├─────────────────────────┤  │
│  │ Account Management      │  │
│  ├─────────────────────────┤  │
│  │ Transfer Interface      │  │
│  └─────────────────────────┘  │
│                               │
└───────────────┬───────────────┘
                │
                │ REST API
                │ JWT
                ▼
┌───────────────────────────────┐
│                               │
│       Node.js + Express       │
│                               │
│  ┌─────────────────────────┐  │
│  │ Authentication          │  │
│  ├─────────────────────────┤  │
│  │ Account Management      │  │
│  ├─────────────────────────┤  │
│  │ Transaction Processing  │  │
│  ├─────────────────────────┤  │
│  │ JWT Middleware          │  │
│  └─────────────────────────┘  │
│                               │
└───────────────┬───────────────┘
                │
                │ Mongoose
                ▼
┌───────────────────────────────┐
│            MongoDB            │
│                               │
│  Users                        │
│  Accounts                     │
│  Ledger / Transactions        │
│                               │
│  Multi-document ACID          │
│  transactions require         │
│  a replica set                │
│                               │
└───────────────────────────────┘
```

---

# Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| State Management | React Context API |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcrypt |
| API | REST |
| Email | Gmail OAuth2 |
| Development | Git, GitHub, VS Code, Postman |

---

# Project Structure

```text
Banking-System/
│
├── backend/
│   │
│   ├── server.js
│   │
│   └── src/
│       ├── app.js
│       │
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── account.controller.js
│       │   └── transaction.controller.js
│       │
│       ├── models/
│       │   ├── user.model.js
│       │   ├── account.model.js
│       │   └── transaction.model.js
│       │
│       ├── routes/
│       │
│       ├── middleware/
│       │
│       └── db/
│           └── db.js
│
└── banking-frontend-react/
    │
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    │
    └── src/
        ├── App.jsx
        │
        ├── api/
        │   └── client.js
        │
        ├── context/
        │   ├── AuthContext.jsx
        │   └── ToastContext.jsx
        │
        ├── components/
        │   ├── AuthScreen
        │   ├── Dashboard
        │   ├── TransferForm
        │   └── ...
        │
        └── utils/
            └── format.js
```

---

# API Reference

All API routes are prefixed with:

```text
/api
```

## Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Authenticate an existing user |
| POST | `/auth/logout` | Logout authenticated user |

### Register

```http
POST /api/auth/register
```

Request:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password"
}
```

---

## Accounts

All account endpoints require authentication.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/accounts` | Create an account |
| GET | `/accounts` | Get authenticated user's accounts |
| GET | `/accounts/balance/:accountId` | Calculate account balance |

Example:

```http
GET /api/accounts
Authorization: Bearer <token>
```

---

## Transactions

All transaction endpoints require authentication.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/transactions` | Transfer funds |
| POST | `/transactions/system/initial-funds` | Add initial funds |

### Transfer

```http
POST /api/transactions
```

Request:

```json
{
  "fromAccount": "ACCOUNT_ID",
  "toAccount": "ACCOUNT_ID",
  "amount": 1000,
  "idempotencyKey": "unique-request-id"
}
```

The `idempotencyKey` ensures that retrying the same request does not create a duplicate transfer.

---

# Transaction Processing

A normal transfer follows this flow:

```text
Client
  │
  │ POST /transactions
  ▼
Validate Request
  │
  ▼
Check Authentication
  │
  ▼
Validate Accounts
  │
  ▼
Check Idempotency Key
  │
  ▼
Start MongoDB Transaction
  │
  ├───────────────────┐
  │                   │
  ▼                   ▼
Debit Sender      Credit Receiver
  │                   │
  └─────────┬─────────┘
            │
            ▼
     Commit Transaction
            │
            ▼
       API Response
```

If an operation fails before the transaction is committed, MongoDB rolls back the changes.

This prevents a partial transfer where the sender is debited but the receiver is not credited.

---

# Ledger-Based Balance

A major design decision is that account balances are **derived rather than directly stored**.

For example:

```text
Credits:
+ ₹10,000
+ ₹2,000

Debits:
- ₹3,000
- ₹1,000

----------------
Balance = ₹8,000
```

The balance is calculated as:

```text
Balance = Total Credits - Total Debits
```

This makes the ledger the source of truth for account activity.

---

# Idempotency

Financial APIs must safely handle request retries.

For example:

```text
Client
   │
   │ Transfer ₹500
   ▼
Server processes request
   │
   X Network failure
   │
Client retries request
   │
   ▼
Same idempotency key
   │
   ▼
Existing request detected
   │
   ▼
No duplicate transfer
```

The frontend generates a unique UUID for each transfer request.

If the same request is retried using the same idempotency key, the backend prevents the transfer from being processed twice.

---

# Optimistic UI

The frontend intentionally simulates a slow transaction/settlement path.

When a transfer is submitted:

```text
User submits transfer
        │
        ▼
Frontend immediately shows
      PENDING
        │
        ▼
Backend processes transaction
        │
        ├───────────────┐
        │               │
     Success          Failure
        │               │
        ▼               ▼
   Confirm UI       Rollback UI
```

This demonstrates how a frontend can remain responsive while waiting for a long-running backend operation.

---

# Authentication Design

The backend supports JWT authentication through:

```text
1. httpOnly Cookie
2. Authorization Header
```

The current frontend uses the Bearer token approach:

```http
Authorization: Bearer <JWT>
```

Passwords are never stored directly. They are hashed using:

```text
bcrypt
```

The frontend currently stores the JWT in `localStorage` for simplicity.

A future security improvement would be to move the frontend completely to cookie-only authentication to reduce exposure to XSS-based token theft.

---

# System User

Initial account funding is restricted to a system-level user.

The `systemUser` property is:

- Immutable
- Hidden from normal queries
- Not exposed as a normal API-controlled field

This prevents ordinary users from modifying their own system privileges through the API.

---

# Running Locally

## Prerequisites

Install the following:

- Node.js
- npm
- MongoDB
- MongoDB Shell (`mongosh`)

MongoDB must run as a **replica set** because the application uses multi-document transactions.

---

## 1. Clone the Repository

```bash
git clone https://github.com/KushagarPathania/Banking-System.git

cd Banking-System
```

---

## 2. Start the Backend

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

If CORS is not already included:

```bash
npm install cors
```

Create a `.env` file:

```env
MONGO_URL=mongodb://127.0.0.1:27017/banking-system?replicaSet=rs0

JWT_SECRET=your-secret-here

EMAIL_USER=your-email
CLIENT_ID=your-client-id
CLIENT_SECRET=your-client-secret
REFRESH_TOKEN=your-refresh-token
```

Never commit `.env` to GitHub.

---

## 3. Configure MongoDB Replica Set

Start MongoDB with replica-set support:

```bash
mongod --replSet rs0 --dbpath <your-db-path>
```

In another terminal:

```bash
mongosh --eval "rs.initiate()"
```

Verify the replica set:

```bash
mongosh
```

Then:

```javascript
rs.status()
```

The replica set is required because MongoDB multi-document transactions are used for fund transfers.

---

## 4. Start the Backend

From the backend directory:

```bash
node server.js
```

The backend should run on:

```text
http://localhost:3000
```

---

## 5. Start the Frontend

Open another terminal:

```bash
cd banking-frontend-react
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend should be available at:

```text
http://localhost:5173
```

---

# Environment Variables

| Variable | Purpose | Required |
|---|---|---|
| `MONGO_URL` | MongoDB connection | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `EMAIL_USER` | Gmail account for notifications | No |
| `CLIENT_ID` | Gmail OAuth2 client ID | No |
| `CLIENT_SECRET` | Gmail OAuth2 client secret | No |
| `REFRESH_TOKEN` | Gmail OAuth2 refresh token | No |

Email configuration is optional.

Never expose or commit secrets, API keys, OAuth credentials, JWT secrets, or `.env` files to the repository.

---

# Security Considerations

This project demonstrates several security and reliability concepts:

- Password hashing with bcrypt
- JWT-based authentication
- Protected API routes
- httpOnly cookie support
- Authorization headers
- Idempotent financial operations
- Atomic database transactions
- Immutable ledger entries
- Restricted system operations
- Environment-based secret configuration

The project is intended for **learning and portfolio purposes** and should not be considered production-ready banking software.

---

# Known Limitations

The current implementation has several areas that can be improved:

- No persistent transaction-history API for the frontend
- No pagination for account/list endpoints
- No refresh-token rotation
- Frontend currently stores JWT in `localStorage`
- No automated unit/integration test suite
- Transfer delay is simulated rather than representing a real settlement system
- No production deployment configuration
- No API rate limiting
- No advanced fraud detection or monitoring

---

# Future Improvements

- [ ] Add persistent transaction-history API
- [ ] Add pagination and filtering
- [ ] Add automated unit and integration tests
- [ ] Add refresh-token rotation
- [ ] Move frontend authentication to cookie-only JWT handling
- [ ] Add API rate limiting
- [ ] Add request validation
- [ ] Add structured logging
- [ ] Add transaction monitoring
- [ ] Add Docker support
- [ ] Add CI/CD with GitHub Actions
- [ ] Deploy frontend and backend
- [ ] Add role-based access control
- [ ] Add transaction search and filtering

---

# What This Project Demonstrates

### Backend Engineering

- REST API design
- Authentication and authorization
- Transaction processing
- Middleware
- Error handling
- API design

### Database Engineering

- MongoDB
- Mongoose
- Multi-document ACID transactions
- Ledger-based accounting
- Data consistency

### Financial-System Concepts

- Double-entry ledger
- Debit/credit accounting
- Idempotency
- Atomic fund transfers
- Transaction rollback

### Frontend Engineering

- React
- Context API
- Tailwind CSS
- Responsive UI
- Optimistic updates
- Asynchronous API handling

### Software Reliability

- Duplicate-request prevention
- Atomic writes
- Failure rollback
- Consistent transaction state

---

# Author

**Kushagar Pathania**

B.E. Computer Engineering  
Thapar Institute of Engineering & Technology

GitHub: [KushagarPathania](https://github.com/KushagarPathania)

Project Repository: [Ledger — Full-Stack Banking & Transaction System](https://github.com/KushagarPathania/Banking-System)