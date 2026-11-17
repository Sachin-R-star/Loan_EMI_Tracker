/**
 * Smart Client-Side Fallback Engine
 * 
 * Provides an in-browser mock backend service with persistent localStorage.
 * If the app is deployed as a static frontend on Vercel without a live backend,
 * this interceptor ensures 100% of features (Login, Members, Loan creation, 
 * 8% Reducing Balance EMI generation, Foreclosure, and CSV export) work seamlessly!
 */

const ANNUAL_INTEREST_RATE = 0.08;

function calculateMonthlyEMI(principal, tenureMonths) {
  const r = ANNUAL_INTEREST_RATE / 12;
  if (tenureMonths === 1) {
    return Math.round(principal + Math.round(principal * r));
  }
  const factor = Math.pow(1 + r, tenureMonths);
  return Math.round((principal * r * factor) / (factor - 1));
}

function generateAmortizationSchedule(principal, tenureMonths, startDate = new Date()) {
  const r = ANNUAL_INTEREST_RATE / 12;
  const baseEMI = calculateMonthlyEMI(principal, tenureMonths);
  const schedule = [];
  let currentBalance = Math.round(principal);
  let totalInterest = 0;
  let totalPrincipal = 0;
  const start = new Date(startDate);

  for (let month = 1; month <= tenureMonths; month++) {
    const dueDate = new Date(start);
    dueDate.setMonth(start.getMonth() + month);
    const openingBalance = currentBalance;
    const interestComponent = Math.round(openingBalance * r);

    let principalComponent;
    let emiAmount;

    if (month === tenureMonths) {
      principalComponent = openingBalance;
      emiAmount = principalComponent + interestComponent;
      currentBalance = 0;
    } else {
      principalComponent = baseEMI - interestComponent;
      if (principalComponent > openingBalance) principalComponent = openingBalance;
      currentBalance = openingBalance - principalComponent;
      emiAmount = baseEMI;
    }

    totalInterest += interestComponent;
    totalPrincipal += principalComponent;

    schedule.push({
      emiNumber: month,
      dueDate: dueDate.toISOString().split('T')[0],
      openingBalance,
      emiAmount,
      principalComponent,
      interestComponent,
      outstandingBalance: currentBalance,
      isPaid: false,
      paidAt: null
    });
  }

  return {
    monthlyEmi: baseEMI,
    schedule,
    summary: {
      principal: Math.round(principal),
      tenureMonths,
      annualInterestRatePct: 8,
      totalInterestPaid: totalInterest,
      totalAmountPaid: totalPrincipal + totalInterest,
      finalBalance: currentBalance
    }
  };
}

function getInitialStore() {
  const members = [
    { id: 'MBR-101', name: 'Aarav Sharma', employeeId: 'EMP-4091', monthlySalary: 65000, createdAt: '2026-01-15T10:00:00Z' },
    { id: 'MBR-102', name: 'Priya Patel', employeeId: 'EMP-4102', monthlySalary: 85000, createdAt: '2026-02-01T11:30:00Z' },
    { id: 'MBR-103', name: 'Rohan Verma', employeeId: 'EMP-3882', monthlySalary: 48000, createdAt: '2026-02-10T09:15:00Z' },
    { id: 'MBR-104', name: 'Ananya Iyer', employeeId: 'EMP-4219', monthlySalary: 95000, createdAt: '2026-02-20T14:45:00Z' },
    { id: 'MBR-105', name: 'Vikram Malhotra', employeeId: 'EMP-3920', monthlySalary: 120000, createdAt: '2026-03-01T16:20:00Z' }
  ];

  const createLoan = (id, memberId, memberName, principal, tenureMonths, startDateStr, paidCount = 0) => {
    const { monthlyEmi, schedule, summary } = generateAmortizationSchedule(principal, tenureMonths, new Date(startDateStr));
    let bal = principal;
    for (let i = 0; i < paidCount && i < schedule.length; i++) {
      schedule[i].isPaid = true;
      schedule[i].paidAt = schedule[i].dueDate;
      bal = schedule[i].outstandingBalance;
    }
    const isClosed = paidCount >= tenureMonths;
    return {
      id,
      memberId,
      memberName,
      principal,
      tenureMonths,
      annualInterestRate: 0.08,
      monthlyEmi,
      outstandingBalance: isClosed ? 0 : bal,
      status: isClosed ? 'Closed' : 'Active',
      startDate: startDateStr,
      schedule,
      summary,
      foreclosureDetails: null,
      createdAt: startDateStr
    };
  };

  const loans = [
    createLoan('LN-2026-001', 'MBR-101', 'Aarav Sharma', 120000, 12, '2026-01-01', 2),
    createLoan('LN-2026-002', 'MBR-102', 'Priya Patel', 250000, 24, '2026-02-01', 1),
    createLoan('LN-2026-003', 'MBR-103', 'Rohan Verma', 60000, 6, '2025-08-01', 6),
    createLoan('LN-2026-004', 'MBR-104', 'Ananya Iyer', 180000, 18, '2026-03-01', 0)
  ];

  return { members, loans };
}

function loadStore() {
  try {
    const saved = localStorage.getItem('loan_tracker_db');
    if (saved) return JSON.parse(saved);
  } catch {}
  const init = getInitialStore();
  saveStore(init);
  return init;
}

function saveStore(data) {
  try {
    localStorage.setItem('loan_tracker_db', JSON.stringify(data));
  } catch {}
}

export async function handleMockApi(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};
  const store = loadStore();

  // Normalize path without query params
  const [urlPath, queryString] = path.split('?');
  const query = new URLSearchParams(queryString || '');

  // 1. Auth Login
  if (urlPath === '/api/auth/login' && method === 'POST') {
    const { username, password } = body;
    if ((username === 'staff' && password === 'password123') || (username === 'admin' && password === 'admin123')) {
      return {
        status: 200,
        data: {
          message: 'Login successful',
          user: {
            id: username === 'admin' ? 'USR-02' : 'USR-01',
            username,
            name: username === 'admin' ? 'Sneha Rao (Branch Manager)' : 'Rohit Sharma (Loan Officer)',
            role: username === 'admin' ? 'Branch Manager' : 'Loan Officer'
          },
          token: `mock-token-${Date.now()}`
        }
      };
    }
    return { status: 401, data: { error: 'Invalid username or password' } };
  }

  // 2. Members List
  if (urlPath === '/api/members' && method === 'GET') {
    const enriched = store.members.map(m => {
      const mLoans = store.loans.filter(l => l.memberId === m.id);
      const activeLoans = mLoans.filter(l => l.status === 'Active');
      return {
        ...m,
        totalLoansCount: mLoans.length,
        activeLoansCount: activeLoans.length,
        totalBorrowed: mLoans.reduce((sum, l) => sum + (l.principal || 0), 0),
        totalOutstanding: activeLoans.reduce((sum, l) => sum + (l.outstandingBalance || 0), 0)
      };
    });
    return { status: 200, data: enriched };
  }

  // 3. Add Member
  if (urlPath === '/api/members' && method === 'POST') {
    const { name, employeeId, monthlySalary } = body;
    if (!name || !name.trim()) return { status: 400, data: { error: 'Name is required' } };
    if (!employeeId || !employeeId.trim()) return { status: 400, data: { error: 'Employee ID is required' } };
    if (!monthlySalary || Number(monthlySalary) <= 0) return { status: 400, data: { error: 'Valid positive salary required' } };

    const exists = store.members.find(m => m.employeeId.toUpperCase() === employeeId.trim().toUpperCase());
    if (exists) return { status: 409, data: { error: `Employee ID ${employeeId} already exists` } };

    const newMember = {
      id: `MBR-${store.members.length + 101}`,
      name: name.trim(),
      employeeId: employeeId.trim().toUpperCase(),
      monthlySalary: Math.round(Number(monthlySalary)),
      createdAt: new Date().toISOString()
    };
    store.members.push(newMember);
    saveStore(store);
    return { status: 201, data: newMember };
  }

  // 4. Loans List
  if (urlPath === '/api/loans' && method === 'GET') {
    return { status: 200, data: store.loans };
  }

  // 5. Loan Preview
  if (urlPath === '/api/loans/preview' && method === 'POST') {
    const p = Number(body.principal);
    const n = Number(body.tenureMonths);
    if (!p || p <= 0 || !n || n < 1) return { status: 400, data: { error: 'Invalid parameters' } };
    return { status: 200, data: generateAmortizationSchedule(p, n) };
  }

  // 6. Create Loan
  if (urlPath === '/api/loans' && method === 'POST') {
    const { memberId, principal, tenureMonths, overrideTopUpGating } = body;
    const member = store.members.find(m => m.id === memberId);
    if (!member) return { status: 404, data: { error: 'Member not found' } };

    const p = Number(principal);
    const n = Number(tenureMonths);

    // Check top up gating
    const memberLoans = store.loans.filter(l => l.memberId === memberId && l.status === 'Active');
    for (const loan of memberLoans) {
      const repaid = loan.principal - loan.outstandingBalance;
      const repaidPct = (repaid / loan.principal) * 100;
      if (repaidPct < 33 && !overrideTopUpGating) {
        return {
          status: 422,
          data: {
            error: 'Top-Up Gating Rule Triggered',
            details: `Loan ${loan.id} has only ${repaidPct.toFixed(1)}% principal repaid. Minimum 33% required.`,
            eligibility: { isEligible: false }
          }
        };
      }
    }

    const { monthlyEmi, schedule, summary } = generateAmortizationSchedule(p, n);
    const nextNum = String(store.loans.length + 1).padStart(3, '0');
    const newLoan = {
      id: `LN-2026-${nextNum}`,
      memberId: member.id,
      memberName: member.name,
      principal: p,
      tenureMonths: n,
      annualInterestRate: 0.08,
      monthlyEmi,
      outstandingBalance: p,
      status: 'Active',
      startDate: new Date().toISOString().split('T')[0],
      schedule,
      summary,
      foreclosureDetails: null,
      createdAt: new Date().toISOString()
    };
    store.loans.push(newLoan);
    saveStore(store);
    return { status: 201, data: newLoan };
  }

  // 7. Single Loan Detail
  const loanDetailMatch = urlPath.match(/^\/api\/loans\/([^\/]+)$/);
  if (loanDetailMatch && method === 'GET') {
    const id = loanDetailMatch[1];
    const loan = store.loans.find(l => l.id === id);
    if (!loan) return { status: 404, data: { error: 'Loan not found' } };

    let foreclosureQuote = null;
    if (loan.status === 'Active' && loan.outstandingBalance > 0) {
      const r = 0.08 / 12;
      const currentMonthInterest = Math.round(loan.outstandingBalance * r);
      foreclosureQuote = {
        outstandingPrincipal: loan.outstandingBalance,
        currentMonthInterest,
        settlementAmount: loan.outstandingBalance + currentMonthInterest,
        interestSavingsNotice: 'All future months interest is 100% waived upon early settlement.'
      };
    }
    return {
      status: 200,
      data: {
        ...loan,
        foreclosureQuote
      }
    };
  }

  // 8. Pay Next EMI
  const payEmiMatch = urlPath.match(/^\/api\/loans\/([^\/]+)\/pay-next-emi$/);
  if (payEmiMatch && method === 'POST') {
    const id = payEmiMatch[1];
    const loan = store.loans.find(l => l.id === id);
    if (!loan) return { status: 404, data: { error: 'Loan not found' } };

    const nextRow = loan.schedule.find(r => !r.isPaid);
    if (!nextRow) return { status: 400, data: { error: 'All EMIs already paid' } };

    nextRow.isPaid = true;
    nextRow.paidAt = new Date().toISOString();
    loan.outstandingBalance = nextRow.outstandingBalance;
    if (loan.outstandingBalance === 0 || !loan.schedule.some(r => !r.isPaid)) {
      loan.status = 'Closed';
    }
    saveStore(store);
    return { status: 200, data: { message: 'EMI paid', loan } };
  }

  // 9. Foreclose Loan
  const forecloseMatch = urlPath.match(/^\/api\/loans\/([^\/]+)\/foreclose$/);
  if (forecloseMatch && method === 'POST') {
    const id = forecloseMatch[1];
    const loan = store.loans.find(l => l.id === id);
    if (!loan) return { status: 404, data: { error: 'Loan not found' } };

    const r = 0.08 / 12;
    const currentMonthInterest = Math.round(loan.outstandingBalance * r);
    const foreclosureDetails = {
      foreclosedAt: new Date().toISOString(),
      settlementAmount: loan.outstandingBalance + currentMonthInterest,
      outstandingPrincipalSettled: loan.outstandingBalance,
      finalMonthInterestPaid: currentMonthInterest,
      interestSavingsNotice: 'All future months interest is 100% waived upon early settlement.'
    };

    loan.schedule.forEach(row => {
      if (!row.isPaid) {
        row.isWaivedDueToForeclosure = true;
      }
    });

    loan.outstandingBalance = 0;
    loan.status = 'Closed';
    loan.foreclosureDetails = foreclosureDetails;
    saveStore(store);
    return { status: 200, data: { message: 'Loan foreclosed', loan, foreclosureDetails } };
  }

  // 10. Reports
  if (urlPath === '/api/reports/member-outstanding' && method === 'GET') {
    const reportRows = store.members.map(m => {
      const mLoans = store.loans.filter(l => l.memberId === m.id);
      const activeLoans = mLoans.filter(l => l.status === 'Active');
      const totalBorrowed = mLoans.reduce((sum, l) => sum + (l.principal || 0), 0);
      const totalOutstanding = activeLoans.reduce((sum, l) => sum + (l.outstandingBalance || 0), 0);
      return {
        memberId: m.id,
        memberName: m.name,
        employeeId: m.employeeId,
        monthlySalary: m.monthlySalary,
        totalLoansCount: mLoans.length,
        activeLoansCount: activeLoans.length,
        totalBorrowed,
        totalRepaid: totalBorrowed - totalOutstanding,
        totalOutstanding
      };
    });

    const totals = reportRows.reduce((acc, r) => ({
      totalMembers: acc.totalMembers + 1,
      totalLoans: acc.totalLoans + r.totalLoansCount,
      totalActiveLoans: acc.totalActiveLoans + r.activeLoansCount,
      totalBorrowed: acc.totalBorrowed + r.totalBorrowed,
      totalRepaid: acc.totalRepaid + r.totalRepaid,
      totalOutstanding: acc.totalOutstanding + r.totalOutstanding
    }), { totalMembers: 0, totalLoans: 0, totalActiveLoans: 0, totalBorrowed: 0, totalRepaid: 0, totalOutstanding: 0 });

    return { status: 200, data: { reportRows, totals } };
  }

  // 11. Reports CSV Export
  if (urlPath === '/api/reports/member-outstanding/csv' && method === 'GET') {
    const reportData = (await handleMockApi('/api/reports/member-outstanding', { method: 'GET' })).data;
    const lines = [
      ['Member ID', 'Member Name', 'Employee ID', 'Monthly Salary', 'Total Loans', 'Active Loans', 'Total Borrowed', 'Total Repaid', 'Total Outstanding'].join(',')
    ];
    for (const r of reportData.reportRows) {
      lines.push([r.memberId, `"${r.memberName}"`, r.employeeId, r.monthlySalary, r.totalLoansCount, r.activeLoansCount, r.totalBorrowed, r.totalRepaid, r.totalOutstanding].join(','));
    }
    lines.push(['TOTALS', `Total Members: ${reportData.totals.totalMembers}`, '-', '-', reportData.totals.totalLoans, reportData.totals.totalActiveLoans, reportData.totals.totalBorrowed, reportData.totals.totalRepaid, reportData.totals.totalOutstanding].join(','));
    return {
      status: 200,
      isBlob: true,
      data: lines.join('\r\n')
    };
  }

  // 12. Reset
  if (urlPath === '/api/reset' && method === 'POST') {
    const fresh = getInitialStore();
    saveStore(fresh);
    return { status: 200, data: { message: 'Reset successful' } };
  }

  return { status: 404, data: { error: 'Not found' } };
}
