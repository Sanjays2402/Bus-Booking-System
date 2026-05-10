// Refund policy config — easy to tune without touching booking logic.
// Keys are minimum hours-until-departure to qualify for that tier.
// First match wins from largest to smallest.

export interface RefundTier {
  minHours: number;
  refundPercent: number;
  label: string;
}

export const REFUND_TIERS: RefundTier[] = [
  { minHours: 24, refundPercent: 100, label: '24+ hours before departure' },
  { minHours: 12, refundPercent: 75, label: '12–24 hours before departure' },
  { minHours: 2, refundPercent: 50, label: '2–12 hours before departure' },
  { minHours: 0, refundPercent: 0, label: 'Less than 2 hours / past departure' },
];

export function quoteRefund(travelDateIso: string, totalAmount: number) {
  const travel = new Date(travelDateIso);
  const hours = (travel.getTime() - Date.now()) / (1000 * 60 * 60);
  const tier =
    REFUND_TIERS.find((t) => hours >= t.minHours) ?? REFUND_TIERS[REFUND_TIERS.length - 1];
  const refundAmount = Math.round(((totalAmount * tier.refundPercent) / 100) * 100) / 100;
  return {
    hoursUntilTravel: Math.max(0, Math.round(hours * 10) / 10),
    refundPercent: tier.refundPercent,
    refundAmount,
    tier: tier.label,
  };
}
