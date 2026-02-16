/**
 * Optional API that mirrors analytics.py functions, scoped to user and dataset.
 * GET /api/functions?dataset=...&fn=...&...
 */

import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

async function ensureDatasetAccess(
  datasetId: string,
  userId: string
): Promise<{ error: Response } | { datasetId: string }> {
  const dataset = await prisma.dataset.findFirst({
    where: { id: datasetId, userId },
    select: { id: true },
  });
  if (!dataset) return { error: NextResponse.json({ error: 'Dataset not found' }, { status: 404 }) };
  return { datasetId };
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const datasetId = searchParams.get('dataset');
  const fn = searchParams.get('fn');

  if (!datasetId || !fn) {
    return NextResponse.json(
      { error: 'Missing dataset or fn (e.g. getMissionCountByCompany, getSuccessRate, getTopCompaniesByMissionCount, getMissionStatusCount, getMostUsedRocket)' },
      { status: 400 }
    );
  }

  const access = await ensureDatasetAccess(datasetId, session.user.id);
  if ('error' in access) return access.error;

  switch (fn) {
    case 'getMissionCountByCompany': {
      const company = searchParams.get('company')?.trim();
      if (!company) return NextResponse.json({ error: 'Missing company' }, { status: 400 });
      const count = await prisma.missionRow.count({
        where: { datasetId: access.datasetId, company: { equals: company, mode: 'insensitive' } },
      });
      return NextResponse.json({ result: count });
    }
    case 'getSuccessRate': {
      const company = searchParams.get('company')?.trim();
      if (!company) return NextResponse.json({ error: 'Missing company' }, { status: 400 });
      const agg = await prisma.aggregateCompany.findFirst({
        where: { datasetId: access.datasetId, company: { equals: company, mode: 'insensitive' } },
      });
      const rate = agg && agg.missionCount > 0
        ? Math.round((100 * agg.successCount) / agg.missionCount * 100) / 100
        : 0;
      return NextResponse.json({ result: rate });
    }
    case 'getTopCompaniesByMissionCount': {
      const n = Math.min(100, Math.max(1, parseInt(searchParams.get('n') ?? '10', 10)));
      const list = await prisma.aggregateCompany.findMany({
        where: { datasetId: access.datasetId },
        orderBy: [{ missionCount: 'desc' }, { company: 'asc' }],
        take: n,
        select: { company: true, missionCount: true },
      });
      return NextResponse.json({
        result: list.map((r) => [r.company, r.missionCount]),
      });
    }
    case 'getMissionStatusCount': {
      const list = await prisma.aggregateStatus.findMany({
        where: { datasetId: access.datasetId },
        select: { status: true, missionCount: true },
      });
      const required = ['Success', 'Failure', 'Partial Failure', 'Prelaunch Failure'];
      const result: Record<string, number> = {};
      for (const k of required) result[k] = 0;
      for (const r of list) result[r.status] = r.missionCount;
      return NextResponse.json({ result });
    }
    case 'getMostUsedRocket': {
      const top = await prisma.aggregateRocket.findFirst({
        where: { datasetId: access.datasetId },
        orderBy: { missionCount: 'desc' },
        select: { rocket: true },
      });
      return NextResponse.json({ result: top?.rocket ?? '' });
    }
    case 'getMissionsByDateRange': {
      const startDate = searchParams.get('startDate')?.trim();
      const endDate = searchParams.get('endDate')?.trim();
      if (!startDate || !endDate) return NextResponse.json({ error: 'Missing startDate or endDate' }, { status: 400 });
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) {
        return NextResponse.json({ result: [] });
      }
      const rows = await prisma.missionRow.findMany({
        where: { datasetId: access.datasetId, date: { gte: start, lte: end } },
        orderBy: [{ date: 'asc' }, { mission: 'asc' }],
        select: { mission: true },
      });
      return NextResponse.json({ result: rows.map((r) => r.mission) });
    }
    case 'getMissionsByYear': {
      const year = parseInt(searchParams.get('year') ?? '', 10);
      if (isNaN(year) || year < 1950 || year > 2100) {
        return NextResponse.json({ result: 0 });
      }
      const agg = await prisma.aggregateYear.findFirst({
        where: { datasetId: access.datasetId, year },
        select: { missionCount: true },
      });
      return NextResponse.json({ result: agg?.missionCount ?? 0 });
    }
    case 'getAverageMissionsPerYear': {
      const startYear = parseInt(searchParams.get('startYear') ?? '', 10);
      const endYear = parseInt(searchParams.get('endYear') ?? '', 10);
      if (isNaN(startYear) || isNaN(endYear) || startYear > endYear) {
        return NextResponse.json({ result: 0 });
      }
      const years = await prisma.aggregateYear.findMany({
        where: { datasetId: access.datasetId, year: { gte: startYear, lte: endYear } },
        select: { missionCount: true },
      });
      const total = years.reduce((s, y) => s + y.missionCount, 0);
      const numYears = endYear - startYear + 1;
      const avg = numYears > 0 ? Math.round((total / numYears) * 100) / 100 : 0;
      return NextResponse.json({ result: avg });
    }
    default:
      return NextResponse.json(
        { error: `Unknown fn. Use: getMissionCountByCompany, getSuccessRate, getMissionsByDateRange, getTopCompaniesByMissionCount, getMissionStatusCount, getMissionsByYear, getMostUsedRocket, getAverageMissionsPerYear` },
        { status: 400 }
      );
  }
}
