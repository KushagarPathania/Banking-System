import React from "react";
import { useToast } from "../context/ToastContext.jsx";
import { formatInr } from "../utils/format.js";

export default function AccountCard({ account }) {
  const showToast = useToast();
  const isFrozenLike = account.status === "FROZEN" || account.status === "CLOSED";

  function copyId() {
    navigator.clipboard?.writeText(account._id);
    showToast("Account ID copied", "success");
  }

  return (
    <div className="relative rounded border border-rule-strong bg-paper-raised p-[18px] shadow-card">
      <span
        className={`inline-block rounded-full px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide ${
          isFrozenLike ? "bg-debit-bg text-debit" : "bg-credit-bg text-credit"
        }`}
      >
        {account.status}
      </span>

      <div className="num mt-2.5 mb-1.5 font-mono text-2xl font-semibold">
        {account.balance === null ? "—" : formatInr(account.balance)}
      </div>

      <div className="break-all font-mono text-[0.72rem] text-ink-faint">{account._id}</div>

      <button
        type="button"
        onClick={copyId}
        className="mt-3 text-[0.78rem] font-semibold text-brass hover:text-brass-hover"
      >
        Copy account ID
      </button>
    </div>
  );
}
