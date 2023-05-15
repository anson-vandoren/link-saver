import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { publicProcedure, router } from '../trpc';
import { loggedInProcedure } from '../middleware/authenticate';
import {
  createLink,
  deleteLink,
  updateLink,
  getLink,
  getLinks,
  exportLinks,
  importLinks,
  scrapeFQDN,
} from '../controllers/link';
import { ApiLinkSchema } from '../schemas/link';

export const linkRouter = router({
  create: loggedInProcedure.input(ApiLinkSchema).mutation((opts) => {
    const { input, ctx } = opts;
    const { user } = ctx;
    const { id: userId } = user;
    const result = createLink(userId, input);
    if (!result.success) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.error });
    }
    return result.data;
  }),
  delete: loggedInProcedure.input(z.number()).mutation((opts) => {
    const { input, ctx } = opts;
    const { user } = ctx;
    const { id: userId } = user;
    const linkId = input;
    const success = deleteLink(linkId, userId);
    if (!success) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete link' });
    }
    return true;
  }),
  update: loggedInProcedure.input(ApiLinkSchema).mutation((opts) => {
    const { input, ctx } = opts;
    const { user } = ctx;
    const { id: userId } = user;
    const result = updateLink(userId, input);
    if (!result.success) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.error });
    }
    return result.data;
  }),
  getOne: publicProcedure.input(z.number()).query((opts) => {
    const { input, ctx } = opts;
    const { user } = ctx;
    const userId = user?.id;
    const result = getLink(input, userId);
    if (!result.success) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.error });
    }
    return result.data;
  }),
  getMany: publicProcedure.input(ApiLinkSchema).query((opts) => {
    const { input, ctx } = opts;
    const { query, page, limit } = input;
    const { user } = ctx;
    const userId = user?.id;
    const result = getLinks(query, page, limit, userId);
    if (!result.success) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.error });
    }
    return result.data;
  }),
  export: loggedInProcedure.query((opts) => {
    const { ctx } = opts;
    const { user } = ctx;
    const { id: userId } = user;
    const result = exportLinks(userId);
    if (!result) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error exporting links. See server logs for details',
      });
    }
    return Buffer.from(result).toString('base64');
  }),
  import: loggedInProcedure.input(z.string()).mutation((opts) => {
    const { input, ctx } = opts;
    const { user } = ctx;
    const { id: userId } = user;
    const attachment = Buffer.from(input, 'base64').toString('utf-8');
    const result = importLinks(attachment, userId);
    if (!result.success) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.reason });
    }
    return { success: true };
  }),
  populateFromFQDN: loggedInProcedure.input(z.string()).query(async (opts) => {
    const { input: url } = opts;
    const scrapedData = await scrapeFQDN(url);
    return scrapedData;
  }),
});
