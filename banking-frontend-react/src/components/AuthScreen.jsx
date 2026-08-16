import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { API_BASE_URL } from "../api/client.js";

const inputClass =
  "w-full rounded border border-rule-strong bg-white px-3 py-2.5 font-mono text-sm text-ink outline-none transition focus:border-brass focus:ring-4 focus:ring-brass-bg";

export default function AuthScreen() {
  const [tab, setTab] = useState("login");
  const [apiWarning, setApiWarning] = useState("");
  const { login, register } = useAuth();
  const showToast = useToast();

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

  const [regForm, setRegForm] = useState({ name: "", email: "", password: "" });
  const [regError, setRegError] = useState("");
  const [regBusy, setRegBusy] = useState(false);

  useEffect(() => {
    // Ping so students see immediately if the backend / CORS isn't set up,
    // instead of a confusing failure on first submit.
    fetch(API_BASE_URL.replace("/api", ""), { mode: "no-cors" }).catch(() =>
      setApiWarning(`Can't reach ${API_BASE_URL} yet — start the backend and enable CORS (see README).`)
    );
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError("");
    setLoginBusy(true);
    try {
      await login(loginForm.email, loginForm.password);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginBusy(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setRegError("");
    setRegBusy(true);
    try {
      const user = await register(regForm.name, regForm.email, regForm.password);
      showToast(`Welcome, ${user.name}. A confirmation email is on its way.`, "success");
    } catch (err) {
      setRegError(err.message);
    } finally {
      setRegBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-[420px]">
        <div className="mb-7 flex items-center gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-xl font-semibold text-paper-raised">
            ₹
          </span>
          <div>
            <h1 className="text-2xl tracking-tight">Ledger</h1>
            <p className="mt-0.5 font-display text-sm italic text-ink-soft">A passbook for your money</p>
          </div>
        </div>

        <div className="rounded border border-rule-strong bg-paper-raised px-7 pb-7 pt-2 shadow-card">
          <div className="-mx-7 mb-6 flex border-b border-rule px-7">
            <button
              type="button"
              onClick={() => setTab("login")}
              className={`mr-6 border-b-2 py-3.5 text-sm font-semibold ${
                tab === "login" ? "border-brass text-ink" : "border-transparent text-ink-faint"
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => setTab("register")}
              className={`border-b-2 py-3.5 text-sm font-semibold ${
                tab === "register" ? "border-brass text-ink" : "border-transparent text-ink-faint"
              }`}
            >
              Open an account
            </button>
          </div>

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-soft">
                <span>Email</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="ada@example.com"
                  className={inputClass}
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-soft">
                <span>Password</span>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={inputClass}
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                />
              </label>
              <button
                type="submit"
                disabled={loginBusy}
                className="w-full rounded bg-ink py-2.5 text-sm font-semibold text-paper-raised transition hover:bg-[#0f1922] disabled:cursor-progress disabled:opacity-60"
              >
                {loginBusy ? "Logging in…" : "Log in"}
              </button>
              {loginError && <p className="text-sm text-debit">{loginError}</p>}
            </form>
          ) : (
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-soft">
                <span>Full name</span>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Ada Lovelace"
                  className={inputClass}
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-soft">
                <span>Email</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="ada@example.com"
                  className={inputClass}
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-soft">
                <span>Password</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  className={inputClass}
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                />
              </label>
              <button
                type="submit"
                disabled={regBusy}
                className="w-full rounded bg-ink py-2.5 text-sm font-semibold text-paper-raised transition hover:bg-[#0f1922] disabled:cursor-progress disabled:opacity-60"
              >
                {regBusy ? "Creating…" : "Create account"}
              </button>
              {regError && <p className="text-sm text-debit">{regError}</p>}
            </form>
          )}
        </div>

        {apiWarning && (
          <p className="mt-4 text-center font-mono text-xs text-ink-faint">{apiWarning}</p>
        )}
      </div>
    </div>
  );
}
