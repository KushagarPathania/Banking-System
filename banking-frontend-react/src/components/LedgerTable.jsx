import React from "react";
import { formatInr, shortId } from "../utils/format.js";

const pillStyles = {
  SUCCESS: "bg-credit-bg text-credit",
  PENDING: "bg-brass-bg text-brass-hover",
  FAILED: "bg-debit-bg text-debit",
  REVERSED: "bg-debit-bg text-debit",
};

export default function LedgerTable({ rows }) {
  return (
    <div className="rounded border border-rule-strong bg-paper-raised p-7 shadow-card">
      <table className="w-full border-collapse font-mono text-[0.82rem]">
        <thead>
          <tr>
            {["Time", "From", "To", "Status", "Debit", "Credit"].map((h, i) => (
              <th
                key={h}
                className={`border-b border-rule-strong pb-2.5 font-sans text-[0.72rem] font-semibold uppercase tracking-wide text-ink-faint ${
                  i >= 4 ? "text-right" : "text-left"
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-[18px] text-center font-sans italic text-ink-faint">
                Transfers you make in this session will show up here.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.key} className="border-b border-dashed border-rule last:border-none">
                <td className="py-2.5">{row.time}</td>
                <td className="py-2.5">{shortId(row.fromAccount)}</td>
                <td className="py-2.5">{shortId(row.toAccount)}</td>
                <td className="py-2.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide ${
                      pillStyles[row.status] || pillStyles.PENDING
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="num py-2.5 text-right text-debit">−{formatInr(row.amount)}</td>
                <td className="num py-2.5 text-right text-credit">+{formatInr(row.amount)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
