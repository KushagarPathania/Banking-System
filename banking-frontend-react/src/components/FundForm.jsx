import React, { useState } from "react";
import { api, newIdempotencyKey } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";

const inputClass =
  "w-full rounded border border-rule-strong bg-white px-3 py-2.5 font-mono text-sm text-ink outline-none transition focus:border-brass focus:ring-4 focus:ring-brass-bg";

export default function FundForm({ onAddSettledRow, onRefreshAccounts }) {
  const [toAccount, setToAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const showToast = useToast();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const key = newIdempotencyKey();

    setBusy(true);
    try {
      const { transaction } = await api.fundAccount(toAccount.trim(), Number(amount), key);
      onAddSettledRow(transaction);
      showToast("Account funded", "success");
      setToAccount("");
      setAmount("");
      onRefreshAccounts();
    } catch (err) {
      // Expected for any non-system-user account — the backend's User.systemUser
      // flag can only be set directly in MongoDB, never through the API.
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded border border-rule-strong bg-[#F1EEE3] p-7 shadow-card">
      <h3 className="text-lg">Fund an account</h3>
      <p className="mt-1 text-sm text-ink-soft">
        System-user only. Seeds an account with initial funds from the system account.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-soft">
          <span>To account ID</span>
          <input
            type="text"
            required
            placeholder="Destination account _id"
            className={inputClass}
            value={toAccount}
            onChange={(e) => setToAccount(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-soft">
          <span>Amount (₹)</span>
          <input
            type="number"
            required
            min="1"
            step="0.01"
            placeholder="1000"
            className={inputClass}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded bg-brass py-2.5 text-sm font-semibold text-white transition hover:bg-brass-hover disabled:cursor-progress disabled:opacity-60"
        >
          {busy ? "Funding…" : "Fund account"}
        </button>

        {error && <p className="text-sm text-debit">{error}</p>}
      </form>
    </div>
  );
}
