import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import db from '../src/db';

const app = createApp({ enableRateLimit: false, enableLogger: false });

const uniqueEmail = (label: string) =>
  `vitest-${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

describe('ticket PDF', () => {
  let token: string;
  let userId: number;
  let routeId: number;
  let seatId: number;

  beforeAll(async () => {
    // 1. Register a user.
    const email = uniqueEmail('pdf');
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email, name: 'PDF Tester', password: 'pdf-secret-pw' });
    token = reg.body.token;
    userId = reg.body.user.id;

    // 2. Seed minimal route + seat directly. Using direct DB inserts keeps
    //    this test isolated from admin-API concerns.
    const bus = db
      .prepare(
        `INSERT INTO buses (operator_name, bus_number, bus_type, total_seats, amenities, rating)
           VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run('PDFCo', 'PDF-1', 'AC Seater', 1, '[]', 4.0);
    const busId = Number(bus.lastInsertRowid);

    const seat = db
      .prepare(
        `INSERT INTO seats (bus_id, seat_number, seat_type, row_number, column_number, price_multiplier)
           VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(busId, '1A', 'Window', 1, 1, 1.0);
    seatId = Number(seat.lastInsertRowid);

    const route = db
      .prepare(
        `INSERT INTO routes (bus_id, origin, destination, departure_time, arrival_time, duration_minutes, price_base)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(busId, 'PDFCity', 'PDFTown', '08:00', '12:00', 240, 42.5);
    routeId = Number(route.lastInsertRowid);
  });

  it('returns a PDF for a real booking owned by the user', async () => {
    const booking = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        routeId,
        travelDate: '2099-06-15',
        passengers: [
          { seatId, name: 'Alex Passenger', age: 30, gender: 'O' },
        ],
      });
    expect(booking.status).toBe(201);
    const bookingId = booking.body.bookingId || booking.body.booking_id;
    expect(bookingId).toBeTruthy();

    const pdfRes = await request(app)
      .get(`/api/bookings/${bookingId}/ticket.pdf`)
      .set('Authorization', `Bearer ${token}`)
      .buffer(true)
      .parse((res, cb) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => cb(null, Buffer.concat(chunks)));
      });
    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers['content-type']).toContain('application/pdf');
    const buf: Buffer = pdfRes.body;
    expect(buf.length).toBeGreaterThan(500);
    // PDF magic header
    expect(buf.slice(0, 4).toString('ascii')).toBe('%PDF');
  });

  it('rejects unauthenticated PDF request', async () => {
    const res = await request(app).get('/api/bookings/BK-DOESNOTEXIST/ticket.pdf');
    expect(res.status).toBe(401);
  });

  it('404s for a booking the user does not own', async () => {
    const res = await request(app)
      .get('/api/bookings/BK-FAKE9999/ticket.pdf')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
