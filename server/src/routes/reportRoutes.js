import { Router } from 'express';
import { db } from '../db/database.js';

const router = Router();

function compileMemberReport() {
  const members = db.getMembers();
  const loans = db.getLoans();

  const reportRows = members.map(member => {
    const memberLoans = loans.filter(l => l.memberId === member.id);
    const activeLoans = memberLoans.filter(l => l.status === 'Active');

    const totalBorrowed = memberLoans.reduce((sum, l) => sum + (l.principal || 0), 0);
    const totalOutstanding = activeLoans.reduce((sum, l) => sum + (l.outstandingBalance || 0), 0);
    const totalRepaid = totalBorrowed - totalOutstanding;

    return {
      memberId: member.id,
      memberName: member.name,
      employeeId: member.employeeId,
      monthlySalary: member.monthlySalary,
      totalLoansCount: memberLoans.length,
      activeLoansCount: activeLoans.length,
      totalBorrowed,
      totalRepaid,
      totalOutstanding
    };
  });

  const totals = reportRows.reduce(
    (acc, row) => ({
      totalMembers: acc.totalMembers + 1,
      totalLoans: acc.totalLoans + row.totalLoansCount,
      totalActiveLoans: acc.totalActiveLoans + row.activeLoansCount,
      totalBorrowed: acc.totalBorrowed + row.totalBorrowed,
      totalRepaid: acc.totalRepaid + row.totalRepaid,
      totalOutstanding: acc.totalOutstanding + row.totalOutstanding
    }),
    {
      totalMembers: 0,
      totalLoans: 0,
      totalActiveLoans: 0,
      totalBorrowed: 0,
      totalRepaid: 0,
      totalOutstanding: 0
    }
  );

  return { reportRows, totals };
}

// GET JSON report
router.get('/member-outstanding', (req, res) => {
  try {
    const data = compileMemberReport();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report', details: err.message });
  }
});

// GET CSV export
router.get('/member-outstanding/csv', (req, res) => {
  try {
    const { reportRows, totals } = compileMemberReport();

    // Helper to escape CSV cell contents
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      'Member ID',
      'Member Name',
      'Employee ID',
      'Monthly Salary (INR)',
      'Total Loans',
      'Active Loans',
      'Total Borrowed (INR)',
      'Total Repaid (INR)',
      'Total Outstanding (INR)'
    ];

    const lines = [headers.join(',')];

    for (const row of reportRows) {
      lines.push([
        escapeCSV(row.memberId),
        escapeCSV(row.memberName),
        escapeCSV(row.employeeId),
        escapeCSV(row.monthlySalary),
        escapeCSV(row.totalLoansCount),
        escapeCSV(row.activeLoansCount),
        escapeCSV(row.totalBorrowed),
        escapeCSV(row.totalRepaid),
        escapeCSV(row.totalOutstanding)
      ].join(','));
    }

    // Totals footer line
    lines.push([
      escapeCSV('TOTALS'),
      escapeCSV(`Total Members: ${totals.totalMembers}`),
      escapeCSV('-'),
      escapeCSV('-'),
      escapeCSV(totals.totalLoans),
      escapeCSV(totals.totalActiveLoans),
      escapeCSV(totals.totalBorrowed),
      escapeCSV(totals.totalRepaid),
      escapeCSV(totals.totalOutstanding)
    ].join(','));

    const csvContent = lines.join('\r\n');
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `member-outstanding-report-${timestamp}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export CSV', details: err.message });
  }
});

export default router;
