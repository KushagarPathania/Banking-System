# Banking System API

A Node.js and MongoDB banking API for user authentication, account creation, and ledger-backed account-to-account transfers. Transfers use an idempotency key and create immutable debit and credit ledger entries.

## Features

- Register and log in users with JWT authentication
- Create INR accounts for authenticated users
- Transfer funds between active accounts
- Calculate balances from immutable ledger entries
- Prevent duplicate transfers with idempotency keys
- Send registration and successful-transfer emails through Gmail OAuth2

## Requirements

- Node.js
- MongoDB configured as a replica set (MongoDB transactions require this)
- A Gmail OAuth2 configuration if email notifications are enabled

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root:

   ```env
   MONGO_URL=mongodb://127.0.0.1:27017/banking-system?replicaSet=rs0
   JWT_SECRET=replace-with-a-long-random-secret

   EMAIL_USER=your-gmail-address@gmail.com
   CLIENT_ID=your-google-oauth-client-id
   CLIENT_SECRET=your-google-oauth-client-secret
   REFRESH_TOKEN=your-google-oauth-refresh-token
   ```

3. Start the API:

   ```bash
   node server.js
   ```

   The server listens on `http://localhost:3000`.

## Authentication

Registration and login return a JWT and also set it in a `token` cookie. For protected endpoints, send either the cookie or an authorization header:

```http
Authorization: Bearer <token>
```

## API

### Register a user

`POST /api/auth/register`

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "secure-password"
}
```

Returns the new user's public fields and a JWT. A welcome email is sent after the response is created.

### Log in

`POST /api/auth/login`

```json
{
  "email": "ada@example.com",
  "password": "secure-password"
}
```

Returns the user's public fields and a JWT.

### Create an account

`POST /api/accounts`

Authentication required. Creates an active INR account for the current user.

```bash
curl -X POST http://localhost:3000/api/accounts \
  -H "Authorization: Bearer <token>"
```

### Create a transfer

`POST /api/transactions`

Authentication required. Both accounts must exist and be `ACTIVE`; the source account must have sufficient ledger-derived balance.

```json
{
  "fromAccount": "<source-account-id>",
  "toAccount": "<destination-account-id>",
  "amount": 500,
  "idempotencyKey": "transfer-2026-08-07-001"
}
```

A successful request creates one `DEBIT` ledger entry for the source account and one `CREDIT` entry for the destination account. Reusing the same idempotency key returns the existing transfer result instead of creating another transfer.

## Data model

| Model | Purpose |
| --- | --- |
| `User` | User identity, email, and bcrypt-hashed password |
| `Account` | User-owned account with `ACTIVE`, `FROZEN`, or `CLOSED` status |
| `Transaction` | Transfer record with source/destination accounts, amount, status, and idempotency key |
| `Ledger` | Immutable `DEBIT` and `CREDIT` entries used to calculate balances |

## Notes

- Account currency defaults to `INR`.
- There is no initial-funding endpoint; newly created accounts have a zero balance.
- **Current transfer caveat:** the controller saves successful transfers with status `COMPLETED`, while the transaction schema only permits `SUCCESS`, `FAILED`, `PENDING`, and `REVERSED`. Align these values before using transfers in a running environment.
- The project currently has no automated test suite or npm start script; run it with `node server.js`.
- Keep `.env` out of version control. It contains database, JWT, and email credentials.
