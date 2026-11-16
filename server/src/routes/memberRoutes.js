import { Router } from 'express';
import { db } from '../db/database.js';

const router = Router();

// GET all members with enriched loan summary
router.get('/', (req, res) => {
  try {
    const members = db.getMembers();
    const loans = db.getLoans();

    const enrichedMembers = members.map(member => {
      const memberLoans = loans.filter(l => l.memberId === member.id);
      const activeLoans = memberLoans.filter(l => l.status === 'Active');
      const totalOutstanding = activeLoans.reduce((sum, l) => sum + (l.outstandingBalance || 0), 0);
      const totalBorrowed = memberLoans.reduce((sum, l) => sum + (l.principal || 0), 0);

      return {
        ...member,
        totalLoansCount: memberLoans.length,
        activeLoansCount: activeLoans.length,
        totalBorrowed,
        totalOutstanding
      };
    });

    res.json(enrichedMembers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve members', details: err.message });
  }
});

// GET single member by ID
router.get('/:id', (req, res) => {
  try {
    const member = db.getMemberById(req.params.id);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const memberLoans = db.getLoansByMemberId(member.id);
    res.json({
      ...member,
      loans: memberLoans
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve member', details: err.message });
  }
});

// POST add a new member
router.post('/', (req, res) => {
  try {
    const { name, employeeId, monthlySalary } = req.body || {};

    // Validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Member name is required and cannot be empty' });
    }

    if (!employeeId || typeof employeeId !== 'string' || !employeeId.trim()) {
      return res.status(400).json({ error: 'Employee/Member ID is required' });
    }

    const salaryNum = Number(monthlySalary);
    if (isNaN(salaryNum) || salaryNum <= 0) {
      return res.status(400).json({ error: 'Monthly salary must be a positive number greater than 0' });
    }

    // Check for duplicate employee ID
    const existing = db.getMemberByEmployeeId(employeeId.trim());
    if (existing) {
      return res.status(409).json({
        error: `Member with Employee ID "${employeeId.trim().toUpperCase()}" already exists (${existing.name})`
      });
    }

    const created = db.addMember({
      name: name.trim(),
      employeeId: employeeId.trim(),
      monthlySalary: salaryNum
    });

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create member', details: err.message });
  }
});

export default router;
