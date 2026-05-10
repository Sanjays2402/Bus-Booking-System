import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../schemas';

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

export default router;
