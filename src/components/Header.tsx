import React from 'react';
import { SoraBenchmarkSummary } from '../types/sora';
import { Landmark, RefreshCw, Server, ArrowUpRight, ShieldCheck, HelpCircle } from 'lucide-react';

interface HeaderProps {
  benchmarkSummary: SoraBenchmarkSummary;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenBackendModal: () => void;
  dataSourceMessage: string;
}

export const Header: React.FC<HeaderProps> = ({
  benchmarkSummary,
  onRefresh,
  isRefreshing,
  onOpenBackendModal,
  dataSourceMessage,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white shadow-xs">
      {/* Top institution bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-700 flex items-center justify-center text-white shadow-xs">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  Singapore SORA Calculator
                </h1>
                <span className="text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                  MAS Benchmark
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Overnight Rate Average & Compounded Mortgage Calculation Engine · Actual/365
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenBackendModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md transition-colors"
              title="Configure future backend integration"
            >
              <Server className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Backend API Connector</span>
              <span className="sm:hidden">API</span>
            </button>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-md transition-colors shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Rates</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAS Benchmark Ticker Bar */}
      <div className="bg-slate-900 text-white border-t border-slate-800 px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-2 text-xs">
          <div className="flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-300 font-medium">MAS Reference Rates</span>
            <span className="text-slate-500">·</span>
            <span>Published {benchmarkSummary.publicationDate} (09:00 SGT)</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-mono text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Overnight SORA:</span>
              <span className="font-semibold text-emerald-300">{benchmarkSummary.overnightSora.toFixed(4)}%</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">1M SORA:</span>
              <span className="font-semibold text-white">{benchmarkSummary.compounded1M.toFixed(4)}%</span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              <span className="text-amber-300 font-medium">3M SORA (Most Popular):</span>
              <span className="font-bold text-amber-200">{benchmarkSummary.compounded3M.toFixed(4)}%</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">6M SORA:</span>
              <span className="font-semibold text-white">{benchmarkSummary.compounded6M.toFixed(4)}%</span>
            </div>

            <div className="hidden md:flex items-center gap-1.5 text-slate-400">
              <span>SORA Index:</span>
              <span className="text-slate-200">{benchmarkSummary.soraIndex.toFixed(5)}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
