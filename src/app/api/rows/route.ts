import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rowsQuerySchema } from '@/lib/validate';
import { parseSort, buildRowsWhere } from '@/lib/query';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = rowsQuerySchema.safeParse({
    datasetId: searchParams.get('datasetId') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
    sort: searchParams.get('sort') ?? undefined,
    search: searchParams.get('search') ?? undefined,
    company: searchParams.get('company') ?? undefined,
    missionStatus: searchParams.get('missionStatus') ?? undefined,
    rocketStatus: searchParams.get('rocketStatus') ?? undefined,
    location: searchParams.get('location') ?? undefined,
    dateFrom: searchParams.get('dateFrom') ?? undefined,
    dateTo: searchParams.get('dateTo') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { datasetId, page, pageSize, sort, search, company, missionStatus, rocketStatus, location, dateFrom, dateTo } =
    parsed.data;

  const dataset = await prisma.dataset.findFirst({
    where: { id: datasetId, userId: session.user.id },
    select: { id: true },
  });
  if (!dataset) {
    return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
  }

  const orderBy = parseSort(Array.isArray(sort) ? sort : []);
  const where = buildRowsWhere(datasetId, {
    search: search || undefined,
    company: company?.length ? company : undefined,
    missionStatus: missionStatus?.length ? missionStatus : undefined,
    rocketStatus: rocketStatus?.length ? rocketStatus : undefined,
    location: location?.length ? location : undefined,
    dateFrom,
    dateTo,
  });

  const [rows, totalRows] = await Promise.all([
    prisma.missionRow.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
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
    totalRows,
    page,
    pageSize,
  });
}
