'use client';

import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { DatasetList } from './DatasetList';
import { UploadDialog } from './UploadDialog';
import { SummaryCards } from './SummaryCards';
import { Charts } from './Charts';
import { MissionsGrid } from './MissionsGrid';

export interface DatasetListItem {
  id: string;
  name: string;
  originalFileName: string;
  uploadedAt: string;
  rowCount: number;
  dateMin: string | null;
  dateMax: string | null;
}

export interface SelectedDatasetData {
  id: string;
  name: string;
  rowCount: number;
  dateMin: string | null;
  dateMax: string | null;
  aggregateCompany: { company: string; missionCount: number; successCount: number; successRate: number }[];
  aggregateYear: { year: number; missionCount: number; successCount?: number; successRate?: number }[];
  aggregateStatus: { status: string; missionCount: number }[];
  mostUsedRocket: string;
}

interface DashboardClientProps {
  datasetList: DatasetListItem[];
  selectedDataset: SelectedDatasetData | null;
  userEmail?: string;
}

export function DashboardClient({
  datasetList,
  selectedDataset,
  userEmail,
}: DashboardClientProps) {
  const router = useRouter();

  const handleDeleteDatasetSuccess = () => {
    router.push('/dashboard');
    router.refresh();
  };

  const loadTablePreferences = async (datasetId: string) => {
    const res = await fetch(`/api/table-preferences?datasetId=${encodeURIComponent(datasetId)}`);
    if (!res.ok) return { columnOrder: [], columnSizing: {}, columnVisibility: {} };
    return res.json();
  };

  const saveTablePreferences = async (
    datasetId: string,
    prefs: { columnOrder?: string[]; columnSizing?: Record<string, number>; columnVisibility?: Record<string, boolean> }
  ) => {
    await fetch('/api/table-preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ datasetId, ...prefs }),
    });
  };

  const filterOptions = selectedDataset
    ? {
        companies: selectedDataset.aggregateCompany.map((a) => a.company),
        missionStatuses: selectedDataset.aggregateStatus.map((a) => a.status),
      }
    : { companies: [] as string[], missionStatuses: [] as string[] };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden>🚀</span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Space Missions Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {userEmail && (
            <span className="text-sm text-slate-600 dark:text-slate-400 hidden sm:inline">
              {userEmail}
            </span>
          )}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
        <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-3 overflow-hidden">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 flex flex-col gap-3 overflow-hidden">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 dark:text-white">Datasets</h2>
              <UploadDialog onUploadSuccess={() => router.refresh()} />
            </div>
            <DatasetList
              datasets={datasetList}
              selectedId={selectedDataset?.id ?? null}
              onDeleteSuccess={handleDeleteDatasetSuccess}
            />
          </div>
        </aside>

        <main className="flex-1 min-w-0 flex flex-col gap-4 overflow-auto">
          {!selectedDataset ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center text-slate-600 dark:text-slate-400">
              Select a dataset from the list or upload a new CSV to get started.
            </div>
          ) : (
            <>
              <SummaryCards dataset={selectedDataset} />
              <Charts dataset={selectedDataset} />
              <MissionsGrid
                datasetId={selectedDataset.id}
                filterOptions={filterOptions}
                onLoadPreferences={loadTablePreferences}
                onSavePreferences={saveTablePreferences}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
