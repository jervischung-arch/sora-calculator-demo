import {
  LoanParameters,
  AmortizationRow,
  StressTestScenario,
  TdsrAnalysis,
  SoraBenchmarkSummary,
} from '../types/sora';

/**
 * Calculates monthly mortgage payment (PMT)
 * Using standard Singapore banking formula
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRatePct: number,
  tenureYears: number
): number {
  if (principal <= 0) return 0;
  if (annualRatePct <= 0) return principal / (tenureYears * 12);

  const monthlyRate = annualRatePct / 100 / 12;
  const totalMonths = tenureYears * 12;

  const factor = Math.pow(1 + monthlyRate, totalMonths);
  const pmt = (principal * monthlyRate * factor) / (factor - 1);
  return Number(pmt.toFixed(2));
}

/**
 * Days in month for Actual/365 calculation
 */
export function getDaysInMonth(year: number, monthZeroIndexed: number): number {
  return new Date(year, monthZeroIndexed + 1, 0).getDate();
}

/**
 * Generates the full amortization schedule for the loan
 */
export function generateAmortizationSchedule(
  params: LoanParameters,
  benchmarkRatePct: number
): {
  schedule: AmortizationRow[];
  totalInterestPaid: number;
  totalAmountPaid: number;
  monthlyPayment: number;
  firstYearInterest: number;
  firstYearPrincipal: number;
} {
  const {
    loanAmount,
    loanTenureYears,
    bankSpread,
    repaymentType,
    startDate,
  } = params;

  const totalMonths = loanTenureYears * 12;
  const effectiveRate = Number((benchmarkRatePct + bankSpread).toFixed(4));
  const standardPmt = calculateMonthlyPayment(loanAmount, effectiveRate, loanTenureYears);

  const schedule: AmortizationRow[] = [];
  let currentBalance = loanAmount;
  let totalInterest = 0;
  let totalPaid = 0;
  let firstYearInterest = 0;
  let firstYearPrincipal = 0;

  const [startYearStr, startMonthStr] = startDate.split('-');
  const baseDate = new Date(parseInt(startYearStr, 10), parseInt(startMonthStr, 10) - 1, 1);

  for (let month = 1; month <= totalMonths; month++) {
    if (currentBalance <= 0) break;

    const paymentDateObj = new Date(baseDate.getFullYear(), baseDate.getMonth() + month - 1, 1);
    const year = paymentDateObj.getFullYear();
    const monthIdx = paymentDateObj.getMonth();
    const daysInMonth = getDaysInMonth(year, monthIdx);

    const dateFormatted = `${year}-${String(monthIdx + 1).padStart(2, '0')}-01`;

    let interestThisMonth = 0;
    let principalThisMonth = 0;
    let paymentThisMonth = 0;

    if (repaymentType === 'INTEREST_ONLY') {
      // Interest = Principal * (Rate / 100) * (DaysInMonth / 365)
      interestThisMonth = Number((currentBalance * (effectiveRate / 100) * (daysInMonth / 365)).toFixed(2));
      principalThisMonth = month === totalMonths ? currentBalance : 0;
      paymentThisMonth = interestThisMonth + principalThisMonth;
    } else {
      // Standard Singapore amortizing schedule
      // Monthly interest based on Actual/365
      interestThisMonth = Number((currentBalance * (effectiveRate / 100) * (daysInMonth / 365)).toFixed(2));
      
      // If last month or balance is lower than standard principal
      if (month === totalMonths) {
        principalThisMonth = currentBalance;
        paymentThisMonth = Number((principalThisMonth + interestThisMonth).toFixed(2));
      } else {
        paymentThisMonth = standardPmt;
        principalThisMonth = Number((paymentThisMonth - interestThisMonth).toFixed(2));

        if (principalThisMonth > currentBalance) {
          principalThisMonth = currentBalance;
          paymentThisMonth = Number((principalThisMonth + interestThisMonth).toFixed(2));
        }
      }
    }

    const endingBalance = Math.max(0, Number((currentBalance - principalThisMonth).toFixed(2)));

    schedule.push({
      period: month,
      paymentDate: dateFormatted,
      startingBalance: currentBalance,
      benchmarkRate: benchmarkRatePct,
      marginSpread: bankSpread,
      effectiveRate: effectiveRate,
      totalPayment: paymentThisMonth,
      principalPayment: principalThisMonth,
      interestPayment: interestThisMonth,
      endingBalance: endingBalance,
      calendarDaysInMonth: daysInMonth,
    });

    totalInterest += interestThisMonth;
    totalPaid += paymentThisMonth;

    if (month <= 12) {
      firstYearInterest += interestThisMonth;
      firstYearPrincipal += principalThisMonth;
    }

    currentBalance = endingBalance;
  }

  return {
    schedule,
    totalInterestPaid: Number(totalInterest.toFixed(2)),
    totalAmountPaid: Number(totalPaid.toFixed(2)),
    monthlyPayment: repaymentType === 'INTEREST_ONLY' 
      ? schedule[0]?.totalPayment || 0 
      : standardPmt,
    firstYearInterest: Number(firstYearInterest.toFixed(2)),
    firstYearPrincipal: Number(firstYearPrincipal.toFixed(2)),
  };
}

/**
 * Calculates stress test scenarios (e.g. rate changes +0.5%, +1.0%, +2.0%, etc.)
 */
export function calculateStressTestScenarios(
  loanAmount: number,
  baseRatePct: number,
  tenureYears: number
): StressTestScenario[] {
  const deltas = [-0.5, -0.25, 0, 0.5, 1.0, 1.5, 2.0, 3.0];
  const basePmt = calculateMonthlyPayment(loanAmount, baseRatePct, tenureYears);

  return deltas.map((delta) => {
    const totalRate = Math.max(0.1, Number((baseRatePct + delta).toFixed(4)));
    const pmt = calculateMonthlyPayment(loanAmount, totalRate, tenureYears);
    const paymentDelta = Number((pmt - basePmt).toFixed(2));
    const totalInterest = (pmt * tenureYears * 12) - loanAmount;

    let label = 'Base Rate';
    if (delta > 0) label = `+${delta.toFixed(2)}% (+${Math.round(delta * 100)} bps)`;
    if (delta < 0) label = `${delta.toFixed(2)}% (${Math.round(delta * 100)} bps)`;

    return {
      rateShiftBps: Math.round(delta * 100),
      label,
      totalRate,
      monthlyPayment: pmt,
      paymentDelta,
      totalInterestTenure: Math.max(0, Number(totalInterest.toFixed(2))),
    };
  });
}

/**
 * MAS TDSR & MSR calculation
 * Regulatory floor: 4.00% p.a. for residential property
 * TDSR cap: 55%
 * MSR cap: 30% (HDB & EC)
 */
export function calculateMasTdsr(
  loanAmount: number,
  tenureYears: number,
  monthlyIncome: number,
  otherMonthlyDebt: number,
  propertyType: 'HDB' | 'CONDO_PRIVATE' | 'COMMERCIAL' = 'CONDO_PRIVATE'
): TdsrAnalysis {
  // MAS regulatory stress test rate is 4.00% p.a. for residential
  const masStressRate = propertyType === 'COMMERCIAL' ? 5.00 : 4.00;
  const stressMonthlyPayment = calculateMonthlyPayment(loanAmount, masStressRate, tenureYears);

  const totalDebtObligation = stressMonthlyPayment + otherMonthlyDebt;
  const tdsrRatio = monthlyIncome > 0 ? (totalDebtObligation / monthlyIncome) * 100 : 0;
  const tdsrLimit = 55.0; // 55% MAS TDSR limit
  const isTdsrCompliant = tdsrRatio <= tdsrLimit;

  let msrRatio: number | undefined;
  let msrLimit: number | undefined;
  let isMsrCompliant: boolean | undefined;

  if (propertyType === 'HDB') {
    msrLimit = 30.0; // 30% MSR limit
    msrRatio = monthlyIncome > 0 ? (stressMonthlyPayment / monthlyIncome) * 100 : 0;
    isMsrCompliant = msrRatio <= msrLimit;
  }

  return {
    monthlyIncome,
    otherMonthlyDebt,
    propertyType,
    masStressRate,
    stressMonthlyPayment: Number(stressMonthlyPayment.toFixed(2)),
    totalDebtObligation: Number(totalDebtObligation.toFixed(2)),
    tdsrRatio: Number(tdsrRatio.toFixed(2)),
    tdsrLimit,
    isTdsrCompliant,
    msrRatio: msrRatio !== undefined ? Number(msrRatio.toFixed(2)) : undefined,
    msrLimit,
    isMsrCompliant,
  };
}

/**
 * Resolves active benchmark rate from summary or custom
 */
export function getBenchmarkRate(
  benchmarkSummary: SoraBenchmarkSummary,
  params: LoanParameters,
  dailyCompoundedRate?: number
): number {
  switch (params.benchmarkType) {
    case '1M_SORA':
      return benchmarkSummary.compounded1M;
    case '3M_SORA':
      return benchmarkSummary.compounded3M;
    case '6M_SORA':
      return benchmarkSummary.compounded6M;
    case 'DAILY_COMPOUNDED':
      return dailyCompoundedRate || benchmarkSummary.compounded3M;
    case 'CUSTOM_FIXED':
      return params.customBenchmarkRate || 2.75;
    default:
      return benchmarkSummary.compounded3M;
  }
}

/**
 * Format currency in Singapore Dollars (SGD)
 */
export function formatSGD(amount: number): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format compact SGD for charts and badges
 */
export function formatCompactSGD(amount: number): string {
  if (amount >= 1_000_000) {
    return `S$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `S$${(amount / 1_000).toFixed(0)}k`;
  }
  return `S$${amount.toFixed(0)}`;
}
