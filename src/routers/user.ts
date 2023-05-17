import { TRPCError } from '@trpc/server';
import { changePassword, loginUser, registerUser } from '../controllers/user';
import { changePasswordReqSchema, userCredReqSchema } from '../schemas/user';
import { loggedInProcedure, publicProcedure, router } from '../trpc';

export const userRouter = router({
  register: publicProcedure.input(userCredReqSchema).mutation(async (opts) => {
    const { input, ctx } = opts;
    const { db } = ctx;
    const { username, password } = input;
    try {
      return await registerUser(db, username, password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message });
    }
  }),
  login: publicProcedure.input(userCredReqSchema).query(async (opts) => {
    const { input, ctx } = opts;
    const { username, password } = input;
    const { db } = ctx;
    try {
      return await loginUser(db, username, password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message });
    }
  }),
  changePassword: loggedInProcedure.input(changePasswordReqSchema).mutation(async (opts) => {
    const { input, ctx } = opts;
    const { db, user } = ctx;
    if (!user || !user.username || user.username !== input.username) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Invalid username or password' });
    }
    const { username, password, newPassword } = input;
    try {
      return await changePassword(db, username, password, newPassword);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message });
    }
  }),
});
