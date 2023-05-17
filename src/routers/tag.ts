import { getTags, purgeUnusedTags } from '../controllers/tag';
import { TagOpResSchema, tagReqSchema } from '../schemas/tag';
import { loggedInProcedure, publicProcedure, router } from '../trpc';

export const tagRouter = router({
  get: publicProcedure.input(tagReqSchema).query((opts) => {
    const { input, ctx } = opts;
    const { query, sortBy } = input;
    const { db } = ctx;
    const tags = getTags(db, query, sortBy);
    return TagOpResSchema.parse({
      success: true,
      tags,
    });
  }),
  purgeUnused: loggedInProcedure.mutation((opts) => {
    // TODO: if multi-user, who should be able to do this?
    const { ctx } = opts;
    const { db } = ctx;
    const numPurged = purgeUnusedTags(db);
    return numPurged;
  }),
});
