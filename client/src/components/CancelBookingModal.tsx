import { useEffect, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface CancelBookingModalProps {
  bookingId: string | null;
  onClose: () => void;
  onConfirm: (bookingId: string) => Promise<void> | void;
}

interface RefundQuote {
  hoursUntilTravel: number;
  refundPercent: number;
  refundAmount: number;
  tier: string;
}

export default function CancelBookingModal({
  bookingId,
  onClose,
  onConfirm,
}: CancelBookingModalProps) {
  const [quote, setQuote] = useState<RefundQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!bookingId) return;
    setQuote(null);
    setError(null);
    const token = localStorage.getItem('token');
    fetch(`/api/bookings/${bookingId}/refund-quote`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Quote failed');
        return r.json();
      })
      .then(setQuote)
      .catch((e) => setError(e.message));
  }, [bookingId]);

  if (!bookingId) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm(bookingId);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div className="relative glass-strong rounded-2xl p-6 w-full max-w-md animate-fade-in">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center text-red-300">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold">Cancel booking</h3>
              <p className="text-xs text-white/50 font-mono">{bookingId}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-glass p-1.5 rounded-lg text-white/60"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error ? (
          <p className="text-red-300 text-sm">{error}</p>
        ) : !quote ? (
          <p className="text-white/50 text-sm">Loading refund estimate…</p>
        ) : (
          <div className="space-y-3 text-sm">
            <p className="text-white/80">{quote.tier}</p>
            <div className="glass rounded-xl p-3 flex items-center justify-between">
              <span className="text-white/60">Estimated refund</span>
              <span className="text-emerald-300 font-semibold">
                ${quote.refundAmount.toFixed(2)} ({quote.refundPercent}%)
              </span>
            </div>
            <p className="text-xs text-white/40">
              Cancellation is final. Refunds are issued back to the original payment method
              within 5–7 business days.
            </p>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="btn-glass flex-1 py-2.5 rounded-xl text-white/80 font-medium"
            disabled={submitting}
          >
            Keep booking
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || !!error}
            className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-pink-500 disabled:opacity-50"
          >
            {submitting ? 'Cancelling…' : 'Confirm cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
