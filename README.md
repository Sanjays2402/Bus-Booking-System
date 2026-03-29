# 🚌 BusGo — Bus Booking System

A modern, full-stack bus booking platform with a stunning glassmorphism UI. Search routes, select seats from an interactive seat map, book tickets, and manage bookings — all in a beautiful dark-themed interface.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)

## ✨ Features

### 🔍 Search & Browse
- Search buses by origin, destination, and travel date
- Filter by bus type (AC/Non-AC, Seater/Sleeper)
- Sort by price, departure time, duration, or rating
- Real-time seat availability display

### 🪑 Interactive Seat Selection
- Visual seat map with grid layout
- Color-coded seats: 🟢 Available · 🔵 Selected · 🔴 Booked
- Dynamic pricing — window seats & front rows cost more
- Real-time price calculation as you select

### 🎫 Complete Booking Flow
- Select seats → Enter passenger details → Review → Confirm
- Unique ticket ID for every booking
- Instant booking confirmation with ticket summary

### 👤 User System
- JWT-based authentication (register/login)
- Profile page with full booking history
- Cancel bookings with tiered refund policy:
  - \>24h before travel: 100% refund
  - 12-24h: 75% refund
  - 2-12h: 50% refund
  - <2h: No refund

### 🚌 Admin Dashboard
- View and manage all bus routes
- View bookings per route
- Revenue analytics by operator and route
- Delete routes

### 🎨 Design
- **Glassmorphism UI** — frosted glass cards, backdrop blur, translucent layers
- **Dark theme** — deep purple-to-indigo gradient background
- **Animated** — fade-ins, hover transitions, glowing accents
- **Responsive** — works on mobile, tablet, and desktop
- **Modern typography** with Inter font

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + Custom Glassmorphism |
| Backend | Node.js + Express + TypeScript |
| Database | SQLite (via better-sqlite3) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Icons | Lucide React |

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/Sanjays2402/Bus-Booking-System.git
cd Bus-Booking-System

# Install all dependencies
npm run install:all

# Seed the database with sample data
npm run seed

# Start both frontend and backend
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| User | demo@example.com | user123 |
| Admin | admin@busbooking.com | admin123 |

## 📁 Project Structure

```
Bus-Booking-System/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   │   ├── HomePage.tsx          # Landing page with search
│   │   │   ├── SearchResults.tsx     # Route search results
│   │   │   ├── SeatSelection.tsx     # Interactive seat map
│   │   │   ├── BookingPage.tsx       # Passenger details form
│   │   │   ├── BookingConfirmation.tsx # Booking success page
│   │   │   ├── ProfilePage.tsx       # User profile & bookings
│   │   │   ├── AdminDashboard.tsx    # Admin panel
│   │   │   └── AuthPage.tsx          # Login & register
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # API client
│   │   └── types/           # TypeScript types
│   └── package.json
├── server/                  # Express backend
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   │   ├── auth.ts      # Authentication
│   │   │   ├── routes.ts    # Bus route search & seats
│   │   │   ├── bookings.ts  # Booking CRUD
│   │   │   └── admin.ts     # Admin operations
│   │   ├── middleware/       # Auth middleware
│   │   ├── db/              # Database setup & seed
│   │   └── types/           # TypeScript types
│   └── package.json
├── package.json             # Root — runs both services
└── README.md
```

## 🗄️ Database Schema

```sql
users        → id, email, name, password, role, created_at
buses        → id, operator_name, bus_number, bus_type, total_seats, amenities, rating
routes       → id, bus_id, origin, destination, departure/arrival_time, duration, price
seats        → id, bus_id, seat_number, seat_type, row, column, price_multiplier, deck
bookings     → id, booking_id, user_id, route_id, travel_date, status, total_amount
booking_details → id, booking_id, seat_id, passenger_name, age, gender
```

## 📊 Seed Data

Pre-loaded with **12 buses** from 5 operators across **15 routes** between major US cities:

- **Operators:** Greyhound, FlixBus, BoltBus, Megabus, Pacific Coach, Coast Express, RedCoach, OurBus
- **Cities:** Seattle, Portland, San Francisco, Los Angeles, Las Vegas, Phoenix, Sacramento, San Diego, Vancouver
- **Price range:** $18 – $55 base (with seat multipliers)
- **Bus types:** AC Seater, Non-AC Seater, AC Sleeper, Non-AC Sleeper

## 📝 API Endpoints

### Auth
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get current user

### Routes
- `GET /api/routes/search` — Search routes (query: origin, destination, date, busType, sortBy)
- `GET /api/routes/:id` — Get route details
- `GET /api/routes/:id/seats` — Get seat map with availability
- `GET /api/routes/cities/list` — Get all cities for autocomplete

### Bookings
- `POST /api/bookings` — Create booking
- `GET /api/bookings/my` — Get user's bookings
- `PATCH /api/bookings/:id/cancel` — Cancel booking

### Admin
- `GET /api/admin/routes` — All routes
- `POST /api/admin/routes` — Add route
- `PUT /api/admin/routes/:id` — Update route
- `DELETE /api/admin/routes/:id` — Delete route
- `GET /api/admin/routes/:id/bookings` — Route bookings
- `GET /api/admin/revenue` — Revenue summary

## 📄 License

MIT

---

Built by [Sanjay Santhanam](https://github.com/Sanjays2402)
