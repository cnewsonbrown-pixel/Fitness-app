'use client';

import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HeatmapData {
  x: number;
  y: number;
  value: number;
}

interface HeatmapProps {
  data: HeatmapData[];
  xLabels: string[];
  yLabels: string[];
  colorScale?: { min: string; max: string };
  className?: string;
  valueFormatter?: (value: number) => string;
  cellSize?: number;
}

function interpolateColor(color1: string, color2: string, factor: number): string {
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');

  const r1 = parseInt(hex1.substring(0, 2), 16);
  const g1 = parseInt(hex1.substring(2, 4), 16);
  const b1 = parseInt(hex1.substring(4, 6), 16);

  const r2 = parseInt(hex2.substring(0, 2), 16);
  const g2 = parseInt(hex2.substring(2, 4), 16);
  const b2 = parseInt(hex2.substring(4, 6), 16);

  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function Heatmap({
  data,
  xLabels,
  yLabels,
  colorScale = { min: '#f0f9ff', max: '#6366f1' },
  className,
  valueFormatter = (v) => v.toString(),
  cellSize = 40,
}: HeatmapProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const minValue = Math.min(...data.map((d) => d.value), 0);
  const range = maxValue - minValue || 1;

  const getColor = (value: number) => {
    const factor = (value - minValue) / range;
    return interpolateColor(colorScale.min, colorScale.max, factor);
  };

  const getValue = (x: number, y: number) => {
    const item = data.find((d) => d.x === x && d.y === y);
    return item?.value ?? 0;
  };

  return (
    <TooltipProvider>
      <div className={cn('overflow-x-auto', className)}>
        <div className="inline-block">
          {/* Header row with x labels */}
          <div className="flex">
            <div style={{ width: 60 }} /> {/* Empty corner */}
            {xLabels.map((label, x) => (
              <div
                key={x}
                className="flex items-center justify-center text-xs text-muted-foreground font-medium"
                style={{ width: cellSize, height: 24 }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Data rows */}
          {yLabels.map((yLabel, y) => (
            <div key={y} className="flex">
              <div
                className="flex items-center text-xs text-muted-foreground font-medium pr-2"
                style={{ width: 60 }}
              >
                {yLabel}
              </div>
              {xLabels.map((_, x) => {
                const value = getValue(x, y);
                return (
                  <Tooltip key={x}>
                    <TooltipTrigger asChild>
                      <div
                        className="border border-white rounded-sm cursor-pointer transition-transform hover:scale-110"
                        style={{
                          width: cellSize,
                          height: cellSize,
                          backgroundColor: getColor(value),
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{xLabels[x]}, {yLabel}</p>
                      <p className="text-sm text-muted-foreground">{valueFormatter(value)}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
