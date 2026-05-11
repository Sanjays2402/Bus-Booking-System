import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db from '../db';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../schemas';

const router = Router();

router.post('/register', validate(registerSchema), (req, res) => {
  const { email, name, password } = req.body;

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare('INSERT INTO users (email, name, password) VALUES (?, ?, ?)')
    .run(email, name, hash);
  const token = generateToken(Number(result.lastInsertRowid), 'user');

  res
    .status(201)
    .json({ token, user: { id: result.lastInsertRowid, email, name, role: 'user' } });
});

router.post('/login', validate(loginSchema), (req, res) => {
  const { email, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken(user.id, user.role);
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

router.get('/me', authMiddleware, (req: AuthRequest, res) => {
  const user = db.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?').get(req.userId!) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

/**
 * POST /api/auth/forgot
 *
 * Issue a short-lived (30 min) password-reset token. In production this token
 * would be emailed to the user; here we log it and — only when
 * NODE_ENV !== 'production' — return it directly in the response so the
 * client/test flow can complete without an SMTP service.
 *
 * Always returns 200 to avoid leaking which emails are registered.
 */
router.post('/forgot', validate(forgotPasswordSchema), (req, res) => {
  const { email } = req.body as { email: string };
  const user = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email) as
    | { id: number; email: string }
    | undefined;

  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    db.prepare(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
    ).run(user.id, token, expiresAt);

    // TODO(prod): replace this log with an actual transactional email send.
    // Logging the token is acceptable in dev/test only.
    console.log(`[auth] DEV-ONLY password reset token for ${user.email}: ${token}`);

    if (process.env.NODE_ENV !== 'production') {
      return res.json({ message: 'Reset link sent', devToken: token, expiresAt });
    }
  }

  res.json({ message: 'If that email exists, a reset link has been sent.' });
});

/**
 * POST /api/auth/reset
 *
 * Consume a valid, unexpired, unused reset token and replace the user's
 * password. The token is single-use — we mark it used on success.
 */
router.post('/reset', validate(resetPasswordSchema), (req, res) => {
  const { token, newPassword } = req.body as { token: string; newPassword: string };
  const row = db
    .prepare(
      'SELECT id, user_id, expires_at, used FROM password_resets WHERE token = ?',
    )
    .get(token) as
    | { id: number; user_id: number; expires_at: string; used: number }
    | undefined;

  if (!row) return res.status(400).json({ error: 'Invalid or expired reset token' });
  if (row.used) return res.status(400).json({ error: 'Reset token has already been used' });
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return res.status(400).json({ error: 'Reset token has expired' });
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  const tx = db.transaction(() => {
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, row.user_id);
    db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(row.id);
  });
  tx();

  res.json({ message: 'Password updated. You can now log in with your new password.' });
});

export default router;
