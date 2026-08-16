export function formatInr(amount) {
  const n = Number(amount) || 0;
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function shortId(id) {
  if (!id) return "—";
  return String(id).slice(-8);
}
