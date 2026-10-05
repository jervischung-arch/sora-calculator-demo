import React from 'react';
import { formatSGD } from '../utils/soraCalculator';
import { DollarSign, Percent, TrendingUp, AlertTriangle, Calendar, ShieldAlert } from 'lucide-react';

interface KeyMetricsCardsProps {
  monthlyPayment: number;
  totalInterest: number;
  totalPaid: number;
  effectiveRate: number;
  firstYearInterest: number;
  firstYearPrincipal: number;
  stressMonthlyPayment: number;
  repaymentType: string;
}

export const KeyMetricsCards: React.FC<KeyMetricsCardsProps> = ({
  monthlyPayment,
  totalInterest,
  totalPaid,
  effectiveRate,
  firstYearInterest,
  firstYearPrincipal,
  stressMonthlyPayment,
  repaymentType,
}) => {
  const stressDelta = stressMonthlyPayment - monthlyPayment;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Monthly Installment */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-2 h-full bg-red-700" />
        <div className="flex items-center justify-between text-slate-500 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider">
            {repaymentType === 'INTEREST_ONLY' ? 'Initial Monthly Interest' : 'Monthly Installment'}
          </span>
          <DollarSign className="w-4 h-4 text-red-700" />
        </div>
        <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
          {formatSGD(monthlyPayment)}
        </div>
        <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
          <span className="font-semibold text-slate-800">{effectiveRate.toFixed(4)}% p.a.</span>
          <span>effective all-in rate</span>
        </div>
      </div>

      {/* 2. Total Interest Paid */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Total Interest (Tenure)
          </span>
          <Percent className="w-4 h-4 text-slate-700" />
        </div>
        <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
          {formatSGD(totalInterest)}
        </div>
        <div className="mt-2 text-xs text-slate-500">
          Total Repayment: <span className="font-semibold text-slate-700">{formatSGD(totalPaid)}</span>
        </div>
      </div>

      {/* 3. First Year Outlay Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Year 1 Interest / Principal
          </span>
          <Calendar className="w-4 h-4 text-slate-700" />
        </div>
        <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
          {formatSGD(firstYearInterest)}
        </div>
        <div className="mt-2 text-xs text-slate-500">
          Principal repaid: <span className="font-semibold text-slate-700">{formatSGD(firstYearPrincipal)}</span>
        </div>
      </div>

      {/* 4. MAS Stress Test Rate (4.0% Floor) */}
      <div className="bg-slate-50 rounded-xl border border-amber-200 p-5 shadow-xs">
        <div className="flex items-center justify-between text-amber-800 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider">
            MAS Stress Test (4.00%)
          </span>
          <ShieldAlert className="w-4 h-4 text-amber-600" />
        </div>
        <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
          {formatSGD(stressMonthlyPayment)}
        </div>
        <div className="mt-2 text-xs text-amber-800 flex items-center gap-1">
          <span>Buffer required:</span>
          <span className="font-bold font-mono">
            {stressDelta >= 0 ? `+${formatSGD(stressDelta)}/mo` : `${formatSGD(stressDelta)}/mo`}
          </span>
        </div>
      </div>
    </div>
  );
};
