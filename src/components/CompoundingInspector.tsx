import React, { useState } from 'react';
import { SoraDailyRate } from '../types/sora';
import { calculateMasCompoundedSora, getRatesForWindow } from '../data/masSoraRates';
import { Binary, Calculator, CheckCircle2, Info, ArrowRight } from 'lucide-react';

interface CompoundingInspectorProps {
  allDailyRates: SoraDailyRate[];
}

export const CompoundingInspector: React.FC<CompoundingInspectorProps> = ({
  allDailyRates,
}) => {
  const [windowDays, setWindowDays] = useState<number>(90); // 30, 90, 180

  const activeRates = React.useMemo(() => {
    return getRatesForWindow(allDailyRates, windowDays);
  }, [allDailyRates, windowDays]);

  const calculationResult = React.useMemo(() => {
    return calculateMasCompoundedSora(activeRates);
  }, [activeRates]);

  const { compoundedRate, totalCalendarDays, businessDaysCount, steps } = calculationResult;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Binary className="w-5 h-5 text-red-700" />
            <h3 className="text-base font-semibold text-slate-900">
              MAS SORA Compounding Formula & Audit Trail
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent breakdown of overnight rate compounding according to MAS / ABS methodology
          </p>
        </div>

        {/* Observation Window Selector */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
          <button
            onClick={() => setWindowDays(30)}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              windowDays === 30
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1-Month (30 Days)
          </button>
          <button
            onClick={() => setWindowDays(90)}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              windowDays === 90
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            3-Month (90 Days)
          </button>
          <button
            onClick={() => setWindowDays(180)}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              windowDays === 180
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            6-Month (180 Days)
          </button>
        </div>
      </div>

      {/* Formula Card */}
      <div className="p-5 border-b border-slate-200 bg-slate-900 text-white">
        <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2 flex items-center justify-between">
          <span>Official MAS Daily Compounding Formula</span>
          <span className="text-emerald-400 font-mono">Actual/365 Day Basis</span>
        </div>

        <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700/80 font-mono text-xs sm:text-sm text-center text-slate-100 overflow-x-auto">
          Compounded SORA = &nbsp;
          <span className="text-amber-300 font-bold">
            [ &prod;<sub>i=1</sub><sup>d<sub>b</sub></sup> ( 1 + (r<sub>i</sub> &times; n<sub>i</sub> / 365) ) - 1 ]
          </span>
          &nbsp;&times;&nbsp;
          <span className="text-emerald-300 font-bold">
            ( 365 / d )
          </span>
          &nbsp;&times;&nbsp; 100%
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs font-mono">
          <div className="bg-slate-800 p-2.5 rounded border border-slate-700">
            <span className="text-slate-400 text-[10px] block uppercase">Business Days (d_b)</span>
            <span className="text-white font-bold text-sm">{businessDaysCount} Days</span>
          </div>
          <div className="bg-slate-800 p-2.5 rounded border border-slate-700">
            <span className="text-slate-400 text-[10px] block uppercase">Calendar Days (d)</span>
            <span className="text-white font-bold text-sm">{totalCalendarDays} Days</span>
          </div>
          <div className="bg-slate-800 p-2.5 rounded border border-slate-700">
            <span className="text-slate-400 text-[10px] block uppercase">Geometric Factor (&prod;)</span>
            <span className="text-amber-300 font-bold text-sm">
              {steps[steps.length - 1]?.runningProduct.toFixed(7) || '1.0000000'}
            </span>
          </div>
          <div className="bg-slate-800 p-2.5 rounded border border-slate-700">
            <span className="text-slate-400 text-[10px] block uppercase">Resulting Compounded</span>
            <span className="text-emerald-400 font-bold text-sm">{compoundedRate.toFixed(4)}% p.a.</span>
          </div>
        </div>
      </div>

      {/* Audit Step-by-Step Table */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex items-center justify-between">
        <span className="font-semibold text-slate-800">
          Daily Overnight Calculation Series ({steps.length} business dates observed)
        </span>
        <span className="text-[11px] text-slate-500">
          Friday rates carry 3 calendar days (Fri, Sat, Sun)
        </span>
      </div>

      <div className="overflow-x-auto max-h-80">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-100 text-slate-700 uppercase sticky top-0 border-b border-slate-200 text-[11px]">
            <tr>
              <th className="py-2.5 px-3">Date (SG)</th>
              <th className="py-2.5 px-3">MAS SORA Rate (r_i)</th>
              <th className="py-2.5 px-3">Day Weight (n_i)</th>
              <th className="py-2.5 px-3">Compounding Factor [1 + (r*n/365)]</th>
              <th className="py-2.5 px-3 text-right">Cumulative Product (&prod;)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {steps.slice(-25).reverse().map((step, idx) => (
              <tr key={step.date} className="hover:bg-slate-50">
                <td className="py-2 px-3 text-slate-900 font-sans font-medium">
                  {step.date}
                </td>
                <td className="py-2 px-3 text-slate-700 font-bold">
                  {step.soraRate.toFixed(4)}%
                </td>
                <td className="py-2 px-3 text-slate-600">
                  <span className={`px-1.5 py-0.5 rounded text-[11px] ${
                    step.weightDays > 1 ? 'bg-amber-100 text-amber-800 font-semibold' : 'text-slate-600'
                  }`}>
                    {step.weightDays} {step.weightDays > 1 ? 'days (Weekend)' : 'day'}
                  </span>
                </td>
                <td className="py-2 px-3 text-slate-600">
                  {step.factor.toFixed(8)}
                </td>
                <td className="py-2 px-3 text-right text-slate-900 font-semibold">
                  {step.runningProduct.toFixed(7)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500">
        Showing latest 25 daily observations in window. All days are strictly factored into final compounded rate.
      </div>
    </div>
  );
};
