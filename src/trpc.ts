import superjson from 'superjson';
import { initTRPC } from '@trpc/server';
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

export const { router } = t;
export const publicProcedure = t.procedure.use(maybeLoggedIn);
