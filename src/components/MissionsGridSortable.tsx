'use client';

import { useMemo } from 'react';
import type { Table } from '@tanstack/react-table';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import type { MissionRowData } from './MissionsGrid';

function SortableHeaderCell({
  table,
  columnId,
  children,
}: {
  table: Table<MissionRowData>;
  columnId: string;
  children: React.ReactNode;
}) {
  const column = table.getColumn(columnId);
  if (!column) return null;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: columnId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <th
      ref={setNodeRef}
      style={{ ...style, width: column.getSize(), minWidth: column.getSize(), position: 'relative' }}
      className={`py-2 px-2 text-left font-medium text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-600 last:border-r-0 select-none ${
        isDragging ? 'opacity-50 bg-slate-200 dark:bg-slate-600' : ''
      }`}
    >
      <div className="flex items-center gap-1 pr-2">
        <span
          className="cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </span>
        <span className="flex-1 truncate">{children}</span>
        <button
          type="button"
          onClick={column.getToggleSortingHandler()}
          className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          title={column.getNextSortingOrder() === 'asc' ? 'Sort ascending' : column.getNextSortingOrder() === 'desc' ? 'Sort descending' : 'Clear sort'}
        >
          {column.getIsSorted() === 'asc' ? ' ↑' : column.getIsSorted() === 'desc' ? ' ↓' : ' ⇅'}
        </button>
      </div>
      {(() => {
        const col = column as unknown as Record<string, unknown>;
        const handler = col.getResizeHandler as (() => (e: unknown) => void) | undefined;
        if (!handler) return null;
        const h = handler();
        return (
          <div
            onMouseDown={h}
            onTouchStart={h}
            className="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-sky-500/50 active:bg-sky-500"
            style={{ touchAction: 'none' }}
          />
        );
      })()}
    </th>
  );
}

export function SortableHeaderRow({ table }: { table: Table<MissionRowData> }) {
  const columnOrder = table.getState().columnOrder.length
    ? table.getState().columnOrder
    : table.getAllLeafColumns().map((c) => c.id);

  const sortableIds = useMemo(() => columnOrder.filter((id) => id !== 'id'), [columnOrder]);

  return (
    <SortableContext items={sortableIds} strategy={horizontalListSortingStrategy}>
      <tr>
        {columnOrder.map((columnId) => {
          const column = table.getColumn(columnId);
          if (!column) return null;
          return (
            <SortableHeaderCell key={columnId} table={table} columnId={columnId}>
              {typeof column.columnDef.header === 'string' ? column.columnDef.header : columnId}
            </SortableHeaderCell>
          );
        })}
      </tr>
    </SortableContext>
  );
}
