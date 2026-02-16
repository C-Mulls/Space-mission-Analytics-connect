'use client';

import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnOrderState,
  type ColumnSizingState,
  type VisibilityState,
  type SortingState,
} from '@tanstack/react-table';
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import { arrayMove } from '@dnd-kit/sortable';
import { SortableHeaderRow } from './MissionsGridSortable';

export interface MissionRowData {
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

const COLUMN_IDS = [
  'date',
  'company',
  'mission',
  'location',
  'rocket',
  'missionStatus',
  'rocketStatus',
  'time',
  'price',
] as const;

const DEFAULT_COLUMN_ORDER: string[] = [...COLUMN_IDS];
const DEFAULT_SIZING: Record<string, number> = {
  date: 110,
  company: 140,
  mission: 200,
  location: 140,
  rocket: 120,
  missionStatus: 120,
  rocketStatus: 120,
  time: 80,
  price: 100,
};

export interface FilterOptions {
  companies: string[];
  missionStatuses: string[];
}

interface MissionsGridProps {
  datasetId: string;
  filterOptions: FilterOptions;
  onLoadPreferences?: (datasetId: string) => Promise<{
    columnOrder: string[];
    columnSizing: Record<string, number>;
    columnVisibility: Record<string, boolean>;
  }>;
  onSavePreferences?: (
    datasetId: string,
    prefs: {
      columnOrder?: string[];
      columnSizing?: Record<string, number>;
      columnVisibility?: Record<string, boolean>;
    }
  ) => Promise<void>;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debouncedValue;
}

export function MissionsGrid({
  datasetId,
  filterOptions,
  onLoadPreferences,
  onSavePreferences,
}: MissionsGridProps) {
  const [rows, setRows] = useState<MissionRowData[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [loading, setLoading] = useState(true);
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(DEFAULT_COLUMN_ORDER);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(DEFAULT_SIZING);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 250);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string[]>([]);
  const [missionStatusFilter, setMissionStatusFilter] = useState<string[]>([]);
  const [rocketStatusFilter, setRocketStatusFilter] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState<string[]>([]);
  const [rocketStatusInput, setRocketStatusInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      datasetId,
      page: String(page),
      pageSize: String(pageSize),
    });
    if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (companyFilter.length) params.set('company', companyFilter.join(','));
    if (missionStatusFilter.length) params.set('missionStatus', missionStatusFilter.join(','));
    if (rocketStatusFilter.length) params.set('rocketStatus', rocketStatusFilter.join(','));
    if (locationFilter.length) params.set('location', locationFilter.join(','));
    if (sorting.length) {
      const sortStr = sorting
        .map((s) => `${s.id.charAt(0).toUpperCase() + s.id.slice(1)}:${s.desc ? 'desc' : 'asc'}`)
        .join(',');
      params.set('sort', sortStr);
    }
    try {
      const res = await fetch(`/api/rows?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setRows(data.rows);
      setTotalRows(data.totalRows);
    } catch {
      setRows([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [
    datasetId,
    page,
    pageSize,
    debouncedSearch,
    dateFrom,
    dateTo,
    companyFilter,
    missionStatusFilter,
    rocketStatusFilter,
    locationFilter,
    sorting,
  ]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  // Load preferences when dataset changes
  useEffect(() => {
    if (!datasetId || !onLoadPreferences) return;
    onLoadPreferences(datasetId).then((prefs) => {
      if (prefs.columnOrder?.length) setColumnOrder(prefs.columnOrder);
      if (prefs.columnSizing && Object.keys(prefs.columnSizing).length) setColumnSizing(prefs.columnSizing);
      if (prefs.columnVisibility && Object.keys(prefs.columnVisibility).length) setColumnVisibility(prefs.columnVisibility);
    });
  }, [datasetId, onLoadPreferences]);

  const savePreferences = useCallback(
    (updates: { columnOrder?: string[]; columnSizing?: Record<string, number>; columnVisibility?: Record<string, boolean> }) => {
      if (!onSavePreferences) return;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        onSavePreferences(datasetId, updates);
        saveTimeoutRef.current = null;
      }, 300);
    },
    [datasetId, onSavePreferences]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      setColumnOrder((prev) => {
        const idx = prev.indexOf(active.id as string);
        const overIdx = prev.indexOf(over.id as string);
        if (idx === -1 || overIdx === -1) return prev;
        const next = arrayMove(prev, idx, overIdx);
        savePreferences({ columnOrder: next });
        return next;
      });
    },
    [savePreferences]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const hasActiveFilters =
    debouncedSearch ||
    dateFrom ||
    dateTo ||
    companyFilter.length > 0 ||
    missionStatusFilter.length > 0 ||
    rocketStatusFilter.length > 0 ||
    locationFilter.length > 0;

  const clearFilters = useCallback(() => {
    setSearchInput('');
    setDateFrom('');
    setDateTo('');
    setCompanyFilter([]);
    setMissionStatusFilter([]);
    setRocketStatusFilter([]);
    setLocationFilter([]);
    setRocketStatusInput('');
    setLocationInput('');
    setPage(1);
  }, []);

  const resetLayout = useCallback(() => {
    setColumnOrder(DEFAULT_COLUMN_ORDER);
    setColumnSizing(DEFAULT_SIZING);
    setColumnVisibility({});
    if (onSavePreferences) {
      onSavePreferences(datasetId, {
        columnOrder: DEFAULT_COLUMN_ORDER,
        columnSizing: DEFAULT_SIZING,
        columnVisibility: {},
      });
    }
  }, [datasetId, onSavePreferences]);

  const columns = useMemo<ColumnDef<MissionRowData>[]>(
    () => [
      { id: 'date', accessorKey: 'date', header: 'Date', size: 110, minSize: 60 },
      { id: 'company', accessorKey: 'company', header: 'Company', size: 140, minSize: 80 },
      { id: 'mission', accessorKey: 'mission', header: 'Mission', size: 200, minSize: 100 },
      { id: 'location', accessorKey: 'location', header: 'Location', size: 140, minSize: 80 },
      { id: 'rocket', accessorKey: 'rocket', header: 'Rocket', size: 120, minSize: 80 },
      { id: 'missionStatus', accessorKey: 'missionStatus', header: 'Mission Status', size: 120, minSize: 90 },
      { id: 'rocketStatus', accessorKey: 'rocketStatus', header: 'Rocket Status', size: 120, minSize: 90 },
      { id: 'time', accessorKey: 'time', header: 'Time', size: 80, minSize: 50 },
      { id: 'price', accessorKey: 'price', header: 'Price', size: 100, minSize: 70, cell: (c) => (c.getValue() != null ? Number(c.getValue()).toLocaleString() : '—') },
    ],
    []
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      columnOrder,
      columnSizing,
      columnVisibility,
      sorting,
    },
    onColumnOrderChange: setColumnOrder,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    onColumnSizingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(columnSizing) : columnSizing;
      setColumnSizing(next);
      savePreferences({ columnSizing: next });
    },
    onColumnVisibilityChange: (updater) => {
      const next = typeof updater === 'function' ? updater(columnVisibility) : columnVisibility;
      setColumnVisibility(next);
      savePreferences({ columnVisibility: next });
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(totalRows / pageSize) || 1,
  });

  const totalPages = Math.ceil(totalRows / pageSize) || 1;
  const start = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalRows);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden flex flex-col">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white px-4 pt-4 pb-2">
        Missions (paginated)
      </h3>

      {/* Toolbar */}
      <div className="px-4 pb-3 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search mission, company, rocket, location…"
          className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-3 py-1.5 text-sm w-56 placeholder:text-slate-400"
        />
        <div className="relative">
          <button
            type="button"
            onClick={() => setFilterOpen((o) => !o)}
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
          >
            Filters {hasActiveFilters ? `•` : ''}
          </button>
          {filterOpen && (
            <>
              <div className="fixed inset-0 z-10" aria-hidden onClick={() => setFilterOpen(false)} />
              <div className="absolute left-0 top-full mt-1 z-20 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-3 shadow-lg min-w-[280px]">
                <div className="space-y-2 text-sm">
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 mb-1">Date range</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-2 py-1 w-36"
                      />
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-2 py-1 w-36"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 mb-1">Company</label>
                    <select
                      multiple
                      value={companyFilter}
                      onChange={(e) =>
                        setCompanyFilter(Array.from(e.target.selectedOptions, (o) => o.value))
                      }
                      className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-2 py-1 w-full max-h-24"
                    >
                      {filterOptions.companies.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 mb-1">Mission status</label>
                    <select
                      multiple
                      value={missionStatusFilter}
                      onChange={(e) =>
                        setMissionStatusFilter(Array.from(e.target.selectedOptions, (o) => o.value))
                      }
                      className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-2 py-1 w-full max-h-24"
                    >
                      {filterOptions.missionStatuses.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 mb-1">Rocket status (comma-separated)</label>
                    <input
                      type="text"
                      value={rocketStatusInput}
                      onChange={(e) => {
                        setRocketStatusInput(e.target.value);
                        setRocketStatusFilter(e.target.value.split(',').map((x) => x.trim()).filter(Boolean));
                      }}
                      placeholder="e.g. Status A, Status B"
                      className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-2 py-1 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 mb-1">Location (comma-separated)</label>
                    <input
                      type="text"
                      value={locationInput}
                      onChange={(e) => {
                        setLocationInput(e.target.value);
                        setLocationFilter(e.target.value.split(',').map((x) => x.trim()).filter(Boolean));
                      }}
                      placeholder="e.g. KSC, CCAFS"
                      className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-2 py-1 w-full"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        <select
          value={pageSize}
          onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
          className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-2 py-1.5 text-sm"
        >
          {[10, 25, 50, 100].map((n) => (
            <option key={n} value={n}>{n} per page</option>
          ))}
        </select>
        <div className="relative">
          <button
            type="button"
            onClick={() => setColumnsOpen((o) => !o)}
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
          >
            Columns
          </button>
          {columnsOpen && (
            <>
              <div className="fixed inset-0 z-10" aria-hidden onClick={() => setColumnsOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-3 shadow-lg">
                {table.getAllLeafColumns().map((col) => (
                  <label key={col.id} className="flex items-center gap-2 py-1 text-sm">
                    <input
                      type="checkbox"
                      checked={col.getIsVisible()}
                      onChange={col.getToggleVisibilityHandler()}
                      className="rounded border-slate-300"
                    />
                    <span className="text-slate-700 dark:text-slate-300">{col.columnDef.header as string}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="px-3 py-1.5 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg"
          >
            Clear filters
          </button>
        )}
        <button
          type="button"
          onClick={resetLayout}
          className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg"
        >
          Reset table layout
        </button>
      </div>

      {/* Table */}
      <div className="overflow-auto flex-1 min-h-0">
        <table className="w-full border-collapse text-sm" style={{ tableLayout: 'fixed', minWidth: table.getCenterTotalSize() }}>
          <thead className="sticky top-0 z-[1] bg-slate-100 dark:bg-slate-700/80 border-b border-slate-200 dark:border-slate-600">
            <DndContext modifiers={[restrictToHorizontalAxis]} onDragEnd={handleDragEnd} sensors={sensors}>
              <SortableHeaderRow table={table} />
            </DndContext>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-8 text-center text-slate-500 dark:text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={`border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 ${
                    i % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="py-2 px-2 text-slate-900 dark:text-slate-200 truncate"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-600 flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 flex-wrap gap-2">
        <span>
          Showing {start}–{end} of {totalRows.toLocaleString()}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage(1)}
            disabled={page <= 1}
            className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700/50"
          >
            First
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700/50"
          >
            Previous
          </button>
          <span className="px-2">
            Page{' '}
            <input
              type="number"
              min={1}
              max={totalPages}
              value={page}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v)) setPage(Math.max(1, Math.min(totalPages, v)));
              }}
              className="w-12 text-center rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white py-0.5"
            />
            {' '}of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700/50"
          >
            Next
          </button>
          <button
            type="button"
            onClick={() => setPage(totalPages)}
            disabled={page >= totalPages}
            className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700/50"
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
}
