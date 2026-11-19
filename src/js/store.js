/**
 * Anytime Fitness Sohna — Gym Database Store
 * Dual-mode persistence:
 * 1. Live MongoDB Atlas sync via Vercel Serverless API (/api/gym) when deployed on Vercel
 * 2. Instant browser localStorage cache & automatic offline/local fallback
 */

import { CONFIG } from './config.js';
import { createInitialData } from './seed.js';

const STORAGE_KEY = CONFIG.storageKey;
const API_ENDPOINT = '/api/gym';

export const INITIAL_DATA = createInitialData({
  graceDays: CONFIG.defaultGraceDays,
  penaltyPerDay: CONFIG.defaultPenaltyPerDay,
  maxPenalty: CONFIG.defaultMaxPenalty
});

export function normalizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '');
}

class GymStore {
  constructor() {
    this.data = this.load();
    this.listeners = [];
    this.sqlLogs = [];
    this.cloudStatus = 'local'; // 'checking' | 'connected' | 'local' | 'error'
    this.cloudDbName = null;
    this.lastSyncedAt = null;
    this._syncQueue = Promise.resolve();

    this.initDefaultSqlLogs();

    // Hydrate from Vercel MongoDB API automatically in browser environments
    if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
      this.syncFromCloud();
    }
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

  getCloudStatus() {
    return {
      status: this.cloudStatus,
      database: this.cloudDbName,
      lastSyncedAt: this.lastSyncedAt
    };
  }

  async syncFromCloud() {
    if (typeof fetch === 'undefined') return false;
    this.cloudStatus = 'checking';

    try {
      const res = await fetch(API_ENDPOINT, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });

      if (!res.ok) {
        this.cloudStatus = 'local';
        this.notify();
        return false;
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        this.cloudStatus = 'local';
        this.notify();
        return false;
      }

      const json = await res.json();
      if (json && json.connected && json.data && json.data.membership_plan) {
        // Guard: If cloud attendance is empty or missing, populate from local/initial data and sync back
        if (!Array.isArray(json.data.attendance) || json.data.attendance.length === 0) {
          json.data.attendance = (this.data.attendance && this.data.attendance.length > 0)
            ? this.data.attendance
            : JSON.parse(JSON.stringify(INITIAL_DATA.attendance || []));
          this.data = json.data;
          this.saveLocalOnly();
          this.syncToCloud();
        } else {
          this.data = json.data;
          this.saveLocalOnly();
        }

        this.cloudStatus = 'connected';
        this.cloudDbName = json.database || 'gym_db';
        this.lastSyncedAt = new Date().toISOString();
        this.notify();
        return true;
      }

      this.cloudStatus = 'local';
      this.notify();
      return false;
    } catch {
      this.cloudStatus = 'local';
      this.notify();
      return false;
    }
  }

  syncToCloud() {
    if (this.cloudStatus !== 'connected' || typeof fetch === 'undefined') return;
    const snapshot = JSON.stringify(this.data);

    this._syncQueue = this._syncQueue
      .then(async () => {
        const res = await fetch(API_ENDPOINT, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: snapshot
        });
        if (res.ok) {
          const json = await res.json();
          this.lastSyncedAt = json.syncedAt || new Date().toISOString();
        } else {
          console.warn('Cloud sync warning:', res.status);
        }
      })
      .catch((err) => {
        console.warn('Cloud sync failed (local cache preserved):', err);
      });
  }

  load() {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.membership_plan && parsed.member && parsed.fee_due && parsed.payment) {
            if (!Array.isArray(parsed.attendance) || parsed.attendance.length === 0) {
              parsed.attendance = JSON.parse(JSON.stringify(INITIAL_DATA.attendance || []));
            }
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Storage read fallback', e);
    }
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }

  saveLocalOnly() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      }
    } catch (e) {
      console.error('Storage write error', e);
    }
  }

  notify() {
    this.listeners.forEach(fn => fn(this.data));
  }

  save() {
    this.saveLocalOnly();
    this.notify();
    this.syncToCloud();
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
    this.data.attendance = (this.data.attendance || []).filter(a => a.member_id !== memberId);
    this.data.member = this.data.member.filter(mem => mem.member_id !== memberId);

    this.logSql(`DELETE FROM member WHERE member_id = ${memberId};`);
    this.save();
    return true;
  }

  // --- PENALTY RULES ---
  getPenaltyRule() {
    return this.data.penalty_rule[0] || {
      rule_id: 1,
      grace_days: CONFIG.defaultGraceDays,
      penalty_per_day: CONFIG.defaultPenaltyPerDay,
      max_penalty: CONFIG.defaultMaxPenalty
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

  // --- ATTENDANCE ---
  getAttendance() {
    return this.data.attendance || [];
  }

  getAttendanceForMember(memberId) {
    const memId = Number(memberId);
    return (this.data.attendance || []).filter(a => a.member_id === memId);
  }

  recordCheckIn({ member_id, method = 'QR Code', notes = '', check_in_date, check_in_time }) {
    const memId = Number(member_id);
    const member = this.getMember(memId);
    if (!member) throw new Error('Member not found for check-in.');

    if (!Array.isArray(this.data.attendance)) {
      this.data.attendance = [];
    }

    const todayStr = check_in_date || new Date().toISOString().split('T')[0];
    const nowTimeStr = check_in_time || new Date().toTimeString().split(' ')[0];

    // Determine access status
    let status = 'Allowed';
    let warningMessage = '';

    if (member.status === 'Inactive') {
      status = 'Blocked';
      warningMessage = `Member #${member.member_id} (${member.full_name}) is marked Inactive. Turnstile Locked.`;
    } else {
      // Check if there are overdue pending dues past grace period
      const rule = this.getPenaltyRule();
      const graceDays = rule.grace_days ?? 5;
      const todayDate = new Date(todayStr);

      const overdueDues = (this.data.fee_due || []).filter(d => {
        if (d.member_id !== memId || d.status !== 'Pending') return false;
        const dueDate = new Date(d.due_date);
        const diffMs = todayDate - dueDate;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        return diffDays > graceDays;
      });

      if (overdueDues.length > 0) {
        status = 'Overdue Warning';
        const totalPending = overdueDues.reduce((s, d) => s + Number(d.fee_amount), 0);
        warningMessage = `Member has overdue payment (₹${totalPending.toLocaleString('en-IN')}) exceeding ${graceDays} days grace.`;
      }
    }

    const nextId = Math.max(1000, ...(this.data.attendance || []).map(a => Number(a.attendance_id) || 0)) + 1;
    const newRecord = {
      attendance_id: nextId,
      member_id: memId,
      check_in_date: todayStr,
      check_in_time: nowTimeStr,
      method: method || 'QR Code',
      status,
      notes: notes || (status === 'Overdue Warning' ? 'Turnstile warning flagged' : status === 'Blocked' ? 'Turnstile Locked - Inactive' : 'Turnstile Gate A Access')
    };

    this.data.attendance.unshift(newRecord);
    this.logSql(`INSERT INTO attendance (attendance_id, member_id, check_in_date, check_in_time, method, status, notes) VALUES (${nextId}, ${memId}, '${todayStr}', '${nowTimeStr}', '${newRecord.method}', '${status}', '${newRecord.notes.replace(/'/g, "''")}');`);
    this.save();

    return {
      record: newRecord,
      member,
      status,
      warningMessage
    };
  }

  deleteAttendance(attendanceId) {
    const id = Number(attendanceId);
    if (!this.data.attendance) return false;
    this.data.attendance = this.data.attendance.filter(a => a.attendance_id !== id);
    this.logSql(`DELETE FROM attendance WHERE attendance_id = ${id};`);
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
        if (!Array.isArray(parsed.attendance)) {
          parsed.attendance = INITIAL_DATA.attendance || [];
        }
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
