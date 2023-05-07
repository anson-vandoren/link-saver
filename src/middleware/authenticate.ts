import { TRPCError, initTRPC } from '@trpc/server';
import { Context } from '../context';

export const t = initTRPC.context<Context>().create();

const isLoggedIn = t.middleware((opts) => {
  const { ctx } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  // TODO: check if user is authorized
  return opts.next(opts);
});

// you can reuse this for any procedure
export const loggedInProcedure = t.procedure.use(isLoggedIn);
