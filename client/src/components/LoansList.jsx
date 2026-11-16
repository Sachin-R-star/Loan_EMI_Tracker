import React, { useState } from 'react';
import { formatINR, calculateRepaidPct } from '../utils/formatters';
import {
  CreditCard,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function LoansList({
  loans = [],
  onOpenCreateLoan,
  onOpenLoanDetail
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredLoans = loans.filter((loan) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      loan.id.toLowerCase().includes(term) ||
      loan.memberName.toLowerCase().includes(term) ||
      loan.memberId.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === 'All' || loan.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & New Loan Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            <span>Loan Portfolio</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            All loans disbursed at 8% p.a. reducing balance. Click any loan to inspect its full EMI schedule.
          </p>
        </div>

        <button
          onClick={onOpenCreateLoan}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium shadow-md shadow-emerald-600/20 transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Loan</span>
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by loan ID, member name..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 shadow-sm"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
          {['All', 'Active', 'Closed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFilter === tab
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        {filteredLoans.length === 0 ? (
          <div className="text-center py-16 px-4">
            <CreditCard className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
              No loans match your criteria
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {searchTerm || statusFilter !== 'All'
                ? 'Try adjusting your search query or status filter.'
                : 'Click "Create New Loan" to disburse the first loan.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3.5 px-4">Loan ID</th>
                  <th className="py-3.5 px-4">Member Name</th>
                  <th className="py-3.5 px-4 text-right">Principal</th>
                  <th className="py-3.5 px-4 text-center">Tenure</th>
                  <th className="py-3.5 px-4 text-right">Monthly EMI</th>
                  <th className="py-3.5 px-4 text-right">Outstanding Balance</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredLoans.map((loan) => {
                  const progressPct = calculateRepaidPct(loan.principal, loan.outstandingBalance);
                  const isActive = loan.status === 'Active';

                  return (
                    <tr
                      key={loan.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition cursor-pointer group"
                      onClick={() => onOpenLoanDetail(loan.id)}
                    >
                      <td className="py-4 px-4 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {loan.id}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {loan.memberName}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          {loan.memberId}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-medium text-slate-800 dark:text-slate-200">
                        {formatINR(loan.principal)}
                      </td>
                      <td className="py-4 px-4 text-center text-slate-600 dark:text-slate-400">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/80 text-xs font-mono">
                          {loan.tenureMonths} Mo
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-semibold text-slate-800 dark:text-slate-200">
                        {formatINR(loan.monthlyEmi)}
                      </td>
                      <td className="py-4 px-4 text-right font-bold">
                        {isActive ? (
                          <span className="text-amber-600 dark:text-amber-400">
                            {formatINR(loan.outstandingBalance)}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 font-normal">
                            ₹0 (Settled)
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isActive
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {loan.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenLoanDetail(loan.id);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 transition"
                        >
                          <span>View Detail</span>
                          <ArrowRight className="w-3.5 h-3.5" />
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
