import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const dataset = await prisma.dataset.findFirst({
    where: { id, userId: session.user.id },
    include: {
      aggregateCompany: { orderBy: { missionCount: 'desc' } },
      aggregateYear: { orderBy: { year: 'asc' } },
      aggregateStatus: true,
      aggregateRocket: { orderBy: { missionCount: 'desc' }, take: 1 },
    },
  });

  if (!dataset) {
    return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: dataset.id,
    name: dataset.name,
    originalFileName: dataset.originalFileName,
    uploadedAt: dataset.uploadedAt.toISOString(),
    rowCount: dataset.rowCount,
    dateMin: dataset.dateMin?.toISOString() ?? null,
    dateMax: dataset.dateMax?.toISOString() ?? null,
    droppedRowCount: dataset.droppedRowCount,
    aggregateCompany: dataset.aggregateCompany.map((a) => ({
      company: a.company,
      missionCount: a.missionCount,
      successCount: a.successCount,
      successRate: a.missionCount > 0
        ? Math.round((100 * a.successCount) / a.missionCount * 100) / 100
        : 0,
    })),
    aggregateYear: dataset.aggregateYear.map((a) => ({
      year: a.year,
      missionCount: a.missionCount,
    })),
    aggregateStatus: dataset.aggregateStatus.map((a) => ({
      status: a.status,
      missionCount: a.missionCount,
    })),
    mostUsedRocket:
      dataset.aggregateRocket[0]?.rocket ?? '',
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const dataset = await prisma.dataset.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!dataset) {
    return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.aggregateCompany.deleteMany({ where: { datasetId: id } });
    await tx.aggregateYear.deleteMany({ where: { datasetId: id } });
    await tx.aggregateStatus.deleteMany({ where: { datasetId: id } });
    await tx.aggregateRocket.deleteMany({ where: { datasetId: id } });
    await tx.missionRow.deleteMany({ where: { datasetId: id } });
    await tx.tablePreference.deleteMany({ where: { datasetId: id } });
    await tx.dataset.delete({ where: { id } });
  });

  return NextResponse.json({ ok: true });
}
