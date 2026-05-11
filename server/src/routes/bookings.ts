import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createBookingSchema } from '../schemas';
import { evaluatePromo } from '../lib/promo';
import { quoteRefund } from '../config/refund';
import { z } from 'zod';

const router = Router();

// Validate a promo code against a tentative subtotal
const validatePromoSchema = z.object({
  code: z.string().trim().min(1).max(40),
  total: z.number().positive(),
});

router.post('/validate-promo', validate(validatePromoSchema), (req, res) => {
  const { code, total } = req.body as { code: string; total: number };
  const result = evaluatePromo(code, total);
  if (!result.ok) return res.status(400).json({ error: result.reason });
  res.json({
    code: result.promo!.code,
    kind: result.promo!.kind,
    amount: result.promo!.amount,
    discount: result.discount,
    finalTotal: Math.round((total - (result.discount || 0)) * 100) / 100,
  });
});

// Create booking
router.post('/', authMiddleware, validate(createBookingSchema), (req: AuthRequest, res) => {
  const { routeId, travelDate, passengers, promoCode } = req.body;

  const route = db.prepare('SELECT r.*, b.bus_type FROM routes r JOIN buses b ON r.bus_id = b.id WHERE r.id = ?').get(routeId) as any;
  if (!route) return res.status(404).json({ error: 'Route not found' });

  // Check seat availability
  const seatIds = passengers.map((p: any) => p.seatId);
  const bookedSeats = db.prepare(`
    SELECT bd.seat_id FROM booking_details bd
    JOIN bookings bk ON bd.booking_id = bk.id
    WHERE bk.route_id = ? AND bk.travel_date = ? AND bk.status = 'confirmed'
    AND bd.seat_id IN (${seatIds.map(() => '?').join(',')})
  `).all(routeId, travelDate, ...seatIds);

  if (bookedSeats.length > 0) {
    return res.status(409).json({ error: 'Some seats are already booked', bookedSeats });
  }

  // Calculate total
  const seats = db.prepare(`SELECT * FROM seats WHERE id IN (${seatIds.map(() => '?').join(',')})`).all(...seatIds) as any[];
  const subtotal = seats.reduce((sum: number, s: any) => sum + Math.round(route.price_base * s.price_multiplier * 100) / 100, 0);

  // Apply promo code if provided
  let discount = 0;
  let appliedCode: string | null = null;
  if (promoCode) {
    const promo = evaluatePromo(promoCode, subtotal);
    if (!promo.ok) return res.status(400).json({ error: promo.reason });
    discount = promo.discount || 0;
    appliedCode = promo.promo!.code;
  }
  const totalAmount = Math.round((subtotal - discount) * 100) / 100;

  const bookingId = `BK-${uuidv4().slice(0, 8).toUpperCase()}`;

  const insertBooking = db.prepare(
    `INSERT INTO bookings (booking_id, user_id, route_id, travel_date, total_amount, discount_amount, promo_code) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertDetail = db.prepare(`INSERT INTO booking_details (booking_id, seat_id, passenger_name, passenger_age, passenger_gender) VALUES (?, ?, ?, ?, ?)`);

  const txn = db.transaction(() => {
    const result = insertBooking.run(
      bookingId,
      req.userId,
      routeId,
      travelDate,
      totalAmount,
      discount,
      appliedCode,
    );
    const dbBookingId = result.lastInsertRowid;
    for (const p of passengers) {
      insertDetail.run(dbBookingId, p.seatId, p.name, p.age, p.gender);
    }
    return dbBookingId;
  });

  const dbId = txn();

  res.status(201).json({
    bookingId,
    id: dbId,
    subtotal,
    discount,
    promoCode: appliedCode,
    totalAmount,
    status: 'confirmed',
    message: 'Booking confirmed!'
  });
});

// Get user's bookings
router.get('/my', authMiddleware, (req: AuthRequest, res) => {
  const bookings = db.prepare(`
    SELECT bk.*, r.origin, r.destination, r.departure_time, r.arrival_time,
    b.operator_name, b.bus_number, b.bus_type
    FROM bookings bk
    JOIN routes r ON bk.route_id = r.id
    JOIN buses b ON r.bus_id = b.id
    WHERE bk.user_id = ?
    ORDER BY bk.created_at DESC
  `).all(req.userId!);

  // Get details for each booking
  const enriched = bookings.map((bk: any) => {
    const details = db.prepare(`
      SELECT bd.*, s.seat_number, s.seat_type FROM booking_details bd
      JOIN seats s ON bd.seat_id = s.id WHERE bd.booking_id = ?
    `).all(bk.id);
    return { ...bk, passengers: details };
  });

  res.json(enriched);
});

// Get a single booking by booking_id (polling endpoint)
router.get('/:bookingId', authMiddleware, (req: AuthRequest, res) => {
  const booking = db
    .prepare(
      `SELECT bk.*, r.origin, r.destination, r.departure_time, r.arrival_time,
              b.operator_name, b.bus_number, b.bus_type
         FROM bookings bk
         JOIN routes r ON bk.route_id = r.id
         JOIN buses b ON r.bus_id = b.id
        WHERE bk.booking_id = ? AND bk.user_id = ?`,
    )
    .get(req.params.bookingId, req.userId!) as any;
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  const passengers = db
    .prepare(
      `SELECT bd.*, s.seat_number, s.seat_type FROM booking_details bd
         JOIN seats s ON bd.seat_id = s.id WHERE bd.booking_id = ?`,
    )
    .all(booking.id);
  res.json({ ...booking, passengers });
});

// Cancel booking
router.patch('/:bookingId/cancel', authMiddleware, (req: AuthRequest, res) => {
  const booking = db.prepare('SELECT * FROM bookings WHERE booking_id = ? AND user_id = ?').get(req.params.bookingId, req.userId!) as any;
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.status === 'cancelled') return res.status(400).json({ error: 'Already cancelled' });

  const { refundPercent, refundAmount, tier } = quoteRefund(
    booking.travel_date,
    booking.total_amount,
  );

  db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run('cancelled', booking.id);

  res.json({
    message: 'Booking cancelled',
    refundPercent,
    refundAmount,
    tier,
  });
});

// Refund quote (read-only) — lets the client preview refund before cancelling
router.get('/:bookingId/refund-quote', authMiddleware, (req: AuthRequest, res) => {
  const booking = db
    .prepare('SELECT * FROM bookings WHERE booking_id = ? AND user_id = ?')
    .get(req.params.bookingId, req.userId!) as any;
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.status === 'cancelled') {
    return res.status(400).json({ error: 'Booking is already cancelled' });
  }
  res.json(quoteRefund(booking.travel_date, booking.total_amount));
});

/**
 * GET /api/bookings/:bookingId/ticket.pdf
 *
 * Server-side e-ticket generation. Streams a PDF directly to the client so
 * the front-end doesn't have to rasterize the DOM with html2canvas. Auth is
 * via the standard bearer header.
 */
router.get('/:bookingId/ticket.pdf', authMiddleware, (req: AuthRequest, res) => {
  const booking = db
    .prepare(
      `SELECT bk.*, r.origin, r.destination, r.departure_time, r.arrival_time,
              b.operator_name, b.bus_number, b.bus_type
         FROM bookings bk
         JOIN routes r ON bk.route_id = r.id
         JOIN buses b ON r.bus_id = b.id
        WHERE bk.booking_id = ? AND bk.user_id = ?`,
    )
    .get(req.params.bookingId, req.userId!) as any;
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  const passengers = db
    .prepare(
      `SELECT bd.passenger_name, bd.passenger_age, bd.passenger_gender,
              s.seat_number, s.seat_type
         FROM booking_details bd JOIN seats s ON bd.seat_id = s.id
         WHERE bd.booking_id = ?`,
    )
    .all(booking.id) as Array<{
      passenger_name: string;
      passenger_age: number;
      passenger_gender: string;
      seat_number: string;
      seat_type: string;
    }>;

  // Lazy-require so test envs that don't exercise this route avoid the
  // pdfkit native font lookups during module load.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="ticket-${booking.booking_id}.pdf"`,
  );
  doc.pipe(res);

  doc.fontSize(22).text('Bus Booking E-Ticket', { align: 'center' });
  doc.moveDown(0.5);
  doc
    .fontSize(11)
    .fillColor('#666')
    .text(`Booking #${booking.booking_id}`, { align: 'center' })
    .fillColor('black');

  doc.moveDown();
  doc.fontSize(14).text(`${booking.origin}  →  ${booking.destination}`);
  doc
    .fontSize(11)
    .text(`Travel date: ${booking.travel_date}`)
    .text(`Departure: ${booking.departure_time}    Arrival: ${booking.arrival_time}`)
    .text(`Operator: ${booking.operator_name} (${booking.bus_number})`)
    .text(`Bus type: ${booking.bus_type}`)
    .text(`Status: ${booking.status}`);

  doc.moveDown();
  doc.fontSize(13).text('Passengers');
  doc.fontSize(11);
  passengers.forEach((p, i) => {
    doc.text(
      `${i + 1}. ${p.passenger_name} (age ${p.passenger_age}, ${p.passenger_gender})  —  seat ${p.seat_number} [${p.seat_type}]`,
    );
  });

  doc.moveDown();
  doc.fontSize(13).text(`Total paid: $${Number(booking.total_amount).toFixed(2)}`);
  if (booking.promo_code) {
    doc.fontSize(10).fillColor('#666').text(
      `Promo applied: ${booking.promo_code} (−$${Number(booking.discount_amount || 0).toFixed(2)})`,
    ).fillColor('black');
  }

  doc.moveDown(2);
  doc.fontSize(9).fillColor('#888').text(
    'Show this ticket at boarding. Generated by Bus Booking System.',
    { align: 'center' },
  );

  doc.end();
});

export default router;
