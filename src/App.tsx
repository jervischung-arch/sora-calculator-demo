import React, { useState, useEffect } from 'react';
import {
  LoanParameters,
  SoraBenchmarkSummary,
  SoraDailyRate,
  BackendIntegrationConfig,
} from './types/sora';
import {
  INITIAL_MAS_BENCHMARK,
  DEFAULT_MAS_DAILY_RATES,
  calculateMasCompoundedSora,
  getRatesForWindow,
} from './data/masSoraRates';
import {
  generateAmortizationSchedule,
  getBenchmarkRate,
  calculateMonthlyPayment,
} from './utils/soraCalculator';
import {
  fetchMasSoraRates,
  getSavedBackendConfig,
} from './services/masApiService';

import { Header } from './components/Header';
import { LoanInputForm } from './components/LoanInputForm';
import { KeyMetricsCards } from './components/KeyMetricsCards';
import { AmortizationTable } from './components/AmortizationTable';
import { CompoundingInspector } from './components/CompoundingInspector';
import { RateTrendsChart } from './components/RateTrendsChart';
import { StressTestAndTdsr } from './components/StressTestAndTdsr';
import { PackageComparison } from './components/PackageComparison';
import { BackendIntegrationModal } from './components/BackendIntegrationModal';

import {
  Calculator,
  Binary,
  Activity,
  ShieldCheck,
  Columns,
  ExternalLink,
  Info,
} from 'lucide-react';

export default function App() {
  // State: Loan parameters
  const [loanParams, setLoanParams] = useState<LoanParameters>({
    loanAmount: 1_200_000,
    loanTenureYears: 25,
    bankSpread: 0.65,
    benchmarkType: '3M_SORA',
    repaymentType: 'AMORTIZED',
    startDate: '2026-11-01',
    resetFrequencyMonths: 3,
    lookbackDays: 5,
  });

  // State: Rates data
  const [benchmarkSummary, setBenchmarkSummary] = useState<SoraBenchmarkSummary>(INITIAL_MAS_BENCHMARK);
  const [dailyRates, setDailyRates] = useState<SoraDailyRate[]>(DEFAULT_MAS_DAILY_RATES);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [dataSourceMessage, setDataSourceMessage] = useState<string>('Official MAS benchmark rates loaded');

  // State: Backend modal & config
  const [isBackendModalOpen, setIsBackendModalOpen] = useState<boolean>(false);
  const [backendConfig, setBackendConfig] = useState<BackendIntegrationConfig>(getSavedBackendConfig());

  // Active Tab
  const [activeTab, setActiveTab] = useState<'CALCULATOR' | 'COMPOUNDING' | 'TRENDS' | 'TDSR' | 'COMPARE'>('CALCULATOR');

  // Load rates on initial mount
  const loadRates = async () => {
    setIsRefreshing(true);
    try {
      const result = await fetchMasSoraRates(backendConfig);
      setBenchmarkSummary(result.summary);
      setDailyRates(result.dailyRates);
      setDataSourceMessage(result.message);
    } catch {
      // fallback safe
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadRates();
  }, []);

  // Compute daily compounded rate from current overnight rates
  const dailyCompoundedResult = React.useMemo(() => {
    const windowRates = getRatesForWindow(dailyRates, 90);
    return calculateMasCompoundedSora(windowRates);
  }, [dailyRates]);

  // Active benchmark rate (% p.a.)
  const activeBenchmarkRate = getBenchmarkRate(
    benchmarkSummary,
    loanParams,
    dailyCompoundedResult.compoundedRate
  );

  const effectiveAllInRate = Number((activeBenchmarkRate + loanParams.bankSpread).toFixed(4));

  // Amortization schedule and metrics
  const amortizationData = React.useMemo(() => {
    return generateAmortizationSchedule(loanParams, activeBenchmarkRate);
  }, [loanParams, activeBenchmarkRate]);

  // MAS regulatory stress test payment (4.00% floor)
  const stressMonthlyPmt = calculateMonthlyPayment(
    loanParams.loanAmount,
    4.00,
    loanParams.loanTenureYears
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-red-700 selection:text-white">
      {/* Header with MAS ticker */}
      <Header
        benchmarkSummary={benchmarkSummary}
        onRefresh={loadRates}
        isRefreshing={isRefreshing}
        onOpenBackendModal={() => setIsBackendModalOpen(true)}
        dataSourceMessage={dataSourceMessage}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Key Metrics Top Row */}
        <KeyMetricsCards
          monthlyPayment={amortizationData.monthlyPayment}
          totalInterest={amortizationData.totalInterestPaid}
          totalPaid={amortizationData.totalAmountPaid}
          effectiveRate={effectiveAllInRate}
          firstYearInterest={amortizationData.firstYearInterest}
          firstYearPrincipal={amortizationData.firstYearPrincipal}
          stressMonthlyPayment={stressMonthlyPmt}
          repaymentType={loanParams.repaymentType}
        />

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 shadow-xs">
          <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setActiveTab('CALCULATOR')}
              className={`flex items-center gap-2 py-3 px-3 border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'CALCULATOR'
                  ? 'border-red-700 text-red-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Loan & Amortization</span>
            </button>

            <button
              onClick={() => setActiveTab('COMPOUNDING')}
              className={`flex items-center gap-2 py-3 px-3 border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'COMPOUNDING'
                  ? 'border-red-700 text-red-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Binary className="w-4 h-4" />
              <span>MAS Compounding Formula</span>
            </button>

            <button
              onClick={() => setActiveTab('TRENDS')}
              className={`flex items-center gap-2 py-3 px-3 border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'TRENDS'
                  ? 'border-red-700 text-red-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>SORA Rate History</span>
            </button>

            <button
              onClick={() => setActiveTab('TDSR')}
              className={`flex items-center gap-2 py-3 px-3 border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'TDSR'
                  ? 'border-red-700 text-red-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>MAS TDSR & Stress Test</span>
            </button>

            <button
              onClick={() => setActiveTab('COMPARE')}
              className={`flex items-center gap-2 py-3 px-3 border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'COMPARE'
                  ? 'border-red-700 text-red-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Columns className="w-4 h-4" />
              <span>Package Comparison</span>
            </button>
          </nav>
        </div>

        {/* Tab View Panels */}
        {activeTab === 'CALCULATOR' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5">
              <LoanInputForm
                params={loanParams}
                onChange={setLoanParams}
                benchmarkSummary={benchmarkSummary}
                dailyCompoundedRate={dailyCompoundedResult.compoundedRate}
              />
            </div>
            <div className="lg:col-span-7">
              <AmortizationTable
                schedule={amortizationData.schedule}
                loanAmount={loanParams.loanAmount}
              />
            </div>
          </div>
        )}

        {activeTab === 'COMPOUNDING' && (
          <div className="space-y-6">
            <CompoundingInspector allDailyRates={dailyRates} />
          </div>
        )}

        {activeTab === 'TRENDS' && (
          <div className="space-y-6">
            <RateTrendsChart
              dailyRates={dailyRates}
              benchmarkRate3M={benchmarkSummary.compounded3M}
              bankSpread={loanParams.bankSpread}
            />
          </div>
        )}

        {activeTab === 'TDSR' && (
          <div className="space-y-6">
            <StressTestAndTdsr
              loanAmount={loanParams.loanAmount}
              tenureYears={loanParams.loanTenureYears}
              effectiveRate={effectiveAllInRate}
            />
          </div>
        )}

        {activeTab === 'COMPARE' && (
          <div className="space-y-6">
            <PackageComparison
              loanAmount={loanParams.loanAmount}
              tenureYears={loanParams.loanTenureYears}
              benchmarkSummary={benchmarkSummary}
              currentSpread={loanParams.bankSpread}
            />
          </div>
        )}

        {/* Institutional & Methodology Footnote */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs text-xs text-slate-600 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-semibold">
            <Info className="w-4 h-4 text-red-700" />
            <span>Singapore Overnight Rate Average (SORA) & Banking Conventions</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 leading-relaxed text-slate-500">
            <div>
              <strong className="text-slate-700 block mb-0.5">Monetary Authority of Singapore (MAS)</strong>
              SORA is published daily at 9:00 AM SGT for the preceding Singapore business day. It is the volume-weighted average rate of unsecured overnight interbank SGD transactions brokered in Singapore.
            </div>
            <div>
              <strong className="text-slate-700 block mb-0.5">Day Count & Compounding Convention</strong>
              In accordance with ABS (The Association of Banks in Singapore), daily compounding uses the Actual/365 convention. Weekend and public holiday carry-over is weighted proportionally.
            </div>
            <div>
              <strong className="text-slate-700 block mb-0.5">Backend Integration Ready</strong>
              This frontend reads MAS backed overnight rates and provides a dedicated API connector drawer for seamless binding when you implement your custom backend service.
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>Singapore SORA Mortgage & Commercial Loan Calculator</span>
          <span className="font-mono text-slate-400">MAS Benchmark Standard · Actual/365</span>
        </div>
      </footer>

      {/* Backend Integration Modal */}
      <BackendIntegrationModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
        config={backendConfig}
        onSaveConfig={setBackendConfig}
        onRefreshData={loadRates}
      />
    </div>
  );
}
