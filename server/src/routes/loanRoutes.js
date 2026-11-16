import { Router } from 'express';
import { db } from '../db/database.js';
import {
  generateAmortizationSchedule,
  calculateMonthlyEMI,
  calculateForeclosureSettlement,
  checkTopUpEligibility,
  ANNUAL_INTEREST_RATE
} from '../services/emiService.js';

const router = Router();

// GET all loans with optional filtering and search
router.get('/', (req, res) => {
  try {
    const { status, search, memberId } = req.query;
    let loans = db.getLoans();

    if (memberId) {
      loans = loans.filter(l => l.memberId === memberId);
    }

    if (status && status !== 'All') {
      loans = loans.filter(l => l.status.toLowerCase() === status.toLowerCase());
    }

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      loans = loans.filter(l =>
        l.id.toLowerCase().includes(term) ||
        l.memberName.toLowerCase().includes(term) ||
        l.memberId.toLowerCase().includes(term)
      );
    }

    // Return list with required fields
    const formatted = loans.map(l => ({
      id: l.id,
      memberId: l.memberId,
      memberName: l.memberName,
      principal: l.principal,
      tenureMonths: l.tenureMonths,
      annualInterestRate: l.annualInterestRate,
      monthlyEmi: l.monthlyEmi,
      outstandingBalance: l.outstandingBalance,
      status: l.status,
      createdAt: l.createdAt
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch loans', details: err.message });
  }
});

// GET preview of EMI calculation before creating loan
router.post('/preview', (req, res) => {
  try {
    const { principal, tenureMonths } = req.body;
    const p = Number(principal);
    const n = Number(tenureMonths);

    if (isNaN(p) || p <= 0) {
      return res.status(400).json({ error: 'Principal must be a positive number' });
    }
    if (isNaN(n) || !Number.isInteger(n) || n < 1) {
      return res.status(400).json({ error: 'Tenure must be an integer of at least 1 month' });
    }

    const preview = generateAmortizationSchedule(p, n);
    res.json(preview);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET loan by ID with full EMI schedule and foreclosure quote
router.get('/:id', (req, res) => {
  try {
    const loan = db.getLoanById(req.params.id);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    const member = db.getMemberById(loan.memberId);

    // If loan is still active, compute live foreclosure quote
    let foreclosureQuote = null;
    if (loan.status === 'Active' && loan.outstandingBalance > 0) {
      foreclosureQuote = calculateForeclosureSettlement(loan.outstandingBalance, loan.annualInterestRate);
    }

    // Repayment statistics
    const totalPaidPrincipal = loan.principal - loan.outstandingBalance;
    const progressPct = Math.min(100, Math.round((totalPaidPrincipal / loan.principal) * 100));

    res.json({
      ...loan,
      memberDetails: member,
      repaymentProgress: {
        paidPrincipal: totalPaidPrincipal,
        totalPrincipal: loan.principal,
        progressPct
      },
      foreclosureQuote
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve loan', details: err.message });
  }
});

// POST create a new loan
router.post('/', (req, res) => {
  try {
    const { memberId, principal, tenureMonths, overrideTopUpGating } = req.body;

    // Validation
    if (!memberId) {
      return res.status(400).json({ error: 'Member ID is required' });
    }

    const member = db.getMemberById(memberId);
    if (!member) {
      return res.status(404).json({ error: 'Member does not exist' });
    }

    const p = Number(principal);
    const n = Number(tenureMonths);

    if (isNaN(p) || p <= 0) {
      return res.status(400).json({ error: 'Principal must be a positive number greater than 0' });
    }

    if (isNaN(n) || !Number.isInteger(n) || n < 1) {
      return res.status(400).json({ error: 'Tenure must be an integer of at least 1 month' });
    }

    // Bonus Feature: Top-Up Gating
    // Only allow a top-up loan once >= 33% of the current loan's principal is repaid.
    const memberExistingLoans = db.getLoansByMemberId(memberId);
    const eligibility = checkTopUpEligibility(memberExistingLoans);

    if (!eligibility.isEligible && !overrideTopUpGating) {
      return res.status(422).json({
        error: 'Top-Up Gating Rule Triggered',
        details: eligibility.reason,
        eligibility,
        canOverride: true
      });
    }

    // Fixed at 8% per annum reducing balance
    const startDate = new Date();
    const { monthlyEmi, schedule, summary } = generateAmortizationSchedule(p, n, startDate, ANNUAL_INTEREST_RATE);

    const newLoan = db.addLoan({
      memberId: member.id,
      memberName: member.name,
      principal: p,
      tenureMonths: n,
      annualInterestRate: ANNUAL_INTEREST_RATE,
      monthlyEmi,
      outstandingBalance: p,
      status: 'Active',
      startDate: startDate.toISOString().split('T')[0],
      schedule,
      summary,
      foreclosureDetails: null
    });

    res.status(201).json(newLoan);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST simulate paying next EMI instalment
router.post('/:id/pay-next-emi', (req, res) => {
  try {
    const loan = db.getLoanById(req.params.id);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    if (loan.status !== 'Active') {
      return res.status(400).json({ error: `Cannot make payment on a loan with status "${loan.status}"` });
    }

    // Find the first unpaid EMI
    const nextEmi = loan.schedule.find(row => !row.isPaid);
    if (!nextEmi) {
      return res.status(400).json({ error: 'All instalments have already been paid' });
    }

    nextEmi.isPaid = true;
    nextEmi.paidAt = new Date().toISOString();

    const remainingBalance = nextEmi.outstandingBalance;
    const isCompleted = remainingBalance === 0 || !loan.schedule.some(row => !row.isPaid);

    const updated = db.updateLoan(loan.id, {
      schedule: loan.schedule,
      outstandingBalance: remainingBalance,
      status: isCompleted ? 'Closed' : 'Active'
    });

    res.json({
      message: `EMI #${nextEmi.emiNumber} marked as paid successfully`,
      paidEmi: nextEmi,
      loan: updated
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process payment', details: err.message });
  }
});

// POST early foreclosure settlement
router.post('/:id/foreclose', (req, res) => {
  try {
    const loan = db.getLoanById(req.params.id);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    if (loan.status !== 'Active' || loan.outstandingBalance <= 0) {
      return res.status(400).json({ error: `Loan is already ${loan.status} and cannot be foreclosed` });
    }

    const settlement = calculateForeclosureSettlement(loan.outstandingBalance, loan.annualInterestRate);

    // Update remaining schedule rows
    const updatedSchedule = loan.schedule.map(row => {
      if (!row.isPaid) {
        return {
          ...row,
          isWaivedDueToForeclosure: true,
          statusNote: 'Waived due to early loan foreclosure'
        };
      }
      return row;
    });

    const foreclosureRecord = {
      foreclosedAt: new Date().toISOString(),
      settlementAmount: settlement.settlementAmount,
      outstandingPrincipalSettled: settlement.outstandingPrincipal,
      finalMonthInterestPaid: settlement.currentMonthInterest,
      interestSavingsNotice: settlement.interestSavingsNotice
    };

    const updated = db.updateLoan(loan.id, {
      outstandingBalance: 0,
      status: 'Closed',
      foreclosureDetails: foreclosureRecord,
      schedule: updatedSchedule
    });

    res.json({
      message: 'Loan successfully foreclosed and settled',
      foreclosureDetails: foreclosureRecord,
      loan: updated
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to foreclose loan', details: err.message });
  }
});

export default router;
