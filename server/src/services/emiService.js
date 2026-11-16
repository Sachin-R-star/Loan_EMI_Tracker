/**
 * Loan EMI Calculator & Amortization Engine
 * 
 * Implements reducing-balance EMI calculations at a fixed 8% annual rate.
 * Formula:
 *   EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
 *   where:
 *     P = Principal loan amount
 *     r = Monthly interest rate (Annual rate / 12)
 *     n = Tenure in months
 */

export const ANNUAL_INTEREST_RATE = 0.08; // 8% p.a.
export const MONTHLY_INTEREST_RATE = ANNUAL_INTEREST_RATE / 12; // 0.006666666666666667

/**
 * Validates loan input parameters.
 * @param {number} principal - Loan amount in rupees
 * @param {number} tenureMonths - Number of monthly instalments
 */
export function validateLoanInputs(principal, tenureMonths) {
  if (typeof principal !== 'number' || isNaN(principal) || principal <= 0) {
    throw new Error('Principal must be a positive number greater than 0');
  }

  if (typeof tenureMonths !== 'number' || !Number.isInteger(tenureMonths) || tenureMonths < 1) {
    throw new Error('Tenure must be an integer of at least 1 month');
  }

  if (tenureMonths > 360) {
    throw new Error('Tenure cannot exceed 360 months (30 years)');
  }
}

/**
 * Calculates the fixed monthly EMI using the standard reducing-balance formula.
 * @param {number} principal - Loan amount
 * @param {number} tenureMonths - Tenure in months
 * @param {number} annualRate - Annual interest rate as decimal (defaults to 8%)
 * @returns {number} Rounded monthly EMI in whole rupees
 */
export function calculateMonthlyEMI(principal, tenureMonths, annualRate = ANNUAL_INTEREST_RATE) {
  validateLoanInputs(principal, tenureMonths);

  const r = annualRate / 12;

  // Edge case: single month tenure
  if (tenureMonths === 1) {
    const interest = Math.round(principal * r);
    return Math.round(principal + interest);
  }

  // Standard reducing balance formula:
  // EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
  const compoundFactor = Math.pow(1 + r, tenureMonths);
  const emiExact = (principal * r * compoundFactor) / (compoundFactor - 1);

  return Math.round(emiExact);
}

/**
 * Generates the full amortization schedule for the loan.
 * 
 * Handles rounding carefully so that:
 * 1. The final instalment completely clears the outstanding principal to exactly 0.
 * 2. Total principal repaid across all months exactly equals the starting principal.
 * 
 * @param {number} principal - Starting loan principal
 * @param {number} tenureMonths - Tenure in months
 * @param {string|Date} [startDate] - First instalment start date (defaults to next month)
 * @param {number} [annualRate] - Annual interest rate (defaults to 8%)
 * @returns {Object} { monthlyEmi, schedule, summary }
 */
export function generateAmortizationSchedule(
  principal,
  tenureMonths,
  startDate = new Date(),
  annualRate = ANNUAL_INTEREST_RATE
) {
  validateLoanInputs(principal, tenureMonths);

  const r = annualRate / 12;
  const baseEMI = calculateMonthlyEMI(principal, tenureMonths, annualRate);

  const schedule = [];
  let currentBalance = Math.round(principal);
  let totalInterest = 0;
  let totalPrincipal = 0;

  const start = new Date(startDate);

  for (let month = 1; month <= tenureMonths; month++) {
    // Calculate due date (same date in subsequent months)
    const dueDate = new Date(start);
    dueDate.setMonth(start.getMonth() + month);

    const openingBalance = currentBalance;
    // Interest is charged strictly on the remaining opening balance
    const interestComponent = Math.round(openingBalance * r);

    let principalComponent;
    let emiAmount;

    if (month === tenureMonths) {
      // FINAL MONTH ADJUSTMENT:
      // In reducing balance loans, rounding whole rupees can accumulate a minor drift.
      // To ensure no loose paise or rupees remain, the final principal component
      // is pegged directly to the remaining opening balance.
      principalComponent = openingBalance;
      emiAmount = principalComponent + interestComponent;
      currentBalance = 0;
    } else {
      principalComponent = baseEMI - interestComponent;

      // Guard against potential edge cases where interest equals or exceeds EMI
      if (principalComponent > openingBalance) {
        principalComponent = openingBalance;
      }

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
      annualInterestRatePct: annualRate * 100,
      totalInterestPaid: totalInterest,
      totalAmountPaid: totalPrincipal + totalInterest,
      finalBalance: currentBalance
    }
  };
}

/**
 * Calculates foreclosure settlement details.
 * Early closure settlement = Outstanding principal + current month's interest.
 * All subsequent future interest is completely waived.
 * 
 * @param {number} outstandingBalance - Current remaining principal
 * @param {number} [annualRate] - Annual interest rate (defaults to 8%)
 * @returns {Object} Foreclosure breakdown
 */
export function calculateForeclosureSettlement(
  outstandingBalance,
  annualRate = ANNUAL_INTEREST_RATE
) {
  if (typeof outstandingBalance !== 'number' || outstandingBalance <= 0) {
    throw new Error('Outstanding balance must be greater than 0 to foreclose');
  }

  const r = annualRate / 12;
  const currentMonthInterest = Math.round(outstandingBalance * r);
  const settlementAmount = Math.round(outstandingBalance + currentMonthInterest);

  return {
    outstandingPrincipal: Math.round(outstandingBalance),
    currentMonthInterest,
    settlementAmount,
    interestSavingsNotice: 'All future months interest is 100% waived upon early settlement.'
  };
}

/**
 * Evaluates whether a member qualifies for a top-up loan.
 * Rule: Only allow top-up once >= 33% of existing active loans' principal has been repaid.
 * 
 * @param {Array<Object>} existingLoans - List of member's active loans
 * @returns {Object} Qualification result
 */
export function checkTopUpEligibility(existingLoans = []) {
  const activeLoans = existingLoans.filter(l => l.status === 'Active');

  if (activeLoans.length === 0) {
    return { isEligible: true, activeLoanCount: 0, reason: 'No active loans. Fully eligible.' };
  }

  for (const loan of activeLoans) {
    const repaidPrincipal = loan.principal - loan.outstandingBalance;
    const repaidPercentage = (repaidPrincipal / loan.principal) * 100;

    if (repaidPercentage < 33) {
      return {
        isEligible: false,
        activeLoanCount: activeLoans.length,
        blockingLoanId: loan.id,
        repaidPercentage: Math.round(repaidPercentage * 10) / 10,
        requiredPercentage: 33,
        reason: `Loan ${loan.id} has only ${repaidPercentage.toFixed(1)}% principal repaid. Minimum 33% required for top-up.`
      };
    }
  }

  return {
    isEligible: true,
    activeLoanCount: activeLoans.length,
    reason: 'All active loans have at least 33% principal repaid.'
  };
}
