export interface User {
  id: number;
  email: string;
  name: string;
  password: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface Bus {
  id: number;
  operator_name: string;
  bus_number: string;
  bus_type: 'AC Seater' | 'Non-AC Seater' | 'AC Sleeper' | 'Non-AC Sleeper';
  total_seats: number;
  amenities: string;
  rating: number;
}

export interface Route {
  id: number;
  bus_id: number;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  price_base: number;
  days_of_week: string; // comma-separated: "Mon,Tue,Wed..."
  active: number;
}

export interface Seat {
  id: number;
  bus_id: number;
  seat_number: string;
  seat_type: 'Window' | 'Aisle' | 'Middle';
  row_number: number;
  column_number: number;
  price_multiplier: number;
  deck: 'lower' | 'upper';
}

export interface Booking {
  id: number;
  booking_id: string;
  user_id: number;
  route_id: number;
  travel_date: string;
  status: 'confirmed' | 'cancelled';
  total_amount: number;
  created_at: string;
}

export interface BookingDetail {
  id: number;
  booking_id: number;
  seat_id: number;
  passenger_name: string;
  passenger_age: number;
  passenger_gender: string;
}
