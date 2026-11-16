import React, { useState, useEffect } from 'react';
import { formatINR, formatDate, calculateRepaidPct } from '../utils/formatters';
import {
  X,
  CreditCard,
  Calendar,
  Percent,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  TrendingDown,
  Sparkles,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function LoanDetailModal({
  isOpen,
  loanId,
  onClose,
  onLoanUpdated
}) {
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForecloseConfirm, setShowForecloseConfirm] = useState(false);

  const fetchLoanDetail = async () => {
    if (!loanId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/loans/${loanId}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch loan details');
      }
      setLoan(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && loanId) {
      fetchLoanDetail();
      setShowForecloseConfirm(false);
    }
  }, [isOpen, loanId]);

  if (!isOpen) return null;

  const handlePayNextEmi = async () => {
    if (!loan) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/loans/${loan.id}/pay-next-emi`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to pay EMI');
      }
      setLoan(prev => ({
        ...prev,
        ...data.loan
      }));
      if (onLoanUpdated) onLoanUpdated(data.loan);
    } catch (err) {
      alert(`Payment error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleForeclose = async () => {
    if (!loan) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/loans/${loan.id}/foreclose`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to foreclose loan');
      }
      setLoan(prev => ({
        ...prev,
        ...data.loan,
        foreclosureDetails: data.foreclosureDetails
      }));
      setShowForecloseConfirm(false);
      if (onLoanUpdated) onLoanUpdated(data.loan);
    } catch (err) {
      alert(`Foreclosure error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const isLoanActive = loan?.status === 'Active';
  const progressPct = loan ? calculateRepaidPct(loan.principal, loan.outstandingBalance) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl max-w-4xl w-full my-auto max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Loan Schedule — {loan?.id || loanId}
                </h2>
                {loan && (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      loan.status === 'Active'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {loan.status}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Borrower: <strong className="text-slate-700 dark:text-slate-200">{loan?.memberName}</strong> ({loan?.memberId})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-20 text-center text-slate-400">Loading loan schedule...</div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 text-rose-700 text-sm">{error}</div>
          ) : loan ? (
            <>
              {/* Top Outstanding & Loan Metrics Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                    Current Outstanding
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">
                    {formatINR(loan.outstandingBalance)}
                  </div>
                  <div className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-1">
                    Remaining principal
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Original Principal
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {formatINR(loan.principal)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Tenure: {loan.tenureMonths} Months
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Monthly EMI
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {formatINR(loan.monthlyEmi)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Fixed monthly instalment
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Interest Rate
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                    8.0% p.a.
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Reducing balance
                  </div>
                </div>
              </div>

              {/* Repayment Progress Bar */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-700 dark:text-slate-300">
                    Principal Repayment Progress
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {progressPct}% Repaid ({formatINR(loan.principal - loan.outstandingBalance)} of {formatINR(loan.principal)})
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Foreclosure Details Banner (if foreclosed) */}
              {loan.foreclosureDetails && (
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-sm text-blue-700 dark:text-blue-300">
                    <CheckCircle2 className="w-4 h-4" />
                    Loan Foreclosed & Fully Settled
                  </div>
                  <p>
                    Settled on {formatDate(loan.foreclosureDetails.foreclosedAt)} with total settlement of{' '}
                    <strong>{formatINR(loan.foreclosureDetails.settlementAmount)}</strong> (Principal: {formatINR(loan.foreclosureDetails.outstandingPrincipalSettled)} + Final Interest: {formatINR(loan.foreclosureDetails.finalMonthInterestPaid)}).
                  </p>
                  <p className="text-[11px] text-blue-600 dark:text-blue-400 italic">
                    {loan.foreclosureDetails.interestSavingsNotice}
                  </p>
                </div>
              )}

              {/* Action Buttons for Active Loans (Pay Next EMI / Foreclose) */}
              {isLoanActive && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    <strong>Interactive Staff Controls:</strong> Record normal monthly payments or trigger instant early foreclosure.
                  </div>

                  <div className="flex items-center gap-2.5">
                    {/* Pay Next EMI */}
                    <button
                      onClick={handlePayNextEmi}
                      disabled={actionLoading}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Pay Next EMI</span>
                    </button>

                    {/* Foreclose Button */}
                    <button
                      onClick={() => setShowForecloseConfirm(true)}
                      disabled={actionLoading}
                      className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Foreclose Loan</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Foreclosure Confirmation Dialog */}
              {showForecloseConfirm && loan.foreclosureQuote && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/70 border-2 border-amber-300 dark:border-amber-800 space-y-3 animate-fadeIn">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                        Confirm Early Foreclosure Settlement
                      </h4>
                      <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                        Closing the loan early waives all future scheduled interest charges.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Remaining Principal:</span>
                      <span className="font-semibold">{formatINR(loan.foreclosureQuote.outstandingPrincipal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Current Month Accrued Interest (8% p.a.):</span>
                      <span className="font-semibold text-purple-600">{formatINR(loan.foreclosureQuote.currentMonthInterest)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between font-bold text-sm">
                      <span>Total Settlement Amount:</span>
                      <span className="text-emerald-600">{formatINR(loan.foreclosureQuote.settlementAmount)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-1">
                    <button
                      onClick={() => setShowForecloseConfirm(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleForeclose}
                      disabled={actionLoading}
                      className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm"
                    >
                      {actionLoading ? 'Processing...' : 'Confirm & Close Loan'}
                    </button>
                  </div>
                </div>
              )}

              {/* Full EMI Amortization Schedule Table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Full EMI Repayment Schedule</span>
                    <span className="text-xs text-slate-500 font-normal">
                      ({loan.schedule?.length || 0} instalments)
                    </span>
                  </h3>
                  <div className="text-[11px] text-slate-400 italic">
                    Final row balance clears to ₹0 exactly
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase sticky top-0 z-10 border-b border-slate-200 dark:border-slate-600">
                        <tr>
                          <th className="py-2.5 px-3 text-center">#</th>
                          <th className="py-2.5 px-3">Due Date</th>
                          <th className="py-2.5 px-3 text-right">Opening Bal</th>
                          <th className="py-2.5 px-3 text-right">EMI Amount</th>
                          <th className="py-2.5 px-3 text-right">Principal</th>
                          <th className="py-2.5 px-3 text-right">Interest (8%)</th>
                          <th className="py-2.5 px-3 text-right">Outstanding Bal</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-mono">
                        {loan.schedule?.map((row) => (
                          <tr
                            key={row.emiNumber}
                            className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition ${
                              row.isPaid
                                ? 'bg-emerald-50/30 dark:bg-emerald-950/20'
                                : row.isWaivedDueToForeclosure
                                ? 'bg-slate-50 dark:bg-slate-900/50 opacity-60'
                                : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                              {row.emiNumber}
                            </td>
                            <td className="py-2.5 px-3 font-sans text-slate-700 dark:text-slate-300">
                              {formatDate(row.dueDate)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-500">
                              {formatINR(row.openingBalance)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                              {formatINR(row.emiAmount)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400">
                              {formatINR(row.principalComponent)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-purple-600 dark:text-purple-400">
                              {formatINR(row.interestComponent)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-amber-600 dark:text-amber-400">
                              {formatINR(row.outstandingBalance)}
                            </td>
                            <td className="py-2.5 px-3 text-center font-sans">
                              {row.isPaid ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                                  Paid
                                </span>
                              ) : row.isWaivedDueToForeclosure ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                                  Waived
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                                  Pending
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end shrink-0 bg-slate-50 dark:bg-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
