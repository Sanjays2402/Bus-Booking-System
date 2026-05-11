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

// All bookings (system-wide, paginated) for the support view
router.get('/bookings', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const status = typeof req.query.status === 'string' ? req.query.status : null;

  const where = status ? 'WHERE bk.status = ?' : '';
  const params: any[] = status ? [status, limit, offset] : [limit, offset];
  const totalRow = db
    .prepare(
      `SELECT COUNT(*) AS c FROM bookings bk ${where}`,
    )
    .get(...(status ? [status] : [])) as { c: number };

  const items = db
    .prepare(
      `SELECT bk.id, bk.booking_id, bk.status, bk.total_amount,
              bk.discount_amount, bk.promo_code, bk.travel_date, bk.created_at,
              u.name AS user_name, u.email AS user_email,
              r.origin, r.destination, b.operator_name
         FROM bookings bk
         JOIN users u ON bk.user_id = u.id
         JOIN routes r ON bk.route_id = r.id
         JOIN buses b ON r.bus_id = b.id
         ${where}
         ORDER BY bk.created_at DESC
         LIMIT ? OFFSET ?`,
    )
    .all(...params);

  res.json({ total: totalRow.c, limit, offset, items });
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

// Audit log: paginated, newest first. Supports ?limit=&offset=&entity=&action=
router.get('/audit', (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const entity = typeof req.query.entity === 'string' ? req.query.entity : null;
  const action = typeof req.query.action === 'string' ? req.query.action : null;

  const where: string[] = [];
  const params: any[] = [];
  if (entity) {
    where.push('entity = ?');
    params.push(entity);
  }
  if (action) {
    where.push('action LIKE ?');
    params.push(`%${action}%`);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const rows = db
    .prepare(
      `SELECT id, user_id, user_email, action, entity, entity_id, meta, ip, created_at
         FROM audit_logs ${whereSql}
         ORDER BY id DESC LIMIT ? OFFSET ?`,
    )
    .all(...params, limit, offset) as Array<{
      id: number;
      user_id: number | null;
      user_email: string | null;
      action: string;
      entity: string;
      entity_id: string | null;
      meta: string | null;
      ip: string | null;
      created_at: string;
    }>;

  const total = db
    .prepare(`SELECT COUNT(*) as c FROM audit_logs ${whereSql}`)
    .get(...params) as { c: number };

  res.json({
    total: total.c,
    limit,
    offset,
    items: rows.map((r) => ({
      ...r,
      meta: r.meta ? JSON.parse(r.meta) : null,
    })),
  });
});

export default router;
