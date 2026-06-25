// Format an ISO date (YYYY-MM-DD) without timezone drift.
export function formatDate(d: string, long = false): string {
  if (!d) return "";
  const [y, m, day] = d.slice(0, 10).split("-").map(Number);
  if (!y) return d;
  return new Date(y, (m || 1) - 1, day || 1).toLocaleDateString("en-US", {
    year: "numeric",
    month: long ? "long" : "short",
    day: "numeric",
  });
}
