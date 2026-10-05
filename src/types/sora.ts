export interface SoraDailyRate {
  date: string; // YYYY-MM-DD
  rate: number; // in percentage, e.g. 2.7845
  volumeMillionSGD?: number; // SGD Million
  dayCountWeight: number; // usually 1 for Mon-Thu, 3 for Fri (to Mon), or accounts for public holidays
  isHolidayOrWeekend?: boolean;
}

export interface SoraBenchmarkSummary {
  publicationDate: string;
  overnightSora: number; // e.g. 2.75
  compounded1M: number; // e.g. 2.82
  compounded3M: number; // e.g. 2.89
  compounded6M: number; // e.g. 2.98
  soraIndex: number; // e.g. 1.15234
  source: 'MAS_OFFICIAL_DATA' | 'CUSTOM_BACKEND' | 'USER_OVERRIDE';
}

export type BenchmarkType = '1M_SORA' | '3M_SORA' | '6M_SORA' | 'DAILY_COMPOUNDED' | 'CUSTOM_FIXED';

export type RepaymentType = 'AMORTIZED' | 'INTEREST_ONLY';

export interface LoanParameters {
  loanAmount: number; // in SGD
  loanTenureYears: number; // e.g. 25, 30
  bankSpread: number; // e.g. 0.65% p.a.
  benchmarkType: BenchmarkType;
  customBenchmarkRate?: number; // used if custom
  repaymentType: RepaymentType;
  startDate: string; // YYYY-MM-DD
  resetFrequencyMonths: number; // 1, 3, or 6
  lookbackDays: number; // usually 5 business days lookback for Singapore banks
}

export interface CompoundingStep {
  date: string;
  soraRate: number;
  weightDays: number;
  factor: number; // 1 + (r * n / 365)
  runningProduct: number;
}

export interface AmortizationRow {
  period: number; // month number 1..N
  paymentDate: string;
  startingBalance: number;
  benchmarkRate: number;
  marginSpread: number;
  effectiveRate: number;
  totalPayment: number;
  principalPayment: number;
  interestPayment: number;
  endingBalance: number;
  calendarDaysInMonth: number;
}

export interface StressTestScenario {
  rateShiftBps: number; // e.g. +50, +100, +200 bps
  label: string;
  totalRate: number;
  monthlyPayment: number;
  paymentDelta: number;
  totalInterestTenure: number;
}

export interface TdsrAnalysis {
  monthlyIncome: number; // SGD
  otherMonthlyDebt: number; // SGD
  propertyType: 'HDB' | 'CONDO_PRIVATE' | 'COMMERCIAL';
  masStressRate: number; // 4.00% p.a. residential floor
  stressMonthlyPayment: number;
  totalDebtObligation: number;
  tdsrRatio: number; // Total Debt / Income
  tdsrLimit: number; // 55%
  isTdsrCompliant: boolean;
  msrRatio?: number; // Mortgage / Income (for HDB, max 30%)
  msrLimit?: number;
  isMsrCompliant?: boolean;
}

export interface BackendIntegrationConfig {
  backendEndpointUrl: string;
  apiKey?: string;
  useLiveMasProxy: boolean;
  enableDebugLogs: boolean;
}
