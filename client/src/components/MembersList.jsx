import React, { useState } from 'react';
import { formatINR } from '../utils/formatters';
import {
  Users,
  UserPlus,
  Search,
  CreditCard,
  Building2,
  Calendar,
  Wallet,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function MembersList({
  members = [],
  onOpenAddMember,
  onOpenCreateLoanForMember,
  setActiveTab
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMembers = members.filter((m) => {
    const term = searchTerm.toLowerCase();
    return (
      m.name.toLowerCase().includes(term) ||
      m.employeeId.toLowerCase().includes(term) ||
      m.id.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-emerald-600" />
            <span>Members Directory</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage organization members, salary records, and credit limits.
          </p>
        </div>

        <button
          onClick={onOpenAddMember}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium shadow-md shadow-emerald-600/20 transition self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Member</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, employee ID, or member ID..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 shadow-sm"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredMembers.length} of {members.length} members
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        {filteredMembers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
              No members found
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {searchTerm ? 'Try a different search keyword.' : 'Click "Add New Member" to register the first member.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3.5 px-4">Member ID</th>
                  <th className="py-3.5 px-4">Full Name</th>
                  <th className="py-3.5 px-4">Employee ID</th>
                  <th className="py-3.5 px-4 text-right">Monthly Salary</th>
                  <th className="py-3.5 px-4 text-center">Active Loans</th>
                  <th className="py-3.5 px-4 text-right">Total Outstanding</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition group"
                  >
                    <td className="py-4 px-4 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {member.id}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {member.name}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {member.employeeId}
                    </td>
                    <td className="py-4 px-4 text-right font-medium text-slate-800 dark:text-slate-200">
                      {formatINR(member.monthlySalary)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          member.activeLoansCount > 0
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {member.activeLoansCount || 0} Active
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                      {member.totalOutstanding > 0 ? (
                        <span className="text-amber-600 dark:text-amber-400">
                          {formatINR(member.totalOutstanding)}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 font-normal">
                          ₹0
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => onOpenCreateLoanForMember(member.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Issue Loan</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
