import React, { useState } from 'react';
import { SoraDailyRate } from '../types/sora';
import { LineChart as LineChartIcon, Activity } from 'lucide-react';

interface RateTrendsChartProps {
  dailyRates: SoraDailyRate[];
  benchmarkRate3M: number;
  bankSpread: number;
}

export const RateTrendsChart: React.FC<RateTrendsChartProps> = ({
  dailyRates,
  benchmarkRate3M,
  bankSpread,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Take the last 60 business days for clear visualization
  const chartData = React.useMemo(() => {
    return dailyRates.slice(-60);
  }, [dailyRates]);

  if (chartData.length === 0) return null;

  // Chart dimensions
  const width = 800;
  const height = 260;
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Min and max for Y axis
  const rates = chartData.map((d) => d.rate);
  const minRate = Math.floor(Math.min(...rates, benchmarkRate3M) * 10) / 10 - 0.2;
  const maxRate = Math.ceil(Math.max(...rates, benchmarkRate3M + bankSpread) * 10) / 10 + 0.2;

  // Scaling helpers
  const getX = (index: number) => padding.left + (index / (chartData.length - 1)) * innerWidth;
  const getY = (val: number) => padding.top + innerHeight - ((val - minRate) / (maxRate - minRate)) * innerHeight;

  // Generate SVG path for daily rates
  const linePoints = chartData.map((d, i) => `${getX(i)},${getY(d.rate)}`).join(' ');

  // Y-axis ticks
  const yTicks = [minRate, minRate + (maxRate - minRate) * 0.33, minRate + (maxRate - minRate) * 0.66, maxRate];

  const hoveredData = hoveredIndex !== null ? chartData[hoveredIndex] : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-700" />
            <h3 className="text-base font-semibold text-slate-900">
              MAS SORA Rate Trajectory (Last 60 Business Days)
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Daily overnight rates vs. 3M Compounded Benchmark ({benchmarkRate3M.toFixed(4)}%)
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-slate-900 inline-block" />
            <span className="text-slate-700">Daily SORA</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-red-700 inline-block stroke-dasharray" />
            <span className="text-slate-700">3M Compounded SORA</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-600 inline-block" />
            <span className="text-slate-700">+ Bank Spread ({bankSpread.toFixed(2)}%)</span>
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          style={{ minWidth: '600px' }}
        >
          {/* Background grid */}
          {yTicks.map((tickVal, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={getY(tickVal)}
                x2={width - padding.right}
                y2={getY(tickVal)}
                stroke="#E2E8F0"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 8}
                y={getY(tickVal) + 4}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-mono"
              >
                {tickVal.toFixed(2)}%
              </text>
            </g>
          ))}

          {/* 3M Benchmark reference line */}
          <line
            x1={padding.left}
            y1={getY(benchmarkRate3M)}
            x2={width - padding.right}
            y2={getY(benchmarkRate3M)}
            stroke="#B91C1C"
            strokeWidth="1.5"
            strokeDasharray="6 3"
          />

          {/* All-in (Benchmark + Spread) line */}
          <line
            x1={padding.left}
            y1={getY(benchmarkRate3M + bankSpread)}
            x2={width - padding.right}
            y2={getY(benchmarkRate3M + bankSpread)}
            stroke="#059669"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />

          {/* Area fill under SORA curve */}
          <path
            d={`M ${getX(0)},${getY(minRate)} L ${chartData
              .map((d, i) => `${getX(i)},${getY(d.rate)}`)
              .join(' L ')} L ${getX(chartData.length - 1)},${getY(minRate)} Z`}
            fill="#0F172A"
            fillOpacity="0.04"
          />

          {/* Daily SORA line */}
          <polyline
            fill="none"
            stroke="#0F172A"
            strokeWidth="2"
            points={linePoints}
          />

          {/* Hover hit areas */}
          {chartData.map((d, i) => (
            <rect
              key={d.date}
              x={getX(i) - 6}
              y={padding.top}
              width={12}
              height={innerHeight}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}

          {/* Active hover indicator */}
          {hoveredIndex !== null && (
            <g>
              <line
                x1={getX(hoveredIndex)}
                y1={padding.top}
                x2={getX(hoveredIndex)}
                y2={padding.top + innerHeight}
                stroke="#64748B"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle
                cx={getX(hoveredIndex)}
                cy={getY(chartData[hoveredIndex].rate)}
                r="4.5"
                fill="#DC2626"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            </g>
          )}

          {/* X axis dates */}
          {chartData.map((d, i) => {
            // Display label every 10 items
            if (i % 10 === 0 || i === chartData.length - 1) {
              return (
                <text
                  key={d.date}
                  x={getX(i)}
                  y={height - 12}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-500 font-mono"
                >
                  {d.date.slice(5)}
                </text>
              );
            }
            return null;
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredData && hoveredIndex !== null && (
          <div
            className="absolute top-2 pointer-events-none bg-slate-900 text-white px-3 py-2 rounded shadow-lg text-xs font-mono space-y-1 z-10"
            style={{
              left: `${Math.min(Math.max(10, (hoveredIndex / chartData.length) * 85), 75)}%`,
            }}
          >
            <div className="font-semibold text-slate-300 font-sans">{hoveredData.date}</div>
            <div>Overnight SORA: <strong className="text-emerald-300">{hoveredData.rate.toFixed(4)}%</strong></div>
            <div>Weight: <strong>{hoveredData.dayCountWeight} day(s)</strong></div>
            {hoveredData.volumeMillionSGD && (
              <div>Volume: <strong>S${(hoveredData.volumeMillionSGD / 1000).toFixed(2)}B</strong></div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
