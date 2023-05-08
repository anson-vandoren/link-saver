import { z } from 'zod';
import { publicProcedure, router } from './trpc';
import User from './models/user';
import { linkRouter } from './routers/link';

// tRPC
export const appRouter = router({
  userList: publicProcedure
    .query(async () => {
      const users = await User.findAll();
      return users;
    }),
  userById: publicProcedure
    .input(z.string())
    .query(async (opts) => {
      const { input } = opts;
      const user = await User.findByPk(input);

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    }),
  link: linkRouter,
});
export type AppRouter = typeof appRouter;
