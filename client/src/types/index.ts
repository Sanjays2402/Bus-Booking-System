export interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
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
  days_of_week: string;
  active: number;
  operator_name: string;
  bus_number: string;
  bus_type: string;
  total_seats: number;
  amenities: string;
  rating: number;
  booked_seats?: number;
  available_seats?: number;
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
  status?: 'available' | 'booked';
  price: number;
}

export interface Passenger {
  seatId: number;
  seatNumber: string;
  name: string;
  age: number;
  gender: string;
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
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  operator_name: string;
  bus_number: string;
  bus_type: string;
  passengers: {
    passenger_name: string;
    passenger_age: number;
    passenger_gender: string;
    seat_number: string;
    seat_type: string;
  }[];
}
