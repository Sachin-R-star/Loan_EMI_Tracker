/**
 * Formatting utilities for Indian Rupee currency and display data
 */

/**
 * Formats a number to Indian Rupee standard format: ₹1,23,456
 * Uses Indian comma numbering system (lakhs, crores) with no decimals/paise.
 * 
 * @param {number} amount - Numeric amount in INR
 * @returns {string} Formatted string, e.g. "₹1,23,456"
 */
export function formatINR(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }

  const rounded = Math.round(Number(amount));
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(rounded);
}

/**
 * Formats a date string (YYYY-MM-DD) into a friendly Indian business format
 * e.g. "15 Jan 2026"
 * 
 * @param {string|Date} dateStr - Date string or Date object
 * @returns {string} Formatted date
 */
export function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return String(dateStr);
  }
}

/**
 * Helper to compute percentage repaid
 */
export function calculateRepaidPct(principal, balance) {
  if (!principal || principal <= 0) return 0;
  const repaid = Math.max(0, principal - (balance || 0));
  return Math.min(100, Math.round((repaid / principal) * 100));
}
