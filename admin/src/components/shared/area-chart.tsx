'use client';

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface AreaChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  areas: {
    dataKey: string;
    name?: string;
    color?: string;
    fillOpacity?: number;
    stackId?: string;
  }[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  yAxisFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number) => string;
}

export function AreaChart({
  data,
  xKey,
  areas,
  height = 300,
  showGrid = true,
  showLegend = true,
  yAxisFormatter,
  tooltipFormatter,
}: AreaChartProps) {
  const defaultColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#e2e8f0' }}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#e2e8f0' }}
          tickFormatter={yAxisFormatter}
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
        {areas.map((area, index) => (
          <Area
            key={area.dataKey}
            type="monotone"
            dataKey={area.dataKey}
            name={area.name || area.dataKey}
            stroke={area.color || defaultColors[index % defaultColors.length]}
            fill={area.color || defaultColors[index % defaultColors.length]}
            fillOpacity={area.fillOpacity ?? 0.2}
            stackId={area.stackId}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
