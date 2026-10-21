import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'Full name must be at least 2 characters long' })
    .max(50, { message: 'Full name cannot exceed 50 characters' }),
  email: z
    .string()
    .trim()
    .email({ message: 'A valid email address is required' })
    .toLowerCase(),
  phone: z
    .string()
    .trim()
    .min(7, { message: 'Phone number must be at least 7 digits' })
    .max(20, { message: 'Phone number cannot exceed 20 digits' })
    .regex(/^[0-9+()-\s]+$/, { message: 'Phone number contains invalid characters' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long' })
    .regex(/[0-9]/, { message: 'Password must contain at least one numeric digit' })
    .regex(/[a-zA-Z]/, { message: 'Password must contain at least one letter' }),
  role: z.enum(['tenant', 'owner'], {
    errorMap: () => ({ message: 'Role must be either tenant or owner' }),
  }),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: 'A valid email address is required' })
    .toLowerCase(),
  password: z
    .string()
    .min(1, { message: 'Password is required' }),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: 'A valid email address is required' })
    .toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, { message: 'Reset token is required' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long' })
    .regex(/[0-9]/, { message: 'Password must contain at least one numeric digit' })
    .regex(/[a-zA-Z]/, { message: 'Password must contain at least one letter' }),
});

export const firebaseAuthSchema = z.object({
  idToken: z.string().min(1, { message: 'Firebase ID token is required' }),
  role: z
    .enum(['tenant', 'owner'], {
      errorMap: () => ({ message: 'Role must be either tenant or owner' }),
    })
    .optional(),
});
