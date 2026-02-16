'use client';

import Link from 'next/link';
import type { DatasetListItem } from './DashboardClient';

interface DatasetListProps {
  datasets: DatasetListItem[];
  selectedId: string | null;
}

export function DatasetList({ datasets, selectedId }: DatasetListProps) {
  if (datasets.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400 py-2">
        No datasets yet. Upload a CSV to start.
      </p>
    );
  }

  return (
    <ul className="space-y-1 overflow-y-auto min-h-0">
      {datasets.map((d) => {
        const isSelected = d.id === selectedId;
        return (
          <li key={d.id}>
            <Link
              href={`/dashboard?dataset=${encodeURIComponent(d.id)}`}
              className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                isSelected
                  ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-900 dark:text-sky-100 font-medium'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              <span className="font-medium truncate block">{d.name}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {d.rowCount.toLocaleString()} rows · {new Date(d.uploadedAt).toLocaleDateString()}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
