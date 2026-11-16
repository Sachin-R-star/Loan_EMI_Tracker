import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMonthlyEMI,
  generateAmortizationSchedule,
  calculateForeclosureSettlement,
  checkTopUpEligibility,
  validateLoanInputs,
  ANNUAL_INTEREST_RATE
} from '../src/services/emiService.js';

describe('Loan EMI Calculator & Schedule Engine', () => {

  describe('calculateMonthlyEMI', () => {
    it('calculates the exact monthly EMI for a standard ₹1,00,000, 12-month loan at 8% p.a.', () => {
      // P = 100,000, r = 0.08 / 12 = 0.00666667, n = 12
      // EMI = 100000 * r * (1+r)^12 / ((1+r)^12 - 1) = 8,698.84 -> rounded 8,699
      const emi = calculateMonthlyEMI(100000, 12);
      assert.equal(emi, 8699);
    });

    it('handles 1-month tenure edge case cleanly', () => {
      // 1 month loan: Principal + 1 month interest
      // Interest = round(50,000 * 0.08 / 12) = 333
      // Total = 50,333
      const emi = calculateMonthlyEMI(50000, 1);
      assert.equal(emi, 50333);
    });

    it('calculates EMI for longer 36-month tenure', () => {
      // P = 3,00,000, n = 36
      const emi = calculateMonthlyEMI(300000, 36);
      // compoundFactor = (1 + 0.08/12)^36 = 1.270237
      // EMI = 300000 * (0.08/12) * 1.270237 / 0.270237 = 9,400.67 -> 9,401
      assert.equal(emi, 9401);
    });

    it('rejects invalid loan parameters', () => {
      assert.throws(() => calculateMonthlyEMI(0, 12), /Principal must be a positive number/);
      assert.throws(() => calculateMonthlyEMI(-1000, 12), /Principal must be a positive number/);
      assert.throws(() => calculateMonthlyEMI(10000, 0), /Tenure must be an integer of at least 1 month/);
      assert.throws(() => calculateMonthlyEMI(10000, -5), /Tenure must be an integer of at least 1 month/);
      assert.throws(() => calculateMonthlyEMI(10000, 3.5), /Tenure must be an integer of at least 1 month/);
      assert.throws(() => calculateMonthlyEMI(10000, 500), /Tenure cannot exceed 360 months/);
    });
  });

  describe('generateAmortizationSchedule', () => {
    it('generates an exact 12-month schedule that balances to zero', () => {
      const principal = 100000;
      const tenureMonths = 12;
      const result = generateAmortizationSchedule(principal, tenureMonths, new Date('2026-01-01'));

      assert.equal(result.schedule.length, 12);
      assert.equal(result.summary.principal, principal);
      assert.equal(result.summary.finalBalance, 0);

      // Verify that the final row leaves exactly 0 outstanding balance
      const finalRow = result.schedule[11];
      assert.equal(finalRow.outstandingBalance, 0);

      // Verify sum of principal components exactly equals starting principal
      const totalPrincipalRepaid = result.schedule.reduce((acc, row) => acc + row.principalComponent, 0);
      assert.equal(totalPrincipalRepaid, principal);

      // Verify reducing balance behavior:
      // In reducing balance loans, interest component decreases each month
      // while principal component increases each month
      for (let i = 1; i < result.schedule.length; i++) {
        const prevRow = result.schedule[i - 1];
        const currentRow = result.schedule[i];

        assert.ok(
          currentRow.interestComponent <= prevRow.interestComponent,
          `Month ${currentRow.emiNumber} interest (${currentRow.interestComponent}) should be <= Month ${prevRow.emiNumber} interest (${prevRow.interestComponent})`
        );

        if (i < result.schedule.length - 1) {
          assert.ok(
            currentRow.principalComponent >= prevRow.principalComponent,
            `Month ${currentRow.emiNumber} principal should be >= Month ${prevRow.emiNumber} principal`
          );
        }
      }
    });

    it('ensures odd principal amounts (rounding torture test) balance to zero', () => {
      // Test tricky odd numbers where rupee rounding could drift
      const oddPrincipal = 13337;
      const oddTenure = 7;
      const result = generateAmortizationSchedule(oddPrincipal, oddTenure);

      assert.equal(result.schedule.length, oddTenure);
      assert.equal(result.schedule[oddTenure - 1].outstandingBalance, 0);

      const totalPrincipal = result.schedule.reduce((acc, row) => acc + row.principalComponent, 0);
      assert.equal(totalPrincipal, oddPrincipal);
    });

    it('verifies first month interest vs last month interest demonstrates reducing balance', () => {
      const result = generateAmortizationSchedule(200000, 24);
      const month1 = result.schedule[0];
      const month24 = result.schedule[23];

      // Month 1 interest on 2,00,000 = 200000 * 0.08 / 12 = 1,333
      assert.equal(month1.interestComponent, 1333);

      // Month 24 interest is dramatically lower because principal has mostly been paid down
      assert.ok(month24.interestComponent < 100);
      assert.ok(month24.interestComponent < month1.interestComponent);
    });
  });

  describe('calculateForeclosureSettlement', () => {
    it('calculates settlement as outstanding principal + current month interest', () => {
      const outstanding = 60000;
      const foreclosure = calculateForeclosureSettlement(outstanding);

      // Current month interest on 60,000 = 60,000 * 0.08 / 12 = 400
      assert.equal(foreclosure.outstandingPrincipal, 60000);
      assert.equal(foreclosure.currentMonthInterest, 400);
      assert.equal(foreclosure.settlementAmount, 60400);
    });

    it('rejects invalid or zero balance for foreclosure', () => {
      assert.throws(() => calculateForeclosureSettlement(0), /must be greater than 0/);
      assert.throws(() => calculateForeclosureSettlement(-500), /must be greater than 0/);
    });
  });

  describe('checkTopUpEligibility', () => {
    it('permits top-up if member has no active loans', () => {
      const result = checkTopUpEligibility([]);
      assert.equal(result.isEligible, true);
    });

    it('blocks top-up if member repaid less than 33% of an active loan', () => {
      const loans = [
        { id: 'LN-001', principal: 100000, outstandingBalance: 80000, status: 'Active' } // 20% repaid
      ];
      const result = checkTopUpEligibility(loans);
      assert.equal(result.isEligible, false);
      assert.equal(result.blockingLoanId, 'LN-001');
      assert.equal(result.repaidPercentage, 20);
    });

    it('allows top-up if member has repaid >= 33% of active loan', () => {
      const loans = [
        { id: 'LN-002', principal: 100000, outstandingBalance: 60000, status: 'Active' } // 40% repaid
      ];
      const result = checkTopUpEligibility(loans);
      assert.equal(result.isEligible, true);
    });

    it('ignores closed or foreclosed loans during eligibility check', () => {
      const loans = [
        { id: 'LN-003', principal: 100000, outstandingBalance: 90000, status: 'Closed' }
      ];
      const result = checkTopUpEligibility(loans);
      assert.equal(result.isEligible, true);
    });
  });

});
