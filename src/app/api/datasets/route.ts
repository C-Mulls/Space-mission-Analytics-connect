import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const datasets = await prisma.dataset.findMany({
    where: { userId: session.user.id },
    orderBy: { uploadedAt: 'desc' },
    select: {
      id: true,
      name: true,
      originalFileName: true,
      uploadedAt: true,
      rowCount: true,
      dateMin: true,
      dateMax: true,
      droppedRowCount: true,
    },
  });

  return NextResponse.json(
    datasets.map((d) => ({
      id: d.id,
      name: d.name,
      originalFileName: d.originalFileName,
      uploadedAt: d.uploadedAt.toISOString(),
      rowCount: d.rowCount,
      dateMin: d.dateMin?.toISOString() ?? null,
      dateMax: d.dateMax?.toISOString() ?? null,
      droppedRowCount: d.droppedRowCount,
    }))
  );
}
