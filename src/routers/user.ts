import { TRPCError } from '@trpc/server';
import { changePassword, loginUser, registerUser } from '../controllers/user';
import { loggedInProcedure } from '../middleware/authenticate';
import { publicProcedure, router } from '../trpc';
import { changePasswordReqSchema, userCredReqSchema } from '../schemas/user';

export const userRouter = router({
  register: publicProcedure.input(userCredReqSchema).mutation(async (opts) => {
    const { input } = opts;
    const { username, password } = input;
    try {
      return await registerUser(username, password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message });
    }
  }),
  login: publicProcedure.input(userCredReqSchema).query(async (opts) => {
    const { input } = opts;
    const { username, password } = input;
    try {
      return await loginUser(username, password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message });
    }
  }),
  changePassword: loggedInProcedure.input(changePasswordReqSchema).mutation(async (opts) => {
    const { input, ctx } = opts;
    const { user } = ctx;
    if (!user || !user.username || (user.username !== input.username)) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Invalid username or password' });
    }
    const { username, password, newPassword } = input;
    try {
      return await changePassword(username, password, newPassword);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message });
    }
  }),
});
