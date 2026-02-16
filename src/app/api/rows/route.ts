import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const PAGE_SIZE = 50;
const MAX_PAGE = 500;

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const datasetId = searchParams.get('datasetId');
  const page = Math.min(
    Math.max(1, parseInt(searchParams.get('page') ?? '1', 10)),
    MAX_PAGE
  );
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const company = searchParams.get('company');
  const missionStatus = searchParams.get('missionStatus');
  const search = searchParams.get('search')?.trim().slice(0, 200) ?? '';

  if (!datasetId) {
    return NextResponse.json(
      { error: 'Missing datasetId' },
      { status: 400 }
    );
  }

  const dataset = await prisma.dataset.findFirst({
    where: { id: datasetId, userId: session.user.id },
    select: { id: true },
  });
  if (!dataset) {
    return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
  }

  const where: Prisma.MissionRowWhereInput = { datasetId };

  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = new Date(dateFrom);
    if (dateTo) {
      const d = new Date(dateTo);
      d.setHours(23, 59, 59, 999);
      where.date.lte = d;
    }
  }
  if (company && company.trim()) where.company = { equals: company.trim(), mode: 'insensitive' as const };
  if (missionStatus && missionStatus.trim())
    where.missionStatus = { equals: missionStatus.trim(), mode: 'insensitive' as const };
  if (search) where.mission = { contains: search, mode: 'insensitive' as const };

  const [rows, total] = await Promise.all([
    prisma.missionRow.findMany({
      where,
      orderBy: [{ date: 'asc' }, { mission: 'asc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        company: true,
        location: true,
        date: true,
        time: true,
        rocket: true,
        mission: true,
        rocketStatus: true,
        price: true,
        missionStatus: true,
      },
    }),
    prisma.missionRow.count({ where }),
  ]);

  return NextResponse.json({
    rows: rows.map((r) => ({
      id: r.id,
      company: r.company,
      location: r.location,
      date: r.date.toISOString().slice(0, 10),
      time: r.time,
      rocket: r.rocket,
      mission: r.mission,
      rocketStatus: r.rocketStatus,
      price: r.price != null ? Number(r.price) : null,
      missionStatus: r.missionStatus,
    })),
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  });
}
