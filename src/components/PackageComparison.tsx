import React, { useState } from 'react';
import { calculateMonthlyPayment, formatSGD } from '../utils/soraCalculator';
import { SoraBenchmarkSummary } from '../types/sora';
import { Columns, ArrowRight, Check, Sparkles } from 'lucide-react';

interface PackageComparisonProps {
  loanAmount: number;
  tenureYears: number;
  benchmarkSummary: SoraBenchmarkSummary;
  currentSpread: number;
}

interface MortgagePackage {
  id: string;
  name: string;
  bankType: string;
  description: string;
  rateFormula: string;
  nominalRatePct: number;
  lockInYears: number;
  isPopular?: boolean;
}

export const PackageComparison: React.FC<PackageComparisonProps> = ({
  loanAmount,
  tenureYears,
  benchmarkSummary,
  currentSpread,
}) => {
  const [fixedRate1, setFixedRate1] = useState<number>(2.95);
  const [fixedRate2, setFixedRate2] = useState<number>(3.10);

  const packages: MortgagePackage[] = [
    {
      id: '3m_sora',
      name: '3-Month Compounded SORA',
      bankType: 'DBS / OCBC / UOB Float',
      description: 'Quarterly reset based on MAS published 3M SORA benchmark.',
      rateFormula: `3M SORA (${benchmarkSummary.compounded3M.toFixed(2)}%) + ${currentSpread.toFixed(2)}%`,
      nominalRatePct: benchmarkSummary.compounded3M + currentSpread,
      lockInYears: 2,
      isPopular: true,
    },
    {
      id: '1m_sora',
      name: '1-Month Compounded SORA',
      bankType: 'StanChart / HSBC Float',
      description: 'Monthly reset, captures rate decreases faster when rates soften.',
      rateFormula: `1M SORA (${benchmarkSummary.compounded1M.toFixed(2)}%) + ${(currentSpread - 0.05).toFixed(2)}%`,
      nominalRatePct: benchmarkSummary.compounded1M + (currentSpread - 0.05),
      lockInYears: 1,
    },
    {
      id: '2y_fixed',
      name: '2-Year Fixed Rate',
      bankType: 'Commercial Bank Fixed',
      description: 'Guaranteed fixed installment protection against market rate spikes.',
      rateFormula: `${fixedRate1.toFixed(2)}% Fixed (Year 1-2)`,
      nominalRatePct: fixedRate1,
      lockInYears: 2,
    },
    {
      id: 'hdb_cpf',
      name: 'HDB Concessionary Loan',
      bankType: 'HDB Statutory Board',
      description: 'CPF OA rate + 0.10% (Fixed across decades for eligible citizens).',
      rateFormula: 'CPF OA (2.50%) + 0.10%',
      nominalRatePct: 2.60,
      lockInYears: 0,
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 lg:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Columns className="w-5 h-5 text-red-700" />
            <h3 className="text-base font-semibold text-slate-900">
              Singapore Mortgage Package Comparison
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare floating SORA packages against fixed rates and HDB concessionary loan for S${(loanAmount / 1000).toFixed(0)}k
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {packages.map((pkg) => {
          const monthlyPmt = calculateMonthlyPayment(loanAmount, pkg.nominalRatePct, tenureYears);
          const totalPaid = monthlyPmt * tenureYears * 12;
          const totalInterest = totalPaid - loanAmount;

          return (
            <div
              key={pkg.id}
              className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                pkg.isPopular
                  ? 'border-red-700 bg-red-50/20 ring-1 ring-red-700/50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    {pkg.bankType}
                  </span>
                  {pkg.isPopular && (
                    <span className="text-[10px] font-bold bg-red-700 text-white px-2 py-0.5 rounded">
                      MOST POPULAR
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  {pkg.name}
                </h4>
                <p className="text-[11px] text-slate-500 leading-snug mb-3 min-h-[32px]">
                  {pkg.description}
                </p>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 mb-4 font-mono text-xs">
                  <span className="text-[10px] text-slate-400 block font-sans uppercase">Formula</span>
                  <span className="font-semibold text-slate-800">{pkg.rateFormula}</span>
                </div>

                <div className="space-y-1 mb-4">
                  <span className="text-xs text-slate-500 uppercase tracking-wide block">
                    All-in Rate
                  </span>
                  <div className="text-2xl font-bold font-mono text-slate-900">
                    {pkg.nominalRatePct.toFixed(2)}%
                    <span className="text-xs font-normal text-slate-500 font-sans"> p.a.</span>
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Monthly Repayment:</span>
                    <span className="font-bold font-mono text-slate-900">
                      {formatSGD(monthlyPmt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Lock-in Period:</span>
                    <span className="font-semibold text-slate-700">
                      {pkg.lockInYears > 0 ? `${pkg.lockInYears} Years` : 'No Lock-in'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Interest (Tenure):</span>
                    <span className="font-mono text-slate-700">
                      {formatSGD(totalInterest)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>3-Yr Outlay:</span>
                  <span className="font-bold font-mono text-slate-800">
                    {formatSGD(monthlyPmt * 36)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
