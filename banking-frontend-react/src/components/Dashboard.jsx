import React, { useCallback, useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import AccountCard from "./AccountCard.jsx";
import TransferForm from "./TransferForm.jsx";
import FundForm from "./FundForm.jsx";
import LedgerTable from "./LedgerTable.jsx";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const showToast = useToast();

  const [accounts, setAccounts] = useState([]);
  const [accountsError, setAccountsError] = useState("");
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [ledgerRows, setLedgerRows] = useState([]);

  const refreshAccounts = useCallback(async () => {
    setAccountsError("");
    try {
      const { accounts: list } = await api.listAccounts();

      // Balances aren't stored on the account — they're derived from the
      // ledger — so fetch each one individually, same as the backend does.
      const withBalances = await Promise.all(
        list.map(async (acc) => {
          try {
            const { balance } = await api.getAccountBalance(acc._id);
            return { ...acc, balance };
          } catch {
            return { ...acc, balance: null };
          }
        })
      );

      setAccounts(withBalances);
    } catch (err) {
      setAccountsError(err.message);
    }
  }, []);

  useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);

  async function handleCreateAccount() {
    setCreatingAccount(true);
    try {
      await api.createAccount();
      showToast("New account opened", "success");
      await refreshAccounts();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setCreatingAccount(false);
    }
  }

  function addPendingRow({ key, fromAccount, toAccount, amount }) {
    setLedgerRows((rows) => [
      { key, fromAccount, toAccount, amount, status: "PENDING", time: new Date().toLocaleTimeString() },
      ...rows,
    ]);
  }

  function settleRow(key, status, keep) {
    setLedgerRows((rows) => {
      if (!keep) return rows.filter((r) => r.key !== key);
      return rows.map((r) => (r.key === key ? { ...r, status } : r));
    });
  }

  function addSettledRow(transaction) {
    setLedgerRows((rows) => [
      {
        key: transaction._id || String(Date.now()),
        fromAccount: transaction.fromAccount,
        toAccount: transaction.toAccount,
        amount: transaction.amount,
        status: transaction.status,
        time: new Date().toLocaleTimeString(),
      },
      ...rows,
    ]);
  }

  return (
    <div>
      <header className="flex items-center justify-between border-b border-rule-strong bg-paper-raised px-10 py-[18px]">
        <div className="flex items-center gap-2.5">
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-ink font-mono text-base font-semibold text-paper-raised">
            ₹
          </span>
          <h1 className="text-xl">Ledger</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-ink-soft">
            Signed in as <strong className="text-ink">{user.name}</strong>
          </span>
          <button
            type="button"
            onClick={logout}
            className="rounded border border-rule-strong px-4 py-2 text-sm font-semibold text-ink-soft transition hover:bg-rule hover:text-ink"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[980px] px-6 pb-20 pt-9">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl">Your accounts</h2>
            <p className="mt-1 text-ink-soft">Every balance below is derived live from the debit / credit ledger.</p>
          </div>
          <button
            type="button"
            onClick={handleCreateAccount}
            disabled={creatingAccount}
            className="rounded bg-ink px-4 py-2.5 text-sm font-semibold text-paper-raised transition hover:bg-[#0f1922] disabled:opacity-60"
          >
            {creatingAccount ? "Opening…" : "+ New account"}
          </button>
        </div>

        {accountsError && <p className="mb-3 text-sm text-debit">{accountsError}</p>}

        {accounts.length === 0 ? (
          <p className="py-8 text-center font-display italic text-ink-faint">
            No accounts yet — open one to get started.
          </p>
        ) : (
          <div className="mb-2 grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4">
            {accounts.map((acc) => (
              <AccountCard key={acc._id} account={acc} />
            ))}
          </div>
        )}

        <SectionDivider label="Move money" />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <TransferForm
            accounts={accounts}
            onAddPendingRow={addPendingRow}
            onSettleRow={settleRow}
            onRefreshAccounts={refreshAccounts}
          />
          <FundForm onAddSettledRow={addSettledRow} onRefreshAccounts={refreshAccounts} />
        </div>

        <SectionDivider label="Recent activity this session" />

        <LedgerTable rows={ledgerRows} />
      </main>
    </div>
  );
}

function SectionDivider({ label }) {
  return (
    <div className="my-9 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
      <span className="h-px flex-1 bg-rule-strong" />
      {label}
      <span className="h-px flex-1 bg-rule-strong" />
    </div>
  );
}
