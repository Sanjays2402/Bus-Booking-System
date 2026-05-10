import 'dotenv/config';
import { createApp } from './app';

const app = createApp();
const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET not set; using insecure default. Set JWT_SECRET in server/.env.');
}

app.listen(PORT, HOST, () => {
  console.log(`🚌 Bus Booking API running on http://${HOST}:${PORT}`);
});
