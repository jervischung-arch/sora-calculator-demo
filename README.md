# Singapore SORA Calculator - MAS Benchmark Rates

A Singapore-based SORA (Singapore Overnight Rate Average) interest and mortgage payment calculator. Built with React, TypeScript, and Tailwind CSS.

## Features

- **MAS Benchmark Rates**: Reads and tracks official Monetary Authority of Singapore (MAS) published benchmark rates:
  - Overnight SORA
  - 1-Month Compounded SORA
  - 3-Month Compounded SORA
  - 6-Month Compounded SORA
  - SORA Index
- **ABS/MAS Compounding Formula**:
  - Implements the exact ABS/MAS daily compounding formula on an **Actual/365** day count convention.
  - Accounts for weekend 3-day weights (Friday rollover) and business day counts.
  - Includes a step-by-step formula audit trail.
- **Singapore Mortgage Loan Calculator**:
  - Singapore loan amount presets (HDB S$500k, EC S$800k, Condo S$1.2M, Prime S$1.8M, Landed S$3.0M).
  - Configurable tenure (1–35 years) and bank margin/spread (+0.60% to +1.00% p.a.).
  - Supports Monthly Amortizing (P + I) and Interest-Only schedules.
  - Full amortization schedule with annual and monthly views, plus CSV export.
- **Regulatory Stress Testing & Affordability**:
  - Evaluates Total Debt Servicing Ratio (**TDSR $\le 55\%$**) and Mortgage Servicing Ratio (**MSR $\le 30\%$** for HDB/EC).
  - Assesses affordability under the MAS regulatory interest rate floor (**4.00% p.a.**).
  - Rate sensitivity matrix modeling shifts from -50 bps to +300 bps.
- **Mortgage Package Comparison**:
  - Side-by-side comparison between 3M SORA, 1M SORA, Fixed Rate packages, and HDB concessionary loan rates.
- **Backend Connector Panel**:
  - Includes a dedicated API connector drawer with JSON contracts and Express.js proxy snippets for seamless future backend integration.

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will start on `http://localhost:3000`.

### Build

```bash
npm run build
```

## License

Apache-2.0
