'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import type { SelectedDatasetData } from './DashboardClient';

interface ChartsProps {
  dataset: SelectedDatasetData;
}

const STATUS_COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#8b5cf6'];

export function Charts({ dataset }: ChartsProps) {
  const successByYearData = dataset.aggregateYear.map((y) => ({
    year: String(y.year),
    missionCount: y.missionCount,
    successRate: y.successRate ?? 0,
  }));

  const topCompanies = dataset.aggregateCompany.slice(0, 10).map((a) => ({
    name: a.company.length > 20 ? a.company.slice(0, 20) + '…' : a.company,
    fullName: a.company,
    count: a.missionCount,
  }));

  const statusData = dataset.aggregateStatus.map((s, i) => ({
    name: s.status,
    value: s.missionCount,
    color: STATUS_COLORS[i % STATUS_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
          Success rate over time by year
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={successByYearData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-600" />
              <XAxis dataKey="year" className="text-xs" />
              <YAxis yAxisId="left" className="text-xs" />
              <YAxis yAxisId="right" orientation="right" className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
                formatter={(value: number, name: string) => [
                  name === 'successRate' ? `${value}%` : value,
                  name === 'successRate' ? 'Success rate (%)' : 'Missions',
                ]}
                labelFormatter={(label) => `Year ${label}`}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="missionCount"
                name="Missions"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="successRate"
                name="Success rate (%)"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Green: success rate (%). Blue: mission count per year.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
            Top companies by mission count
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCompanies} layout="vertical" margin={{ left: 80, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-600" />
                <XAxis type="number" className="text-xs" />
                <YAxis type="category" dataKey="name" width={80} className="text-xs" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [value, 'Missions']}
                  labelFormatter={(_, payload) => payload[0]?.payload?.fullName ?? ''}
                />
                <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} name="Missions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
            Mission status distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string) => [value, name]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
