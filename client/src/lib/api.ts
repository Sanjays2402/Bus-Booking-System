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
  forgotPassword: (email: string) =>
    request<{ message: string; devToken?: string; expiresAt?: string }>('/auth/forgot', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, newPassword: string) =>
    request<{ message: string }>('/auth/reset', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),

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
  validatePromo: (code: string, total: number) =>
    request<{ code: string; discount: number; finalTotal: number }>(
      '/bookings/validate-promo',
      { method: 'POST', body: JSON.stringify({ code, total }) },
    ),
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
  getAuditLog: (params: { entity?: string; action?: string; limit?: number; offset?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.entity) qs.set('entity', params.entity);
    if (params.action) qs.set('action', params.action);
    if (params.limit != null) qs.set('limit', String(params.limit));
    if (params.offset != null) qs.set('offset', String(params.offset));
    return request<{ total: number; limit: number; offset: number; items: any[] }>(
      `/admin/audit${qs.toString() ? `?${qs}` : ''}`,
    );
  },

  // Seat locks
  getSeatLocks: (routeId: number, date: string) =>
    request<{ locks: { seatId: number; expiresAt: number }[] }>(
      `/routes/${routeId}/locks?date=${date}`,
    ),
  claimSeatLocks: (routeId: number, travelDate: string, seatIds: number[]) =>
    request<{ ok: boolean; expiresAt: number }>(`/routes/${routeId}/locks`, {
      method: 'POST',
      body: JSON.stringify({ travelDate, seatIds }),
    }),
  releaseSeatLocks: (routeId: number, travelDate: string, seatIds: number[]) =>
    request<{ released: number }>(`/routes/${routeId}/locks`, {
      method: 'DELETE',
      body: JSON.stringify({ travelDate, seatIds }),
    }),
};
