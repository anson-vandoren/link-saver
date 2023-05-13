import { inferAsyncReturnType } from '@trpc/server';
import * as trpcStandalone from '@trpc/server/adapters/standalone';
import { decodeAndVerifyJwtToken } from './jwt';
import { User } from './models/user';

// TODO: if not using sequelize, the db connection could go in the context: https://trpc.io/docs/server/context

export function createContext({ req, res }: trpcStandalone.CreateHTTPContextOptions) {
  // Create your context based on the request object
  // Will be available as `ctx` in all your resolvers

  function getUserFromHeader(): User | undefined {
    if (req.headers.authorization) {
      const user = decodeAndVerifyJwtToken(req.headers.authorization.split(' ')[1]);
      return user;
    }
    return undefined;
  }

  const user = getUserFromHeader();

  return {
    user,
  };
}
export type Context = inferAsyncReturnType<typeof createContext>;
