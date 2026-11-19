/**
 * Anytime Fitness Sohna — Initial Seed Dataset
 * Shared single source of truth for both MongoDB Atlas initial seeding (api/gym.js)
 * and local browser storage fallback (src/js/store.js).
 */

export function createInitialData(defaults = {}) {
  const graceDays = Number(defaults.graceDays ?? 5);
  const penaltyPerDay = Number(defaults.penaltyPerDay ?? 10);
  const maxPenalty = Number(defaults.maxPenalty ?? 500);

  return {
    membership_plan: [
      { plan_id: 1, plan_name: 'Monthly Standard', duration_months: 1, monthly_fee: 1500.00 },
      { plan_id: 2, plan_name: 'Quarterly Fitness', duration_months: 3, monthly_fee: 1200.00 },
      { plan_id: 3, plan_name: 'Half-Yearly Pro', duration_months: 6, monthly_fee: 1000.00 },
      { plan_id: 4, plan_name: 'Annual Elite', duration_months: 12, monthly_fee: 850.00 },
      { plan_id: 5, plan_name: 'Student Special (Quarterly)', duration_months: 3, monthly_fee: 900.00 }
    ],

    member: [
      { member_id: 101, full_name: 'Aarav Sharma', phone: '+91 98201 12345', email: 'aarav.sharma@example.com', join_date: '2026-01-10', plan_id: 4, status: 'Active' },
      { member_id: 102, full_name: 'Pooja Iyer', phone: '+91 98333 45678', email: 'pooja.iyer@example.com', join_date: '2026-03-15', plan_id: 2, status: 'Active' },
      { member_id: 103, full_name: 'Rohan Gupta', phone: '+91 97123 98765', email: 'rohan.gupta@example.com', join_date: '2026-05-01', plan_id: 3, status: 'Active' },
      { member_id: 104, full_name: 'Kavita Patil', phone: '+91 96543 21098', email: 'kavita.patil@example.com', join_date: '2026-08-20', plan_id: 1, status: 'Active' },
      { member_id: 105, full_name: 'Arjun Nair', phone: '+91 93210 98765', email: 'arjun.nair@example.com', join_date: '2026-02-01', plan_id: 1, status: 'Inactive' },
      { member_id: 106, full_name: 'Sneha Kulkarni', phone: '+91 98111 22334', email: 'sneha.k@example.com', join_date: '2026-01-20', plan_id: 4, status: 'Active' },
      { member_id: 107, full_name: 'Vikram Singhania', phone: '+91 98765 43210', email: 'vikram.s@example.com', join_date: '2026-04-10', plan_id: 3, status: 'Active' },
      { member_id: 108, full_name: 'Ananya Deshmukh', phone: '+91 99200 11223', email: 'ananya.d@example.com', join_date: '2026-08-01', plan_id: 5, status: 'Active' },
      { member_id: 109, full_name: 'Aditya Verma', phone: '+91 98450 67890', email: 'aditya.v@example.com', join_date: '2026-07-15', plan_id: 2, status: 'Active' },
      { member_id: 110, full_name: 'Meera Joshi', phone: '+91 97654 32109', email: 'meera.joshi@example.com', join_date: '2026-09-01', plan_id: 1, status: 'Active' },
      { member_id: 111, full_name: 'Kunal Malhotra', phone: '+91 98321 65498', email: 'kunal.m@example.com', join_date: '2026-02-15', plan_id: 4, status: 'Active' },
      { member_id: 112, full_name: 'Priya Sen', phone: '+91 99887 76655', email: 'priya.sen@example.com', join_date: '2026-08-15', plan_id: 5, status: 'Active' },
      { member_id: 113, full_name: 'Rajesh Choudhary', phone: '+91 91234 56780', email: 'rajesh.c@example.com', join_date: '2026-03-01', plan_id: 1, status: 'Inactive' },
      { member_id: 114, full_name: 'Neha Bansal', phone: '+91 98222 33445', email: 'neha.bansal@example.com', join_date: '2026-06-10', plan_id: 2, status: 'Active' },
      { member_id: 115, full_name: 'Siddharth Roy', phone: '+91 97531 86420', email: 'sid.roy@example.com', join_date: '2026-05-20', plan_id: 3, status: 'Active' }
    ],

    penalty_rule: [
      {
        rule_id: 1,
        grace_days: graceDays,
        penalty_per_day: penaltyPerDay,
        max_penalty: maxPenalty
      }
    ],

    fee_due: [
      { due_id: 1, member_id: 101, due_date: '2026-10-01', fee_amount: 10200.00, status: 'Paid' },
      { due_id: 2, member_id: 102, due_date: '2026-10-05', fee_amount: 3600.00, status: 'Paid' },
      { due_id: 3, member_id: 106, due_date: '2026-10-10', fee_amount: 10200.00, status: 'Paid' },
      { due_id: 4, member_id: 107, due_date: '2026-10-12', fee_amount: 6000.00, status: 'Paid' },
      { due_id: 5, member_id: 111, due_date: '2026-10-15', fee_amount: 10200.00, status: 'Paid' },
      { due_id: 6, member_id: 103, due_date: '2026-09-15', fee_amount: 6000.00, status: 'Paid' },
      { due_id: 7, member_id: 105, due_date: '2026-09-01', fee_amount: 1500.00, status: 'Paid' },
      { due_id: 8, member_id: 104, due_date: '2026-10-10', fee_amount: 1500.00, status: 'Pending' },
      { due_id: 9, member_id: 109, due_date: '2026-10-20', fee_amount: 3600.00, status: 'Pending' },
      { due_id: 10, member_id: 113, due_date: '2026-09-01', fee_amount: 1500.00, status: 'Pending' },
      { due_id: 11, member_id: 110, due_date: '2026-11-02', fee_amount: 1500.00, status: 'Pending' },
      { due_id: 12, member_id: 108, due_date: '2026-11-04', fee_amount: 2700.00, status: 'Pending' },
      { due_id: 13, member_id: 112, due_date: '2026-11-10', fee_amount: 2700.00, status: 'Pending' },
      { due_id: 14, member_id: 114, due_date: '2026-11-20', fee_amount: 3600.00, status: 'Pending' },
      { due_id: 15, member_id: 115, due_date: '2026-12-01', fee_amount: 6000.00, status: 'Pending' }
    ],

    payment: [
      { payment_id: 501, due_id: 1, paid_date: '2026-10-01', fee_paid: 10200.00, penalty_paid: 0.00, payment_mode: 'Card', notes: 'Annual Elite plan payment - HDFC Credit Card' },
      { payment_id: 502, due_id: 2, paid_date: '2026-10-05', fee_paid: 3600.00, penalty_paid: 0.00, payment_mode: 'UPI', notes: 'Google Pay ref #982348712' },
      { payment_id: 503, due_id: 3, paid_date: '2026-10-10', fee_paid: 10200.00, penalty_paid: 0.00, payment_mode: 'UPI', notes: 'PhonePe ref #339182390' },
      { payment_id: 504, due_id: 4, paid_date: '2026-10-12', fee_paid: 6000.00, penalty_paid: 0.00, payment_mode: 'Cash', notes: 'Counter Cash Settlement' },
      { payment_id: 505, due_id: 5, paid_date: '2026-10-15', fee_paid: 10200.00, penalty_paid: 0.00, payment_mode: 'Card', notes: 'ICICI Debit Card' },
      { payment_id: 506, due_id: 6, paid_date: '2026-10-05', fee_paid: 6000.00, penalty_paid: 150.00, payment_mode: 'UPI', notes: 'Late settlement with ₹150 penalty - Paytm' },
      { payment_id: 507, due_id: 7, paid_date: '2026-09-20', fee_paid: 1500.00, penalty_paid: 100.00, payment_mode: 'Cash', notes: 'Final settlement before deactivation' }
    ],

    attendance: (() => {
      const now = new Date();
      const getIso = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      const today = getIso(now);
      const yesterday = getIso(new Date(now.getTime() - 86400000));
      const twoDaysAgo = getIso(new Date(now.getTime() - 172800000));

      return [
        // Today's Check-ins
        { attendance_id: 1001, member_id: 101, check_in_date: today, check_in_time: '06:12:40', method: 'RFID Card', status: 'Allowed', notes: 'Turnstile A (East Wing)' },
        { attendance_id: 1002, member_id: 102, check_in_date: today, check_in_time: '06:34:15', method: 'QR Code', status: 'Allowed', notes: 'Mobile App Pass Scan' },
        { attendance_id: 1003, member_id: 106, check_in_date: today, check_in_time: '07:05:22', method: 'RFID Card', status: 'Allowed', notes: 'Smart Band Tap' },
        { attendance_id: 1004, member_id: 107, check_in_date: today, check_in_time: '07:22:50', method: 'QR Code', status: 'Allowed', notes: 'Turnstile B' },
        { attendance_id: 1005, member_id: 104, check_in_date: today, check_in_time: '08:15:10', method: 'QR Code', status: 'Overdue Warning', notes: 'Pending fee ₹1,500 overdue alert' },
        { attendance_id: 1006, member_id: 111, check_in_date: today, check_in_time: '08:45:00', method: 'RFID Card', status: 'Allowed', notes: 'Turnstile A' },
        { attendance_id: 1007, member_id: 103, check_in_date: today, check_in_time: '09:10:35', method: 'QR Code', status: 'Allowed', notes: 'Turnstile A' },
        { attendance_id: 1008, member_id: 109, check_in_date: today, check_in_time: '11:05:18', method: 'RFID Card', status: 'Overdue Warning', notes: 'Pending fee ₹3,600 alert' },
        { attendance_id: 1009, member_id: 114, check_in_date: today, check_in_time: '12:30:45', method: 'Manual', status: 'Allowed', notes: 'Front Desk Manual Log' },

        // Yesterday's Check-ins
        { attendance_id: 1010, member_id: 101, check_in_date: yesterday, check_in_time: '06:15:00', method: 'RFID Card', status: 'Allowed', notes: 'Turnstile A' },
        { attendance_id: 1011, member_id: 102, check_in_date: yesterday, check_in_time: '06:40:12', method: 'QR Code', status: 'Allowed', notes: 'Turnstile B' },
        { attendance_id: 1012, member_id: 108, check_in_date: yesterday, check_in_time: '07:18:40', method: 'QR Code', status: 'Allowed', notes: 'Turnstile A' },
        { attendance_id: 1013, member_id: 112, check_in_date: yesterday, check_in_time: '08:02:55', method: 'RFID Card', status: 'Allowed', notes: 'Turnstile B' },
        { attendance_id: 1014, member_id: 105, check_in_date: yesterday, check_in_time: '10:14:20', method: 'RFID Card', status: 'Blocked', notes: 'Turnstile Locked - Inactive Member' },
        { attendance_id: 1015, member_id: 115, check_in_date: yesterday, check_in_time: '18:45:30', method: 'QR Code', status: 'Allowed', notes: 'Evening Peak Session' },

        // Two Days Ago
        { attendance_id: 1016, member_id: 106, check_in_date: twoDaysAgo, check_in_time: '07:00:10', method: 'RFID Card', status: 'Allowed', notes: 'Turnstile A' },
        { attendance_id: 1017, member_id: 107, check_in_date: twoDaysAgo, check_in_time: '07:30:45', method: 'QR Code', status: 'Allowed', notes: 'Turnstile B' },
        { attendance_id: 1018, member_id: 110, check_in_date: twoDaysAgo, check_in_time: '08:12:00', method: 'RFID Card', status: 'Allowed', notes: 'Turnstile A' },
        { attendance_id: 1019, member_id: 111, check_in_date: twoDaysAgo, check_in_time: '17:50:20', method: 'RFID Card', status: 'Allowed', notes: 'Turnstile A' },
        { attendance_id: 1020, member_id: 114, check_in_date: twoDaysAgo, check_in_time: '19:15:10', method: 'QR Code', status: 'Allowed', notes: 'Turnstile B' }
      ];
    })()
  };
}
