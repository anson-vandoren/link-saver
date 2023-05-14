import { z } from 'zod';
import { OpMetaSchema } from './util';

export const LinkSchema = z.object({
  id: z.number(),
  url: z.string(),
  title: z.string(),
  description: z.string().optional(),
  savedAt: z.instanceof(Date),
  isPublic: z.boolean(),
  userId: z.number(),
});

const tagsSchema = z.object({
  tags: z.array(z.string()),
});

const optionalUserIdSchema = z.object({
  userId: z.number().optional(),
  username: z.string().optional(),
});

export const LinkSchemaWithTags = LinkSchema.merge(tagsSchema);

export const baseLinkReqSchema = LinkSchemaWithTags.omit({
  savedAt: true,
  userId: true,
});

// No `id`, `savedAt`, or `userId` fields when creating a link - `userId` comes from auth token
export const CreateLinkReqSchema = baseLinkReqSchema
  .omit({
    id: true,
  });

export const InProgressLinkReqSchema = z.object({
  url: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
});

// Response schema includes `tags` field
export const LinkResSchema = LinkSchemaWithTags.merge(optionalUserIdSchema);

export const GetLinksReqSchema = z.object({
  query: z.string().optional().default(''),
  page: z.number().optional().default(1),
  limit: z.number().optional().default(25),
});

export const LinkWithTagRowSchema = LinkSchema.extend({
  tagName: z.string().nullable(),
});

const LinkImportSchema = LinkSchemaWithTags.omit({
  id: true,
});

export const LinkOpResSchema = z
  .object({
    link: LinkResSchema.optional(),
  })
  .and(OpMetaSchema);

const MultiLinkSchema = z.object({
  links: z.array(LinkResSchema),
  currentPage: z.number(),
  totalPages: z.number(),
});

export const MultiLinkOpResSchema = MultiLinkSchema.and(OpMetaSchema);

export const ExportLinksResSchema = z
  .object({
    attachment: z.string().optional(),
  })
  .and(OpMetaSchema);

export const ScrapedURLResSchema = z.object({
  title: z.string(),
  description: z.string(),
  url: z.string(),
}).and(OpMetaSchema);

// Response Types
export type LinkOpRes = z.infer<typeof LinkOpResSchema>;
export type MultiLinkOpRes = z.infer<typeof MultiLinkOpResSchema>;
export type ExportLinksRes = z.infer<typeof ExportLinksResSchema>;
export type ScrapedURLRes = z.infer<typeof ScrapedURLResSchema>;

// Request Types
export type CreateLinkReq = z.infer<typeof CreateLinkReqSchema>;

export type MultiLink = z.infer<typeof MultiLinkSchema>;
export type Link = z.infer<typeof LinkSchema>;
export type LinkRes = z.infer<typeof LinkResSchema>;
export type LinkImport = z.infer<typeof LinkImportSchema>;
export type UpdateLinkReq = z.infer<typeof baseLinkReqSchema>;
export type LinkWithTags = z.infer<typeof LinkSchemaWithTags>;
