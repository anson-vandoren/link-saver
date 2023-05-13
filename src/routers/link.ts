import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { publicProcedure, router } from '../trpc';
import { loggedInProcedure } from '../middleware/authenticate';
import { createLink, deleteLink, updateLink, getLink, getLinks, exportLinks, importLinks } from '../controllers/link';
import { CreateLinkReqSchema, GetLinkReqSchema, GetLinksReqSchema, UpdateLinkReqSchema } from '../models/link';

export const linkRouter = router({
  create: loggedInProcedure.input(CreateLinkReqSchema).mutation((opts) => {
    const { input, ctx } = opts;
    const { user } = ctx;
    const { id: userId } = user;
    const result = createLink(userId, input);
    if (!result.success) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.reason });
    }
    return { success: true, link: result.newLink };
  }),
  delete: loggedInProcedure.input(z.number()).mutation((opts) => {
    const { input, ctx } = opts;
    const { user } = ctx;
    const { id: userId } = user;
    const linkId = input;
    const result = deleteLink(linkId, userId);
    if (!result.success) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.reason });
    }
    return { success: true };
  }),
  update: loggedInProcedure.input(UpdateLinkReqSchema).mutation((opts) => {
    const { input, ctx } = opts;
    const { user } = ctx;
    const { id: userId } = user;
    const result = updateLink(userId, input);
    if (!result.success) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.reason });
    }
    return { success: true, link: result.newLink };
  }),
  getOne: publicProcedure.input(GetLinkReqSchema).query((opts) => {
    const { input } = opts;
    const { id: linkId } = input;
    const result = getLink(linkId);
    if (!result.success) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.reason });
    }
    return { success: true, link: result.newLink };
  }),
  getMany: publicProcedure.input(GetLinksReqSchema).query((opts) => {
    const { input } = opts;
    const { query, page, limit } = input;
    const result = getLinks(query, page, limit);
    if (!result.success) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.reason });
    }
    return {
      success: true,
      links: result.newLinks,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
    };
  }),
  export: loggedInProcedure.query((opts) => {
    const { ctx } = opts;
    const { user } = ctx;
    const { id: userId } = user;
    const result = exportLinks(userId);
    if (!result.success || !result.attachment) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Error exporting links. See server logs for details' });
    }
    const base64Attachment = Buffer.from(result.attachment).toString('base64');
    return { success: true, attachment: base64Attachment };
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
});
