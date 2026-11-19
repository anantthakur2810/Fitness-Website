/**
 * Anytime Fitness Sohna — Member Portal View
 * Dedicated member portal for gym members to view personal profile, digital RFID/QR pass,
 * gate check-in history, membership plan validity, and pay pending dues via Razorpay.
 */

import { store } from './store.js';
import { auth } from './auth.js';
import { calculateDuePenalty, formatINR, formatDate } from './penalty.js';
import { generateQRCodeSVG } from './qr.js';
import { openRazorpayCheckout } from './razorpay.js';

let activeMemberTab = 'pass'; // 'pass' | 'dues' | 'receipts' | 'attendance' | 'plan'

export function renderMemberPortal(container) {
  const member = auth.getCurrentMember();

  if (!member) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 4rem 1rem;">
        <div style="font-size: 3rem;">🔒</div>
        <h2>Member Sign In Required</h2>
        <p>Sign in to view your pass, dues, and attendance.</p>
        <button type="button" class="btn btn-primary" onclick="openAuthModal('member')">
          Sign In
        </button>
      </div>
    `;
    return;
  }

  const plan = store.getPlan(member.plan_id);
  const dues = store.getFeeDues().filter(d => d.member_id === member.member_id);
  const pendingDues = dues.filter(d => d.status === 'Pending');
  const paidDues = dues.filter(d => d.status === 'Paid');
  const payments = store.getPayments().filter(p => {
    const d = dues.find(due => due.due_id === p.due_id);
    return !!d;
  });
  const attendance = store.getAttendanceForMember(member.member_id);

  // Calculate total pending amount including late penalties
  let totalPendingAmount = 0;
  pendingDues.forEach(d => {
    const p = calculateDuePenalty(d);
    totalPendingAmount += p.totalPayable;
  });

  // Calculate membership expiry from join date & duration
  const joinDate = new Date(member.join_date);
  const durationMonths = plan ? plan.duration_months : 12;
  const expiryDate = new Date(joinDate);
  expiryDate.setMonth(expiryDate.getMonth() + durationMonths);
  const now = new Date();
  const diffTime = expiryDate - now;
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // Generate Digital Pass QR Code
  const qrPayload = `AF-MEMBER-PASS:${member.member_id}:${member.phone}:${member.status}`;
  const qrSvg = generateQRCodeSVG(qrPayload, { size: 160, color: '#0f172a', bgColor: '#ffffff', quietZone: 1 });

  container.innerHTML = `
    <div class="member-portal-wrap">
      <!-- Member Profile Header -->
      <div class="member-header-card">
        <div class="member-header-main">
          <div class="member-avatar-lg">
            ${member.full_name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              <h1 class="member-name">${member.full_name}</h1>
              <span class="badge ${member.status === 'Active' ? 'badge-active' : 'badge-inactive'}">
                ${member.status === 'Active' ? '● Active Member' : '● Inactive'}
              </span>
              <span class="member-id-pill">ID: #${member.member_id}</span>
            </div>
            <div class="member-meta-line">
              <span>📧 ${member.email}</span>
              <span>📱 ${member.phone}</span>
              <span>📅 Joined ${formatDate(member.join_date)}</span>
            </div>
          </div>
        </div>

        <div class="member-header-actions">
          <button type="button" class="btn btn-secondary" onclick="handleLogout()">
            Sign Out
          </button>
        </div>
      </div>

      <!-- Quick Stats Metric Row -->
      <div class="metrics-row" style="margin-top: 1.25rem;">
        <div class="metric-card">
          <div class="metric-label">Current Membership</div>
          <div class="metric-val" style="font-size: 1.35rem; color: var(--accent-text);">
            ${plan ? plan.plan_name : 'Standard'}
          </div>
          <div class="metric-sub">${daysRemaining} days remaining (Expires ${formatDate(expiryDate.toISOString().split('T')[0])})</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Fee Dues Status</div>
          <div class="metric-val tabular-nums" style="color: ${pendingDues.length > 0 ? 'var(--danger-text)' : 'var(--success-text)'};">
            ${pendingDues.length > 0 ? formatINR(totalPendingAmount) : '₹0.00 Paid'}
          </div>
          <div class="metric-sub">
            ${pendingDues.length > 0 
              ? `${pendingDues.length} pending installment(s) requiring payment` 
              : 'All dues settled up to date'
            }
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Gym Check-Ins</div>
          <div class="metric-val tabular-nums">
            ${attendance.length} <span style="font-size: 0.95rem; font-weight: 500; color: var(--text-muted);">visits</span>
          </div>
          <div class="metric-sub">
            ${attendance.length > 0 ? `Last visited ${formatDate(attendance[0].check_in_date)} at ${attendance[0].check_in_time}` : 'No visits recorded yet'}
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="portal-nav-bar" style="margin-top: 1.5rem;">
        <button 
          type="button" 
          class="portal-tab-btn ${activeMemberTab === 'pass' ? 'active' : ''}" 
          onclick="switchMemberTab('pass')"
        >
          Pass
        </button>
        <button 
          type="button" 
          class="portal-tab-btn ${activeMemberTab === 'dues' ? 'active' : ''}" 
          onclick="switchMemberTab('dues')"
        >
          Dues (${pendingDues.length})
        </button>
        <button 
          type="button" 
          class="portal-tab-btn ${activeMemberTab === 'receipts' ? 'active' : ''}" 
          onclick="switchMemberTab('receipts')"
        >
          Receipts (${payments.length})
        </button>
        <button 
          type="button" 
          class="portal-tab-btn ${activeMemberTab === 'attendance' ? 'active' : ''}" 
          onclick="switchMemberTab('attendance')"
        >
          Attendance (${attendance.length})
        </button>
        <button 
          type="button" 
          class="portal-tab-btn ${activeMemberTab === 'plan' ? 'active' : ''}" 
          onclick="switchMemberTab('plan')"
        >
          Plan
        </button>
      </div>

      <!-- TAB CONTENT PANELS -->
      <div class="portal-content-box" style="margin-top: 1rem;">
        ${renderActiveTabContent(member, plan, dues, pendingDues, payments, attendance, qrSvg)}
      </div>
    </div>
  `;
}

function renderActiveTabContent(member, plan, dues, pendingDues, payments, attendance, qrSvg) {
  switch (activeMemberTab) {
    case 'pass':
      return `
        <div class="member-pass-container">
          <!-- Digital Keyfob Pass Card -->
          <div class="member-card-visual">
            <div class="card-chip"></div>
            <div class="card-brand-row">
              <span class="card-brand-title">ANYTIME FITNESS</span>
              <span class="card-brand-branch">SECTOR 34, SOHNA</span>
            </div>
            
            <div class="card-qr-box">
              ${qrSvg}
              <div class="card-qr-label">TAP TO SCAN AT ENTRANCE</div>
            </div>

            <div class="card-bottom-info">
              <div>
                <div class="card-mem-name">${member.full_name}</div>
                <div class="card-mem-meta">ID #${member.member_id} • ${plan ? plan.plan_name : 'Standard'}</div>
              </div>
              <div class="card-rfid-badge">
                <span class="card-rfid-dot"></span>
                <span>RFID 24/7 ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      `;

    case 'dues':
      if (pendingDues.length === 0) {
        return `
          <div class="empty-state" style="padding: 3rem 1rem;">
            <div style="font-size: 2.5rem;">🎉</div>
            <h3 style="margin-top: 0.5rem;">No Pending Dues</h3>
            <p style="color: var(--text-muted); max-width: 440px; margin: 0.5rem auto 1.5rem;">
              All membership dues are settled.
            </p>
            <button type="button" class="btn btn-secondary" onclick="switchMemberTab('receipts')">
              View Receipts
            </button>
          </div>
        `;
      }

      return `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
            <div>
              <h3 style="margin: 0;">Pending Dues</h3>
            </div>
          </div>

          <div class="dues-cards-list">
            ${pendingDues.map(due => {
              const p = calculateDuePenalty(due);
              return `
                <div class="due-pay-card ${p.daysOverdue > 0 ? 'overdue-card' : ''}">
                  <div class="due-card-header">
                    <div>
                      <div class="due-card-title">Membership Due #${due.due_id}</div>
                      <div class="due-card-date">Scheduled Due Date: <strong>${formatDate(due.due_date)}</strong></div>
                    </div>
                    <span class="badge ${p.daysOverdue > 0 ? 'badge-overdue' : 'badge-pending'}">
                      ${p.daysOverdue > 0 ? `${p.daysOverdue} Days Overdue` : 'Pending'}
                    </span>
                  </div>

                  <div class="due-card-breakdown">
                    <div class="breakdown-row">
                      <span>Base Plan Fee:</span>
                      <span class="tabular-nums font-bold">${formatINR(due.fee_amount)}</span>
                    </div>
                    ${p.penalty > 0 ? `
                      <div class="breakdown-row" style="color: var(--danger-text);">
                        <span>Late Penalty (${p.chargeableDays} days overdue):</span>
                        <span class="tabular-nums font-bold">+${formatINR(p.penalty)}</span>
                      </div>
                    ` : ''}
                    <div class="breakdown-row total-breakdown">
                      <span>Total Amount Payable:</span>
                      <span class="tabular-nums total-val">${formatINR(p.totalPayable)}</span>
                    </div>
                  </div>

                  <div class="due-card-footer">
                    <button 
                      type="button" 
                      class="btn btn-primary rzp-trigger-btn"
                      onclick="openRazorpayCheckout(${due.due_id})"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                      Pay ${formatINR(p.totalPayable)} with Razorpay
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;

    case 'receipts':
      if (payments.length === 0) {
        return `
          <div class="empty-state" style="padding: 3rem 1rem;">
            <div style="font-size: 2.5rem;">📄</div>
            <h3 style="margin-top: 0.5rem;">No Receipts Found</h3>
            <p style="color: var(--text-muted);">Receipts will appear here once you settle a membership due.</p>
          </div>
        `;
      }

      return `
        <div>
          <div style="margin-bottom: 1rem;">
            <h3 style="margin: 0;">Payment Receipts</h3>
          </div>

          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Payment Date</th>
                  <th>Fee Paid</th>
                  <th>Penalty Paid</th>
                  <th>Total Paid</th>
                  <th>Mode</th>
                  <th>Razorpay / Ref ID</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${payments.map(p => {
                  const total = Number(p.fee_paid) + Number(p.penalty_paid || 0);
                  return `
                    <tr>
                      <td class="tabular-nums font-bold">#REC-${p.payment_id}</td>
                      <td class="tabular-nums">${formatDate(p.paid_date)}</td>
                      <td class="tabular-nums">${formatINR(p.fee_paid)}</td>
                      <td class="tabular-nums" style="color: ${Number(p.penalty_paid) > 0 ? 'var(--danger-text)' : 'inherit'};">
                        ${Number(p.penalty_paid) > 0 ? `+${formatINR(p.penalty_paid)}` : '₹0.00'}
                      </td>
                      <td class="tabular-nums font-bold" style="color: var(--success-text);">${formatINR(total)}</td>
                      <td><span class="badge badge-active">${p.payment_mode}</span></td>
                      <td style="font-family: ui-monospace, monospace; font-size: 0.78rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${p.notes || '—'}
                      </td>
                      <td style="text-align: right;">
                        <button 
                          type="button" 
                          class="btn btn-sm btn-secondary" 
                          onclick="openReceiptModal(${p.payment_id})"
                        >
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

    case 'attendance':
      return `
        <div>
          <div style="margin-bottom: 1rem;">
            <h3 style="margin: 0;">Attendance</h3>
          </div>

          ${attendance.length === 0 ? `
            <div class="empty-state" style="padding: 2.5rem 1rem;">
              <div style="font-size: 2rem;">🚪</div>
              <h4>No attendance records found</h4>
              <p style="color: var(--text-muted);">Check-in logs will appear here after visiting the gym.</p>
            </div>
          ` : `
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Log ID</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Method</th>
                    <th>Gate Status</th>
                    <th>Sensor / Turnstile Notes</th>
                  </tr>
                </thead>
                <tbody>
                  ${attendance.map(a => `
                    <tr>
                      <td class="tabular-nums">#${a.attendance_id}</td>
                      <td class="tabular-nums">${formatDate(a.check_in_date)}</td>
                      <td class="tabular-nums font-bold">${a.check_in_time}</td>
                      <td>
                        <span class="badge ${a.method === 'QR Code' ? 'badge-active' : 'badge-pending'}">
                          ${a.method === 'QR Code' ? '📱 QR Code' : '💳 RFID Keyfob'}
                        </span>
                      </td>
                      <td>
                        <span class="badge ${a.status === 'Allowed' ? 'badge-active' : 'badge-overdue'}">
                          ${a.status === 'Allowed' ? '✓ Turnstile Unlocked' : a.status}
                        </span>
                      </td>
                      <td style="font-size: 0.82rem; color: var(--text-muted);">
                        ${a.notes || 'Turnstile Gate A Access'}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      `;

    case 'plan':
      return `
        <div class="plan-details-grid">
          <div class="plan-info-card">
            <span class="plan-badge">CURRENT PLAN</span>
            <h2 style="margin: 0.5rem 0; font-size: 1.6rem; color: var(--text-main);">${plan ? plan.plan_name : 'Standard'}</h2>
            <div style="font-size: 1.35rem; font-weight: 800; color: var(--accent-text); margin-bottom: 1rem;">
              ${plan ? formatINR(plan.monthly_fee) : '—'} <span style="font-size: 0.85rem; font-weight: normal; color: var(--text-muted);">/ month</span>
            </div>

            <div class="plan-specs-list">
              <div class="spec-row">
                <span>Contract Duration:</span>
                <strong>${plan ? plan.duration_months : 12} Months</strong>
              </div>
              <div class="spec-row">
                <span>Membership Start Date:</span>
                <strong>${formatDate(member.join_date)}</strong>
              </div>
              <div class="spec-row">
                <span>Membership Status:</span>
                <span class="badge ${member.status === 'Active' ? 'badge-active' : 'badge-inactive'}">${member.status}</span>
              </div>
              <div class="spec-row">
                <span>Branch Club:</span>
                <strong>Anytime Fitness — Sector 34, Sohna</strong>
              </div>
            </div>
          </div>

          <div class="plan-perks-card">
            <h3 style="margin-bottom: 0.75rem;">Membership Inclusions</h3>
            <ul class="plan-perks-list">
              <li>✓ <strong>24/7/365 Unlimited Access</strong> to training floor and functional turf</li>
              <li>✓ <strong>Anytime Fitness Global Access</strong> at 5,000+ clubs worldwide</li>
              <li>✓ Free initial <strong>InBody Composition Analysis</strong> & consultation</li>
              <li>✓ Private individual shower suites, sanitized lockers & changing rooms</li>
              <li>✓ Complimentary high-speed Wi-Fi & member lounge access</li>
              <li>✓ Anytime Fitness Workouts companion mobile app integration</li>
            </ul>

            <div style="margin-top: 1.5rem; padding: 0.85rem; background: var(--bg-surface); border: 1px solid var(--border); border-radius: 8px; font-size: 0.82rem; color: var(--text-muted);">
              For plan upgrades or personal training inquiries, contact the front desk at <strong>+91 87965 67500</strong>.
            </div>
          </div>
        </div>
      `;

    default:
      return '';
  }
}

/**
 * Handle Switching Member Tabs
 */
export function switchMemberTab(tab) {
  activeMemberTab = tab;
  const container = document.getElementById('view-root');
  if (container) renderMemberPortal(container);
}

/**
 * Simulate turnstile scan from member pass
 */
export function simulateMemberSelfCheckIn(memberId) {
  try {
    const res = store.recordCheckIn({
      member_id: memberId,
      method: 'QR Code',
      notes: 'Member Mobile Pass Self-Scan • Turnstile Gate A'
    });

    if (res.status === 'Allowed') {
      window.showToast?.(`✅ Turnstile Gate A Unlocked! Welcome, ${res.member.full_name}.`, 'success');
    } else {
      window.showToast?.(`⚠️ Gate Alert: ${res.warningMessage}`, 'warning');
    }

    const container = document.getElementById('view-root');
    if (container) renderMemberPortal(container);
  } catch (err) {
    window.showToast?.(err.message, 'error');
  }
}

if (typeof window !== 'undefined') {
  window.switchMemberTab = switchMemberTab;
  window.simulateMemberSelfCheckIn = simulateMemberSelfCheckIn;
}
