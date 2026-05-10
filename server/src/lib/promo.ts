import db from '../db';

export interface PromoRow {
  id: number;
  code: string;
  kind: 'percent' | 'flat';
  amount: number;
  min_total: number;
  max_discount: number | null;
  active: number;
  expires_at: string | null;
}

export interface PromoResult {
  ok: boolean;
  reason?: string;
  promo?: PromoRow;
  discount?: number; // amount in dollars to subtract from total
}

export function evaluatePromo(rawCode: string | undefined, total: number): PromoResult {
  if (!rawCode) return { ok: false, reason: 'No promo code provided' };
  const code = rawCode.trim().toUpperCase();
  const promo = db.prepare('SELECT * FROM promo_codes WHERE code = ?').get(code) as
    | PromoRow
    | undefined;
  if (!promo) return { ok: false, reason: 'Invalid promo code' };
  if (!promo.active) return { ok: false, reason: 'Promo code is not active' };
  if (promo.expires_at && new Date(promo.expires_at).getTime() < Date.now()) {
    return { ok: false, reason: 'Promo code expired' };
  }
  if (total < promo.min_total) {
    return {
      ok: false,
      reason: `Minimum order total of $${promo.min_total.toFixed(2)} required`,
    };
  }
  let discount =
    promo.kind === 'percent' ? (total * promo.amount) / 100 : promo.amount;
  if (promo.max_discount != null) {
    discount = Math.min(discount, promo.max_discount);
  }
  discount = Math.min(discount, total);
  discount = Math.round(discount * 100) / 100;
  return { ok: true, promo, discount };
}
