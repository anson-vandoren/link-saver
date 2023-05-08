import { inferAsyncReturnType } from '@trpc/server';
import * as trpcStandalone from '@trpc/server/adapters/standalone';
import { decodeAndVerifyJwtToken } from './jwt';
import User from './models/user';

// TODO: if not using sequelize, the db connection could go in the context: https://trpc.io/docs/server/context

export async function createContext({ req, res }: trpcStandalone.CreateHTTPContextOptions) {
  // Create your context based on the request object
  // Will be available as `ctx` in all your resolvers

  // This is just an example of something you might want to do in your ctx fn
  async function getUserFromHeader(): Promise<User> {
    if (req.headers.authorization) {
      const user = await decodeAndVerifyJwtToken(req.headers.authorization.split(' ')[1]);
      return user;
    }
    throw new Error('No user found');
  }
  const user = await getUserFromHeader();

  return {
    user,
  };
}
export type Context = inferAsyncReturnType<typeof createContext>;
