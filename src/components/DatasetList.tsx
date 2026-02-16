'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { DatasetListItem } from './DashboardClient';

interface DatasetListProps {
  datasets: DatasetListItem[];
  selectedId: string | null;
  onDeleteSuccess?: () => void;
}

export function DatasetList({ datasets, selectedId, onDeleteSuccess }: DatasetListProps) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteClick = (d: DatasetListItem) => {
    setMenuOpenId(null);
    setConfirmDelete({ id: d.id, name: d.name });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete || !onDeleteSuccess) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/datasets/${confirmDelete.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setConfirmDelete(null);
      onDeleteSuccess();
    } catch {
      setConfirmDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDelete(null);
  };

  if (datasets.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400 py-2">
        No datasets yet. Upload a CSV to start.
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-1 overflow-y-auto min-h-0">
        {datasets.map((d) => {
          const isSelected = d.id === selectedId;
          const isMenuOpen = menuOpenId === d.id;
          return (
            <li key={d.id} className="group relative">
              <div
                className={`flex items-stretch rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-sky-100 dark:bg-sky-900/40'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }`}
              >
                <Link
                  href={`/dashboard?dataset=${encodeURIComponent(d.id)}`}
                  className={`flex-1 min-w-0 rounded-l-lg px-3 py-2 text-sm ${
                    isSelected ? 'text-sky-900 dark:text-sky-100 font-medium' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="font-medium truncate block">{d.name}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {d.rowCount.toLocaleString()} rows · {new Date(d.uploadedAt).toLocaleDateString()}
                  </span>
                </Link>
                <div className="flex items-center pr-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setMenuOpenId(isMenuOpen ? null : d.id);
                    }}
                    className="p-1.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600/50"
                    aria-label="Dataset actions"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16" aria-hidden>
                      <circle cx="8" cy="4" r="1.5" />
                      <circle cx="8" cy="8" r="1.5" />
                      <circle cx="8" cy="12" r="1.5" />
                    </svg>
                  </button>
                </div>
              </div>
              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" aria-hidden onClick={() => setMenuOpenId(null)} />
                  <div className="absolute right-0 top-full mt-0.5 z-20 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg py-1 min-w-[140px]">
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(d)}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                      <span aria-hidden>🗑</span>
                      Delete dataset
                    </button>
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>

      {confirmDelete && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
          <div className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-6 max-w-md w-full shadow-xl">
            <h3 id="delete-dialog-title" className="text-lg font-semibold text-slate-900 dark:text-white">
              Delete dataset?
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Delete dataset &lsquo;{confirmDelete.name}&rsquo;? This removes all missions and analytics for this dataset.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelDelete}
                disabled={deleting}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
