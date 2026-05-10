import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Ticket, ArrowRight, Download, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export default function BookingConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as any;

  if (!state?.bookingId) {
    return (
      <div className="text-center py-20">
        <p className="text-white/40">No booking data</p>
        <button onClick={() => navigate('/')} className="text-purple-400 hover:text-purple-300 mt-4">← Go Home</button>
      </div>
    );
  }

  const { bookingId, route, date, passengers, totalPrice } = state;
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(
      JSON.stringify({
        bookingId,
        from: route.origin,
        to: route.destination,
        date,
        operator: route.operator_name,
      }),
      { width: 220, margin: 1, color: { dark: '#1a0a3e', light: '#ffffff' } },
    )
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [bookingId, route, date]);

  const handlePrint = () => window.print();

  const handleDownloadPdf = async () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    let y = 50;
    doc.setFontSize(20);
    doc.text('BusGo Booking Confirmation', 40, y);
    y += 30;
    doc.setFontSize(11);
    doc.text(`Booking ID: ${bookingId}`, 40, y); y += 18;
    doc.text(`Route: ${route.origin} → ${route.destination}`, 40, y); y += 18;
    doc.text(`Operator: ${route.operator_name} (${route.bus_type})`, 40, y); y += 18;
    doc.text(`Date: ${new Date(date + 'T00:00').toDateString()}`, 40, y); y += 18;
    doc.text(`Time: ${route.departure_time} – ${route.arrival_time}`, 40, y); y += 28;
    doc.setFontSize(13);
    doc.text('Passengers', 40, y); y += 18;
    doc.setFontSize(11);
    passengers.forEach((p: any) => {
      doc.text(`• ${p.name} (${p.gender || 'N/A'}, ${p.age}) — Seat ${p.seatNumber}`, 50, y);
      y += 16;
    });
    y += 12;
    doc.setFontSize(13);
    doc.text(`Total Paid: $${Number(totalPrice).toFixed(2)}`, 40, y);
    if (qrDataUrl) {
      try {
        doc.addImage(qrDataUrl, 'PNG', 400, 60, 140, 140);
        doc.setFontSize(9);
        doc.text('Scan at boarding', 420, 215);
      } catch {
        // QR not added; ignore
      }
    }
    doc.save(`busgo-${bookingId}.pdf`);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="glass-strong rounded-3xl p-8 text-center animate-fade-in">
        {/* Success Icon */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/25">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-3xl font-extrabold text-white mb-2">Booking Confirmed!</h1>
        <p className="text-white/40 mb-8">Your bus tickets have been booked successfully</p>

        {/* Ticket Card */}
        <div className="glass rounded-2xl p-6 text-left mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-purple-300">
              <Ticket className="w-5 h-5" />
              <span className="font-mono font-bold">{bookingId}</span>
            </div>
            <span className="text-xs glass px-3 py-1 rounded-full text-emerald-400 font-medium">Confirmed</span>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-xl font-bold text-white">{route.origin}</span>
            <ArrowRight className="w-5 h-5 text-purple-400" />
            <span className="text-xl font-bold text-white">{route.destination}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-white/30">Date</p>
              <p className="text-white font-medium">{new Date(date + 'T00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <div>
              <p className="text-white/30">Time</p>
              <p className="text-white font-medium">{route.departure_time} – {route.arrival_time}</p>
            </div>
            <div>
              <p className="text-white/30">Operator</p>
              <p className="text-white font-medium">{route.operator_name}</p>
            </div>
            <div>
              <p className="text-white/30">Bus Type</p>
              <p className="text-white font-medium">{route.bus_type}</p>
            </div>
          </div>

          <div className="border-t border-white/10 mt-4 pt-4">
            <p className="text-white/30 text-sm mb-2">Passengers</p>
            {passengers.map((p: any, idx: number) => (
              <div key={idx} className="flex justify-between text-sm py-1">
                <span className="text-white">{p.name} ({p.gender}, {p.age}y)</span>
                <span className="text-white/40">Seat {p.seatNumber}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 mt-4 pt-4 flex justify-between items-center">
            <span className="text-white/40 font-medium">Total Paid</span>
            <span className="text-2xl font-extrabold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">${totalPrice.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center print:hidden">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="btn-glow px-6 py-3 rounded-xl font-bold text-white inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="btn-glass px-6 py-3 rounded-xl font-medium text-white/80 hover:text-white inline-flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <Link to="/profile" className="btn-glass px-6 py-3 rounded-xl font-medium text-white/80 hover:text-white">
            View Bookings
          </Link>
          <Link to="/" className="btn-glass px-6 py-3 rounded-xl font-medium text-white/70 hover:text-white">
            Book Another Trip
          </Link>
        </div>
        {qrDataUrl && (
          <div className="mt-6 flex flex-col items-center gap-2">
            <img
              src={qrDataUrl}
              alt="QR code for boarding"
              className="w-32 h-32 rounded-xl border border-white/10 bg-white p-1"
            />
            <p className="text-xs text-white/40">Scan at boarding</p>
          </div>
        )}
      </div>
    </div>
  );
}
