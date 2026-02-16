'use client';

import { useState, useEffect, useCallback } from 'react';

interface Row {
  id: string;
  company: string;
  location: string;
  date: string;
  time: string;
  rocket: string;
  mission: string;
  rocketStatus: string;
  price: number | null;
  missionStatus: string;
}

interface DataTableProps {
  datasetId: string;
}

export function DataTable({ datasetId }: DataTableProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [company, setCompany] = useState('');
  const [missionStatus, setMissionStatus] = useState('');
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState({ dateFrom: '', dateTo: '', company: '', missionStatus: '', search: '' });

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      datasetId,
      page: String(page),
    });
    if (applied.dateFrom) params.set('dateFrom', applied.dateFrom);
    if (applied.dateTo) params.set('dateTo', applied.dateTo);
    if (applied.company.trim()) params.set('company', applied.company.trim());
    if (applied.missionStatus.trim()) params.set('missionStatus', applied.missionStatus.trim());
    if (applied.search.trim()) params.set('search', applied.search.trim());
    try {
      const res = await fetch(`/api/rows?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setRows(data.rows);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setRows([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [datasetId, page, applied]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
        Missions (paginated)
      </h3>
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-2 py-1.5 text-sm"
          placeholder="From"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-2 py-1.5 text-sm"
          placeholder="To"
        />
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Company"
          className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-2 py-1.5 text-sm w-32"
        />
        <input
          type="text"
          value={missionStatus}
          onChange={(e) => setMissionStatus(e.target.value)}
          placeholder="Mission status"
          className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-2 py-1.5 text-sm w-36"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search mission"
          className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-2 py-1.5 text-sm w-40"
        />
        <button
          type="button"
          onClick={() => {
            setApplied({
              dateFrom,
              dateTo,
              company,
              missionStatus,
              search,
            });
            setPage(1);
          }}
          className="px-3 py-1.5 text-sm font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg"
        >
          Apply filters
        </button>
      </div>
      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 py-4">Loading…</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-600">
                  <th className="py-2 pr-2 font-medium text-slate-700 dark:text-slate-300">Company</th>
                  <th className="py-2 pr-2 font-medium text-slate-700 dark:text-slate-300">Location</th>
                  <th className="py-2 pr-2 font-medium text-slate-700 dark:text-slate-300">Date</th>
                  <th className="py-2 pr-2 font-medium text-slate-700 dark:text-slate-300">Rocket</th>
                  <th className="py-2 pr-2 font-medium text-slate-700 dark:text-slate-300">Mission</th>
                  <th className="py-2 pr-2 font-medium text-slate-700 dark:text-slate-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 dark:border-slate-700/50">
                    <td className="py-2 pr-2 text-slate-900 dark:text-white">{r.company}</td>
                    <td className="py-2 pr-2 text-slate-600 dark:text-slate-400">{r.location}</td>
                    <td className="py-2 pr-2 text-slate-600 dark:text-slate-400">{r.date}</td>
                    <td className="py-2 pr-2 text-slate-600 dark:text-slate-400">{r.rocket}</td>
                    <td className="py-2 pr-2 text-slate-900 dark:text-white">{r.mission}</td>
                    <td className="py-2 pr-2 text-slate-600 dark:text-slate-400">{r.missionStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-4 text-sm text-slate-600 dark:text-slate-400">
            <span>
              Page {page} of {totalPages || 1} · {total.toLocaleString()} total
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
