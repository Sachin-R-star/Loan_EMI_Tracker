import React, { useState, useEffect } from 'react';
import { formatINR } from '../utils/formatters';
import {
  FileBarChart,
  Download,
  Wallet,
  Users,
  CreditCard,
  Building2,
  CheckCircle2,
  TrendingDown,
  RefreshCw
} from 'lucide-react';

export default function ReportsView() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/reports/member-outstanding');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate report');
      }
      setReportData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/reports/member-outstanding/csv');
      if (!res.ok) throw new Error('Failed to download CSV');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `member-wise-outstanding-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(`Export error: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const { reportRows = [], totals = {} } = reportData || {};

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileBarChart className="w-6 h-6 text-emerald-600" />
            <span>Member-wise Outstanding Report</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Consolidated credit exposure and outstanding balance aggregated by member.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchReport}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
            title="Refresh Report Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
          <button
            onClick={handleExportCSV}
            disabled={exporting || loading || reportRows.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{exporting ? 'Generating CSV...' : 'Export to CSV'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase text-slate-400">Total Outstanding</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
            {formatINR(totals.totalOutstanding)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Across all member loan accounts</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase text-slate-400">Total Borrowed</span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {formatINR(totals.totalBorrowed)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Total principal disbursed</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase text-slate-400">Total Repaid</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {formatINR(totals.totalRepaid)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Principal successfully recovered</div>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-sm">Compiling report data...</div>
        ) : error ? (
          <div className="p-6 text-center text-rose-600 text-sm">{error}</div>
        ) : reportRows.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">No report data available.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3.5 px-4">Member ID</th>
                  <th className="py-3.5 px-4">Member Name</th>
                  <th className="py-3.5 px-4">Employee ID</th>
                  <th className="py-3.5 px-4 text-right">Monthly Salary</th>
                  <th className="py-3.5 px-4 text-center">Total Loans</th>
                  <th className="py-3.5 px-4 text-center">Active Loans</th>
                  <th className="py-3.5 px-4 text-right">Total Borrowed</th>
                  <th className="py-3.5 px-4 text-right">Total Repaid</th>
                  <th className="py-3.5 px-4 text-right">Outstanding Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {reportRows.map((row) => (
                  <tr
                    key={row.memberId}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition"
                  >
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {row.memberId}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {row.memberName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                      {row.employeeId}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                      {formatINR(row.monthlySalary)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-xs">
                      {row.totalLoansCount}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-xs">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full ${
                          row.activeLoansCount > 0
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                        }`}
                      >
                        {row.activeLoansCount}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                      {formatINR(row.totalBorrowed)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                      {formatINR(row.totalRepaid)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-amber-600 dark:text-amber-400">
                      {formatINR(row.totalOutstanding)}
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Totals Footer */}
              <tfoot className="bg-slate-100/90 dark:bg-slate-900/90 border-t-2 border-slate-300 dark:border-slate-700 font-bold text-xs">
                <tr>
                  <td className="py-4 px-4 uppercase text-slate-800 dark:text-slate-200">
                    Grand Totals
                  </td>
                  <td className="py-4 px-4 text-slate-500 dark:text-slate-400 font-normal">
                    {totals.totalMembers} Members
                  </td>
                  <td className="py-4 px-4">-</td>
                  <td className="py-4 px-4 text-right">-</td>
                  <td className="py-4 px-4 text-center">{totals.totalLoans}</td>
                  <td className="py-4 px-4 text-center">{totals.totalActiveLoans}</td>
                  <td className="py-4 px-4 text-right text-slate-900 dark:text-white">
                    {formatINR(totals.totalBorrowed)}
                  </td>
                  <td className="py-4 px-4 text-right text-emerald-600 dark:text-emerald-400">
                    {formatINR(totals.totalRepaid)}
                  </td>
                  <td className="py-4 px-4 text-right text-base text-amber-600 dark:text-amber-400 font-extrabold">
                    {formatINR(totals.totalOutstanding)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
