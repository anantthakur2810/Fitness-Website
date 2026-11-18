/**
 * Anytime Fitness Sohna — Gym Database Store
 * Relational schema implementation from capstone_dbms.sql:
 * - membership_plan (plan_id, plan_name, duration_months, monthly_fee)
 * - member (member_id, full_name, phone, email, join_date, plan_id, status)
 * - penalty_rule (rule_id, grace_days, penalty_per_day, max_penalty)
 * - fee_due (due_id, member_id, due_date, fee_amount, status)
 * - payment (payment_id, due_id, paid_date, fee_paid, penalty_paid, payment_mode, notes)
 */

const STORAGE_KEY = 'GYM_DB_STORAGE_V4';

export const INITIAL_DATA = {
  membership_plan: [
    {
      plan_id: 1,
      plan_name: 'Monthly Standard',
      duration_months: 1,
      monthly_fee: 1500.00
    },
    {
      plan_id: 2,
      plan_name: 'Quarterly Fitness',
      duration_months: 3,
      monthly_fee: 1200.00
    },
    {
      plan_id: 3,
      plan_name: 'Half-Yearly Pro',
      duration_months: 6,
      monthly_fee: 1000.00
    },
    {
      plan_id: 4,
      plan_name: 'Annual Elite',
      duration_months: 12,
      monthly_fee: 850.00
    },
    {
      plan_id: 5,
      plan_name: 'Student Special (Quarterly)',
      duration_months: 3,
      monthly_fee: 900.00
    }
  ],

  member: [
    {
      member_id: 101,
      full_name: 'Aarav Sharma',
      phone: '+91 98201 12345',
      email: 'aarav.sharma@example.com',
      join_date: '2026-01-10',
      plan_id: 4,
      status: 'Active'
    },
    {
      member_id: 102,
      full_name: 'Pooja Iyer',
      phone: '+91 98333 45678',
      email: 'pooja.iyer@example.com',
      join_date: '2026-03-15',
      plan_id: 2,
      status: 'Active'
    },
    {
      member_id: 103,
      full_name: 'Rohan Gupta',
      phone: '+91 97123 98765',
      email: 'rohan.gupta@example.com',
      join_date: '2026-05-01',
      plan_id: 3,
      status: 'Active'
    },
    {
      member_id: 104,
      full_name: 'Kavita Patil',
      phone: '+91 96543 21098',
      email: 'kavita.patil@example.com',
      join_date: '2026-08-20',
      plan_id: 1,
      status: 'Active'
    },
    {
      member_id: 105,
      full_name: 'Arjun Nair',
      phone: '+91 93210 98765',
      email: 'arjun.nair@example.com',
      join_date: '2026-02-01',
      plan_id: 1,
      status: 'Inactive'
    },
    {
      member_id: 106,
      full_name: 'Sneha Kulkarni',
      phone: '+91 98111 22334',
      email: 'sneha.k@example.com',
      join_date: '2026-01-20',
      plan_id: 4,
      status: 'Active'
    },
    {
      member_id: 107,
      full_name: 'Vikram Singhania',
      phone: '+91 98765 43210',
      email: 'vikram.s@example.com',
      join_date: '2026-04-10',
      plan_id: 3,
      status: 'Active'
    },
    {
      member_id: 108,
      full_name: 'Ananya Deshmukh',
      phone: '+91 99200 11223',
      email: 'ananya.d@example.com',
      join_date: '2026-08-01',
      plan_id: 5,
      status: 'Active'
    },
    {
      member_id: 109,
      full_name: 'Aditya Verma',
      phone: '+91 98450 67890',
      email: 'aditya.v@example.com',
      join_date: '2026-07-15',
      plan_id: 2,
      status: 'Active'
    },
    {
      member_id: 110,
      full_name: 'Meera Joshi',
      phone: '+91 97654 32109',
      email: 'meera.joshi@example.com',
      join_date: '2026-09-01',
      plan_id: 1,
      status: 'Active'
    },
    {
      member_id: 111,
      full_name: 'Kunal Malhotra',
      phone: '+91 98321 65498',
      email: 'kunal.m@example.com',
      join_date: '2026-02-15',
      plan_id: 4,
      status: 'Active'
    },
    {
      member_id: 112,
      full_name: 'Priya Sen',
      phone: '+91 99887 76655',
      email: 'priya.sen@example.com',
      join_date: '2026-08-15',
      plan_id: 5,
      status: 'Active'
    },
    {
      member_id: 113,
      full_name: 'Rajesh Choudhary',
      phone: '+91 91234 56780',
      email: 'rajesh.c@example.com',
      join_date: '2026-03-01',
      plan_id: 1,
      status: 'Inactive'
    },
    {
      member_id: 114,
      full_name: 'Neha Bansal',
      phone: '+91 98222 33445',
      email: 'neha.bansal@example.com',
      join_date: '2026-06-10',
      plan_id: 2,
      status: 'Active'
    },
    {
      member_id: 115,
      full_name: 'Siddharth Roy',
      phone: '+91 97531 86420',
      email: 'sid.roy@example.com',
      join_date: '2026-05-20',
      plan_id: 3,
      status: 'Active'
    }
  ],

  penalty_rule: [
    {
      rule_id: 1,
      grace_days: 5,
      penalty_per_day: 10.00,
      max_penalty: 500.00
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
    {
      payment_id: 501,
      due_id: 1,
      paid_date: '2026-10-01',
      fee_paid: 10200.00,
      penalty_paid: 0.00,
      payment_mode: 'Card',
      notes: 'Annual Elite plan payment - HDFC Credit Card'
    },
    {
      payment_id: 502,
      due_id: 2,
      paid_date: '2026-10-05',
      fee_paid: 3600.00,
      penalty_paid: 0.00,
      payment_mode: 'UPI',
      notes: 'Google Pay ref #982348712'
    },
    {
      payment_id: 503,
      due_id: 3,
      paid_date: '2026-10-10',
      fee_paid: 10200.00,
      penalty_paid: 0.00,
      payment_mode: 'UPI',
      notes: 'PhonePe ref #339182390'
    },
    {
      payment_id: 504,
      due_id: 4,
      paid_date: '2026-10-12',
      fee_paid: 6000.00,
      penalty_paid: 0.00,
      payment_mode: 'Cash',
      notes: 'Counter Cash Settlement'
    },
    {
      payment_id: 505,
      due_id: 5,
      paid_date: '2026-10-15',
      fee_paid: 10200.00,
      penalty_paid: 0.00,
      payment_mode: 'Card',
      notes: 'ICICI Debit Card'
    },
    {
      payment_id: 506,
      due_id: 6,
      paid_date: '2026-10-05',
      fee_paid: 6000.00,
      penalty_paid: 150.00,
      payment_mode: 'UPI',
      notes: 'Late settlement with ₹150 penalty - Paytm'
    },
    {
      payment_id: 507,
      due_id: 7,
      paid_date: '2026-09-20',
      fee_paid: 1500.00,
      penalty_paid: 100.00,
      payment_mode: 'Cash',
      notes: 'Final settlement before deactivation'
    }
  ]
};

export function normalizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '');
}

class GymStore {
  constructor() {
    this.data = this.load();
    this.listeners = [];
    this.sqlLogs = [];
    this.initDefaultSqlLogs();
  }

  initDefaultSqlLogs() {
    this.sqlLogs = [
      { timestamp: new Date().toLocaleTimeString(), query: 'USE gym_db;' },
      { timestamp: new Date().toLocaleTimeString(), query: 'SELECT * FROM membership_plan;' },
      { timestamp: new Date().toLocaleTimeString(), query: 'SELECT m.*, p.plan_name FROM member m JOIN membership_plan p ON m.plan_id = p.plan_id;' }
    ];
  }

  logSql(query) {
    this.sqlLogs.unshift({
      timestamp: new Date().toLocaleTimeString(),
      query: query.trim()
    });
    if (this.sqlLogs.length > 60) this.sqlLogs.pop();
  }

  getSqlLogs() {
    return this.sqlLogs;
  }

  load() {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.membership_plan && parsed.member && parsed.fee_due && parsed.payment) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Storage read fallback', e);
    }
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }

  save() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      }
    } catch (e) {
      console.error('Storage write error', e);
    }
    this.listeners.forEach(fn => fn(this.data));
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.initDefaultSqlLogs();
    this.logSql('-- RESET DATABASE TO SEED STATE');
    this.save();
  }

  subscribe(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  // --- PLANS ---
  getPlans() {
    return this.data.membership_plan;
  }

  getPlan(id) {
    return this.data.membership_plan.find(p => p.plan_id === Number(id));
  }

  addPlan({ plan_name, duration_months, monthly_fee }) {
    const name = (plan_name || '').trim();
    const duration = parseInt(duration_months, 10);
    const fee = parseFloat(monthly_fee);

    if (!name) throw new Error('Plan name cannot be empty.');
    if (isNaN(duration) || duration <= 0) throw new Error('Plan duration must be at least 1 month.');
    if (isNaN(fee) || fee <= 0) throw new Error('Monthly fee must be greater than 0.');

    const nextId = Math.max(0, ...this.data.membership_plan.map(p => p.plan_id)) + 1;
    const newPlan = {
      plan_id: nextId,
      plan_name: name,
      duration_months: duration,
      monthly_fee: fee
    };

    this.data.membership_plan.push(newPlan);
    this.logSql(`INSERT INTO membership_plan (plan_id, plan_name, duration_months, monthly_fee) VALUES (${nextId}, '${name.replace(/'/g, "''")}', ${duration}, ${fee.toFixed(2)});`);
    this.save();
    return newPlan;
  }

  updatePlan(id, { plan_name, duration_months, monthly_fee }) {
    const plan = this.getPlan(id);
    if (!plan) throw new Error('Plan not found.');

    const name = (plan_name || '').trim();
    const duration = parseInt(duration_months, 10);
    const fee = parseFloat(monthly_fee);

    if (!name) throw new Error('Plan name cannot be empty.');
    if (isNaN(duration) || duration <= 0) throw new Error('Plan duration must be at least 1 month.');
    if (isNaN(fee) || fee <= 0) throw new Error('Monthly fee must be greater than 0.');

    plan.plan_name = name;
    plan.duration_months = duration;
    plan.monthly_fee = fee;

    this.logSql(`UPDATE membership_plan SET plan_name = '${name.replace(/'/g, "''")}', duration_months = ${duration}, monthly_fee = ${fee.toFixed(2)} WHERE plan_id = ${id};`);
    this.save();
    return plan;
  }

  deletePlan(id) {
    const planId = Number(id);
    const plan = this.getPlan(planId);
    if (!plan) throw new Error('Plan not found.');

    const enrolledMembers = this.data.member.filter(m => m.plan_id === planId);
    if (enrolledMembers.length > 0) {
      throw new Error(`Cannot delete plan "${plan.plan_name}": ${enrolledMembers.length} member(s) are currently enrolled. Reassign them first.`);
    }

    this.data.membership_plan = this.data.membership_plan.filter(p => p.plan_id !== planId);
    this.logSql(`DELETE FROM membership_plan WHERE plan_id = ${planId};`);
    this.save();
    return true;
  }

  // --- MEMBERS ---
  getMembers() {
    return this.data.member;
  }

  getMember(id) {
    return this.data.member.find(m => m.member_id === Number(id));
  }

  getMemberDetails(id) {
    const member = this.getMember(id);
    if (!member) return null;

    const plan = this.getPlan(member.plan_id);
    const dues = this.data.fee_due
      .filter(d => d.member_id === member.member_id)
      .sort((a, b) => new Date(b.due_date) - new Date(a.due_date));

    const payments = this.data.payment
      .filter(p => {
        const due = this.data.fee_due.find(d => d.due_id === p.due_id);
        return due && due.member_id === member.member_id;
      })
      .sort((a, b) => new Date(b.paid_date) - new Date(a.paid_date));

    const totalPaid = payments.reduce((sum, p) => sum + Number(p.fee_paid) + Number(p.penalty_paid || 0), 0);
    const pendingDues = dues.filter(d => d.status === 'Pending');
    const totalPendingFee = pendingDues.reduce((sum, d) => sum + Number(d.fee_amount), 0);

    return {
      member,
      plan,
      dues,
      payments,
      totalPaid,
      pendingDues,
      totalPendingFee
    };
  }

  addMember({ full_name, phone, email, join_date, plan_id, status }) {
    const name = (full_name || '').trim();
    const rawPhone = (phone || '').trim();
    const cleanNum = normalizePhone(rawPhone);

    if (!name) throw new Error('Member name is required.');
    if (!cleanNum || cleanNum.length < 7) throw new Error('Valid phone number is required (min 7 digits).');

    const duplicate = this.data.member.some(m => normalizePhone(m.phone) === cleanNum);
    if (duplicate) {
      throw new Error(`Phone number ${rawPhone} is already registered to another member.`);
    }

    const planId = Number(plan_id);
    const plan = this.getPlan(planId);
    if (!plan) throw new Error('Selected membership plan does not exist.');

    const nextId = Math.max(100, ...this.data.member.map(m => m.member_id)) + 1;
    const joinDateStr = join_date || new Date().toISOString().split('T')[0];

    const newMember = {
      member_id: nextId,
      full_name: name,
      phone: rawPhone,
      email: (email || '').trim(),
      join_date: joinDateStr,
      plan_id: planId,
      status: status || 'Active'
    };

    this.data.member.unshift(newMember);
    this.logSql(`INSERT INTO member (member_id, full_name, phone, email, join_date, plan_id, status) VALUES (${nextId}, '${name.replace(/'/g, "''")}', '${rawPhone}', '${newMember.email}', '${joinDateStr}', ${planId}, '${newMember.status}');`);

    const feeAmount = plan.duration_months * plan.monthly_fee;
    const nextDueId = Math.max(0, ...this.data.fee_due.map(d => d.due_id)) + 1;
    const initialDue = {
      due_id: nextDueId,
      member_id: nextId,
      due_date: joinDateStr,
      fee_amount: feeAmount,
      status: 'Pending'
    };
    this.data.fee_due.unshift(initialDue);
    this.logSql(`INSERT INTO fee_due (due_id, member_id, due_date, fee_amount, status) VALUES (${nextDueId}, ${nextId}, '${joinDateStr}', ${feeAmount.toFixed(2)}, 'Pending');`);

    this.save();
    return newMember;
  }

  updateMember(id, updates) {
    const m = this.getMember(id);
    if (!m) throw new Error('Member not found.');

    if (updates.phone) {
      const cleanNum = normalizePhone(updates.phone);
      if (cleanNum.length < 7) throw new Error('Valid phone number is required.');
      const duplicate = this.data.member.some(mem => mem.member_id !== m.member_id && normalizePhone(mem.phone) === cleanNum);
      if (duplicate) {
        throw new Error(`Phone number ${updates.phone} is already registered to another member.`);
      }
      m.phone = updates.phone.trim();
    }

    if (updates.full_name !== undefined) {
      const name = updates.full_name.trim();
      if (!name) throw new Error('Full name cannot be empty.');
      m.full_name = name;
    }

    if (updates.email !== undefined) m.email = updates.email.trim();
    if (updates.join_date !== undefined && updates.join_date) m.join_date = updates.join_date;
    if (updates.status !== undefined) m.status = updates.status;

    if (updates.plan_id !== undefined) {
      const planId = Number(updates.plan_id);
      const plan = this.getPlan(planId);
      if (!plan) throw new Error('Selected plan does not exist.');
      m.plan_id = planId;
    }

    this.logSql(`UPDATE member SET full_name = '${m.full_name.replace(/'/g, "''")}', phone = '${m.phone}', email = '${m.email}', status = '${m.status}', plan_id = ${m.plan_id} WHERE member_id = ${m.member_id};`);
    this.save();
    return m;
  }

  deleteMember(id) {
    const memberId = Number(id);
    const m = this.getMember(memberId);
    if (!m) throw new Error('Member not found.');

    const pendingDues = this.data.fee_due.filter(d => d.member_id === memberId && d.status === 'Pending');
    if (pendingDues.length > 0) {
      throw new Error(`Cannot delete member "${m.full_name}": has ${pendingDues.length} pending fee due(s). Settle or cancel dues first.`);
    }

    const duesOfMember = this.data.fee_due.filter(d => d.member_id === memberId);
    const dueIds = duesOfMember.map(d => d.due_id);

    this.data.payment = this.data.payment.filter(p => !dueIds.includes(p.due_id));
    this.data.fee_due = this.data.fee_due.filter(d => d.member_id !== memberId);
    this.data.member = this.data.member.filter(mem => mem.member_id !== memberId);

    this.logSql(`DELETE FROM member WHERE member_id = ${memberId};`);
    this.save();
    return true;
  }

  // --- PENALTY RULES ---
  getPenaltyRule() {
    return this.data.penalty_rule[0] || {
      rule_id: 1,
      grace_days: 5,
      penalty_per_day: 10.00,
      max_penalty: 500.00
    };
  }

  updatePenaltyRule({ grace_days, penalty_per_day, max_penalty }) {
    const grace = parseInt(grace_days, 10);
    const rate = parseFloat(penalty_per_day);
    const maxP = parseFloat(max_penalty);

    if (isNaN(grace) || grace < 0) throw new Error('Grace days must be 0 or more.');
    if (isNaN(rate) || rate < 0) throw new Error('Penalty per day must be 0 or more.');
    if (isNaN(maxP) || maxP < 0) throw new Error('Max penalty cap must be 0 or more.');

    this.data.penalty_rule[0] = {
      rule_id: 1,
      grace_days: grace,
      penalty_per_day: rate,
      max_penalty: maxP
    };

    this.logSql(`UPDATE penalty_rule SET grace_days = ${grace}, penalty_per_day = ${rate.toFixed(2)}, max_penalty = ${maxP.toFixed(2)} WHERE rule_id = 1;`);
    this.save();
    return this.data.penalty_rule[0];
  }

  // --- FEE DUES ---
  getFeeDues() {
    return this.data.fee_due;
  }

  getFeeDue(id) {
    return this.data.fee_due.find(d => d.due_id === Number(id));
  }

  addFeeDue({ member_id, due_date, fee_amount }) {
    const memId = Number(member_id);
    const member = this.getMember(memId);
    if (!member) throw new Error('Member not found for fee due.');

    const amount = parseFloat(fee_amount);
    if (isNaN(amount) || amount <= 0) throw new Error('Fee amount must be greater than 0.');
    if (!due_date) throw new Error('Due date is required.');

    const nextId = Math.max(0, ...this.data.fee_due.map(d => d.due_id)) + 1;
    const newDue = {
      due_id: nextId,
      member_id: memId,
      due_date,
      fee_amount: amount,
      status: 'Pending'
    };

    this.data.fee_due.unshift(newDue);
    this.logSql(`INSERT INTO fee_due (due_id, member_id, due_date, fee_amount, status) VALUES (${nextId}, ${memId}, '${due_date}', ${amount.toFixed(2)}, 'Pending');`);
    this.save();
    return newDue;
  }

  updateFeeDue(id, { due_date, fee_amount }) {
    const due = this.getFeeDue(id);
    if (!due) throw new Error('Fee due not found.');
    if (due.status === 'Paid') throw new Error('Cannot edit a settled fee due.');

    const amount = parseFloat(fee_amount);
    if (isNaN(amount) || amount <= 0) throw new Error('Fee amount must be greater than 0.');
    if (!due_date) throw new Error('Due date is required.');

    due.due_date = due_date;
    due.fee_amount = amount;

    this.logSql(`UPDATE fee_due SET due_date = '${due_date}', fee_amount = ${amount.toFixed(2)} WHERE due_id = ${due.due_id};`);
    this.save();
    return due;
  }

  deleteFeeDue(id) {
    const dueId = Number(id);
    const due = this.getFeeDue(dueId);
    if (!due) throw new Error('Fee due not found.');

    const payment = this.data.payment.find(p => p.due_id === dueId);
    if (payment) {
      throw new Error(`Cannot delete Fee Due #${dueId}: Payment #${payment.payment_id} is recorded against it. Cancel payment first.`);
    }

    this.data.fee_due = this.data.fee_due.filter(d => d.due_id !== dueId);
    this.logSql(`DELETE FROM fee_due WHERE due_id = ${dueId};`);
    this.save();
    return true;
  }

  generateRenewalDue(member_id) {
    const member = this.getMember(member_id);
    if (!member) throw new Error('Member not found.');
    const plan = this.getPlan(member.plan_id);
    if (!plan) throw new Error('Member has no valid plan assigned.');

    const memberDues = this.data.fee_due
      .filter(d => d.member_id === member.member_id)
      .sort((a, b) => new Date(b.due_date) - new Date(a.due_date));

    let nextDueDate;
    if (memberDues.length > 0) {
      const lastDate = new Date(memberDues[0].due_date);
      lastDate.setMonth(lastDate.getMonth() + plan.duration_months);
      nextDueDate = lastDate.toISOString().split('T')[0];
    } else {
      nextDueDate = new Date().toISOString().split('T')[0];
    }

    const feeAmount = plan.duration_months * plan.monthly_fee;
    return this.addFeeDue({
      member_id: member.member_id,
      due_date: nextDueDate,
      fee_amount: feeAmount
    });
  }

  // --- PAYMENTS ---
  getPayments() {
    return this.data.payment;
  }

  getPayment(id) {
    return this.data.payment.find(p => p.payment_id === Number(id));
  }

  getPaymentByDueId(due_id) {
    return this.data.payment.find(p => p.due_id === Number(due_id));
  }

  recordPayment({ due_id, paid_date, fee_paid, penalty_paid, payment_mode, notes }) {
    const due = this.getFeeDue(due_id);
    if (!due) throw new Error('Fee due not found.');
    if (due.status === 'Paid') throw new Error('Fee due is already marked as Paid.');

    const nextId = Math.max(500, ...this.data.payment.map(p => p.payment_id)) + 1;
    const paidDate = paid_date || new Date().toISOString().split('T')[0];
    const feeAmt = parseFloat(fee_paid);
    const penAmt = parseFloat(penalty_paid || 0);
    const mode = payment_mode || 'UPI';

    if (isNaN(feeAmt) || feeAmt < 0) throw new Error('Fee paid amount is invalid.');
    if (isNaN(penAmt) || penAmt < 0) throw new Error('Penalty paid amount cannot be negative.');

    const newPayment = {
      payment_id: nextId,
      due_id: Number(due_id),
      paid_date: paidDate,
      fee_paid: feeAmt,
      penalty_paid: penAmt,
      payment_mode: mode,
      notes: (notes || '').trim()
    };

    due.status = 'Paid';
    this.data.payment.unshift(newPayment);

    this.logSql(`UPDATE fee_due SET status = 'Paid' WHERE due_id = ${due.due_id};\nINSERT INTO payment (payment_id, due_id, paid_date, fee_paid, penalty_paid, payment_mode) VALUES (${nextId}, ${due.due_id}, '${paidDate}', ${feeAmt.toFixed(2)}, ${penAmt.toFixed(2)}, '${mode}');`);
    this.save();
    return newPayment;
  }

  deletePayment(payment_id) {
    const payId = Number(payment_id);
    const payment = this.getPayment(payId);
    if (!payment) throw new Error('Payment not found.');

    const due = this.getFeeDue(payment.due_id);
    if (due) {
      due.status = 'Pending';
    }

    this.data.payment = this.data.payment.filter(p => p.payment_id !== payId);
    this.logSql(`UPDATE fee_due SET status = 'Pending' WHERE due_id = ${payment.due_id};\nDELETE FROM payment WHERE payment_id = ${payId};`);
    this.save();
    return true;
  }

  // --- BACKUP & EXPORT ---
  exportJsonBackup() {
    return JSON.stringify(this.data, null, 2);
  }

  importJsonBackup(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.membership_plan && parsed.member && parsed.fee_due && parsed.payment) {
        this.data = parsed;
        this.logSql('-- IMPORTED JSON BACKUP DATABASE');
        this.save();
        return true;
      }
      throw new Error('Invalid backup file structure.');
    } catch (err) {
      throw new Error('Could not parse JSON backup: ' + err.message);
    }
  }
}

export const store = new GymStore();
