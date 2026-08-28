import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(10, 'Refresh token required'),
});

export const RegisterUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  title: z.string().optional(),
  roles: z.array(z.enum(['ADMIN', 'TECHNICIAN', 'MICROBIOLOGIST', 'REVIEWER', 'VIEWER'])).min(1, 'At least one role required'),
});

export type LoginDto = z.infer<typeof LoginSchema>;
export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;
export type RegisterUserDto = z.infer<typeof RegisterUserSchema>;
