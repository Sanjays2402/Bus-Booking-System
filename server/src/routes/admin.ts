import { Router } from 'express';
import db from '../db';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth';
import { auditMiddleware } from '../lib/audit';

const router = Router();

router.use(authMiddleware, adminMiddleware);

// Get all routes with bus info
router.get('/routes', (_req, res) => {
  const routes = db.prepare(`
    SELECT r.*, b.operator_name, b.bus_number, b.bus_type, b.rating
    FROM routes r JOIN buses b ON r.bus_id = b.id ORDER BY r.origin, r.destination
  `).all();
  res.json(routes);
});

// Add route
router.post('/routes', auditMiddleware('admin.route.create', 'route'), (req, res) => {
  const { busId, origin, destination, departureTime, arrivalTime, durationMinutes, priceBase, daysOfWeek } = req.body;
  const result = db.prepare(`
    INSERT INTO routes (bus_id, origin, destination, departure_time, arrival_time, duration_minutes, price_base, days_of_week)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(busId, origin, destination, departureTime, arrivalTime, durationMinutes, priceBase, daysOfWeek || 'Mon,Tue,Wed,Thu,Fri,Sat,Sun');
  res.status(201).json({ id: result.lastInsertRowid });
});

// Update route
router.put('/routes/:id', auditMiddleware('admin.route.update', 'route'), (req, res) => {
  const { origin, destination, departureTime, arrivalTime, durationMinutes, priceBase, daysOfWeek, active } = req.body;
  db.prepare(`
    UPDATE routes SET origin=?, destination=?, departure_time=?, arrival_time=?, duration_minutes=?, price_base=?, days_of_week=?, active=?
    WHERE id=?
  `).run(origin, destination, departureTime, arrivalTime, durationMinutes, priceBase, daysOfWeek, active ?? 1, req.params.id);
  res.json({ success: true });
});

// Delete route
router.delete('/routes/:id', auditMiddleware('admin.route.delete', 'route'), (req, res) => {
  db.prepare('DELETE FROM routes WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Get all buses
router.get('/buses', (_req, res) => {
  res.json(db.prepare('SELECT * FROM buses ORDER BY operator_name').all());
});

// Bookings for a route
router.get('/routes/:id/bookings', (req, res) => {
  const bookings = db.prepare(`
    SELECT bk.*, u.name as user_name, u.email as user_email
    FROM bookings bk JOIN users u ON bk.user_id = u.id
    WHERE bk.route_id = ? ORDER BY bk.created_at DESC
  `).all(req.params.id);
  res.json(bookings);
});

// Revenue summary
router.get('/revenue', (_req, res) => {
  const total = db.prepare(`SELECT COALESCE(SUM(total_amount),0) as total FROM bookings WHERE status='confirmed'`).get() as any;
  const byOperator = db.prepare(`
    SELECT b.operator_name, COUNT(bk.id) as bookings, COALESCE(SUM(bk.total_amount),0) as revenue
    FROM bookings bk JOIN routes r ON bk.route_id = r.id JOIN buses b ON r.bus_id = b.id
    WHERE bk.status='confirmed' GROUP BY b.operator_name ORDER BY revenue DESC
  `).all();
  const byRoute = db.prepare(`
    SELECT r.origin, r.destination, COUNT(bk.id) as bookings, COALESCE(SUM(bk.total_amount),0) as revenue
    FROM bookings bk JOIN routes r ON bk.route_id = r.id
    WHERE bk.status='confirmed' GROUP BY r.origin, r.destination ORDER BY revenue DESC
  `).all();
  res.json({ totalRevenue: total.total, byOperator, byRoute });
});

export default router;
