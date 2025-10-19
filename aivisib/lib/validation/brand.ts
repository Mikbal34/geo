import { z } from 'zod'
import { isValidDomain } from './domain'

export const CreateBrandSchema = z.object({
  brand_name: z.string().min(1).max(255),
  domain: z.string().refine(isValidDomain, 'Invalid domain format (e.g., example.com)'),
  region: z.string().min(1).max(100),
})

export type CreateBrandRequest = z.infer<typeof CreateBrandSchema>
