# Banking System API

A Node.js, Express, and MongoDB API for user authentication, INR accounts, and ledger-backed transfers. Each transfer records immutable debit and credit ledger entries, and an idempotency key prevents duplicate requests.

## Features

- JWT authentication with cookie or `Authorization` header support
- User registration, login, and logout with token blacklisting
- INR account creation, account listing, and ledger-derived balances
- Account-to-account transfers with idempotency protection
- System-user-only endpoint for funding an account
- Gmail OAuth2 registration and successful-transfer email notifications

## Requirements

- Node.js
- MongoDB configured as a replica set; transfers use MongoDB transactions
- Gmail OAuth2 credentials to send email notifications

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

Registering or logging in returns a JWT and sets a `token` cookie. Protected endpoints accept that cookie or a bearer token:

```http
Authorization: Bearer <token>
```

## API

### Register

`POST /api/auth/register`

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "secure-password"
}
```

Returns `201` with the new user's public fields and a JWT. A registration email is sent after the response is prepared.

### Log in

`POST /api/auth/login`

```json
{
  "email": "ada@example.com",
  "password": "secure-password"
}
```

Returns `201` with the user's public fields and a JWT.

### Log out

`POST /api/auth/logout`

Authentication required. Blacklists the current token for three days and clears the `token` cookie.

### Create an account

`POST /api/accounts`

Authentication required. Creates an active INR account for the current user.

```bash
curl -X POST http://localhost:3000/api/accounts \
  -H "Authorization: Bearer <token>"
```

### List accounts

`GET /api/accounts`

Authentication required. Returns all accounts owned by the current user.

### Get an account balance

`GET /api/accounts/balance/:accountId`

Authentication required. Returns the current user's account balance, calculated as total credits minus total debits in the ledger.

### Create a transfer

`POST /api/transactions`

Authentication required. Both accounts must exist and have `ACTIVE` status. The source account must have sufficient ledger-derived funds.

```json
{
  "fromAccount": "<source-account-id>",
  "toAccount": "<destination-account-id>",
  "amount": 500,
  "idempotencyKey": "transfer-2026-08-07-001"
}
```

On success, the API creates one `DEBIT` entry for the source account and one `CREDIT` entry for the destination account. Repeating a completed request with the same idempotency key returns its existing transaction rather than creating a duplicate. Successful transfers trigger an email notification.

### Fund an account (system users only)

`POST /api/transactions/system/initial-funds`

Requires a token belonging to a user with `systemUser: true`. It moves funds from an account belonging to that system user to the destination account.

```json
{
  "toAccount": "<destination-account-id>",
  "amount": 1000,
  "idempotencyKey": "initial-funds-001"
}
```

## Data model

| Model | Purpose |
| --- | --- |
| `User` | User identity, email, bcrypt-hashed password, and optional system-user flag |
| `Account` | User-owned account with `ACTIVE`, `FROZEN`, or `CLOSED` status |
| `Transaction` | Transfer record with source/destination accounts, amount, status, and idempotency key |
| `Ledger` | Immutable `DEBIT` and `CREDIT` entries used to calculate balances |
| `TokenBlacklist` | Logged-out JWTs, automatically expired after three days |

## Notes

- New accounts start with a zero balance and default to `INR`.
- The app has no `npm start` script or automated test suite; use `node server.js` to run it.
- Email transport errors are logged by the service; provide valid Gmail OAuth2 credentials for notifications to be delivered.
- Keep `.env` out of version control because it contains database, JWT, and email credentials.
