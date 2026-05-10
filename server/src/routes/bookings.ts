import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createBookingSchema } from '../schemas';
import { evaluatePromo } from '../lib/promo';
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
  const { routeId, travelDate, passengers } = req.body;

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
  const totalAmount = seats.reduce((sum: number, s: any) => sum + Math.round(route.price_base * s.price_multiplier * 100) / 100, 0);

  const bookingId = `BK-${uuidv4().slice(0, 8).toUpperCase()}`;

  const insertBooking = db.prepare(`INSERT INTO bookings (booking_id, user_id, route_id, travel_date, total_amount) VALUES (?, ?, ?, ?, ?)`);
  const insertDetail = db.prepare(`INSERT INTO booking_details (booking_id, seat_id, passenger_name, passenger_age, passenger_gender) VALUES (?, ?, ?, ?, ?)`);

  const txn = db.transaction(() => {
    const result = insertBooking.run(bookingId, req.userId, routeId, travelDate, totalAmount);
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

// Cancel booking
router.patch('/:bookingId/cancel', authMiddleware, (req: AuthRequest, res) => {
  const booking = db.prepare('SELECT * FROM bookings WHERE booking_id = ? AND user_id = ?').get(req.params.bookingId, req.userId!) as any;
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.status === 'cancelled') return res.status(400).json({ error: 'Already cancelled' });

  // Cancellation policy: full refund if > 24h before travel
  const travelDate = new Date(booking.travel_date);
  const now = new Date();
  const hoursUntilTravel = (travelDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  let refundPercent = 100;
  if (hoursUntilTravel < 2) refundPercent = 0;
  else if (hoursUntilTravel < 12) refundPercent = 50;
  else if (hoursUntilTravel < 24) refundPercent = 75;

  db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run('cancelled', booking.id);

  res.json({
    message: 'Booking cancelled',
    refundPercent,
    refundAmount: Math.round(booking.total_amount * refundPercent / 100 * 100) / 100
  });
});

export default router;
