'use client';

import type { SelectedDatasetData } from './DashboardClient';

interface SummaryCardsProps {
  dataset: SelectedDatasetData;
}

export function SummaryCards({ dataset }: SummaryCardsProps) {
  const totalMissions = dataset.rowCount;
  const successCount = dataset.aggregateStatus.find((s) => s.status === 'Success')?.missionCount ?? 0;
  const successRateDisplay =
    totalMissions > 0 ? Math.round((100 * successCount) / totalMissions * 100) / 100 : 0;
  const uniqueCompanies = dataset.aggregateCompany.length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          Total missions
        </p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
          {totalMissions.toLocaleString()}
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          Success rate (%)
        </p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
          {successRateDisplay.toFixed(1)}
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          Unique companies
        </p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
          {uniqueCompanies.toLocaleString()}
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          Most used rocket
        </p>
        <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 truncate" title={dataset.mostUsedRocket}>
          {dataset.mostUsedRocket || '—'}
        </p>
      </div>
    </div>
  );
}
