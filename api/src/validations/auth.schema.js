import { z } from 'zod';

export const signupSchema = {
  body: z.object({
    username: z.string().min(1),
    email: z.string().min(1),
    password: z.string().min(8)
  })
};

export const loginSchema = {
  body: z.object({
    username: z.string().min(1),
    password: z.string().min(1)
  })
};
