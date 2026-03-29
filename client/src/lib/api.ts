const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${url}`, { ...options, headers: { ...headers, ...options?.headers } });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) => request<{ token: string; user: any }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (email: string, name: string, password: string) => request<{ token: string; user: any }>('/auth/register', { method: 'POST', body: JSON.stringify({ email, name, password }) }),
  getMe: () => request<any>('/auth/me'),

  // Routes
  searchRoutes: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return request<any[]>(`/routes/search?${qs}`);
  },
  getRoute: (id: number) => request<any>(`/routes/${id}`),
  getSeats: (routeId: number, date: string) => request<any[]>(`/routes/${routeId}/seats?date=${date}`),
  getCities: () => request<string[]>('/routes/cities/list'),

  // Bookings
  createBooking: (data: { routeId: number; travelDate: string; passengers: any[] }) =>
    request<any>('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  getMyBookings: () => request<any[]>('/bookings/my'),
  cancelBooking: (bookingId: string) => request<any>(`/bookings/${bookingId}/cancel`, { method: 'PATCH' }),

  // Admin
  getAdminRoutes: () => request<any[]>('/admin/routes'),
  addRoute: (data: any) => request<any>('/admin/routes', { method: 'POST', body: JSON.stringify(data) }),
  updateRoute: (id: number, data: any) => request<any>(`/admin/routes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRoute: (id: number) => request<any>(`/admin/routes/${id}`, { method: 'DELETE' }),
  getAdminBuses: () => request<any[]>('/admin/buses'),
  getRouteBookings: (id: number) => request<any[]>(`/admin/routes/${id}/bookings`),
  getRevenue: () => request<any>('/admin/revenue'),
};
