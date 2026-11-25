import { z } from 'zod';

export const inspectMediaSchema = z.object({
  url: z
    .string({ required_error: 'URL is required' })
    .url('Please provide a valid HTTP or HTTPS URL')
    .trim(),
});

export type InspectMediaInput = z.infer<typeof inspectMediaSchema>;
