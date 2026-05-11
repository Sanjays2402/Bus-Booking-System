import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp({ enableRateLimit: false, enableLogger: false });

const uniqueEmail = (label = 'reset') =>
  `vitest-${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

describe('password reset', () => {
  it('issues a dev token and lets the user reset their password', async () => {
    const email = uniqueEmail();
    const oldPw = 'old-password-123';
    const newPw = 'brand-new-password-456';

    await request(app)
      .post('/api/auth/register')
      .send({ email, name: 'Reset Tester', password: oldPw })
      .expect(201);

    const forgot = await request(app).post('/api/auth/forgot').send({ email });
    expect(forgot.status).toBe(200);
    expect(forgot.body.devToken).toBeTruthy();
    expect(forgot.body.expiresAt).toBeTruthy();

    const reset = await request(app)
      .post('/api/auth/reset')
      .send({ token: forgot.body.devToken, newPassword: newPw });
    expect(reset.status).toBe(200);

    // Old password no longer works.
    const failedLogin = await request(app)
      .post('/api/auth/login')
      .send({ email, password: oldPw });
    expect(failedLogin.status).toBe(401);

    // New password works.
    const okLogin = await request(app)
      .post('/api/auth/login')
      .send({ email, password: newPw });
    expect(okLogin.status).toBe(200);
    expect(okLogin.body.token).toBeTruthy();
  });

  it('always returns 200 even for unknown emails (no enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/forgot')
      .send({ email: 'ghost-' + Date.now() + '@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.devToken).toBeUndefined();
  });

  it('rejects reuse of a consumed token', async () => {
    const email = uniqueEmail('reuse');
    await request(app)
      .post('/api/auth/register')
      .send({ email, name: 'Reuse Tester', password: 'first-pass' })
      .expect(201);

    const { body } = await request(app).post('/api/auth/forgot').send({ email });
    await request(app)
      .post('/api/auth/reset')
      .send({ token: body.devToken, newPassword: 'second-pass' })
      .expect(200);

    const replay = await request(app)
      .post('/api/auth/reset')
      .send({ token: body.devToken, newPassword: 'third-pass' });
    expect(replay.status).toBe(400);
  });

  it('rejects an invalid reset token', async () => {
    const res = await request(app)
      .post('/api/auth/reset')
      .send({ token: 'a'.repeat(64), newPassword: 'anything-pass' });
    expect(res.status).toBe(400);
  });
});
