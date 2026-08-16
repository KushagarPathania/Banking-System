import React, { useState } from "react";
import { api, newIdempotencyKey } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";

const inputClass =
  "w-full rounded border border-rule-strong bg-white px-3 py-2.5 font-mono text-sm text-ink outline-none transition focus:border-brass focus:ring-4 focus:ring-brass-bg";

export default function TransferForm({ accounts, onAddPendingRow, onSettleRow, onRefreshAccounts }) {
  const [fromAccount, setFromAccount] = useState(accounts[0]?._id || "");
  const [toAccount, setToAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // keep the "from" select in sync once accounts load in
  React.useEffect(() => {
    if (!fromAccount && accounts[0]) setFromAccount(accounts[0]._id);
  }, [accounts, fromAccount]);

  const showToast = useToast();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const key = newIdempotencyKey();
    const amt = Number(amount);

    setBusy(true);
    onAddPendingRow({ key, fromAccount, toAccount: toAccount.trim(), amount: amt });

    try {
      const { transaction } = await api.createTransfer(fromAccount, toAccount.trim(), amt, key);
      onSettleRow(key, transaction.status, true);
      showToast("Transfer completed", "success");
      setToAccount("");
      setAmount("");
      onRefreshAccounts();
    } catch (err) {
      setError(err.message);
      onSettleRow(key, null, false); // false => remove the pending row
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded border border-rule-strong bg-paper-raised p-7 shadow-card">
      <h3 className="text-lg">Transfer between accounts</h3>
      <p className="mt-1 text-sm text-ink-soft">Sends money from one of your accounts to any account ID.</p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink-soft">
          <span>From account</span>
          <select
            required
            className={inputClass}
            value={fromAccount}
            onChange={(e) => setFromAccount(e.target.value)}
          >
            {accounts.map((acc) => (
              <option key={acc._id} value={acc._id}>
                {acc._id.slice(-8)} · {acc.status} · {acc.currency}
              </option>
            ))}
          </select>
        </label>

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
            placeholder="500"
            className={inputClass}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>

        <button
          type="submit"
          disabled={busy || !fromAccount}
          className="w-full rounded bg-ink py-2.5 text-sm font-semibold text-paper-raised transition hover:bg-[#0f1922] disabled:cursor-progress disabled:opacity-60"
        >
          {busy ? "Posting to ledger…" : "Send transfer"}
        </button>

        {busy && (
          <p className="text-[0.82rem] text-ink-soft">
            The ledger writes a debit entry, then a credit entry — this takes about 15 seconds by design.
          </p>
        )}
        {error && <p className="text-sm text-debit">{error}</p>}
      </form>
    </div>
  );
}
