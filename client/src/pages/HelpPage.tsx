import { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

interface QA {
  q: string;
  a: string;
}

const FAQS: QA[] = [
  {
    q: 'How do I book a seat?',
    a: 'Search a route, pick a date, choose your seats on the seat map, then continue to passenger details. We hold each seat for 5 minutes while you fill in the form — if you abandon the page, other riders can grab it.',
  },
  {
    q: 'Can I cancel my booking?',
    a: 'Yes. Open your profile, find the booking, and tap Cancel. We show a refund preview before you confirm — the percentage depends on how close to departure you cancel (see the Pricing page).',
  },
  {
    q: 'Are promo codes stackable?',
    a: 'No — only one promo can be applied per booking. Codes are validated server-side, and the discount is recalculated against the cart total at booking time.',
  },
  {
    q: 'What does the seat colour mean?',
    a: 'Green = available, purple = you have selected it, amber pulsing = another rider is holding it, red = already booked. Holds expire after 5 minutes.',
  },
  {
    q: 'Why is my e-ticket not downloading?',
    a: 'The download button generates a PDF using your browser. If pop-ups are blocked you may need to allow them for this site. You can also fetch the ticket directly from /api/bookings/<id>/ticket.pdf.',
  },
  {
    q: 'How do I become an admin?',
    a: 'Admin accounts are seeded by a database administrator. There is no self-service admin sign-up by design.',
  },
];

export default function HelpPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Help &amp; FAQs</h1>
      </div>

      <p className="text-white/60 mb-8">
        Quick answers to the things we get asked most often. Still stuck? Email
        <a className="text-purple-300 ml-1" href="mailto:hello@busgo.example">
          hello@busgo.example
        </a>
        .
      </p>

      <ul className="space-y-3">
        {FAQS.map((faq, i) => (
          <li key={faq.q} className="glass rounded-2xl overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between px-5 py-4 text-left text-white"
              aria-expanded={open === i}
              aria-controls={`faq-panel-${i}`}
              onClick={() => setOpen(open === i ? null : i)}
            >
              <span className="font-semibold">{faq.q}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  open === i ? 'rotate-180' : ''
                }`}
              />
            </button>
            {open === i && (
              <div
                id={`faq-panel-${i}`}
                className="px-5 pb-5 text-white/70 text-sm leading-relaxed"
              >
                {faq.a}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
