/**
 * CSV parse, validate, and normalize for space missions.
 * Required columns: Company, Location, Date, Time, Rocket, Mission, RocketStatus, Price, MissionStatus
 */

import Papa from 'papaparse';

export const REQUIRED_COLUMNS = [
  'Company',
  'Location',
  'Date',
  'Time',
  'Rocket',
  'Mission',
  'RocketStatus',
  'Price',
  'MissionStatus',
] as const;

export type RequiredColumn = (typeof REQUIRED_COLUMNS)[number];

export interface NormalizedRow {
  company: string;
  location: string;
  date: Date;
  time: string;
  rocket: string;
  mission: string;
  rocketStatus: string;
  price: number | null;
  missionStatus: string;
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function trim(s: unknown): string {
  if (s == null) return '';
  return String(s).trim();
}

function parseDate(value: string): Date | null {
  const v = trim(value);
  if (!v || !DATE_REGEX.test(v)) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function parsePrice(value: string): number | null {
  const v = trim(value);
  if (v === '' || v.toLowerCase() === 'nan') return null;
  const n = Number(v.replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? null : n;
}

export interface ParseResult {
  rows: NormalizedRow[];
  droppedRowCount: number;
  errors: string[];
}

/**
 * Parse CSV string and validate headers. Normalize whitespace, parse dates, handle missing Price.
 * Invalid date rows are dropped and counted.
 */
export function parseAndValidateCsv(csvText: string): ParseResult {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => trim(h),
  });

  const errors: string[] = [];
  const rows: NormalizedRow[] = [];
  let droppedRowCount = 0;

  if (!result.data.length) {
    errors.push('CSV has no data rows.');
    return { rows: [], droppedRowCount: 0, errors };
  }

  const headers = result.meta.fields ?? [];
  const missing = REQUIRED_COLUMNS.filter((c) => !headers.includes(c));
  if (missing.length > 0) {
    errors.push(`Missing required columns: ${missing.join(', ')}`);
    return { rows: [], droppedRowCount: 0, errors };
  }

  for (const row of result.data) {
    if (!row || typeof row !== 'object') continue;
    const get = (col: string) => trim(String((row as Record<string, unknown>)[col] ?? ''));
    const date = parseDate(get('Date'));
    if (!date) {
      droppedRowCount++;
      continue;
    }
    rows.push({
      company: get('Company'),
      location: get('Location'),
      date,
      time: get('Time'),
      rocket: get('Rocket'),
      mission: get('Mission'),
      rocketStatus: get('RocketStatus'),
      price: parsePrice(get('Price')),
      missionStatus: get('MissionStatus'),
    });
  }

  return { rows, droppedRowCount, errors };
}

/**
 * Max file size in bytes (e.g. 10MB)
 */
export const MAX_CSV_BYTES = 10 * 1024 * 1024;
