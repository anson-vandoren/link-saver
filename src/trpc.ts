import { TRPCError, initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { Context } from './context';

// TODO: consolidate w/ authenticate.ts
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

const maybeLoggedIn = t.middleware(({ next, ctx }) => next({
  ctx: {
    user: ctx.user,
  },
}));

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

export const { router } = t;
export const publicProcedure = t.procedure.use(maybeLoggedIn);
export const loggedInProcedure = t.procedure.use(isLoggedIn);
