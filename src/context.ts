import { inferAsyncReturnType } from '@trpc/server';
import * as trpcStandalone from '@trpc/server/adapters/standalone';
import { decodeAndVerifyJwtToken } from './jwt';
import type { User } from './schemas/user';
import { DbContext } from './db';

export function createContext({ req, res: _res }: trpcStandalone.CreateHTTPContextOptions) {
  // Create your context based on the request object
  // Will be available as `ctx` in all your resolvers
  const db = DbContext.create();

  function getUserFromHeader(): User | undefined {
    if (req.headers.authorization) {
      const user = decodeAndVerifyJwtToken(db, req.headers.authorization.split(' ')[1]);
      return user;
    }
    return undefined;
  }

  const user = getUserFromHeader();

  return {
    user,
    db,
  };
}
export type Context = inferAsyncReturnType<typeof createContext>;
