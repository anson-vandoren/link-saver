import { z } from 'zod';
import { publicProcedure, router } from './trpc';
import User from './models/user';
import { loggedInProcedure } from './middleware/authenticate';
import Link from './models/link';

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
  link: router({
    delete: loggedInProcedure
      .input(z.number())
      .mutation(async (opts) => {
        const { input, ctx } = opts;
        const { user } = ctx;
        const { id: userId } = user;
        const linkId = input;
        const link = await Link.findOne({ where: { id: linkId, userId } });
        if (!link) {
          // TODO: tRPC error handling
          throw new Error('Link not found');
        }
        await link.destroy();
        return true; // TODO: return something useful
      }),
  }),
});
export type AppRouter = typeof appRouter;
