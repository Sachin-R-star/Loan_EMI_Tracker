import { generateAmortizationSchedule } from '../services/emiService.js';

export function getInitialSeedData() {
  const members = [
    {
      id: 'MBR-101',
      name: 'Aarav Sharma',
      employeeId: 'EMP-4091',
      monthlySalary: 65000,
      createdAt: '2026-01-15T10:00:00Z'
    },
    {
      id: 'MBR-102',
      name: 'Priya Patel',
      employeeId: 'EMP-4102',
      monthlySalary: 85000,
      createdAt: '2026-02-01T11:30:00Z'
    },
    {
      id: 'MBR-103',
      name: 'Rohan Verma',
      employeeId: 'EMP-3882',
      monthlySalary: 48000,
      createdAt: '2026-02-10T09:15:00Z'
    },
    {
      id: 'MBR-104',
      name: 'Ananya Iyer',
      employeeId: 'EMP-4219',
      monthlySalary: 95000,
      createdAt: '2026-02-20T14:45:00Z'
    },
    {
      id: 'MBR-105',
      name: 'Vikram Malhotra',
      employeeId: 'EMP-3920',
      monthlySalary: 120000,
      createdAt: '2026-03-01T16:20:00Z'
    }
  ];

  // Helper to construct a realistic seeded loan
  const createSeedLoan = (id, memberId, principal, tenureMonths, startDateStr, paidCount = 0) => {
    const member = members.find(m => m.id === memberId);
    const startDate = new Date(startDateStr);
    const { monthlyEmi, schedule, summary } = generateAmortizationSchedule(principal, tenureMonths, startDate);

    let currentBalance = principal;
    // Mark paid EMIs
    for (let i = 0; i < paidCount && i < schedule.length; i++) {
      schedule[i].isPaid = true;
      schedule[i].paidAt = schedule[i].dueDate;
      currentBalance = schedule[i].outstandingBalance;
    }

    const isFullyPaid = paidCount >= tenureMonths;

    return {
      id,
      memberId,
      memberName: member ? member.name : 'Unknown',
      principal,
      tenureMonths,
      annualInterestRate: 0.08,
      monthlyEmi,
      outstandingBalance: isFullyPaid ? 0 : currentBalance,
      status: isFullyPaid ? 'Closed' : 'Active',
      startDate: startDateStr,
      schedule,
      summary,
      foreclosureDetails: null,
      createdAt: startDateStr
    };
  };

  const loans = [
    createSeedLoan('LN-2026-001', 'MBR-101', 120000, 12, '2026-01-01', 2), // 2 EMIs paid
    createSeedLoan('LN-2026-002', 'MBR-102', 250000, 24, '2026-02-01', 1), // 1 EMI paid
    createSeedLoan('LN-2026-003', 'MBR-103', 60000, 6, '2025-08-01', 6),   // Fully closed loan
    createSeedLoan('LN-2026-004', 'MBR-104', 180000, 18, '2026-03-01', 0)  // Fresh active loan
  ];

  return { members, loans };
}
