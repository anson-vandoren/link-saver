import { z } from 'zod';

export const OpMetaSchema = z.object({
  success: z.boolean(),
  reason: z.string().optional(),
});
export type OpMeta = z.infer<typeof OpMetaSchema>;

export const WebSocketMessageSchema = z.object({
  type: z.string(),
  payload: z.any(),
});

export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;

export interface Wrapper<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const SuccessSchema = <T extends z.ZodType<any, any>>(schema: T) =>
  z.object({
    success: z.literal(true),
    data: schema,
  });

const ErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
});

export const WrapperSchema = <T extends z.ZodType<any, any>>(schema: T) => z.union([SuccessSchema(schema), ErrorSchema]);