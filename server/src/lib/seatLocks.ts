/**
 * In-memory seat-lock manager.
 *
 * Holds short-lived locks (default 5 min) that prevent another user from
 * picking the same seat on the same route + travel-date while the original
 * holder is going through the checkout flow.
 *
 * Locks are keyed by `${routeId}:${travelDate}:${seatId}`. Each lock stores
 * the userId that owns it and an expiry timestamp. Expired locks are lazily
 * evicted on every access, so the map stays bounded under realistic load.
 *
 * NOTE: This is intentionally a single-process implementation. For a real
 * multi-instance deploy you'd back it with Redis or a `seat_locks` SQLite
 * table — but the API surface below is stable and would not change.
 */

export const LOCK_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface LockEntry {
  userId: number;
  expiresAt: number;
}

const locks = new Map<string, LockEntry>();

function key(routeId: number, travelDate: string, seatId: number): string {
  return `${routeId}:${travelDate}:${seatId}`;
}

function purgeExpired(now: number): void {
  for (const [k, v] of locks) {
    if (v.expiresAt <= now) locks.delete(k);
  }
}

export interface ClaimResult {
  ok: boolean;
  conflicts: number[]; // seat ids that could not be locked
  expiresAt?: number;
}

/**
 * Try to claim a set of seats for the given user. If any seat is already
 * locked by someone else (and not expired), the call fails with a list of
 * conflicting seat ids and leaves existing locks untouched.
 */
export function claimSeats(
  routeId: number,
  travelDate: string,
  seatIds: number[],
  userId: number,
): ClaimResult {
  const now = Date.now();
  purgeExpired(now);

  const conflicts: number[] = [];
  for (const seatId of seatIds) {
    const existing = locks.get(key(routeId, travelDate, seatId));
    if (existing && existing.userId !== userId) conflicts.push(seatId);
  }
  if (conflicts.length) return { ok: false, conflicts };

  const expiresAt = now + LOCK_TTL_MS;
  for (const seatId of seatIds) {
    locks.set(key(routeId, travelDate, seatId), { userId, expiresAt });
  }
  return { ok: true, conflicts: [], expiresAt };
}

export function releaseSeats(
  routeId: number,
  travelDate: string,
  seatIds: number[],
  userId: number,
): { released: number } {
  let released = 0;
  for (const seatId of seatIds) {
    const k = key(routeId, travelDate, seatId);
    const existing = locks.get(k);
    if (existing && existing.userId === userId) {
      locks.delete(k);
      released++;
    }
  }
  return { released };
}

/** Snapshot of currently locked seat ids for a route+date (excluding owner). */
export function listLockedSeats(
  routeId: number,
  travelDate: string,
  excludeUserId?: number,
): Array<{ seatId: number; expiresAt: number; mine: boolean }> {
  const now = Date.now();
  purgeExpired(now);
  const prefix = `${routeId}:${travelDate}:`;
  const out: Array<{ seatId: number; expiresAt: number; mine: boolean }> = [];
  for (const [k, v] of locks) {
    if (!k.startsWith(prefix)) continue;
    const seatId = Number(k.slice(prefix.length));
    out.push({
      seatId,
      expiresAt: v.expiresAt,
      mine: excludeUserId != null && v.userId === excludeUserId,
    });
  }
  return out;
}

/** Test helper: wipe all locks. Not exported via index. */
export function _resetLocksForTests(): void {
  locks.clear();
}
