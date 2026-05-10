import { Router } from 'express';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

router.get('/search', (req, res) => {
  const { origin, destination, date, busType, minPrice, maxPrice, sortBy } = req.query;

  if (!origin || !destination) {
    return res.status(400).json({ error: 'Origin and destination required' });
  }

  let query = `
    SELECT r.*, b.operator_name, b.bus_number, b.bus_type, b.total_seats, b.amenities, b.rating,
    (SELECT COUNT(*) FROM seats s WHERE s.bus_id = b.id) as total_seat_count
    FROM routes r
    JOIN buses b ON r.bus_id = b.id
    WHERE LOWER(r.origin) = LOWER(?) AND LOWER(r.destination) = LOWER(?) AND r.active = 1
  `;
  const params: any[] = [origin, destination];

  if (busType) {
    query += ` AND b.bus_type = ?`;
    params.push(busType);
  }
  if (minPrice) {
    query += ` AND r.price_base >= ?`;
    params.push(Number(minPrice));
  }
  if (maxPrice) {
    query += ` AND r.price_base <= ?`;
    params.push(Number(maxPrice));
  }

  // Sort
  switch (sortBy) {
    case 'price_asc': query += ' ORDER BY r.price_base ASC'; break;
    case 'price_desc': query += ' ORDER BY r.price_base DESC'; break;
    case 'departure': query += ' ORDER BY r.departure_time ASC'; break;
    case 'duration': query += ' ORDER BY r.duration_minutes ASC'; break;
    case 'rating': query += ' ORDER BY b.rating DESC'; break;
    default: query += ' ORDER BY r.departure_time ASC';
  }

  const routes = db.prepare(query).all(...params);

  // If date provided, get booked seat counts
  if (date) {
    const enriched = routes.map((r: any) => {
      const booked = db.prepare(`
        SELECT COUNT(*) as count FROM booking_details bd
        JOIN bookings bk ON bd.booking_id = bk.id
        WHERE bk.route_id = ? AND bk.travel_date = ? AND bk.status = 'confirmed'
      `).get(r.id, date) as any;
      return { ...r, booked_seats: booked.count, available_seats: r.total_seat_count - booked.count };
    });
    return res.json(enriched);
  }

  res.json(routes);
});

router.get('/:id', (req, res) => {
  const route = db.prepare(`
    SELECT r.*, b.operator_name, b.bus_number, b.bus_type, b.total_seats, b.amenities, b.rating
    FROM routes r JOIN buses b ON r.bus_id = b.id WHERE r.id = ?
  `).get(req.params.id) as any;
  
  if (!route) return res.status(404).json({ error: 'Route not found' });
  res.json(route);
});

router.get('/:id/seats', (req, res) => {
  const { date } = req.query;
  const route = db.prepare('SELECT * FROM routes WHERE id = ?').get(req.params.id) as any;
  if (!route) return res.status(404).json({ error: 'Route not found' });

  const seats = db.prepare('SELECT * FROM seats WHERE bus_id = ? ORDER BY row_number, column_number').all(route.bus_id);

  if (date) {
    const bookedSeatIds = db.prepare(`
      SELECT bd.seat_id FROM booking_details bd
      JOIN bookings bk ON bd.booking_id = bk.id
      WHERE bk.route_id = ? AND bk.travel_date = ? AND bk.status = 'confirmed'
    `).all(Number(req.params.id), date).map((r: any) => r.seat_id);

    const enriched = seats.map((s: any) => ({
      ...s,
      status: bookedSeatIds.includes(s.id) ? 'booked' : 'available',
      price: Math.round(route.price_base * s.price_multiplier * 100) / 100
    }));
    return res.json(enriched);
  }

  res.json(seats.map((s: any) => ({ ...s, price: Math.round(route.price_base * s.price_multiplier * 100) / 100 })));
});

// Get all unique cities for autocomplete
router.get('/cities/list', (_req, res) => {
  const origins = db.prepare('SELECT DISTINCT origin as city FROM routes WHERE active = 1').all();
  const dests = db.prepare('SELECT DISTINCT destination as city FROM routes WHERE active = 1').all();
  const cities = [...new Set([...origins, ...dests].map((c: any) => c.city))].sort();
  res.json(cities);
});

// Reviews: list reviews for a route (with average rating)
router.get('/:id/reviews', (req, res) => {
  const routeId = Number(req.params.id);
  const route = db.prepare('SELECT id FROM routes WHERE id = ?').get(routeId);
  if (!route) return res.status(404).json({ error: 'Route not found' });
  const reviews = db
    .prepare(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.name as user_name
         FROM reviews r JOIN users u ON r.user_id = u.id
        WHERE r.route_id = ?
        ORDER BY r.created_at DESC`,
    )
    .all(routeId);
  const stats = db
    .prepare(
      `SELECT COUNT(*) as count, AVG(rating) as avg_rating
         FROM reviews WHERE route_id = ?`,
    )
    .get(routeId) as { count: number; avg_rating: number | null };
  res.json({
    count: stats.count,
    average: stats.avg_rating ? Math.round(stats.avg_rating * 10) / 10 : null,
    reviews,
  });
});

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(800).optional(),
});

// Reviews: create / upsert a review for a route (authenticated)
router.post(
  '/:id/reviews',
  authMiddleware,
  validate(reviewSchema),
  (req: AuthRequest, res) => {
    const routeId = Number(req.params.id);
    const route = db.prepare('SELECT id FROM routes WHERE id = ?').get(routeId);
    if (!route) return res.status(404).json({ error: 'Route not found' });
    const { rating, comment } = req.body as { rating: number; comment?: string };
    db.prepare(
      `INSERT INTO reviews (route_id, user_id, rating, comment)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(route_id, user_id)
           DO UPDATE SET rating = excluded.rating, comment = excluded.comment, created_at = datetime('now')`,
    ).run(routeId, req.userId!, rating, comment ?? null);
    res.status(201).json({ message: 'Review saved' });
  },
);

export default router;
