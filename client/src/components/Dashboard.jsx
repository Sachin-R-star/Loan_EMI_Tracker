import React from 'react';
import { formatINR, calculateRepaidPct } from '../utils/formatters';
import {
  Wallet,
  Users,
  CreditCard,
  Percent,
  PlusCircle,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';

export default function Dashboard({
  members = [],
  loans = [],
  onOpenAddMember,
  onOpenCreateLoan,
  onOpenLoanDetail,
  setActiveTab
}) {
  const activeLoans = loans.filter(l => l.status === 'Active');
  const closedLoans = loans.filter(l => l.status === 'Closed');

  const totalOutstanding = activeLoans.reduce((sum, l) => sum + (l.outstandingBalance || 0), 0);
  const totalPrincipalDisbursed = loans.reduce((sum, l) => sum + (l.principal || 0), 0);
  const totalRepaidPrincipal = totalPrincipalDisbursed - totalOutstanding;
  const portfolioRepaymentRate = totalPrincipalDisbursed > 0
    ? Math.round((totalRepaidPrincipal / totalPrincipalDisbursed) * 100)
    : 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Staff Overview & Portfolio Hub
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tracking loan amortization schedules and reducing balance repayments.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenAddMember}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-sm font-medium shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Add Member</span>
          </button>
          <button
            onClick={onOpenCreateLoan}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium shadow-md shadow-emerald-600/20 transition"
          >
            <CreditCard className="w-4 h-4" />
            <span>Create Loan</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Outstanding */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Outstanding
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatINR(totalOutstanding)}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
            <span>Across {activeLoans.length} active loans</span>
          </div>
        </div>

        {/* Total Disbursed */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Disbursed
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatINR(totalPrincipalDisbursed)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{portfolioRepaymentRate}% Principal Repaid</span>
          </div>
        </div>

        {/* Total Members */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Registered Members
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {members.length}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
            <span>Active borrowers & applicants</span>
          </div>
        </div>

        {/* Interest Standard */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Standard Rate
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
            8.0% p.a.
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
            <span>Reducing balance compounding</span>
          </div>
        </div>
      </div>

      {/* Feature Explainer Card (Reducing Balance & Top-Up Rule) */}
      <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Transparent Reducing Balance Rule
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                Interest is charged strictly on the remaining opening balance each month ($r = 8\% / 12$).
                The final instalment automatically absorbs rounding differences to clear the principal exactly to ₹0.
                Top-up loans require at least 33% of prior principal to be paid.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('reports')}
            className="shrink-0 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 flex items-center gap-1.5 underline underline-offset-4"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>View Member Outstanding Report</span>
          </button>
        </div>
      </div>

      {/* Active Loans Section */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Active Loans
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live repayment tracking and schedule access
            </p>
          </div>
          <button
            onClick={() => setActiveTab('loans')}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>View All ({loans.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeLoans.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            No active loans found. Click "Create Loan" to disburse a loan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700/60 text-xs uppercase font-semibold text-slate-400">
                  <th className="pb-3 pl-2">Loan ID</th>
                  <th className="pb-3">Member Name</th>
                  <th className="pb-3 text-right">Principal</th>
                  <th className="pb-3 text-right">Tenure</th>
                  <th className="pb-3 text-right">Monthly EMI</th>
                  <th className="pb-3 text-right">Outstanding</th>
                  <th className="pb-3 text-center">Progress</th>
                  <th className="pb-3 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                {activeLoans.slice(0, 5).map((loan) => {
                  const progressPct = calculateRepaidPct(loan.principal, loan.outstandingBalance);
                  return (
                    <tr
                      key={loan.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition group"
                    >
                      <td className="py-3.5 pl-2 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {loan.id}
                      </td>
                      <td className="py-3.5 font-medium text-slate-800 dark:text-slate-200">
                        {loan.memberName}
                      </td>
                      <td className="py-3.5 text-right font-medium text-slate-700 dark:text-slate-300">
                        {formatINR(loan.principal)}
                      </td>
                      <td className="py-3.5 text-right text-slate-500">
                        {loan.tenureMonths} Mo
                      </td>
                      <td className="py-3.5 text-right font-semibold text-slate-800 dark:text-slate-200">
                        {formatINR(loan.monthlyEmi)}
                      </td>
                      <td className="py-3.5 text-right font-bold text-amber-600 dark:text-amber-400">
                        {formatINR(loan.outstandingBalance)}
                      </td>
                      <td className="py-3.5 text-center">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">{progressPct}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 text-right pr-2">
                        <button
                          onClick={() => onOpenLoanDetail(loan.id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300 transition"
                        >
                          Schedule
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
