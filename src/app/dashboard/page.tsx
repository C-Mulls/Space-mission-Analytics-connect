import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DashboardClient } from '@/components/DashboardClient';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ dataset?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const { dataset: selectedId } = await searchParams;

  const [datasets, selectedDataset] = await Promise.all([
    prisma.dataset.findMany({
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
      },
    }),
    selectedId
      ? prisma.dataset.findFirst({
          where: { id: selectedId, userId: session.user.id },
          include: {
            aggregateCompany: { orderBy: { missionCount: 'desc' } },
            aggregateYear: { orderBy: { year: 'asc' } },
            aggregateStatus: true,
            aggregateRocket: { orderBy: { missionCount: 'desc' }, take: 1 },
          },
        })
      : null,
  ]);

  const datasetList = datasets.map((d) => ({
    id: d.id,
    name: d.name,
    originalFileName: d.originalFileName,
    uploadedAt: d.uploadedAt.toISOString(),
    rowCount: d.rowCount,
    dateMin: d.dateMin?.toISOString() ?? null,
    dateMax: d.dateMax?.toISOString() ?? null,
  }));

  const selected =
    selectedDataset && selectedDataset.userId === session.user.id
      ? {
          id: selectedDataset.id,
          name: selectedDataset.name,
          rowCount: selectedDataset.rowCount,
          dateMin: selectedDataset.dateMin?.toISOString() ?? null,
          dateMax: selectedDataset.dateMax?.toISOString() ?? null,
          aggregateCompany: selectedDataset.aggregateCompany.map((a) => ({
            company: a.company,
            missionCount: a.missionCount,
            successCount: a.successCount,
            successRate:
              a.missionCount > 0
                ? Math.round((100 * a.successCount) / a.missionCount * 100) / 100
                : 0,
          })),
          aggregateYear: selectedDataset.aggregateYear.map((a) => ({
            year: a.year,
            missionCount: a.missionCount,
            successCount: a.successCount,
            successRate:
              a.missionCount > 0
                ? Math.round((100 * a.successCount) / a.missionCount * 100) / 100
                : 0,
          })),
          aggregateStatus: selectedDataset.aggregateStatus.map((a) => ({
            status: a.status,
            missionCount: a.missionCount,
          })),
          mostUsedRocket: selectedDataset.aggregateRocket[0]?.rocket ?? '',
        }
      : null;

  return (
    <DashboardClient
      datasetList={datasetList}
      selectedDataset={selected}
      userEmail={session.user.email ?? undefined}
    />
  );
}
