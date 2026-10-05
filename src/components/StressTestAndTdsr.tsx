import React, { useState } from 'react';
import { calculateMasTdsr, calculateStressTestScenarios, formatSGD } from '../utils/soraCalculator';
import { ShieldCheck, AlertCircle, TrendingUp, Building, UserCheck } from 'lucide-react';

interface StressTestAndTdsrProps {
  loanAmount: number;
  tenureYears: number;
  effectiveRate: number;
}

export const StressTestAndTdsr: React.FC<StressTestAndTdsrProps> = ({
  loanAmount,
  tenureYears,
  effectiveRate,
}) => {
  const [monthlyIncome, setMonthlyIncome] = useState<number>(12000);
  const [otherMonthlyDebt, setOtherMonthlyDebt] = useState<number>(1200); // e.g. car loan, student debt
  const [propertyType, setPropertyType] = useState<'CONDO_PRIVATE' | 'HDB' | 'COMMERCIAL'>('CONDO_PRIVATE');

  const tdsr = calculateMasTdsr(
    loanAmount,
    tenureYears,
    monthlyIncome,
    otherMonthlyDebt,
    propertyType
  );

  const scenarios = calculateStressTestScenarios(loanAmount, effectiveRate, tenureYears);

  return (
    <div className="space-y-6">
      {/* 1. TDSR Affordability Assessment */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 lg:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-red-700" />
              <h3 className="text-base font-semibold text-slate-900">
                MAS TDSR & Affordability Stress Assessment
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Assessed strictly at the MAS regulatory interest rate floor (4.00% p.a. for residential)
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
            MAS Notice 645 Compliant
          </span>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Monthly Income */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Gross Monthly Income (SGD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-mono text-slate-400">S$</span>
              <input
                type="number"
                min={1000}
                step={500}
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(Math.max(0, Number(e.target.value)))}
                className="w-full pl-8 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-1 focus:ring-red-600"
              />
            </div>
            <span className="text-[11px] text-slate-500">Sole or combined borrower income</span>
          </div>

          {/* Other Debt Commitments */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Other Monthly Debts (SGD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-mono text-slate-400">S$</span>
              <input
                type="number"
                min={0}
                step={100}
                value={otherMonthlyDebt}
                onChange={(e) => setOtherMonthlyDebt(Math.max(0, Number(e.target.value)))}
                className="w-full pl-8 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-1 focus:ring-red-600"
              />
            </div>
            <span className="text-[11px] text-slate-500">Car loans, personal loans, credit card balances</span>
          </div>

          {/* Property Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Property Classification
            </label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-red-600 bg-white"
            >
              <option value="CONDO_PRIVATE">Private Condo / Landed (TDSR 55%)</option>
              <option value="HDB">HDB / Executive Condo (TDSR 55% + MSR 30%)</option>
              <option value="COMMERCIAL">Commercial / Industrial (5.00% Floor)</option>
            </select>
            <span className="text-[11px] text-slate-500">Determines MSR & regulatory interest floor</span>
          </div>
        </div>

        {/* Results Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* TDSR Result */}
          <div className={`p-4 rounded-xl border ${
            tdsr.isTdsrCompliant ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Total Debt Servicing Ratio (TDSR)
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                tdsr.isTdsrCompliant ? 'bg-emerald-200 text-emerald-900' : 'bg-red-200 text-red-900'
              }`}>
                {tdsr.isTdsrCompliant ? 'PASS' : 'EXCEEDED'}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold font-mono text-slate-900">
                {tdsr.tdsrRatio.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-500 font-medium">
                (MAS Regulatory Ceiling: 55.0%)
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full transition-all duration-300 ${
                  tdsr.tdsrRatio <= 55 ? 'bg-emerald-600' : 'bg-red-600'
                }`}
                style={{ width: `${Math.min(100, (tdsr.tdsrRatio / 55) * 100)}%` }}
              />
            </div>

            <div className="text-[11px] text-slate-600 space-y-0.5">
              <div>Stress test installment (at {tdsr.masStressRate.toFixed(2)}%): <strong>{formatSGD(tdsr.stressMonthlyPayment)}/mo</strong></div>
              <div>Total debt commitment: <strong>{formatSGD(tdsr.totalDebtObligation)}/mo</strong></div>
            </div>
          </div>

          {/* MSR Result (if HDB) or Borrowing Capacity */}
          {propertyType === 'HDB' ? (
            <div className={`p-4 rounded-xl border ${
              tdsr.isMsrCompliant ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Mortgage Servicing Ratio (MSR)
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  tdsr.isMsrCompliant ? 'bg-emerald-200 text-emerald-900' : 'bg-red-200 text-red-900'
                }`}>
                  {tdsr.isMsrCompliant ? 'PASS' : 'EXCEEDED'}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold font-mono text-slate-900">
                  {tdsr.msrRatio?.toFixed(1)}%
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  (MAS HDB/EC Cap: 30.0%)
                </span>
              </div>

              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full transition-all duration-300 ${
                    (tdsr.msrRatio || 0) <= 30 ? 'bg-emerald-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${Math.min(100, ((tdsr.msrRatio || 0) / 30) * 100)}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-600">
                For HDB flats and ECs, the monthly mortgage installment alone cannot exceed 30% of gross household income.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1">
                  Remaining Borrowing Capacity
                </span>
                <div className="text-2xl font-bold font-mono text-slate-900 mb-1">
                  {formatSGD(Math.max(0, (monthlyIncome * 0.55) - tdsr.totalDebtObligation))}
                  <span className="text-xs font-sans text-slate-500 font-normal"> / month buffer</span>
                </div>
                <p className="text-xs text-slate-600">
                  Maximum allowable total monthly commitments under MAS 55% TDSR is{' '}
                  <strong>{formatSGD(monthlyIncome * 0.55)}</strong>.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500">
                Regulatory requirement under MAS Notice 645 & Notice 1115 for financial institutions in Singapore.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Rate Sensitivity Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-700" />
            <h3 className="text-base font-semibold text-slate-900">
              SORA Rate Sensitivity Matrix
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Simulate how your monthly payment and total interest change if SORA interest rates shift
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Rate Scenario</th>
                <th className="py-3 px-4">Total All-In Rate</th>
                <th className="py-3 px-4 text-right">Monthly Installment</th>
                <th className="py-3 px-4 text-right">Monthly Difference</th>
                <th className="py-3 px-4 text-right">Total Interest Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {scenarios.map((sc) => {
                const isBase = sc.rateShiftBps === 0;
                return (
                  <tr
                    key={sc.rateShiftBps}
                    className={`hover:bg-slate-50 transition-colors ${
                      isBase ? 'bg-red-50/40 font-semibold' : ''
                    }`}
                  >
                    <td className="py-2.5 px-4 font-sans text-slate-900">
                      {sc.label}
                      {isBase && (
                        <span className="ml-2 text-[10px] text-red-700 bg-red-100 px-1.5 py-0.5 rounded font-bold">
                          CURRENT
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-slate-800">
                      {sc.totalRate.toFixed(4)}% p.a.
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                      {formatSGD(sc.monthlyPayment)}
                    </td>
                    <td className={`py-2.5 px-4 text-right ${
                      sc.paymentDelta > 0
                        ? 'text-red-700 font-medium'
                        : sc.paymentDelta < 0
                        ? 'text-emerald-700 font-medium'
                        : 'text-slate-500'
                    }`}>
                      {sc.paymentDelta > 0 ? `+${formatSGD(sc.paymentDelta)}` : sc.paymentDelta < 0 ? formatSGD(sc.paymentDelta) : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-700">
                      {formatSGD(sc.totalInterestTenure)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
