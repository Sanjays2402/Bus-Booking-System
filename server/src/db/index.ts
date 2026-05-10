import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'bus_booking.db');

// Ensure data directory exists
import fs from 'fs';
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user' CHECK(role IN ('user','admin')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS buses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operator_name TEXT NOT NULL,
      bus_number TEXT NOT NULL,
      bus_type TEXT NOT NULL CHECK(bus_type IN ('AC Seater','Non-AC Seater','AC Sleeper','Non-AC Sleeper')),
      total_seats INTEGER NOT NULL,
      amenities TEXT DEFAULT '[]',
      rating REAL DEFAULT 4.0
    );

    CREATE TABLE IF NOT EXISTS routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bus_id INTEGER NOT NULL REFERENCES buses(id),
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      departure_time TEXT NOT NULL,
      arrival_time TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      price_base REAL NOT NULL,
      days_of_week TEXT DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS seats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bus_id INTEGER NOT NULL REFERENCES buses(id),
      seat_number TEXT NOT NULL,
      seat_type TEXT NOT NULL CHECK(seat_type IN ('Window','Aisle','Middle')),
      row_number INTEGER NOT NULL,
      column_number INTEGER NOT NULL,
      price_multiplier REAL DEFAULT 1.0,
      deck TEXT DEFAULT 'lower' CHECK(deck IN ('lower','upper'))
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id),
      route_id INTEGER NOT NULL REFERENCES routes(id),
      travel_date TEXT NOT NULL,
      status TEXT DEFAULT 'confirmed' CHECK(status IN ('confirmed','cancelled')),
      total_amount REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS booking_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL REFERENCES bookings(id),
      seat_id INTEGER NOT NULL REFERENCES seats(id),
      passenger_name TEXT NOT NULL,
      passenger_age INTEGER NOT NULL,
      passenger_gender TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id INTEGER NOT NULL REFERENCES routes(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(route_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_routes_origin_dest ON routes(origin, destination);
    CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_route_date ON bookings(route_id, travel_date);
    CREATE INDEX IF NOT EXISTS idx_seats_bus ON seats(bus_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_route ON reviews(route_id);
  `);
}

export default db;
