import React from 'react';
import { LoanParameters, BenchmarkType, RepaymentType, SoraBenchmarkSummary } from '../types/sora';
import { formatSGD } from '../utils/soraCalculator';
import { Sliders, Calculator, Info, Building2, Calendar, Percent } from 'lucide-react';

interface LoanInputFormProps {
  params: LoanParameters;
  onChange: (params: LoanParameters) => void;
  benchmarkSummary: SoraBenchmarkSummary;
  dailyCompoundedRate: number;
}

const PRESET_AMOUNTS = [
  { label: 'S$500k', value: 500_000, desc: 'HDB 4/5-Room' },
  { label: 'S$800k', value: 800_000, desc: 'EC / Resale' },
  { label: 'S$1.2M', value: 1_200_000, desc: 'Entry Condo' },
  { label: 'S$1.8M', value: 1_800_000, desc: 'Prime 3-Bed' },
  { label: 'S$3.0M', value: 3_000_000, desc: 'Landed / Luxury' },
];

const PRESET_SPREADS = [
  { label: '+0.60%', value: 0.60, note: 'Year 1-3 promo' },
  { label: '+0.65%', value: 0.65, note: 'Standard market' },
  { label: '+0.75%', value: 0.75, note: 'Competitive' },
  { label: '+0.85%', value: 0.85, note: 'Thereafter rate' },
];

export const LoanInputForm: React.FC<LoanInputFormProps> = ({
  params,
  onChange,
  benchmarkSummary,
  dailyCompoundedRate,
}) => {
  const handleAmountChange = (val: number) => {
    onChange({ ...params, loanAmount: Math.max(10_000, val) });
  };

  const handleTenureChange = (val: number) => {
    onChange({ ...params, loanTenureYears: Math.min(35, Math.max(1, val)) });
  };

  const handleSpreadChange = (val: number) => {
    onChange({ ...params, bankSpread: Math.max(0, Number(val.toFixed(2))) });
  };

  const handleBenchmarkTypeChange = (type: BenchmarkType) => {
    onChange({ ...params, benchmarkType: type });
  };

  const handleRepaymentChange = (type: RepaymentType) => {
    onChange({ ...params, repaymentType: type });
  };

  // Active benchmark rate value for display
  const getActiveBenchmarkValue = (): number => {
    switch (params.benchmarkType) {
      case '1M_SORA':
        return benchmarkSummary.compounded1M;
      case '3M_SORA':
        return benchmarkSummary.compounded3M;
      case '6M_SORA':
        return benchmarkSummary.compounded6M;
      case 'DAILY_COMPOUNDED':
        return dailyCompoundedRate;
      case 'CUSTOM_FIXED':
        return params.customBenchmarkRate || 2.75;
    }
  };

  const activeBenchmarkRate = getActiveBenchmarkValue();
  const totalEffectiveRate = (activeBenchmarkRate + params.bankSpread).toFixed(4);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 lg:p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-red-700" />
          <h2 className="text-base font-semibold text-slate-900">Loan Parameters</h2>
        </div>
        <span className="text-xs text-slate-500 font-mono">
          MAS Standard (Actual/365)
        </span>
      </div>

      {/* 1. Loan Amount */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Loan Amount (SGD)
          </label>
          <span className="text-sm font-mono font-bold text-slate-900">
            {formatSGD(params.loanAmount)}
          </span>
        </div>

        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-mono text-sm">
            S$
          </span>
          <input
            type="number"
            min={10000}
            max={20000000}
            step={10000}
            value={params.loanAmount}
            onChange={(e) => handleAmountChange(Number(e.target.value))}
            className="w-full pl-9 pr-4 py-2.5 text-sm font-mono font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-slate-50 hover:bg-white transition-colors"
          />
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {PRESET_AMOUNTS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => handleAmountChange(preset.value)}
              className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                params.loanAmount === preset.value
                  ? 'bg-red-700 text-white border-red-700 font-medium'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {preset.label} <span className="opacity-75 text-[10px]">({preset.desc})</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Loan Tenure & Repayment Mode */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Loan Tenure */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Tenure
            </label>
            <span className="text-xs font-mono font-semibold text-slate-800">
              {params.loanTenureYears} Years ({params.loanTenureYears * 12} Months)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={35}
              step={1}
              value={params.loanTenureYears}
              onChange={(e) => handleTenureChange(Number(e.target.value))}
              className="flex-1 accent-red-700 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <input
              type="number"
              min={1}
              max={35}
              value={params.loanTenureYears}
              onChange={(e) => handleTenureChange(Number(e.target.value))}
              className="w-16 px-2 py-1.5 text-center text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-600"
            />
          </div>
          <p className="text-[11px] text-slate-500">
            MAS max: 30 yrs for HDB, 35 yrs for Private property
          </p>
        </div>

        {/* Repayment Type */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Repayment Structure
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleRepaymentChange('AMORTIZED')}
              className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                params.repaymentType === 'AMORTIZED'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Principal + Interest
            </button>
            <button
              type="button"
              onClick={() => handleRepaymentChange('INTEREST_ONLY')}
              className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                params.repaymentType === 'INTEREST_ONLY'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Interest-Only
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            {params.repaymentType === 'AMORTIZED' ? 'Standard monthly amortization' : 'Bullet principal upon maturity'}
          </p>
        </div>
      </div>

      {/* 3. Benchmark Selection */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            SORA Benchmark Type
          </label>
          <span className="text-xs font-mono font-medium text-slate-600">
            Selected: <span className="text-slate-900 font-bold">{activeBenchmarkRate.toFixed(4)}% p.a.</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* 3M SORA */}
          <button
            type="button"
            onClick={() => handleBenchmarkTypeChange('3M_SORA')}
            className={`p-3 rounded-lg border text-left transition-all ${
              params.benchmarkType === '3M_SORA'
                ? 'border-red-700 bg-red-50/50 ring-1 ring-red-700'
                : 'border-slate-200 bg-slate-50 hover:bg-white'
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="font-semibold text-xs text-slate-900">3-Month Compounded SORA</span>
              <span className="text-[10px] font-semibold text-red-700 bg-red-100/60 px-1.5 py-0.5 rounded">
                Standard
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-base font-bold font-mono text-slate-900">
                {benchmarkSummary.compounded3M.toFixed(4)}%
              </span>
              <span className="text-[11px] text-slate-500">Published MAS benchmark</span>
            </div>
          </button>

          {/* 1M SORA */}
          <button
            type="button"
            onClick={() => handleBenchmarkTypeChange('1M_SORA')}
            className={`p-3 rounded-lg border text-left transition-all ${
              params.benchmarkType === '1M_SORA'
                ? 'border-red-700 bg-red-50/50 ring-1 ring-red-700'
                : 'border-slate-200 bg-slate-50 hover:bg-white'
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="font-semibold text-xs text-slate-900">1-Month Compounded SORA</span>
              <span className="text-[10px] text-slate-500">Monthly reset</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-base font-bold font-mono text-slate-900">
                {benchmarkSummary.compounded1M.toFixed(4)}%
              </span>
              <span className="text-[11px] text-slate-500">Fast tracking</span>
            </div>
          </button>

          {/* 6M SORA */}
          <button
            type="button"
            onClick={() => handleBenchmarkTypeChange('6M_SORA')}
            className={`p-3 rounded-lg border text-left transition-all ${
              params.benchmarkType === '6M_SORA'
                ? 'border-red-700 bg-red-50/50 ring-1 ring-red-700'
                : 'border-slate-200 bg-slate-50 hover:bg-white'
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="font-semibold text-xs text-slate-900">6-Month Compounded SORA</span>
              <span className="text-[10px] text-slate-500">Semi-annual reset</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-base font-bold font-mono text-slate-900">
                {benchmarkSummary.compounded6M.toFixed(4)}%
              </span>
              <span className="text-[11px] text-slate-500">Lower volatility</span>
            </div>
          </button>

          {/* Daily Compounded in-arrears */}
          <button
            type="button"
            onClick={() => handleBenchmarkTypeChange('DAILY_COMPOUNDED')}
            className={`p-3 rounded-lg border text-left transition-all ${
              params.benchmarkType === 'DAILY_COMPOUNDED'
                ? 'border-red-700 bg-red-50/50 ring-1 ring-red-700'
                : 'border-slate-200 bg-slate-50 hover:bg-white'
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="font-semibold text-xs text-slate-900">Daily Compounded (Exact)</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                In-Arrears
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-base font-bold font-mono text-slate-900">
                {dailyCompoundedRate.toFixed(4)}%
              </span>
              <span className="text-[11px] text-slate-500">Calculated from overnight</span>
            </div>
          </button>
        </div>

        {params.benchmarkType === 'CUSTOM_FIXED' && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Custom Benchmark Rate (% p.a.)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="15"
              value={params.customBenchmarkRate || 2.75}
              onChange={(e) => onChange({ ...params, customBenchmarkRate: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded focus:ring-1 focus:ring-red-600"
            />
          </div>
        )}
      </div>

      {/* 4. Bank Margin / Spread */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Bank Margin / Spread (+% p.a.)
          </label>
          <span className="text-xs font-mono font-bold text-slate-900">
            +{params.bankSpread.toFixed(2)}% p.a.
          </span>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0.1}
            max={3.0}
            step={0.05}
            value={params.bankSpread}
            onChange={(e) => handleSpreadChange(Number(e.target.value))}
            className="flex-1 accent-red-700 h-2 bg-slate-200 rounded-lg cursor-pointer"
          />
          <div className="relative">
            <input
              type="number"
              step={0.01}
              min={0}
              max={10}
              value={params.bankSpread}
              onChange={(e) => handleSpreadChange(Number(e.target.value))}
              className="w-20 px-2 py-1.5 text-right pr-6 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-600"
            />
            <span className="absolute right-2 top-2 text-xs text-slate-400">%</span>
          </div>
        </div>

        {/* Spread Presets */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {PRESET_SPREADS.map((spread) => (
            <button
              key={spread.value}
              type="button"
              onClick={() => handleSpreadChange(spread.value)}
              className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                params.bankSpread === spread.value
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {spread.label} <span className="opacity-70 text-[10px]">({spread.note})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Total Effective Rate Banner */}
      <div className="p-3.5 bg-slate-900 text-white rounded-lg flex items-center justify-between">
        <div>
          <span className="text-[11px] text-slate-400 block uppercase tracking-wider font-semibold">
            All-In Effective Interest Rate
          </span>
          <span className="text-xs text-slate-300">
            {activeBenchmarkRate.toFixed(4)}% (SORA) + {params.bankSpread.toFixed(2)}% (Bank Spread)
          </span>
        </div>
        <div className="text-right">
          <span className="text-xl font-bold font-mono text-emerald-400">
            {totalEffectiveRate}%
          </span>
          <span className="text-[10px] text-slate-400 block">per annum</span>
        </div>
      </div>
    </div>
  );
};
