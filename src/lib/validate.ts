import { z } from 'zod';

const sortPart = z.string().regex(/^[A-Za-z]+:(asc|desc)$/);
export const rowsQuerySchema = z.object({
  datasetId: z.string().min(1, 'Missing datasetId'),
  page: z.coerce.number().int().min(1).max(500).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sort: z
    .string()
    .optional()
    .transform((s): string[] => (s ? s.split(',').map((p) => p.trim()).filter((p) => sortPart.safeParse(p).success) : [])),
  search: z
    .string()
    .max(200)
    .optional()
    .transform((s) => (s?.trim() ?? '')),
  company: z.string().optional().transform((s) => (s?.trim() ? s.trim().split(',').map((c) => c.trim()).filter(Boolean) : [])),
  missionStatus: z.string().optional().transform((s) => (s?.trim() ? s.trim().split(',').map((c) => c.trim()).filter(Boolean) : [])),
  rocketStatus: z.string().optional().transform((s) => (s?.trim() ? s.trim().split(',').map((c) => c.trim()).filter(Boolean) : [])),
  location: z.string().optional().transform((s) => (s?.trim() ? s.trim().split(',').map((c) => c.trim()).filter(Boolean) : [])),
  dateFrom: z.string().optional().transform((s) => (s?.trim() ? s.trim() : undefined)),
  dateTo: z.string().optional().transform((s) => (s?.trim() ? s.trim() : undefined)),
});

export type RowsQuery = z.infer<typeof rowsQuerySchema>;

export const tablePreferencesGetSchema = z.object({
  datasetId: z.string().min(1, 'Missing datasetId'),
});

export const tablePreferencesPutSchema = z.object({
  datasetId: z.string().min(1, 'Missing datasetId'),
  columnOrder: z.array(z.string()).optional(),
  columnSizing: z.record(z.string(), z.number()).optional(),
  columnVisibility: z.record(z.string(), z.boolean()).optional(),
});

export type TablePreferencesPut = z.infer<typeof tablePreferencesPutSchema>;
