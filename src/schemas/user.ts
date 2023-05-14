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
  createdAt: z.instanceof(Date),
  updatedAt: z.instanceof(Date),
});

const CreateUserInputSchema = UserSchema.omit(
  {
    id: true, createdAt: true, updatedAt: true,
  },
);

const TokenSchema = z.object({
  token: z.string(),
});

export type User = z.infer<typeof UserSchema>;
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;
export type UserCredReq = z.infer<typeof userCredReqSchema>;
export type ChangePasswordReq = z.infer<typeof changePasswordReqSchema>;
export type Token = z.infer<typeof TokenSchema>;
