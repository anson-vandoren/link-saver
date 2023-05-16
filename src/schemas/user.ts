import { z } from 'zod';

export const userCredReqSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const changePasswordReqSchema = userCredReqSchema.extend({
  newPassword: z.string(),
});

export const UserSchema = z.object({
  id: z.number(),
  username: z.string(),
  password: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type User = z.infer<typeof UserSchema>;

const CreateUserInputSchema = UserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

const TokenSchema = z.object({
  token: z.string(),
});
export type Token = z.infer<typeof TokenSchema>;
