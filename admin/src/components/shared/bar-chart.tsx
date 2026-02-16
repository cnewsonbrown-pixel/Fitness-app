'use client';

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface BarChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  bars: {
    dataKey: string;
    name?: string;
    color?: string;
    stackId?: string;
  }[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  layout?: 'horizontal' | 'vertical';
  yAxisFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number) => string;
}

export function BarChart({
  data,
  xKey,
  bars,
  height = 300,
  showGrid = true,
  showLegend = true,
  layout = 'horizontal',
  yAxisFormatter,
  tooltipFormatter,
}: BarChartProps) {
  const defaultColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        layout={layout}
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
        <XAxis
          dataKey={layout === 'horizontal' ? xKey : undefined}
          type={layout === 'horizontal' ? 'category' : 'number'}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#e2e8f0' }}
        />
        <YAxis
          dataKey={layout === 'vertical' ? xKey : undefined}
          type={layout === 'vertical' ? 'category' : 'number'}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#e2e8f0' }}
          tickFormatter={layout === 'horizontal' ? yAxisFormatter : undefined}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          formatter={(value: number) => [
            tooltipFormatter ? tooltipFormatter(value) : value,
          ]}
        />
        {showLegend && <Legend />}
        {bars.map((bar, index) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            name={bar.name || bar.dataKey}
            fill={bar.color || defaultColors[index % defaultColors.length]}
            stackId={bar.stackId}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
