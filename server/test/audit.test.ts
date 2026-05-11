import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import db from '../src/db';

const app = createApp({ enableRateLimit: false, enableLogger: false });

const uniqueEmail = (label: string) =>
  `vitest-${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

async function makeAdmin(): Promise<string> {
  const email = uniqueEmail('admin');
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ email, name: 'Audit Admin', password: 'admin-secret-pw' });
  expect(reg.status).toBe(201);
  // Promote to admin in-place. Token in res.body was issued with role=user, so
  // we need to re-login to receive a fresh token carrying the admin role.
  db.prepare("UPDATE users SET role = 'admin' WHERE email = ?").run(email);
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'admin-secret-pw' });
  expect(login.status).toBe(200);
  return login.body.token as string;
}

describe('admin audit log', () => {
  let token: string;
  let busId: number;

  beforeAll(async () => {
    token = await makeAdmin();
    // We need an existing bus for routes to reference. Create one directly.
    const r = db
      .prepare(
        `INSERT INTO buses (operator_name, bus_number, bus_type, total_seats, amenities, rating)
           VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run('AuditCo', 'AC-1', 'AC Seater', 30, '[]', 4.0);
    busId = Number(r.lastInsertRowid);
  });

  it('records admin route create + delete in audit log', async () => {
    const create = await request(app)
      .post('/api/admin/routes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        busId,
        origin: 'Audit-City-A',
        destination: 'Audit-City-B',
        departureTime: '09:00',
        arrivalTime: '13:00',
        durationMinutes: 240,
        priceBase: 50,
      });
    expect(create.status).toBe(201);
    const routeId = create.body.id;

    const del = await request(app)
      .delete(`/api/admin/routes/${routeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);

    // Give the finish handler a tick to flush both audit rows.
    await new Promise((r) => setTimeout(r, 50));

    const log = await request(app)
      .get('/api/admin/audit?entity=route&limit=50')
      .set('Authorization', `Bearer ${token}`);
    expect(log.status).toBe(200);
    expect(log.body.total).toBeGreaterThanOrEqual(2);
    const actions = log.body.items.map((i: any) => i.action);
    expect(actions).toContain('admin.route.create');
    expect(actions).toContain('admin.route.delete');
    // entity_id should be populated for the delete (param-based)
    const delEntry = log.body.items.find(
      (i: any) => i.action === 'admin.route.delete',
    );
    expect(delEntry.entity_id).toBe(String(routeId));
  });

  it('rejects non-admin from audit endpoint', async () => {
    const userEmail = uniqueEmail('user');
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email: userEmail, name: 'Regular User', password: 'regular-pw' });
    const res = await request(app)
      .get('/api/admin/audit')
      .set('Authorization', `Bearer ${reg.body.token}`);
    expect(res.status).toBe(403);
  });
});
