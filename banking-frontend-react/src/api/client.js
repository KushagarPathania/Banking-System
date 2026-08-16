/**
 * client.js — thin wrapper around the Banking-System REST API.
 * Matches routes/response shapes exactly as implemented in:
 *   src/controllers/auth.controller.js
 *   src/controllers/account.controller.js
 *   src/controllers/transaction.controller.js
 *
 * The backend accepts the JWT either as a `token` cookie (set
 * automatically on login/register) or as `Authorization: Bearer <token>`.
 * We send both — the header explicitly, and the cookie via
 * credentials:'include' — so this works whether or not the backend's
 * CORS config is fully wired for cross-site cookies.
 */

export const API_BASE_URL = "http://localhost:3000/api";

const TOKEN_KEY = "bs_token";
const USER_KEY = "bs_user";

export const storage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (t) => localStorage.setItem(TOKEN_KEY, t),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),

  getUser: () => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  setUser: (u) => localStorage.setItem(USER_KEY, JSON.stringify(u)),
  clearUser: () => localStorage.removeItem(USER_KEY),
};

/**
 * Core request helper. Throws an Error whose .message is the backend's
 * `message` field when the response is not ok, so callers can render it
 * directly.
 */
async function request(path, { method = "GET", body } = {}) {
  const token = storage.getToken();

  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      credentials: "include",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(
      `Can't reach the API. Is the server running at ${API_BASE_URL}? (CORS must also be enabled — see README)`
    );
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // some responses (e.g. logout with no token) may have no body
  }

  if (!res.ok) {
    throw new Error((data && data.message) || `Request failed (${res.status})`);
  }

  return data;
}

export const api = {
  // ---- Auth ----
  register: (name, email, password) =>
    request("/auth/register", { method: "POST", body: { name, email, password } }),

  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password } }),

  logout: () => request("/auth/logout", { method: "POST" }),

  // ---- Accounts ----
  createAccount: () => request("/accounts", { method: "POST" }),

  listAccounts: () => request("/accounts", { method: "GET" }),

  getAccountBalance: (accountId) => request(`/accounts/balance/${accountId}`, { method: "GET" }),

  // ---- Transactions ----
  // Note: the backend deliberately sleeps ~15s mid-transfer, writing the
  // debit ledger entry, waiting, then the credit entry — see
  // transaction.controller.js. Callers must show a real pending state.
  createTransfer: (fromAccount, toAccount, amount, idempotencyKey) =>
    request("/transactions", {
      method: "POST",
      body: { fromAccount, toAccount, amount, idempotencyKey },
    }),

  // System-user only: the User.systemUser flag is `immutable` and
  // `select: false` in the backend's schema, so it can only be set
  // directly in MongoDB — not through any API call.
  fundAccount: (toAccount, amount, idempotencyKey) =>
    request("/transactions/system/initial-funds", {
      method: "POST",
      body: { toAccount, amount, idempotencyKey },
    }),
};

export function newIdempotencyKey() {
  if (window.crypto?.randomUUID) return crypto.randomUUID();
  return "key-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}
