import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router } from '../trpc';
import { loggedInProcedure } from '../middleware/authenticate';
import { deleteLink, updateLink } from '../controllers/linkController';

const updateLinkRequest = z.object({
  id: z.number(),
  title: z.string().optional(),
  url: z.string().optional(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export type UpdateLinkRequest = z.infer<typeof updateLinkRequest>;

export const linkRouter = router({
  delete: loggedInProcedure.input(z.number()).mutation(async (opts) => {
    const { input, ctx } = opts;
    const { user } = ctx;
    const { id: userId } = user;
    const linkId = input;
    const result = await deleteLink(linkId, userId);
    if (!result.success) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.reason });
    }
    return { success: true };
  }),
  update: loggedInProcedure.input(updateLinkRequest).mutation(async (opts) => {
    const { input, ctx } = opts;
    const { user } = ctx;
    const { id: userId } = user;
    const { id: linkId } = input;
    const result = await updateLink(linkId, userId, input);
    if (!result.success) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.reason });
    }
    return { success: true, link: result.newLink };
  }),
});
