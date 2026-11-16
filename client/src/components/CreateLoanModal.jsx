import React, { useState, useEffect } from 'react';
import { formatINR } from '../utils/formatters';
import {
  X,
  CreditCard,
  Percent,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  TrendingDown
} from 'lucide-react';

export default function CreateLoanModal({
  isOpen,
  onClose,
  members = [],
  preselectedMemberId = '',
  onLoanCreated
}) {
  const [memberId, setMemberId] = useState(preselectedMemberId);
  const [principal, setPrincipal] = useState('100000');
  const [tenureMonths, setTenureMonths] = useState('12');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [topUpWarning, setTopUpWarning] = useState(null);
  const [overrideGating, setOverrideGating] = useState(false);

  useEffect(() => {
    if (preselectedMemberId) {
      setMemberId(preselectedMemberId);
    }
  }, [preselectedMemberId]);

  // Fetch live EMI preview whenever principal or tenure changes
  useEffect(() => {
    const p = Number(principal);
    const n = Number(tenureMonths);

    if (p > 0 && Number.isInteger(n) && n >= 1 && n <= 360) {
      fetch('/api/loans/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ principal: p, tenureMonths: n })
      })
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setPreview(data);
          } else {
            setPreview(null);
          }
        })
        .catch(() => setPreview(null));
    } else {
      setPreview(null);
    }
  }, [principal, tenureMonths]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!memberId) {
      setError('Please select a member.');
      return;
    }

    const p = Number(principal);
    const n = Number(tenureMonths);

    if (isNaN(p) || p <= 0) {
      setError('Principal must be a positive loan amount.');
      return;
    }

    if (isNaN(n) || !Number.isInteger(n) || n < 1) {
      setError('Tenure must be at least 1 month.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          principal: p,
          tenureMonths: n,
          overrideTopUpGating: overrideGating
        })
      });

      const data = await res.json();

      if (res.status === 422 && data.eligibility) {
        // Top-up gating hit
        setTopUpWarning(data);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create loan');
      }

      onLoanCreated(data);
      onClose();
      // Reset form
      setPrincipal('100000');
      setTenureMonths('12');
      setTopUpWarning(null);
      setOverrideGating(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full p-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Create Member Loan
              </h3>
              <p className="text-xs text-slate-500">
                Auto-generates full 8% reducing balance EMI schedule
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Top-up Gating Warning */}
        {topUpWarning && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs space-y-2">
            <div className="flex items-start gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Top-Up Gating Rule Triggered</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {topUpWarning.details}
            </p>
            <label className="flex items-center gap-2 pt-1 font-medium cursor-pointer text-slate-800 dark:text-slate-200">
              <input
                type="checkbox"
                checked={overrideGating}
                onChange={(e) => setOverrideGating(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <span>Staff Override: Authorize loan anyway with manager concurrence</span>
            </label>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Member Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Select Member *
            </label>
            <select
              value={memberId}
              onChange={(e) => {
                setMemberId(e.target.value);
                setTopUpWarning(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              <option value="">-- Choose Member --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.employeeId}) — Salary: {formatINR(m.monthlySalary)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Principal */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Principal Amount (₹) *
              </label>
              <input
                type="number"
                min="1000"
                step="1000"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                placeholder="e.g. 100000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                required
              />
            </div>

            {/* Tenure */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Tenure (Months) *
              </label>
              <input
                type="number"
                min="1"
                max="360"
                value={tenureMonths}
                onChange={(e) => setTenureMonths(e.target.value)}
                placeholder="e.g. 12"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                required
              />
            </div>
          </div>

          {/* Interest Rate Badge */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              Annual Interest Rate
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Percent className="w-3.5 h-3.5" />
              8.0% p.a. (Fixed, Reducing Balance)
            </span>
          </div>

          {/* Live EMI Preview Card */}
          {preview && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 dark:border-emerald-500/20 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  Live EMI Estimation
                </span>
                <span className="text-[11px] font-mono lowercase">8% reducing</span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Monthly EMI</div>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {formatINR(preview.monthlyEmi)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Total Interest</div>
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {formatINR(preview.summary.totalInterestPaid)}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Total Repayment:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {formatINR(preview.summary.totalAmountPaid)}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
            >
              {loading ? 'Disbursing...' : 'Create & Generate Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
