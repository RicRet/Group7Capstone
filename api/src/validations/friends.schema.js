import { z } from 'zod';

export const friendSearchSchema = {
  query: z.object({
    q: z.string().min(1).max(50)
  })
};

export const friendRequestSchema = {
  body: z.object({
    userId: z.string().uuid()
  })
};

export const friendRespondSchema = {
  params: z.object({
    userId: z.string().uuid()
  })
};
