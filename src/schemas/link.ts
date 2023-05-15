import { z } from 'zod';
import { Wrapper } from './util';

const tagsSchema = z.object({
  tags: z.array(z.string()),
});

export const DbLinkSchema = z.object({
  id: z.number(),
  url: z.string(),
  title: z.string(),
  description: z.string(),
  savedAt: z.number(),
  isPublic: z.number(),
  userId: z.number(),
});
export type DbLink = z.infer<typeof DbLinkSchema>;

export const DbLinkRowWithTagSchema = DbLinkSchema.extend({
  tags: z.string().optional().transform((val) => val?.split(',') || []),
});
export type DbLinkRowWithTag = z.infer<typeof DbLinkRowWithTagSchema>;

export const DbLinkWithTagsSchema = DbLinkSchema.merge(tagsSchema);
export type DbLinkWithTags = z.infer<typeof DbLinkWithTagsSchema>;

export const DbNewLinkSchema = DbLinkSchema.omit({
  id: true,
}).extend({
  savedAt: z.number().optional(),
  isPublic: z.number().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
}).merge(tagsSchema);
export type DbNewLink = z.infer<typeof DbNewLinkSchema>;

export const ApiLinkSchema = z.object({
  id: z.number().optional(),
  url: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  savedAt: z.instanceof(Date).optional(),
  isPublic: z.boolean().optional(),
  userId: z.number().optional(),
  username: z.string().optional(),
  tags: z.array(z.string()).optional(),
  query: z.string().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});
export type ApiLink = z.infer<typeof ApiLinkSchema>;
export type WrappedApiLink = Wrapper<ApiLink>;

export const ApiLinksSchema = z.object({
  links: z.array(ApiLinkSchema),
  totalPages: z.number(),
  currentPage: z.number(),
});
export type ApiLinks = z.infer<typeof ApiLinksSchema>;
export type WrappedApiLinks = Wrapper<ApiLinks>;

export const LinkDbToApiSchema = DbLinkSchema.extend({
  isPublic: z.number().transform((val) => val === 1),
  savedAt: z.number().transform((val) => new Date(val)),
});
export const LinkDbToApiWithTagsSchema = LinkDbToApiSchema.merge(tagsSchema);

export const LinkApiToDbSchema = ApiLinkSchema.extend({
  isPublic: z.boolean().transform((val) => (val ? 1 : 0)),
  savedAt: z.instanceof(Date).transform((val) => val.getTime()),
  url: z.string().transform((val, ctx) => {
    if (!val) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'url is required',
      });
      return z.NEVER;
    }
    return val;
  }),
  title: z.string().transform((val) => val || ''),
  description: z.string().transform((val) => val || ''),
  userId: z.number().transform((val, ctx) => {
    if (!val) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'userId is required',
      });
      return z.NEVER;
    }
    return val;
  }),
  tags: z.array(z.string()).transform((val) => val || []),
});

export const NewLinkApiToDbSchema = LinkApiToDbSchema.omit({
  id: true,
  savedAt: true,
});

export const ScrapedURLResSchema = z.object({
  title: z.string(),
  description: z.string(),
  url: z.string(),
});
export type ScrapedURLRes = z.infer<typeof ScrapedURLResSchema>;
