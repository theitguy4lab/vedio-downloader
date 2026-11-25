import { z } from 'zod';

export const createDownloadJobSchema = z.object({
  url: z.string().url('A valid media URL is required').trim(),
  source: z.string().default('direct'),
  format: z.object({
    container: z.string().min(1, 'Container format is required'),
    quality: z.string().default('original'),
    resolution: z.string().optional(),
    audioOnly: z.boolean().default(false),
  }),
  mediaInfo: z
    .object({
      title: z.string().optional(),
      thumbnail: z.string().optional(),
      duration: z.number().optional(),
      creator: z.string().optional(),
    })
    .optional(),
});

export type CreateDownloadJobInput = z.infer<typeof createDownloadJobSchema>;
