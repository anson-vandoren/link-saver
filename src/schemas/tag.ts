import { string, z } from 'zod';
import { OpMetaSchema } from './util';

const sortByEnum = z.enum(['name', 'links']);
export const tagReqSchema = z.object({
  query: z.string().optional(),
  sortBy: sortByEnum.optional(),
});

export const TagSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const TagOpResSchema = z.object({
  tags: z.array(string()),
}).and(OpMetaSchema);

export type Tag = z.infer<typeof TagSchema>;
export type TagReq = z.infer<typeof tagReqSchema>;
