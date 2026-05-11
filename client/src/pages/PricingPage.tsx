import { useEffect, useState } from 'react';
import { Tag, Percent, ShieldCheck, Clock } from 'lucide-react';
import { api } from '../lib/api';

interface RefundTier {
  hours: number;
  percent: number;
  label: string;
}

const REFUND_TIERS: RefundTier[] = [
  { hours: 24, percent: 100, label: 'More than 24h before departure' },
  { hours: 12, percent: 75, label: '12 – 24h before departure' },
  { hours: 2, percent: 50, label: '2 – 12h before departure' },
  { hours: 0, percent: 0, label: 'Less than 2h before departure' },
];

const PROMOS = [
  {
    code: 'WELCOME10',
    kind: 'percent' as const,
    amount: 10,
    minTotal: 0,
    maxDiscount: 25,
    note: 'New riders save 10% (up to $25).',
  },
  {
    code: 'SAVE5',
    kind: 'flat' as const,
    amount: 5,
    minTotal: 20,
    maxDiscount: null,
    note: 'Flat $5 off bookings of $20 or more.',
  },
];

export default function PricingPage() {
  const [exampleQuote, setExampleQuote] = useState<{
    total: number;
    discount: number;
    code: string;
  } | null>(null);

  useEffect(() => {
    api
      .validatePromo?.('WELCOME10', 80)
      .then((res: any) =>
        setExampleQuote({ total: 80, discount: res.discount || 8, code: 'WELCOME10' }),
      )
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
          <Tag className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Pricing &amp; promos</h1>
      </div>

      <p className="text-white/60 mb-10 max-w-2xl">
        Base ticket prices come straight from the operator. Seat type adds a small
        multiplier (window/aisle/middle), and any active promo code is applied at
        the very end of the cart.
      </p>

      <section className="mb-12">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Percent className="w-4 h-4 text-purple-300" /> Active promo codes
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {PROMOS.map((p) => (
            <div key={p.code} className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <code className="text-cyan-300 text-lg font-bold tracking-wide">
                  {p.code}
                </code>
                <span className="text-xs glass px-2 py-0.5 rounded-full text-purple-300">
                  {p.kind === 'percent' ? `${p.amount}% off` : `$${p.amount} off`}
                </span>
              </div>
              <p className="text-white/60 text-sm">{p.note}</p>
              <p className="text-white/40 text-xs mt-2">
                Min cart ${p.minTotal.toFixed(2)}
                {p.maxDiscount != null
                  ? ` · Capped at $${p.maxDiscount.toFixed(2)}`
                  : ''}
              </p>
            </div>
          ))}
        </div>
        {exampleQuote && (
          <p className="mt-4 text-white/50 text-sm">
            Example: an $80 cart with{' '}
            <code className="text-cyan-300">{exampleQuote.code}</code> saves{' '}
            <strong className="text-white">${exampleQuote.discount.toFixed(2)}</strong>.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-300" /> Refund policy
        </h2>
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-white/40 border-b border-white/10">
              <tr>
                <th className="text-left py-3 px-5">
                  <Clock className="inline w-3.5 h-3.5 mr-1" />
                  When you cancel
                </th>
                <th className="text-right py-3 px-5">Refund</th>
              </tr>
            </thead>
            <tbody>
              {REFUND_TIERS.map((t) => (
                <tr key={t.hours} className="border-b border-white/5">
                  <td className="py-3 px-5 text-white/80">{t.label}</td>
                  <td className="py-3 px-5 text-right font-semibold text-cyan-300">
                    {t.percent}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-white/40 text-xs mt-3">
          Refunds are credited back to the original payment method within 5–7
          business days in production. The demo build skips real payments.
        </p>
      </section>
    </div>
  );
}
