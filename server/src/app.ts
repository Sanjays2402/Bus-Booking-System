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

export interface AppOptions {
  enableRateLimit?: boolean;
  enableLogger?: boolean;
}

/**
 * Build a fresh express app instance. Extracted from `index.ts` so the test
 * suite can mount the API without binding to a port.
 */
export function createApp(options: AppOptions = {}): express.Express {
  const { enableRateLimit = true, enableLogger = true } = options;

  const app = express();
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(express.json());

  if (enableLogger) {
    app.use(
      morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
        skip: (req) => req.url === '/api/health',
      }),
    );
  }

  initDB();

  if (enableRateLimit) {
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 30,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many auth requests, please try again later.' },
    });
    app.use('/api/auth', authLimiter, authRoutes);
  } else {
    app.use('/api/auth', authRoutes);
  }
  app.use('/api/routes', routeRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/admin', adminRoutes);

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api', notFoundHandler);
  app.use(errorHandler);

  return app;
}
