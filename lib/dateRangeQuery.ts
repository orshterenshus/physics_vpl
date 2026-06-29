// Builds a Mongo createdAt range filter from optional "YYYY-MM-DD" bounds
// (as produced by an <input type="date">), inclusive of the whole "to" day.
export function buildCreatedAtFilter(from?: string | null, to?: string | null): Record<string, Date> | null {
  if (!from && !to) return null;
  const createdAt: Record<string, Date> = {};
  if (from) createdAt.$gte = new Date(`${from}T00:00:00.000Z`);
  if (to) createdAt.$lte = new Date(`${to}T23:59:59.999Z`);
  return createdAt;
}
