import { TRPCError, initTRPC } from '@trpc/server';
import { Context } from '../context';

export const t = initTRPC.context<Context>().create();

const isLoggedIn = t.middleware(({ next, ctx }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  // TODO: check if user is authorized
  return next({
    ctx: {
      user: ctx.user,
    },
  });
});

// you can reuse this for any procedure
export const loggedInProcedure = t.procedure.use(isLoggedIn);
