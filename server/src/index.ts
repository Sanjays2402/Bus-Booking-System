import express from 'express';
import cors from 'cors';
import { initDB } from './db';
import authRoutes from './routes/auth';
import routeRoutes from './routes/routes';
import bookingRoutes from './routes/bookings';
import adminRoutes from './routes/admin';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Init database
initDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`🚌 Bus Booking API running on http://localhost:${PORT}`);
});
