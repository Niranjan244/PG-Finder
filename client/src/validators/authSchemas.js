import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email address is required' })
    .email({ message: 'Enter a valid email address' })
    .toLowerCase(),
  password: z
    .string()
    .min(1, { message: 'Password is required' }),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(50, { message: 'Name cannot exceed 50 characters' }),
  email: z
    .string()
    .trim()
    .min(1, { message: 'Email address is required' })
    .email({ message: 'Enter a valid email address' })
    .toLowerCase(),
  phone: z
    .string()
    .trim()
    .min(7, { message: 'Phone number must be at least 7 digits' })
    .max(20, { message: 'Phone number cannot exceed 20 digits' })
    .regex(/^[0-9+()-\s]+$/, { message: 'Please enter a valid phone number' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[0-9]/, { message: 'Must include at least one number' })
    .regex(/[a-zA-Z]/, { message: 'Must include at least one letter' }),
  confirmPassword: z
    .string()
    .min(1, { message: 'Please confirm your password' }),
  role: z.enum(['tenant', 'owner'], {
    errorMap: () => ({ message: 'Please select whether you are a Tenant or PG Owner' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
