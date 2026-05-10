import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { initDB } from './db';
import authRoutes from './routes/auth';
import routeRoutes from './routes/routes';
import bookingRoutes from './routes/bookings';
import adminRoutes from './routes/admin';
import { errorHandler, notFoundHandler } from './middleware/errors';

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET not set; using insecure default. Set JWT_SECRET in server/.env.');
}

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    skip: (req) => req.url === '/api/health',
  }),
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth requests, please try again later.' },
});

// Init database
initDB();

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// 404 + error handlers
app.use('/api', notFoundHandler);
app.use(errorHandler);

app.listen(PORT, HOST, () => {
  console.log(`🚌 Bus Booking API running on http://${HOST}:${PORT}`);
});
