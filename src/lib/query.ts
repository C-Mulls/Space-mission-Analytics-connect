import type { Prisma } from '@prisma/client';

const SORT_FIELD_MAP: Record<string, keyof Prisma.MissionRowOrderByWithRelationInput> = {
  Date: 'date',
  Mission: 'mission',
  Company: 'company',
  Location: 'location',
  Rocket: 'rocket',
  RocketStatus: 'rocketStatus',
  MissionStatus: 'missionStatus',
  Price: 'price',
  Time: 'time',
};

export function parseSort(
  sortParts: string[]
): Prisma.MissionRowOrderByWithRelationInput[] {
  const orderBy: Prisma.MissionRowOrderByWithRelationInput[] = [];
  for (const part of sortParts) {
    const [field, dir] = part.split(':');
    const prismaField = SORT_FIELD_MAP[field?.trim() ?? ''];
    if (prismaField && (dir === 'asc' || dir === 'desc')) {
      orderBy.push({ [prismaField]: dir });
    }
  }
  if (orderBy.length === 0) {
    return [{ date: 'asc' }, { mission: 'asc' }];
  }
  return orderBy;
}

export function buildRowsWhere(
  datasetId: string,
  opts: {
    search?: string;
    company?: string[];
    missionStatus?: string[];
    rocketStatus?: string[];
    location?: string[];
    dateFrom?: string;
    dateTo?: string;
  }
): Prisma.MissionRowWhereInput {
  const where: Prisma.MissionRowWhereInput = { datasetId };

  if (opts.dateFrom || opts.dateTo) {
    where.date = {};
    if (opts.dateFrom) where.date.gte = new Date(opts.dateFrom);
    if (opts.dateTo) {
      const d = new Date(opts.dateTo);
      d.setHours(23, 59, 59, 999);
      where.date.lte = d;
    }
  }

  if (opts.company?.length) {
    where.company = { in: opts.company, mode: 'insensitive' };
  }
  if (opts.missionStatus?.length) {
    where.missionStatus = { in: opts.missionStatus, mode: 'insensitive' };
  }
  if (opts.rocketStatus?.length) {
    where.rocketStatus = { in: opts.rocketStatus, mode: 'insensitive' };
  }
  if (opts.location?.length) {
    where.location = { in: opts.location, mode: 'insensitive' };
  }

  if (opts.search) {
    const q = opts.search;
    where.OR = [
      { mission: { contains: q, mode: 'insensitive' } },
      { company: { contains: q, mode: 'insensitive' } },
      { rocket: { contains: q, mode: 'insensitive' } },
      { location: { contains: q, mode: 'insensitive' } },
    ];
  }

  return where;
}
