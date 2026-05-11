import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(80),
  password: z.string().min(6).max(120),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(16).max(128),
  newPassword: z.string().min(6).max(120),
});

export const passengerSchema = z.object({
  seatId: z.number().int().positive(),
  name: z.string().min(1).max(80),
  age: z.number().int().min(0).max(120),
  gender: z.enum(['M', 'F', 'O', 'male', 'female', 'other']).optional().default('O'),
});

export const createBookingSchema = z.object({
  routeId: z.number().int().positive(),
  travelDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  passengers: z.array(passengerSchema).min(1).max(10),
  promoCode: z.string().trim().max(40).optional(),
});
