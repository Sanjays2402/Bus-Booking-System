import db, { initDB } from './index';
import bcrypt from 'bcryptjs';

initDB();

console.log('🌱 Seeding database...');

// Clear existing data
db.exec(`
  DELETE FROM booking_details;
  DELETE FROM bookings;
  DELETE FROM seats;
  DELETE FROM routes;
  DELETE FROM buses;
  DELETE FROM users;
`);

// Create admin user
const adminPass = bcrypt.hashSync('admin123', 10);
const userPass = bcrypt.hashSync('user123', 10);

db.prepare(`INSERT INTO users (email, name, password, role) VALUES (?, ?, ?, ?)`).run('admin@busbooking.com', 'Admin User', adminPass, 'admin');
db.prepare(`INSERT INTO users (email, name, password, role) VALUES (?, ?, ?, ?)`).run('demo@example.com', 'Demo User', userPass, 'user');

// Buses
const buses = [
  { operator: 'Greyhound', number: 'GH-1001', type: 'AC Seater', seats: 40, amenities: '["WiFi","USB Charging","Reclining Seats"]', rating: 4.2 },
  { operator: 'Greyhound', number: 'GH-1002', type: 'AC Sleeper', seats: 30, amenities: '["WiFi","USB Charging","Blanket","Pillow"]', rating: 4.5 },
  { operator: 'FlixBus', number: 'FB-2001', type: 'AC Seater', seats: 44, amenities: '["WiFi","Power Outlets","Extra Legroom"]', rating: 4.3 },
  { operator: 'FlixBus', number: 'FB-2002', type: 'Non-AC Seater', seats: 44, amenities: '["WiFi","USB Charging"]', rating: 3.8 },
  { operator: 'BoltBus', number: 'BB-3001', type: 'AC Seater', seats: 40, amenities: '["WiFi","Power Outlets","Leather Seats"]', rating: 4.4 },
  { operator: 'BoltBus', number: 'BB-3002', type: 'AC Sleeper', seats: 30, amenities: '["WiFi","USB Charging","Blanket","Snacks"]', rating: 4.6 },
  { operator: 'Megabus', number: 'MB-4001', type: 'Non-AC Seater', seats: 48, amenities: '["WiFi"]', rating: 3.5 },
  { operator: 'Megabus', number: 'MB-4002', type: 'AC Seater', seats: 40, amenities: '["WiFi","USB Charging","Reclining Seats"]', rating: 4.0 },
  { operator: 'Pacific Coach', number: 'PC-5001', type: 'AC Sleeper', seats: 28, amenities: '["WiFi","USB Charging","Blanket","Pillow","Snacks"]', rating: 4.7 },
  { operator: 'Coast Express', number: 'CE-6001', type: 'AC Seater', seats: 36, amenities: '["WiFi","Power Outlets","Extra Legroom","Snacks"]', rating: 4.5 },
  { operator: 'RedCoach', number: 'RC-7001', type: 'AC Sleeper', seats: 26, amenities: '["WiFi","Power Outlets","Blanket","Pillow","Entertainment"]', rating: 4.8 },
  { operator: 'OurBus', number: 'OB-8001', type: 'AC Seater', seats: 40, amenities: '["WiFi","USB Charging"]', rating: 4.1 },
];

const insertBus = db.prepare(`INSERT INTO buses (operator_name, bus_number, bus_type, total_seats, amenities, rating) VALUES (?, ?, ?, ?, ?, ?)`);
for (const b of buses) {
  insertBus.run(b.operator, b.number, b.type, b.seats, b.amenities, b.rating);
}

// Generate seats for each bus
const insertSeat = db.prepare(`INSERT INTO seats (bus_id, seat_number, seat_type, row_number, column_number, price_multiplier, deck) VALUES (?, ?, ?, ?, ?, ?, ?)`);

function generateSeats(busId: number, totalSeats: number, isSleeper: boolean) {
  const cols = isSleeper ? 3 : 4; // sleeper: 3 across, seater: 4 across (2+2)
  const rows = Math.ceil(totalSeats / cols);
  let seatCount = 0;

  for (let row = 1; row <= rows && seatCount < totalSeats; row++) {
    for (let col = 1; col <= cols && seatCount < totalSeats; col++) {
      seatCount++;
      const isWindow = col === 1 || col === cols;
      const isAisle = isSleeper ? col === 2 : (col === 2 || col === 3);
      const seatType = isWindow ? 'Window' : isAisle ? 'Aisle' : 'Middle';
      
      // Front rows and window seats cost more
      let multiplier = 1.0;
      if (row <= 3) multiplier += 0.15; // front rows premium
      if (seatType === 'Window') multiplier += 0.10;
      if (seatType === 'Middle') multiplier -= 0.05;
      
      const seatNum = `${String.fromCharCode(64 + row)}${col}`;
      const deck = isSleeper && seatCount > totalSeats / 2 ? 'upper' : 'lower';
      
      insertSeat.run(busId, seatNum, seatType, row, col, Math.round(multiplier * 100) / 100, deck);
    }
  }
}

const allBuses = db.prepare('SELECT * FROM buses').all() as any[];
for (const bus of allBuses) {
  generateSeats(bus.id, bus.total_seats, bus.bus_type.includes('Sleeper'));
}

// Routes
const routes = [
  { busId: 1, origin: 'Seattle', dest: 'Portland', dep: '06:00', arr: '09:30', dur: 210, price: 25 },
  { busId: 2, origin: 'Seattle', dest: 'Portland', dep: '22:00', arr: '01:30', dur: 210, price: 35 },
  { busId: 3, origin: 'San Francisco', dest: 'Los Angeles', dep: '07:00', arr: '13:00', dur: 360, price: 45 },
  { busId: 4, origin: 'San Francisco', dest: 'Los Angeles', dep: '14:00', arr: '20:00', dur: 360, price: 30 },
  { busId: 5, origin: 'Los Angeles', dest: 'Las Vegas', dep: '08:00', arr: '12:30', dur: 270, price: 35 },
  { busId: 6, origin: 'Los Angeles', dest: 'Las Vegas', dep: '20:00', arr: '00:30', dur: 270, price: 50 },
  { busId: 7, origin: 'Portland', dest: 'San Francisco', dep: '06:30', arr: '16:30', dur: 600, price: 40 },
  { busId: 8, origin: 'Seattle', dest: 'San Francisco', dep: '07:00', arr: '20:00', dur: 780, price: 55 },
  { busId: 9, origin: 'Las Vegas', dest: 'Phoenix', dep: '09:00', arr: '13:30', dur: 270, price: 40 },
  { busId: 10, origin: 'San Francisco', dest: 'Sacramento', dep: '08:00', arr: '10:00', dur: 120, price: 18 },
  { busId: 11, origin: 'Los Angeles', dest: 'San Diego', dep: '10:00', arr: '12:30', dur: 150, price: 22 },
  { busId: 12, origin: 'Seattle', dest: 'Vancouver', dep: '09:00', arr: '13:00', dur: 240, price: 30 },
  { busId: 1, origin: 'Portland', dest: 'Seattle', dep: '15:00', arr: '18:30', dur: 210, price: 25 },
  { busId: 3, origin: 'Los Angeles', dest: 'San Francisco', dep: '08:00', arr: '14:00', dur: 360, price: 45 },
  { busId: 5, origin: 'Las Vegas', dest: 'Los Angeles', dep: '14:00', arr: '18:30', dur: 270, price: 35 },
];

const insertRoute = db.prepare(`INSERT INTO routes (bus_id, origin, destination, departure_time, arrival_time, duration_minutes, price_base, days_of_week) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
for (const r of routes) {
  insertRoute.run(r.busId, r.origin, r.dest, r.dep, r.arr, r.dur, r.price, 'Mon,Tue,Wed,Thu,Fri,Sat,Sun');
}

console.log('✅ Seeded:');
console.log(`   ${allBuses.length} buses`);
console.log(`   ${db.prepare('SELECT COUNT(*) as c FROM seats').get()?.c || 0} seats`);
console.log(`   ${routes.length} routes`);
console.log(`   2 users (admin@busbooking.com / admin123, demo@example.com / user123)`);
console.log('🎉 Done!');
