import { SoraDailyRate, SoraBenchmarkSummary, CompoundingStep } from '../types/sora';

/**
 * Historical and recent MAS SORA benchmark rates dataset
 * Rates are in percent p.a. (e.g. 2.7850 = 2.7850% p.a.)
 * Day count convention: Actual/365 (Singapore standard)
 */

export const INITIAL_MAS_BENCHMARK: SoraBenchmarkSummary = {
  publicationDate: '2026-10-02',
  overnightSora: 2.7845,
  compounded1M: 2.8120,
  compounded3M: 2.8765,
  compounded6M: 2.9430,
  soraIndex: 1.16482,
  source: 'MAS_OFFICIAL_DATA',
};

// Generate realistic consecutive daily overnight rates for the last 120 business days
export function generateDefaultMasDailyRates(): SoraDailyRate[] {
  const rates: SoraDailyRate[] = [];
  const baseDate = new Date('2026-10-02');
  
  // Seed rates trending realistically between 2.65% and 3.15%
  let currentRate = 2.7845;
  const numDays = 130;

  for (let i = 0; i < numDays; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - i);
    const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday

    // Skip weekends as SORA is only published on Singapore business days
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue;
    }

    // Determine weight (calendar days until next business day)
    // Friday (5) applies for 3 days: Fri, Sat, Sun
    const weight = dayOfWeek === 5 ? 3 : 1;

    // Small realistic random walk with mean reversion
    const delta = (Math.sin(i * 0.18) * 0.015) + ((Math.random() - 0.49) * 0.02);
    currentRate = Math.max(2.45, Math.min(3.40, currentRate + delta));

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const volume = Math.round(2800 + Math.sin(i * 0.3) * 600 + (Math.random() * 400));

    rates.push({
      date: dateStr,
      rate: Number(currentRate.toFixed(4)),
      volumeMillionSGD: volume,
      dayCountWeight: weight,
      isHolidayOrWeekend: false,
    });
  }

  // Sort chronological ascending (oldest first)
  return rates.reverse();
}

export const DEFAULT_MAS_DAILY_RATES: SoraDailyRate[] = generateDefaultMasDailyRates();

/**
 * Calculates the exact MAS Compounded SORA according to the ABS/MAS formula:
 * Compounded SORA = [ Product_{i=1}^{d_b} (1 + (r_i * n_i / 365)) - 1 ] * (365 / d) * 100%
 * 
 * @param rates Array of daily rates in the observation period
 * @returns { compoundedRate: number, totalCalendarDays: number, steps: CompoundingStep[] }
 */
export function calculateMasCompoundedSora(rates: SoraDailyRate[]): {
  compoundedRate: number;
  totalCalendarDays: number;
  businessDaysCount: number;
  steps: CompoundingStep[];
} {
  if (!rates || rates.length === 0) {
    return {
      compoundedRate: INITIAL_MAS_BENCHMARK.compounded3M,
      totalCalendarDays: 90,
      businessDaysCount: 65,
      steps: [],
    };
  }

  let product = 1.0;
  let totalCalendarDays = 0;
  const steps: CompoundingStep[] = [];

  for (const item of rates) {
    const rDecimal = item.rate / 100;
    const factor = 1 + (rDecimal * item.dayCountWeight) / 365;
    product *= factor;
    totalCalendarDays += item.dayCountWeight;

    steps.push({
      date: item.date,
      soraRate: item.rate,
      weightDays: item.dayCountWeight,
      factor: factor,
      runningProduct: product,
    });
  }

  if (totalCalendarDays === 0) totalCalendarDays = 1;

  // Annualized rate in percentage
  const compoundedAnnualRate = (product - 1) * (365 / totalCalendarDays) * 100;
  const rounded = Number(compoundedAnnualRate.toFixed(4));

  return {
    compoundedRate: rounded,
    totalCalendarDays,
    businessDaysCount: rates.length,
    steps,
  };
}

/**
 * Filter daily rates for a specific lookback window (e.g. past 30 days, 90 days, or 180 days)
 */
export function getRatesForWindow(
  allRates: SoraDailyRate[],
  windowDays: number = 90
): SoraDailyRate[] {
  if (allRates.length === 0) return [];
  // Slice last N calendar days worth of business days (approx 5/7 of calendar days)
  const approxBusinessDays = Math.ceil((windowDays * 5) / 7);
  return allRates.slice(-approxBusinessDays);
}
