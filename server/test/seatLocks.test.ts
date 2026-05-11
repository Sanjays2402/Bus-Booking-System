import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { _resetLocksForTests } from '../src/lib/seatLocks';

const app = createApp({ enableRateLimit: false, enableLogger: false });

const uniqueEmail = (label = 'lock') =>
  `vitest-${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

async function registerAndGetToken(email = uniqueEmail()) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, name: 'Lock Tester', password: 'super-secret-pw' });
  return res.body.token as string;
}

const TRAVEL_DATE = '2099-12-25';

describe('seat locks', () => {
  beforeEach(() => {
    _resetLocksForTests();
  });

  it('claims and releases seats for the authed user', async () => {
    const token = await registerAndGetToken();
    const claim = await request(app)
      .post('/api/routes/1/locks')
      .set('Authorization', `Bearer ${token}`)
      .send({ travelDate: TRAVEL_DATE, seatIds: [1, 2, 3] });
    expect(claim.status).toBe(200);
    expect(claim.body.ok).toBe(true);
    expect(claim.body.expiresAt).toBeGreaterThan(Date.now());

    const list = await request(app)
      .get(`/api/routes/1/locks?date=${TRAVEL_DATE}`);
    expect(list.status).toBe(200);
    expect(list.body.locks.map((l: any) => l.seatId).sort()).toEqual([1, 2, 3]);

    const release = await request(app)
      .delete('/api/routes/1/locks')
      .set('Authorization', `Bearer ${token}`)
      .send({ travelDate: TRAVEL_DATE, seatIds: [1, 2, 3] });
    expect(release.status).toBe(200);
    expect(release.body.released).toBe(3);
  });

  it('rejects when another user already holds the seat', async () => {
    const alice = await registerAndGetToken(uniqueEmail('alice'));
    const bob = await registerAndGetToken(uniqueEmail('bob'));

    const aliceClaim = await request(app)
      .post('/api/routes/1/locks')
      .set('Authorization', `Bearer ${alice}`)
      .send({ travelDate: TRAVEL_DATE, seatIds: [10] });
    expect(aliceClaim.status).toBe(200);

    const bobClaim = await request(app)
      .post('/api/routes/1/locks')
      .set('Authorization', `Bearer ${bob}`)
      .send({ travelDate: TRAVEL_DATE, seatIds: [10, 11] });
    expect(bobClaim.status).toBe(409);
    expect(bobClaim.body.conflicts).toContain(10);

    // Bob's lock on 11 must NOT have been created (atomic claim).
    const list = await request(app)
      .get(`/api/routes/1/locks?date=${TRAVEL_DATE}`);
    expect(list.body.locks.map((l: any) => l.seatId)).toEqual([10]);
  });

  it('rejects unauthenticated claim attempts', async () => {
    const res = await request(app)
      .post('/api/routes/1/locks')
      .send({ travelDate: TRAVEL_DATE, seatIds: [1] });
    expect(res.status).toBe(401);
  });

  it('400s on missing date query param', async () => {
    const res = await request(app).get('/api/routes/1/locks');
    expect(res.status).toBe(400);
  });
});
