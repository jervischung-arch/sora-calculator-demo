import React, { useState } from 'react';
import { AmortizationRow } from '../types/sora';
import { formatSGD } from '../utils/soraCalculator';
import { Download, ChevronRight, ChevronDown, Calendar, Search } from 'lucide-react';

interface AmortizationTableProps {
  schedule: AmortizationRow[];
  loanAmount: number;
}

export const AmortizationTable: React.FC<AmortizationTableProps> = ({
  schedule,
  loanAmount,
}) => {
  const [viewMode, setViewMode] = useState<'YEARLY' | 'MONTHLY'>('YEARLY');
  const [selectedYear, setSelectedYear] = useState<number | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Group by year for yearly summary
  const yearlySummary = React.useMemo(() => {
    const yearsMap = new Map<number, {
      yearNum: number;
      startBalance: number;
      endBalance: number;
      totalPayment: number;
      principalPayment: number;
      interestPayment: number;
      effectiveRate: number;
      months: AmortizationRow[];
    }>();

    schedule.forEach((row) => {
      const yearNum = Math.ceil(row.period / 12);
      if (!yearsMap.has(yearNum)) {
        yearsMap.set(yearNum, {
          yearNum,
          startBalance: row.startingBalance,
          endBalance: row.endingBalance,
          totalPayment: 0,
          principalPayment: 0,
          interestPayment: 0,
          effectiveRate: row.effectiveRate,
          months: [],
        });
      }

      const yData = yearsMap.get(yearNum)!;
      yData.totalPayment += row.totalPayment;
      yData.principalPayment += row.principalPayment;
      yData.interestPayment += row.interestPayment;
      yData.endBalance = row.endingBalance;
      yData.months.push(row);
    });

    return Array.from(yearsMap.values());
  }, [schedule]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Period (Month)',
      'Payment Date',
      'Days in Month',
      'Starting Balance (SGD)',
      'Benchmark Rate (%)',
      'Bank Spread (%)',
      'Effective Rate (%)',
      'Total Payment (SGD)',
      'Principal Paid (SGD)',
      'Interest Paid (SGD)',
      'Ending Balance (SGD)',
    ];

    const rows = schedule.map((r) => [
      r.period,
      r.paymentDate,
      r.calendarDaysInMonth,
      r.startingBalance.toFixed(2),
      r.benchmarkRate.toFixed(4),
      r.marginSpread.toFixed(2),
      r.effectiveRate.toFixed(4),
      r.totalPayment.toFixed(2),
      r.principalPayment.toFixed(2),
      r.interestPayment.toFixed(2),
      r.endingBalance.toFixed(2),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SORA_Amortization_Schedule_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered rows for monthly view
  const filteredSchedule = React.useMemo(() => {
    let result = schedule;
    if (selectedYear !== 'ALL') {
      result = result.filter((r) => Math.ceil(r.period / 12) === selectedYear);
    }
    if (searchTerm.trim()) {
      result = result.filter(
        (r) =>
          r.paymentDate.includes(searchTerm) ||
          r.period.toString().includes(searchTerm)
      );
    }
    return result;
  }, [schedule, selectedYear, searchTerm]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Amortization Schedule
          </h3>
          <p className="text-xs text-slate-500">
            Based on Singapore banking standard convention: Actual / 365 days
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
            <button
              onClick={() => setViewMode('YEARLY')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewMode === 'YEARLY'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Annual Summary
            </button>
            <button
              onClick={() => setViewMode('MONTHLY')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewMode === 'MONTHLY'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Breakdown
            </button>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-md transition-colors hover:bg-slate-50 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter bar for monthly view */}
      {viewMode === 'MONTHLY' && (
        <div className="px-4 py-3 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Filter Year:</span>
            <select
              value={selectedYear}
              onChange={(e) =>
                setSelectedYear(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
              }
              className="px-2.5 py-1 text-xs border border-slate-300 rounded bg-white font-mono focus:ring-1 focus:ring-red-600"
            >
              <option value="ALL">All Years ({yearlySummary.length} yrs)</option>
              {yearlySummary.map((y) => (
                <option key={y.yearNum} value={y.yearNum}>
                  Year {y.yearNum}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search date or month #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-red-600 w-44"
            />
          </div>
        </div>
      )}

      {/* Content Table */}
      <div className="overflow-x-auto max-h-[500px]">
        {viewMode === 'YEARLY' ? (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold sticky top-0 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Year</th>
                <th className="py-3 px-4">Beginning Balance</th>
                <th className="py-3 px-4 text-right">Annual Payment</th>
                <th className="py-3 px-4 text-right">Principal Repaid</th>
                <th className="py-3 px-4 text-right text-red-700">Interest Paid</th>
                <th className="py-3 px-4 text-right">Ending Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {yearlySummary.map((y) => (
                <tr key={y.yearNum} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                    Year {y.yearNum}
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {formatSGD(y.startBalance)}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-900">
                    {formatSGD(y.totalPayment)}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-700 font-medium">
                    {formatSGD(y.principalPayment)}
                  </td>
                  <td className="py-3 px-4 text-right text-red-700 font-medium">
                    {formatSGD(y.interestPayment)}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-900">
                    {formatSGD(y.endBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold sticky top-0 border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Days</th>
                <th className="py-3 px-3">Starting Balance</th>
                <th className="py-3 px-3">Rate</th>
                <th className="py-3 px-3 text-right">Payment</th>
                <th className="py-3 px-3 text-right">Principal</th>
                <th className="py-3 px-3 text-right text-red-700">Interest</th>
                <th className="py-3 px-3 text-right">Ending Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {filteredSchedule.map((row) => (
                <tr key={row.period} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 text-slate-500">{row.period}</td>
                  <td className="py-2.5 px-3 text-slate-800">{row.paymentDate}</td>
                  <td className="py-2.5 px-3 text-slate-500">{row.calendarDaysInMonth}d</td>
                  <td className="py-2.5 px-3 text-slate-700">{formatSGD(row.startingBalance)}</td>
                  <td className="py-2.5 px-3 text-slate-600">{row.effectiveRate.toFixed(3)}%</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                    {formatSGD(row.totalPayment)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-700">
                    {formatSGD(row.principalPayment)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-red-700">
                    {formatSGD(row.interestPayment)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-900 font-medium">
                    {formatSGD(row.endingBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Table Footer info */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex flex-wrap justify-between items-center">
        <span>Total Loan Amount: <strong className="text-slate-800">{formatSGD(loanAmount)}</strong></span>
        <span>MAS SORA Mortgage Standard · Day Count: Actual/365</span>
      </div>
    </div>
  );
};
