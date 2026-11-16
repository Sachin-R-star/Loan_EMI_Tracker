# Loan EMI Tracker — Staff Portal & Amortization Engine

A clean, responsive, and robust **Loan EMI Management Application** tailored for lending staff, loan officers, and branch managers. Built with an exact **8.0% per annum reducing-balance amortization engine**, complete with member management, automated schedule generation, early foreclosure settlement, top-up gating rules, and member-wise outstanding portfolio reporting with CSV export.

---

## Table of Contents

1. [Quick Start & Local Setup](#1-quick-start--local-setup)
2. [The EMI Math & Reducing Balance Explained](#2-the-emi-math--reducing-balance-explained)
   - [The Mathematical Formula](#the-mathematical-formula)
   - [Why Month 1 Interest Differs From Month 12 Interest](#why-month-1-interest-differs-from-month-12-interest)
   - [Zero-Discrepancy Rounding Strategy](#zero-discrepancy-rounding-strategy)
3. [Features & Capabilities](#3-features--capabilities)
   - [Core Requirements](#core-requirements)
   - [Bonus Features](#bonus-features)
4. [Tech Stack & Architecture Decisions](#4-tech-stack--architecture-decisions)
5. [Automated Test Suite](#5-automated-test-suite)
6. [Demo Accounts](#6-demo-accounts)
7. [Honest AI Assistance Disclosure](#7-honest-ai-assistance-disclosure)
8. [What I Would Improve with More Time](#8-what-i-would-improve-with-more-time)

---

## 1. Quick Start & Local Setup

### Prerequisites
- **Node.js**: v18.0.0 or later (Tested on Node v20+ / v26)
- **npm**: v9.0.0 or later

### Step 1: Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/Sachin-R-star/Loan_EMI_Tracker.git
cd Loan_EMI_Tracker

# Install dependencies (root, server, and client)
npm install
cd server && npm install && cd ../client && npm install && cd ..
```

### Step 2: Run in Development Mode

Run both the Express backend API (`:5000`) and the Vite React frontend (`:5173`) concurrently with a single command:

```bash
npm run dev
```

- Open your browser at: **`http://localhost:5173`**
- The backend API will be available at: **`http://localhost:5000`**

### Step 3: Run the Test Suite

Execute the automated test suite covering all EMI mathematics, amortization schedules, edge cases, rounding behavior, and API endpoints:

```bash
npm test
```

### Step 4 (Alternative): Unified Production Build

You can also compile the frontend into optimized static assets and have the Node/Express server serve both the API and client from a single port (`:5000`):

```bash
npm run build
npm start
```
- Open: **`http://localhost:5000`**

---

## 2. The EMI Math & Reducing Balance Explained

### The Mathematical Formula

The monthly instalment (EMI) is computed using the standard reducing-balance formula:

$$\text{EMI} = P \times \frac{r(1 + r)^n}{(1 + r)^n - 1}$$

Where:
- **$P$** = Principal loan amount (e.g., ₹1,00,000)
- **$r$** = Monthly interest rate ($\text{Annual Rate} / 12 = 0.08 / 12 \approx 0.0066666666666667$)
- **$n$** = Loan tenure in months (e.g., 12)

```javascript
const r = 0.08 / 12;
const compoundFactor = Math.pow(1 + r, tenureMonths);
const emiExact = (principal * r * compoundFactor) / (compoundFactor - 1);
const monthlyEMI = Math.round(emiExact);
```

### Why Month 1 Interest Differs From Month 12 Interest

> **The Core Principle:** In a reducing-balance loan, interest is calculated solely on the **unpaid opening balance**, never on the original principal.

Consider a loan of **₹1,00,000** for **12 months** at **8% per annum** (Monthly EMI = **₹8,699**):

1. **In Month 1:**
   - The opening balance is the full **₹1,00,000**.
   - Interest for Month 1 = $₹1,00,000 \times \frac{0.08}{12} = \mathbf{₹667}$.
   - Principal component paid = $₹8,699 - ₹667 = \mathbf{₹8,032}$.
   - Remaining balance falls to $₹1,00,000 - ₹8,032 = \mathbf{₹91,968}$.

2. **In Subsequent Months (e.g., Month 2 to 11):**
   - Each monthly payment reduces the principal debt.
   - Because the remaining debt is smaller each month, the interest charge shrinks monotonically.
   - Since the EMI is fixed, as the interest charge shrinks, the **principal portion of the EMI grows** each month.

3. **In Month 12 (Final Month):**
   - By month 12, 11 instalments have eroded the principal down to only **₹8,641**.
   - Interest for Month 12 = $₹8,641 \times \frac{0.08}{12} = \mathbf{₹58}$.
   - Principal component paid = **₹8,641** (paying off the entire remainder).
   - Ending balance = **₹0**.

**Summary Table:**

| Metric | Month 1 | Month 12 | Explanation |
| :--- | :--- | :--- | :--- |
| **Opening Balance** | ₹1,00,000 | ₹8,641 | 91% of principal already paid down |
| **Interest Charged** | **₹667** | **₹58** | Calculated strictly on remaining debt |
| **Principal Portion** | ₹8,032 | ₹8,641 | Larger share goes toward principal payoff |
| **Closing Balance** | ₹91,968 | **₹0** | Loan is completely cleared |

### Zero-Discrepancy Rounding Strategy

In financial applications using whole rupees (`₹1,23,456`), rounding each month's interest and principal to integer values can introduce a minor cumulative drift (a few rupees or paise).

To guarantee that:
1. No lingering paise or rupees are left hanging,
2. The final row's closing balance is guaranteed to be **₹0**, and
3. The sum of all principal components across all months **strictly equals** the starting principal $P$,

the amortization generator treats the final month with standard banking reconciliation:
- Month $n$ Principal Component $\equiv$ Remaining Opening Balance ($B_{n-1}$).
- Month $n$ EMI $\equiv$ Principal Component $+$ Month $n$ Interest.
- Month $n$ Closing Balance $\equiv \mathbf{₹0}$.

---

## 3. Features & Capabilities

### Core Requirements
- **Staff Authentication**: Secure login interface with pre-configured staff accounts (`Loan Officer` and `Branch Manager`).
- **Member Directory**:
  - View all registered members with their employee IDs, monthly salaries, active loans count, and total outstanding exposure.
  - Register new members with comprehensive validation (unique employee IDs, positive monthly salary, required fields).
- **Loan Management**:
  - Disburse new loans with Principal, Tenure in months, and fixed 8% p.a. reducing rate.
  - Auto-generate complete month-by-month amortization schedule on creation.
  - Search loans by ID or member name, and filter by status (`All`, `Active`, `Closed`).
- **Interactive Loan Detail View**:
  - Current outstanding balance highlighted at the top.
  - Visual principal repayment progress bar.
  - Full amortization schedule table: EMI #, Due Date, Opening Balance, EMI Amount, Principal Component, Interest Component, Outstanding Balance, and Status.
- **Member-wise Outstanding Report**:
  - Aggregated tabular view of each member's credit profile (Total Loans, Active Loans, Total Borrowed, Total Repaid, Total Outstanding).
  - Summary totals footer with grand metrics.
  - **"Export to CSV"** button for instant file download.
- **Indian Rupee Standard**: All currency values formatted as `₹1,23,456` with Indian comma grouping without decimals.

### Bonus Features
- **Early Foreclosure Settlement**:
  - One-click foreclosure action on any active loan.
  - Precise settlement calculation: $\text{Settlement} = \text{Outstanding Principal} + \text{Current Month Interest}$ (all future interest 100% waived).
  - Updates loan status to `Closed` with permanent settlement audit log.
- **Top-Up Gating Rule**:
  - Enforces policy: Members can only receive an additional top-up loan if they have repaid **$\ge$ 33% of the principal** on existing active loans.
  - Provides a visible warning with staff override capability for authorized management exceptions.
- **Live EMI Preview**: Real-time calculator card as staff types loan amount and tenure in the modal before disbursement.
- **Interactive "Pay Next EMI" Action**: Allows staff/reviewers to simulate sequential instalment payments and observe the reducing balance live.
- **Dark Mode**: Persistent light/dark mode toggle supporting system preferences and manual override.
- **Automated Test Suite**: 20 unit and integration tests with 100% pass rate.

---

## 4. Tech Stack & Architecture Decisions

| Component | Choice | Reason for Decision |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | Lightning-fast development server, instant HMR, clean component tree. |
| **Styling** | Tailwind CSS | Utility-first styling with effortless dark mode support and crisp data tables. |
| **Icons** | Lucide React | Modern, accessible, clean icon set. |
| **Backend** | Node.js + Express (ES Modules) | Lightweight, predictable REST API with native fetch and zero compilation overhead. |
| **Data Layer** | Atomic JSON Persistence | Reliable cross-platform file database (`store.json`) with pre-seeded realistic members and loans; eliminates native C++ build errors (e.g. node-gyp on Windows). |
| **Testing** | Node.js Native Test Runner (`node:test`, `node:assert`) | Zero external test dependencies, blazing fast (< 1.5s), runs natively in modern Node.js. |

---

## 5. Automated Test Suite

The test suite is organized into two suites:
1. **Mathematical Engine Tests (`server/tests/emiService.test.js`)**:
   - Exact EMI formula verification for standard 12-month loan.
   - 1-month tenure single-payment edge case.
   - Multi-year 36-month tenure verification.
   - Input validation (rejects 0 tenure, negative principal, non-integers).
   - Schedule reconciliation: verifying total principal sum == initial principal and final balance == 0.
   - Rounding torture test with odd numbers (e.g., ₹13,337 across 7 months).
   - Monotonic interest reduction verification ($I_1 > I_2 > \dots > I_n$).
   - Foreclosure settlement breakdown.
   - Top-up gating qualification logic.
2. **Backend API Integration Tests (`server/tests/api.test.js`)**:
   - `/api/health` status check.
   - `/api/auth/login` credential validation.
   - `/api/members` retrieval and uniqueness validation.
   - `/api/loans/preview` live calculation without saving.
   - `/api/reports/member-outstanding` aggregation.
   - `/api/reports/member-outstanding/csv` downloadable CSV generation.

Run all tests via:
```bash
npm test
```

---

## 6. Demo Accounts

| Role | Username | Password | Notes |
| :--- | :--- | :--- | :--- |
| **Loan Officer** | `staff` | `password123` | Default staff member |
| **Branch Manager** | `admin` | `admin123` | Managerial access |

*(Quick demo buttons are also provided directly on the login screen for 1-click credential entry).*

---

## 7. Honest AI Assistance Disclosure

In alignment with Section 6 of the assignment, here is a transparent breakdown of how AI tools were used during development:

- **What AI was used for:**
  - Generating initial Tailwind CSS layout scaffolding and modal markup structures.
  - Typing boilerplate integration test wrappers (`node:test` setup and fetch calls).
  - Generating initial seed data arrays for Indian member names and realistic loan balances.
- **What was designed, coded, and reviewed by the author:**
  - The entire **reducing-balance amortization formula and rounding reconciliation logic** in `emiService.js`.
  - The zero-discrepancy final month principal adjustment to prevent fractional rupee leakage.
  - The foreclosure settlement formula ($\text{Principal} + \text{Current Month Interest}$) and future interest waiver behavior.
  - The top-up gating 33% repayment validation rule.
  - Designing the REST API route contracts and database atomic persistence.
  - Writing the test cases to verify financial accuracy and edge conditions.
  - Indian Rupee comma formatting (`Intl.NumberFormat('en-IN')`).

---

## 8. What I Would Improve with More Time

1. **Part-Payment / Prepayment Flexibility**: Allow borrowers to make ad-hoc principal part-payments with the option to either reduce the remaining tenure or lower the monthly EMI.
2. **Production Database & ORM**: Migrate the lightweight JSON store to PostgreSQL with Prisma or SQLite with WAL mode for high concurrency.
3. **Role-Based Permissions (RBAC)**: Enforce distinct authorization scopes (e.g. only Branch Managers can authorize top-up gating overrides or process foreclosures).
4. **Automated Repayment Webhooks**: Integrate with banking payment gateways (e.g. NACH / eNACH mandates or UPI autopay) for automated EMI collection callbacks.
5. **PDF Statement Generator**: Add printable PDF amortization schedule downloads alongside CSV exports.
