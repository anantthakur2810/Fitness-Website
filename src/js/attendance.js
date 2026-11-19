/**
 * Anytime Fitness Sohna — Attendance & Turnstile Management
 * Real-time RFID Card & QR Code gate check-in logging, access control, and analytics.
 */

import { store } from './store.js';
import { formatDate, formatINR } from './penalty.js';
import { generateQRCodeSVG } from './qr.js';

let attendanceDateFilter = 'today'; // 'today' | 'yesterday' | 'week' | 'all'
let attendanceMethodFilter = 'ALL';  // 'ALL' | 'QR Code' | 'RFID Card' | 'Manual'
let attendanceStatusFilter = 'ALL';  // 'ALL' | 'Allowed' | 'Overdue Warning' | 'Blocked'
let attendanceSearch = '';

/**
 * Web Audio API synthesizer for realistic turnstile gate chimes
 */
function playGateSound(type = 'success') {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'success') {
      // Pleasant dual-tone chime (high-speed turnstile unlock)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc1.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08); // A5
      osc2.frequency.setValueAtTime(440.00, ctx.currentTime); // A4
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.36);
      osc2.stop(ctx.currentTime + 0.36);
    } else if (type === 'warning') {
      // Amber alert double beep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(350, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.32);
    } else {
      // Red buzz for blocked/inactive
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.42);
    }
  } catch {
    // AudioContext blocked by browser autoplay policy until user gesture
  }
}

/**
 * Filter and query attendance records
 */
function getFilteredAttendance() {
  const all = store.getAttendance();
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const weekAgoStr = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  return all.filter(att => {
    // Date filter
    if (attendanceDateFilter === 'today' && att.check_in_date !== todayStr) return false;
    if (attendanceDateFilter === 'yesterday' && att.check_in_date !== yesterdayStr) return false;
    if (attendanceDateFilter === 'week' && (att.check_in_date < weekAgoStr || att.check_in_date > todayStr)) return false;

    // Method filter
    if (attendanceMethodFilter !== 'ALL' && att.method !== attendanceMethodFilter) return false;

    // Status filter
    if (attendanceStatusFilter !== 'ALL' && att.status !== attendanceStatusFilter) return false;

    // Search query
    if (attendanceSearch.trim()) {
      const q = attendanceSearch.toLowerCase().trim();
      const member = store.getMember(att.member_id);
      const memberName = (member ? member.full_name : '').toLowerCase();
      const memberPhone = (member ? member.phone : '').toLowerCase();
      const notes = (att.notes || '').toLowerCase();
      const time = (att.check_in_time || '').toLowerCase();
      const idMatch = String(att.member_id).includes(q) || String(att.attendance_id).includes(q);

      if (!memberName.includes(q) && !memberPhone.includes(q) && !notes.includes(q) && !time.includes(q) && !idMatch) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Computes live attendance metrics
 */
function getAttendanceMetrics() {
  const all = store.getAttendance();
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntries = all.filter(a => a.check_in_date === todayStr);

  const qrCount = todayEntries.filter(a => a.method === 'QR Code').length;
  const cardCount = todayEntries.filter(a => a.method === 'RFID Card').length;
  const manualCount = todayEntries.filter(a => a.method === 'Manual').length;
  const warningCount = todayEntries.filter(a => a.status === 'Overdue Warning' || a.status === 'Blocked').length;

  // Active inside gym: entries in the last 2 hours (or recent today check-ins)
  const now = new Date();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();

  const activeInGym = todayEntries.filter(a => {
    if (a.status === 'Blocked') return false;
    const parts = (a.check_in_time || '00:00:00').split(':').map(Number);
    const entryHour = parts[0] || 0;
    const entryMin = parts[1] || 0;
    const diffMins = (currentHour - entryHour) * 60 + (currentMin - entryMin);
    // Checked in within past 120 minutes, or at least 1-3 active members
    return diffMins >= 0 && diffMins <= 150;
  }).length;

  return {
    todayTotal: todayEntries.length,
    activeInGym: Math.max(activeInGym, todayEntries.length > 0 ? Math.min(todayEntries.length, 4) : 0),
    qrCount,
    cardCount,
    manualCount,
    warningCount,
    totalRecords: all.length
  };
}

/**
 * Render the Main Attendance View
 */
export function renderAttendanceView(container) {
  const metrics = getAttendanceMetrics();
  const records = getFilteredAttendance();

  container.innerHTML = `
    <div class="view-header">
      <div>
        <h1 class="view-title">Gate Attendance & Turnstile Monitor</h1>
        <p class="view-subtitle">Anytime Fitness Sohna — Live RFID smart card taps, QR mobile pass scans, and member entry logs</p>
      </div>
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
        <button type="button" class="btn btn-secondary" onclick="exportAttendanceCSV()">
          📥 Export CSV
        </button>
        <button type="button" class="btn btn-primary" onclick="openGateCheckInModal()">
          ⚡ + Gate Check-In
        </button>
      </div>
    </div>

    <!-- Live Gate Status Alert -->
    <div class="gate-status-bar">
      <div class="gate-status-left">
        <span class="gate-indicator-dot"></span>
        <span class="gate-indicator-title">TURNSTILES OPERATIONAL</span>
        <span class="gate-indicator-meta">Turnstile A (Main Entry) & Turnstile B (East Wing) Active</span>
      </div>
      <div class="gate-status-right">
        <span class="gate-fast-stat">⚡ 24/7 Smart Access Active</span>
      </div>
    </div>

    <!-- Metrics Row -->
    <div class="metrics-row">
      <div class="metric-card">
        <div class="metric-label">Today's Check-Ins</div>
        <div class="metric-val tabular-nums">${metrics.todayTotal}</div>
        <div class="metric-sub">${metrics.qrCount} QR Passes • ${metrics.cardCount} RFID Cards</div>
      </div>

      <div class="metric-card">
        <div class="metric-label">Estimated Inside Gym</div>
        <div class="metric-val tabular-nums" style="color: var(--accent-text);">
          ${metrics.activeInGym}
        </div>
        <div class="metric-sub">Active workout session (past 2.5 hrs)</div>
      </div>

      <div class="metric-card">
        <div class="metric-label">Access Method Split</div>
        <div class="metric-val tabular-nums" style="font-size: 1.15rem; display: flex; gap: 0.6rem; align-items: baseline;">
          <span>📱 ${metrics.qrCount}</span>
          <span style="color: var(--text-muted); font-size: 0.9rem;">/</span>
          <span>💳 ${metrics.cardCount}</span>
          <span style="color: var(--text-muted); font-size: 0.9rem;">/</span>
          <span style="font-size: 0.9rem; color: var(--text-muted);">✍️ ${metrics.manualCount}</span>
        </div>
        <div class="metric-sub">QR Code / RFID Keyfob / Front Desk</div>
      </div>

      <div class="metric-card">
        <div class="metric-label">Flagged / Overdue Alerts</div>
        <div class="metric-val tabular-nums" style="color: ${metrics.warningCount > 0 ? 'var(--warning-text)' : 'inherit'};">
          ${metrics.warningCount}
        </div>
        <div class="metric-sub">${metrics.warningCount > 0 ? 'Late fee or inactive pass flagged' : 'Zero access anomalies today'}</div>
      </div>
    </div>

    <!-- Controls Bar -->
    <div class="table-controls">
      <div class="search-wrap">
        <input 
          type="text" 
          class="search-input" 
          id="att-search" 
          placeholder="Search by member name, ID, phone, turnstile..." 
          value="${attendanceSearch}"
        />
      </div>

      <div class="filters-wrap" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <!-- Date Filter -->
        <select class="filter-select" id="att-date-filter">
          <option value="today" ${attendanceDateFilter === 'today' ? 'selected' : ''}>📅 Today</option>
          <option value="yesterday" ${attendanceDateFilter === 'yesterday' ? 'selected' : ''}>📅 Yesterday</option>
          <option value="week" ${attendanceDateFilter === 'week' ? 'selected' : ''}>📅 Past 7 Days</option>
          <option value="all" ${attendanceDateFilter === 'all' ? 'selected' : ''}>📅 All Time (${metrics.totalRecords})</option>
        </select>

        <!-- Method Filter -->
        <select class="filter-select" id="att-method-filter">
          <option value="ALL" ${attendanceMethodFilter === 'ALL' ? 'selected' : ''}>All Methods</option>
          <option value="QR Code" ${attendanceMethodFilter === 'QR Code' ? 'selected' : ''}>📱 QR Code</option>
          <option value="RFID Card" ${attendanceMethodFilter === 'RFID Card' ? 'selected' : ''}>💳 RFID Card</option>
          <option value="Manual" ${attendanceMethodFilter === 'Manual' ? 'selected' : ''}>✍️ Manual</option>
        </select>

        <!-- Status Filter -->
        <select class="filter-select" id="att-status-filter">
          <option value="ALL" ${attendanceStatusFilter === 'ALL' ? 'selected' : ''}>All Statuses</option>
          <option value="Allowed" ${attendanceStatusFilter === 'Allowed' ? 'selected' : ''}>Allowed (Normal)</option>
          <option value="Overdue Warning" ${attendanceStatusFilter === 'Overdue Warning' ? 'selected' : ''}>⚠️ Overdue Warning</option>
          <option value="Blocked" ${attendanceStatusFilter === 'Blocked' ? 'selected' : ''}>⛔ Blocked / Inactive</option>
        </select>

        ${(attendanceSearch || attendanceDateFilter !== 'today' || attendanceMethodFilter !== 'ALL' || attendanceStatusFilter !== 'ALL') ? `
          <button type="button" class="btn btn-sm btn-secondary" id="att-reset-filters" title="Reset all filters">
            Reset Filters
          </button>
        ` : ''}
      </div>
    </div>

    <!-- Attendance Table -->
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Time & Date</th>
            <th>Member Details</th>
            <th>Plan Tier</th>
            <th>Method</th>
            <th>Access Status</th>
            <th>Turnstile / Location</th>
            <th style="text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${records.length === 0 ? `
            <tr>
              <td colspan="7" class="empty-state">
                <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">📋</div>
                <div>No attendance records match the selected filters.</div>
                <button type="button" class="btn btn-sm btn-secondary" style="margin-top: 0.75rem;" onclick="openGateCheckInModal()">
                  + Check In a Member
                </button>
              </td>
            </tr>
          ` : records.map(att => {
            const member = store.getMember(att.member_id);
            const plan = member ? store.getPlan(member.plan_id) : null;
            const initials = member ? member.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'AF';

            let methodBadgeClass = 'method-qr';
            let methodIcon = '📱';
            if (att.method === 'RFID Card') {
              methodBadgeClass = 'method-rfid';
              methodIcon = '💳';
            } else if (att.method === 'Manual') {
              methodBadgeClass = 'method-manual';
              methodIcon = '✍️';
            }

            let statusBadgeClass = 'badge-active';
            let statusIcon = '✅';
            if (att.status === 'Overdue Warning') {
              statusBadgeClass = 'badge-warning';
              statusIcon = '⚠️';
            } else if (att.status === 'Blocked') {
              statusBadgeClass = 'badge-danger';
              statusIcon = '⛔';
            }

            return `
              <tr>
                <td>
                  <div class="tabular-nums font-bold" style="font-size: 0.95rem; color: var(--text-main);">
                    ${att.check_in_time}
                  </div>
                  <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem;">
                    ${formatDate(att.check_in_date)}
                  </div>
                </td>
                <td>
                  ${member ? `
                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                      <div class="member-mini-avatar">${initials}</div>
                      <div>
                        <a href="#" class="member-link" onclick="openMemberProfileModal(${member.member_id}); return false;">
                          ${member.full_name}
                        </a>
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem;">
                          #${member.member_id} • ${member.phone}
                        </div>
                      </div>
                    </div>
                  ` : `
                    <span style="color: var(--text-muted);">Member #${att.member_id} (Removed)</span>
                  `}
                </td>
                <td>
                  <span style="font-size: 0.85rem; font-weight: 500;">
                    ${plan ? plan.plan_name : 'Standard'}
                  </span>
                </td>
                <td>
                  <span class="attendance-method-badge ${methodBadgeClass}">
                    <span>${methodIcon}</span>
                    <span>${att.method}</span>
                  </span>
                </td>
                <td>
                  <span class="badge ${statusBadgeClass}" style="display: inline-flex; align-items: center; gap: 0.35rem;">
                    <span>${statusIcon}</span>
                    <span>${att.status}</span>
                  </span>
                </td>
                <td>
                  <span style="font-size: 0.85rem; color: var(--text-secondary);">
                    ${att.notes || 'Turnstile A'}
                  </span>
                </td>
                <td style="text-align: right;">
                  <div style="display: inline-flex; gap: 0.35rem;">
                    ${member ? `
                      <button 
                        type="button" 
                        class="btn btn-sm btn-secondary" 
                        onclick="openMemberProfileModal(${member.member_id})" 
                        title="View Member Pass & History"
                      >
                        Pass
                      </button>
                    ` : ''}
                    <button 
                      type="button" 
                      class="btn btn-sm btn-secondary" 
                      style="color: var(--danger-text);" 
                      onclick="confirmDeleteAttendance(${att.attendance_id})" 
                      title="Delete Entry"
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Attach control listeners
  const searchInput = document.getElementById('att-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      attendanceSearch = e.target.value;
      renderAttendanceView(container);
      const reFocus = document.getElementById('att-search');
      if (reFocus) {
        reFocus.focus();
        reFocus.setSelectionRange(reFocus.value.length, reFocus.value.length);
      }
    });
  }

  const dateSelect = document.getElementById('att-date-filter');
  if (dateSelect) {
    dateSelect.addEventListener('change', (e) => {
      attendanceDateFilter = e.target.value;
      renderAttendanceView(container);
    });
  }

  const methodSelect = document.getElementById('att-method-filter');
  if (methodSelect) {
    methodSelect.addEventListener('change', (e) => {
      attendanceMethodFilter = e.target.value;
      renderAttendanceView(container);
    });
  }

  const statusSelect = document.getElementById('att-status-filter');
  if (statusSelect) {
    statusSelect.addEventListener('change', (e) => {
      attendanceStatusFilter = e.target.value;
      renderAttendanceView(container);
    });
  }

  const resetBtn = document.getElementById('att-reset-filters');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      attendanceDateFilter = 'today';
      attendanceMethodFilter = 'ALL';
      attendanceStatusFilter = 'ALL';
      attendanceSearch = '';
      renderAttendanceView(container);
    });
  }
}

/**
 * Gate Check-In Terminal Modal
 * Allows front desk admin to simulate RFID tap or QR pass scan with immediate feedback
 */
export function openGateCheckInModal(preselectedMemberId = null) {
  const members = store.getMembers();
  const dialog = document.getElementById('modal-generic');
  if (!dialog) return;

  const defaultMember = preselectedMemberId
    ? store.getMember(preselectedMemberId)
    : members.find(m => m.status === 'Active') || members[0];

  const nowTime = new Date().toTimeString().split(' ')[0];
  const todayDate = new Date().toISOString().split('T')[0];

  dialog.innerHTML = `
    <div class="modal-head">
      <div style="display: flex; align-items: center; gap: 0.6rem;">
        <span class="gate-live-pulse"></span>
        <span class="modal-head-title">Gate Check-In Terminal</span>
      </div>
      <button type="button" class="btn btn-sm btn-secondary" onclick="closeModal()">✕</button>
    </div>

    <div class="modal-body-content" style="max-height: 82vh; overflow-y: auto;">
      <!-- Terminal Mode Switcher -->
      <div class="terminal-tab-bar">
        <button type="button" class="terminal-tab active" id="tab-rfid" onclick="switchTerminalTab('rfid')">
          💳 RFID Card / Manual Lookup
        </button>
        <button type="button" class="terminal-tab" id="tab-qr" onclick="switchTerminalTab('qr')">
          📱 QR Pass Scanner
        </button>
      </div>

      <!-- Tab 1: RFID & Member Select -->
      <div id="terminal-rfid-panel">
        <div class="form-field">
          <label for="checkin-member-select">Select Member (Search by Name, Phone, or ID)</label>
          <select id="checkin-member-select" class="form-control" onchange="updateTerminalMemberPreview(this.value)">
            ${members.map(m => `
              <option value="${m.member_id}" ${defaultMember && defaultMember.member_id === m.member_id ? 'selected' : ''}>
                #${m.member_id} — ${m.full_name} (${m.phone}) [${m.status}]
              </option>
            `).join('')}
          </select>
        </div>

        <!-- Real-time Member Status Preview Card -->
        <div id="terminal-member-preview" class="terminal-member-preview-card"></div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 0.5rem;">
          <div class="form-field">
            <label for="checkin-method-select">Check-In Method</label>
            <select id="checkin-method-select">
              <option value="RFID Card" selected>💳 RFID Smart Card / Band</option>
              <option value="QR Code">📱 QR Code Mobile Pass</option>
              <option value="Manual">✍️ Manual Desk Sign-In</option>
            </select>
          </div>

          <div class="form-field">
            <label for="checkin-gate-select">Turnstile Gate</label>
            <select id="checkin-gate-select">
              <option value="Turnstile A (Main Entry)" selected>Turnstile A (Main Entry)</option>
              <option value="Turnstile B (East Wing)">Turnstile B (East Wing)</option>
              <option value="Turnstile C (Studio / VIP)">Turnstile C (Studio / VIP)</option>
              <option value="Front Desk Manual">Front Desk Manual</option>
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
          <div class="form-field">
            <label for="checkin-date">Date</label>
            <input type="date" id="checkin-date" value="${todayDate}" />
          </div>
          <div class="form-field">
            <label for="checkin-time">Time</label>
            <input type="text" id="checkin-time" value="${nowTime}" />
          </div>
        </div>
      </div>

      <!-- Tab 2: Interactive QR Scanner Simulator -->
      <div id="terminal-qr-panel" style="display: none;">
        <div class="qr-scanner-viewport">
          <div class="qr-scanner-laser"></div>
          <div class="qr-scanner-corners"></div>
          <div class="qr-scanner-content">
            <div id="qr-scan-svg-target"></div>
            <div class="qr-scanner-hint">Simulate scanning digital member pass</div>
          </div>
        </div>

        <div style="margin-top: 0.75rem;">
          <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem;">
            Instant Scan Quick-Select:
          </div>
          <div class="qr-quick-list">
            ${members.slice(0, 6).map(m => `
              <button 
                type="button" 
                class="qr-quick-btn" 
                onclick="simulateQuickQRScan(${m.member_id})"
              >
                <span>${m.status === 'Active' ? '🟢' : '🔴'}</span>
                <span>${m.full_name} (#${m.member_id})</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Live Gate Turnstile Visual Feedback Container -->
      <div id="turnstile-feedback" class="turnstile-feedback-box" style="display: none;"></div>
    </div>

    <div class="modal-foot">
      <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button type="button" class="btn btn-primary" id="btn-submit-checkin" onclick="processTerminalCheckIn()">
        ⚡ Tap & Open Turnstile
      </button>
    </div>
  `;

  // Attach helper functions to window for the dialog
  window.switchTerminalTab = function (tab) {
    const rfidTab = document.getElementById('tab-rfid');
    const qrTab = document.getElementById('tab-qr');
    const rfidPanel = document.getElementById('terminal-rfid-panel');
    const qrPanel = document.getElementById('terminal-qr-panel');
    const submitBtn = document.getElementById('btn-submit-checkin');

    if (tab === 'rfid') {
      rfidTab?.classList.add('active');
      qrTab?.classList.remove('active');
      if (rfidPanel) rfidPanel.style.display = 'block';
      if (qrPanel) qrPanel.style.display = 'none';
      if (submitBtn) submitBtn.style.display = 'inline-block';
    } else {
      rfidTab?.classList.remove('active');
      qrTab?.classList.add('active');
      if (rfidPanel) rfidPanel.style.display = 'none';
      if (qrPanel) qrPanel.style.display = 'block';
      if (submitBtn) submitBtn.style.display = 'none';

      // Load initial QR preview
      const sel = document.getElementById('checkin-member-select');
      const memId = sel ? Number(sel.value) : 101;
      window.simulateQuickQRScan(memId, false);
    }
  };

  window.updateTerminalMemberPreview = function (memberId) {
    const mem = store.getMember(Number(memberId));
    const target = document.getElementById('terminal-member-preview');
    if (!target || !mem) return;

    const plan = store.getPlan(mem.plan_id);
    const dues = store.getFeeDues().filter(d => d.member_id === mem.member_id && d.status === 'Pending');
    const totalPending = dues.reduce((s, d) => s + Number(d.fee_amount), 0);

    let statusHtml = '';
    if (mem.status === 'Inactive') {
      statusHtml = `<div class="terminal-alert danger">⛔ Member is marked INACTIVE. Turnstile will lock.</div>`;
    } else if (dues.length > 0) {
      statusHtml = `<div class="terminal-alert warning">⚠️ Member has ₹${totalPending.toLocaleString('en-IN')} pending fee. Overdue warning will flag.</div>`;
    } else {
      statusHtml = `<div class="terminal-alert success">✅ Account in Good Standing. Turnstile access approved.</div>`;
    }

    target.innerHTML = `
      <div class="terminal-preview-grid">
        <div>
          <span class="preview-label">Member</span>
          <div class="preview-value">${mem.full_name}</div>
        </div>
        <div>
          <span class="preview-label">Plan Tier</span>
          <div class="preview-value">${plan ? plan.plan_name : 'Standard'}</div>
        </div>
        <div>
          <span class="preview-label">Phone</span>
          <div class="preview-value">${mem.phone}</div>
        </div>
        <div>
          <span class="preview-label">Status</span>
          <div class="preview-value"><span class="badge badge-${mem.status.toLowerCase()}">${mem.status}</span></div>
        </div>
      </div>
      ${statusHtml}
    `;
  };

  window.simulateQuickQRScan = function (memberId, autoSubmit = true) {
    const mem = store.getMember(Number(memberId));
    if (!mem) return;

    const svgTarget = document.getElementById('qr-scan-svg-target');
    if (svgTarget) {
      svgTarget.innerHTML = generateQRCodeSVG(
        `AF-SOHNA:MEMBER:${mem.member_id}:${mem.phone}:${mem.full_name}`,
        { size: 140, color: '#09090b', bgColor: '#ffffff', quietZone: 1 }
      );
    }

    // Update select in background
    const sel = document.getElementById('checkin-member-select');
    if (sel) sel.value = String(mem.member_id);
    window.updateTerminalMemberPreview(mem.member_id);

    if (autoSubmit) {
      const gateSelect = document.getElementById('checkin-gate-select');
      const gate = gateSelect ? gateSelect.value : 'Turnstile A (Main Entry)';
      processDirectCheckIn(mem.member_id, 'QR Code', `${gate} - QR Mobile Scan`);
    }
  };

  window.processTerminalCheckIn = function () {
    const memberSelect = document.getElementById('checkin-member-select');
    const methodSelect = document.getElementById('checkin-method-select');
    const gateSelect = document.getElementById('checkin-gate-select');
    const dateInput = document.getElementById('checkin-date');
    const timeInput = document.getElementById('checkin-time');

    if (!memberSelect) return;
    const memberId = Number(memberSelect.value);
    const method = methodSelect ? methodSelect.value : 'RFID Card';
    const gate = gateSelect ? gateSelect.value : 'Turnstile A (Main Entry)';
    const date = dateInput ? dateInput.value : '';
    const time = timeInput ? timeInput.value : '';

    processDirectCheckIn(memberId, method, gate, date, time);
  };

  function processDirectCheckIn(memberId, method, notes, date, time) {
    try {
      const result = store.recordCheckIn({
        member_id: memberId,
        method,
        notes,
        check_in_date: date,
        check_in_time: time
      });

      const feedbackBox = document.getElementById('turnstile-feedback');
      if (feedbackBox) {
        feedbackBox.style.display = 'block';

        if (result.status === 'Blocked') {
          playGateSound('blocked');
          feedbackBox.className = 'turnstile-feedback-box blocked';
          feedbackBox.innerHTML = `
            <div class="feedback-icon">⛔</div>
            <div>
              <div class="feedback-title">TURNSTILE LOCKED — ACCESS DENIED</div>
              <div class="feedback-desc">${result.warningMessage}</div>
            </div>
          `;
          window.showToast(`⛔ Access Denied: ${result.member.full_name} is inactive`, 'error');
        } else if (result.status === 'Overdue Warning') {
          playGateSound('warning');
          feedbackBox.className = 'turnstile-feedback-box warning';
          feedbackBox.innerHTML = `
            <div class="feedback-icon">⚠️</div>
            <div>
              <div class="feedback-title">TURNSTILE UNLOCKED — OVERDUE WARNING</div>
              <div class="feedback-desc">Welcome, ${result.member.full_name}! ${result.warningMessage}</div>
            </div>
          `;
          window.showToast(`⚠️ Turnstile Unlocked (Overdue Warning): ${result.member.full_name}`, 'info');
        } else {
          playGateSound('success');
          feedbackBox.className = 'turnstile-feedback-box success';
          feedbackBox.innerHTML = `
            <div class="feedback-icon">🔓</div>
            <div>
              <div class="feedback-title">TURNSTILE UNLOCKED — ACCESS GRANTED</div>
              <div class="feedback-desc">Welcome to Anytime Fitness Sohna, ${result.member.full_name}! (Method: ${method})</div>
            </div>
          `;
          window.showToast(`✅ Turnstile Unlocked: Welcome, ${result.member.full_name}!`, 'success');
        }
      }

      // Close after 1.8 seconds so admin can see gate feedback
      setTimeout(() => {
        closeModal();
      }, 1800);
    } catch (err) {
      window.showToast(err.message, 'error');
    }
  }

  // Initialize preview
  if (defaultMember) {
    window.updateTerminalMemberPreview(defaultMember.member_id);
  }

  dialog.showModal();
}

if (typeof window !== 'undefined') {
  window.openGateCheckInModal = openGateCheckInModal;

  /**
   * Confirm and delete single attendance record
   */
  window.confirmDeleteAttendance = function (attendanceId) {
    if (confirm(`Are you sure you want to delete Attendance Log #${attendanceId}?`)) {
      store.deleteAttendance(attendanceId);
      window.showToast?.(`Attendance entry #${attendanceId} removed`, 'info');
    }
  };

  /**
   * Export current attendance records to downloadable CSV
   */
  window.exportAttendanceCSV = function () {
    const records = getFilteredAttendance();
    if (records.length === 0) {
      window.showToast?.('No attendance records to export.', 'error');
      return;
    }

    const headers = [
      'Attendance ID',
      'Date',
      'Time',
      'Member ID',
      'Member Name',
      'Phone',
      'Plan Tier',
      'Method',
      'Access Status',
      'Turnstile / Notes'
    ];

    const rows = records.map(att => {
      const member = store.getMember(att.member_id);
      const plan = member ? store.getPlan(member.plan_id) : null;

      return [
        att.attendance_id,
        att.check_in_date,
        att.check_in_time,
        att.member_id,
        `"${(member ? member.full_name : '').replace(/"/g, '""')}"`,
        `"${(member ? member.phone : '').replace(/"/g, '""')}"`,
        `"${(plan ? plan.plan_name : '').replace(/"/g, '""')}"`,
        `"${att.method}"`,
        `"${att.status}"`,
        `"${(att.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anytime_fitness_attendance_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    window.showToast?.(`Exported ${records.length} attendance records to CSV!`, 'success');
  };
}
