import { z } from 'zod';

export const loginSchema = {
  body: z.object({
    username: z.string().min(1),
    password: z.string().min(1)
  })
};
