import { router } from '../trpc';
import { linkRouter } from './link';
import { tagRouter } from './tag';
import { userRouter } from './user';

// tRPC
export const appRouter = router({
  link: linkRouter,
  tag: tagRouter,
  user: userRouter,
});
export type AppRouter = typeof appRouter;
