import { z } from 'zod';

export const signupSchema = {
  body: z.object({
    username: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1).max(80).optional(),
    lastName: z.string().min(1).max(80).optional()
  })
};

export const loginSchema = {
  body: z.object({
    username: z.string().min(1),
    password: z.string().min(1)
  })
};

export const emailCheckSchema = {
  body: z.object({
    email: z.string().email()
  })
};
