'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import type { ChartDataPoint, PieChartData } from '@/lib/analytics-types';

type ChartType = 'line' | 'bar' | 'area' | 'pie';

interface ReportChartProps {
  title: string;
  description?: string;
  type: ChartType;
  data: ChartDataPoint[] | PieChartData[];
  className?: string;
  dataKey?: string;
  secondaryDataKey?: string;
  height?: number;
  loading?: boolean;
  colors?: string[];
}

const DEFAULT_COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#f97316', '#14b8a6', '#ec4899'];

function LoadingChart({ height }: { height: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-4 w-1/3 bg-muted rounded" />
      <div style={{ height }} className="bg-muted rounded" />
    </div>
  );
}

export function ReportChart({
  title,
  description,
  type,
  data,
  className,
  dataKey = 'value',
  secondaryDataKey,
  height = 300,
  loading = false,
  colors = DEFAULT_COLORS,
}: ReportChartProps) {
  if (loading) {
    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <LoadingChart height={height} />
        </CardHeader>
      </Card>
    );
  }

  const isPie = type === 'pie';
  const chartData = data as ChartDataPoint[];
  const pieData = data as PieChartData[];

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div style={{ height }} className="flex items-center justify-center text-sm text-muted-foreground">
            No data available for this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            {isPie ? (
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name} ${(percent != null ? (percent * 100).toFixed(0) : 0)}%`}
                  outerRadius={80}
                  dataKey="value"
                  role="img"
                  aria-label={title}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color ?? colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            ) : type === 'area' ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors[0]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={colors[0]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" className="text-xs" tick={{ fontSize: 12 }} />
                <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey={dataKey}
                  stroke={colors[0]}
                  fill={`url(#gradient-${title})`}
                  strokeWidth={2}
                />
                {secondaryDataKey && (
                  <Area
                    type="monotone"
                    dataKey={secondaryDataKey}
                    stroke={colors[1]}
                    fill={`url(#gradient-${title}-secondary)`}
                    strokeWidth={2}
                  />
                )}
              </AreaChart>
            ) : type === 'bar' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" className="text-xs" tick={{ fontSize: 12 }} />
                <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey={dataKey} fill={colors[0]} radius={[4, 4, 0, 0]} role="img" aria-label={title} />
                {secondaryDataKey && (
                  <Bar dataKey={secondaryDataKey} fill={colors[1]} radius={[4, 4, 0, 0]} />
                )}
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" className="text-xs" tick={{ fontSize: 12 }} />
                <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={dataKey}
                  stroke={colors[0]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  role="img"
                  aria-label={title}
                />
                {secondaryDataKey && (
                  <Line
                    type="monotone"
                    dataKey={secondaryDataKey}
                    stroke={colors[1]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
