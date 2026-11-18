/**
 * Anytime Fitness Sohna — Penalty & Due Calculations Engine
 * Implements transparent business logic and constraints from penalty_rule:
 * - grace_days: free period after due_date where no late penalty is incurred
 * - penalty_per_day: daily fee charged for every day exceeding the grace period
 * - max_penalty: maximum statutory ceiling limit on accumulated late penalties
 */

import { store } from './store.js';
import { CONFIG } from './config.js';

/**
 * Safely parse 'YYYY-MM-DD' into local midnight Date object,
 * preventing UTC timezone offset skew across regions.
 */
export function parseDate(dateStr) {
  if (!dateStr) return new Date();
  if (typeof dateStr === 'string' && dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day, 0, 0, 0, 0);
    }
  }
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Transparent Mathematical Model for Late Fees:
 *
 * 1. diffDays = Today - Due Date (in integer calendar days)
 * 2. If diffDays < 0  => Future Due (Days until due = |diffDays|)
 * 3. If diffDays == 0 => Due Today (0 penalty)
 * 4. If 1 <= diffDays <= Grace Days => Within Grace Period (0 penalty, Grace Days Left = Grace Days - diffDays)
 * 5. If diffDays > Grace Days => Penalty Applies!
 *    - Billable Days = diffDays - Grace Days
 *    - Raw Penalty = Billable Days * Penalty Rate
 *    - Final Penalty = Min(Max Penalty Cap, Raw Penalty)
 *    - Total Payable = Base Fee + Final Penalty
 */
export function calculateDuePenalty(due) {
  if (!due) {
    return {
      isPaid: false,
      isOverdue: false,
      withinGrace: false,
      isDueToday: false,
      daysOverdue: 0,
      daysUntilDue: 0,
      chargeableDays: 0,
      graceDaysRemaining: 0,
      penalty: 0,
      rawPenalty: 0,
      baseFee: 0,
      totalPayable: 0,
      isCapped: false,
      formulaExplanation: 'No due record provided.'
    };
  }

  const baseFee = Number(due.fee_amount || 0);

  // If the due is already settled, reflect actual historical payment numbers from the payment ledger
  if (due.status === 'Paid') {
    const payment = store.getPaymentByDueId(due.due_id);
    const penaltyPaid = payment ? Number(payment.penalty_paid || 0) : 0;
    const feePaid = payment ? Number(payment.fee_paid || baseFee) : baseFee;
    return {
      isPaid: true,
      isOverdue: false,
      withinGrace: false,
      isDueToday: false,
      daysOverdue: 0,
      daysUntilDue: 0,
      chargeableDays: 0,
      graceDaysRemaining: 0,
      penalty: penaltyPaid,
      rawPenalty: penaltyPaid,
      baseFee: feePaid,
      totalPayable: feePaid + penaltyPaid,
      isCapped: false,
      formulaExplanation: 'Settled & Paid in full.',
      payment
    };
  }

  const rule = store.getPenaltyRule();
  const dueDate = parseDate(due.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Use Math.round to avoid daylight-saving or fractional millisecond rounding errors
  const diffMs = today.getTime() - dueDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  // Case 1: Future due date
  if (diffDays < 0) {
    const daysUntilDue = Math.abs(diffDays);
    return {
      isPaid: false,
      isOverdue: false,
      withinGrace: false,
      isDueToday: false,
      daysOverdue: 0,
      daysUntilDue,
      chargeableDays: 0,
      graceDaysRemaining: rule.grace_days,
      penalty: 0,
      rawPenalty: 0,
      baseFee,
      totalPayable: baseFee,
      isCapped: false,
      formulaExplanation: `Due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`
    };
  }

  // Case 2: Due today
  if (diffDays === 0) {
    return {
      isPaid: false,
      isOverdue: false,
      withinGrace: false,
      isDueToday: true,
      daysOverdue: 0,
      daysUntilDue: 0,
      chargeableDays: 0,
      graceDaysRemaining: rule.grace_days,
      penalty: 0,
      rawPenalty: 0,
      baseFee,
      totalPayable: baseFee,
      isCapped: false,
      formulaExplanation: 'Due Today (0 late penalty)'
    };
  }

  // Case 3: Past due date, but strictly within the grace period (1 to rule.grace_days)
  if (diffDays <= rule.grace_days) {
    const remaining = rule.grace_days - diffDays;
    return {
      isPaid: false,
      isOverdue: false,
      withinGrace: true,
      isDueToday: false,
      daysOverdue: diffDays,
      daysUntilDue: 0,
      chargeableDays: 0,
      graceDaysRemaining: remaining,
      penalty: 0,
      rawPenalty: 0,
      baseFee,
      totalPayable: baseFee,
      isCapped: false,
      formulaExplanation: `${diffDays}d elapsed (Grace period: ${remaining}d left — ₹0 penalty)`
    };
  }

  // Case 4: Grace period has lapsed (diffDays > rule.grace_days)
  // Transparent breakdown:
  // Total Days Elapsed = diffDays (e.g. 29 days)
  // Free Grace Period = rule.grace_days (e.g. 5 days)
  // Billable Chargeable Days = diffDays - rule.grace_days (e.g. 24 days)
  // Raw Penalty = Chargeable Days * rate (e.g. 24 * 10 = ₹240)
  // Final Penalty = Min(max_penalty, Raw Penalty)
  const chargeableDays = diffDays - rule.grace_days;
  const rawPenalty = chargeableDays * rule.penalty_per_day;
  const isCapped = rawPenalty >= rule.max_penalty;
  const penalty = Math.min(rule.max_penalty, rawPenalty);
  const totalPayable = baseFee + penalty;

  const formulaExplanation = isCapped
    ? `${diffDays}d past due (${chargeableDays} billable days @ ₹${rule.penalty_per_day}/d = ₹${rawPenalty} → Capped at max limit ₹${rule.max_penalty})`
    : `${diffDays}d past due (${diffDays}d elapsed - ${rule.grace_days}d grace = ${chargeableDays} billable days @ ₹${rule.penalty_per_day}/d)`;

  return {
    isPaid: false,
    isOverdue: true,
    withinGrace: false,
    isDueToday: false,
    daysOverdue: diffDays,
    daysUntilDue: 0,
    chargeableDays,
    graceDaysRemaining: 0,
    penalty,
    rawPenalty,
    baseFee,
    totalPayable,
    isCapped,
    formulaExplanation
  };
}

export function formatINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: CONFIG.currencyCode || 'INR',
    maximumFractionDigits: 2
  }).format(val || 0);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = parseDate(dateStr);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Generate formatted WhatsApp reminder link for Anytime Fitness Sohna members
 */
export function generateWhatsAppReminderUrl(member, due) {
  if (!member || !member.phone) return '#';
  const calc = calculateDuePenalty(due);
  const phoneClean = member.phone.replace(/[^0-9]/g, '');
  
  let msg = `Hello ${member.full_name},\n\nThis is a friendly reminder from Anytime Fitness Sohna regarding your membership fee due on ${formatDate(due.due_date)}.\n`;
  msg += `• Base Plan Fee: ${formatINR(calc.baseFee)}\n`;
  if (calc.penalty > 0) {
    msg += `• Late Fee Penalty (${calc.daysOverdue} days past due, ${calc.chargeableDays} billable days): ${formatINR(calc.penalty)}\n`;
  }
  msg += `• Total Payable: ${formatINR(calc.totalPayable)}\n\n`;
  msg += `Kindly settle at the gym front desk via UPI, Card, or Cash.\nThank you! — Anytime Fitness Sohna`;

  return `https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`;
}

export function getOverviewMetrics() {
  const members = store.getMembers();
  const dues = store.getFeeDues();
  const payments = store.getPayments();

  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.status === 'Active').length;
  const inactiveMembers = totalMembers - activeMembers;

  const totalFeeCollected = payments.reduce((sum, p) => sum + Number(p.fee_paid), 0);
  const totalPenaltyCollected = payments.reduce((sum, p) => sum + Number(p.penalty_paid || 0), 0);
  const totalRevenue = totalFeeCollected + totalPenaltyCollected;

  let pendingDuesTotal = 0;
  let pendingPenaltiesTotal = 0;
  let overdueDuesCount = 0;
  let inGraceDuesCount = 0;
  let futureDuesCount = 0;

  // Dues with status 'Pending'
  dues.filter(d => d.status === 'Pending').forEach(due => {
    const calc = calculateDuePenalty(due);
    pendingDuesTotal += Number(due.fee_amount);
    pendingPenaltiesTotal += calc.penalty;

    if (calc.isOverdue) overdueDuesCount++;
    else if (calc.withinGrace) inGraceDuesCount++;
    else futureDuesCount++;
  });

  const totalBilled = totalRevenue + pendingDuesTotal + pendingPenaltiesTotal;
  const collectionEfficiency = totalBilled > 0 ? ((totalRevenue / totalBilled) * 100).toFixed(1) : '100.0';

  return {
    totalMembers,
    activeMembers,
    inactiveMembers,
    totalRevenue,
    totalFeeCollected,
    totalPenaltyCollected,
    pendingDuesTotal,
    pendingPenaltiesTotal,
    overdueDuesCount,
    inGraceDuesCount,
    futureDuesCount,
    collectionEfficiency,
    totalDuesCount: dues.length,
    paymentsCount: payments.length
  };
}
