/**
 * Anytime Fitness Sohna — Member Management System
 * Operations, Home landing page, automated recurring billing, late fee calculation, and payment processing
 */

import { store } from './store.js';
import { calculateDuePenalty, formatINR, formatDate, getOverviewMetrics, generateWhatsAppReminderUrl } from './penalty.js';
import { renderHome, cleanupHomeEffects } from './home.js';
import { renderAttendanceView, openGateCheckInModal } from './attendance.js';
import { renderDigitalMemberPass } from './qr.js';
import { openRazorpayCheckout } from './razorpay.js';
import { auth, openAuthModal, handleLogout } from './auth.js';
import { renderMemberPortal } from './memberPortal.js';
import { CONFIG } from './config.js';

let activeView = 'home';
let memberSearch = '';
let memberFilter = 'ALL';
let memberSort = 'id';

let duesFilter = 'ALL';
let duesSearch = '';

let paymentsFilterMode = 'ALL';
let paymentsSearch = '';

// Theme Cycling Engine (No menu bar - clicking the theme icon cycles themes directly)
const THEMES = [
  { id: 'theme-dark', name: 'Dark Obsidian', icon: '🌙' },
  { id: 'theme-purple', name: 'Anytime Purple', icon: '🟣' },
  { id: 'theme-light', name: 'Studio Light', icon: '☀️' },
  { id: 'theme-emerald', name: 'Cyber Emerald', icon: '⚡' }
];

let currentThemeIndex = 0;

export function init() {
  const container = document.getElementById('view-root');
  const navRoot = document.getElementById('nav-links-root');
  const headerActionsRoot = document.getElementById('header-actions-root');

  // Apply configurable brand text from env if present
  const brandNameEl = document.querySelector('.brand-name');
  const brandBranchEl = document.querySelector('.brand-branch');
  if (brandNameEl) brandNameEl.textContent = CONFIG.gymName;
  if (brandBranchEl) brandBranchEl.textContent = CONFIG.gymBranch;

  // Initialize theme from localStorage (falling back to VITE_DEFAULT_THEME)
  const savedTheme = localStorage.getItem('af_theme') || CONFIG.defaultTheme;
  const foundIdx = THEMES.findIndex(t => t.id === savedTheme);
  if (foundIdx !== -1) currentThemeIndex = foundIdx;

  function applyTheme(idx, notify = false) {
    const theme = THEMES[idx];
    document.documentElement.className = theme.id;
    localStorage.setItem('af_theme', theme.id);
    const iconEl = document.getElementById('theme-icon');
    if (iconEl) iconEl.textContent = theme.icon;
    const btnEl = document.getElementById('theme-btn');
    if (btnEl) btnEl.title = `Current Theme: ${theme.name} (Click to switch)`;
    if (notify) showToast(`Theme: ${theme.name}`, 'info');
  }

  applyTheme(currentThemeIndex, false);

  window.cycleAppTheme = function () {
    currentThemeIndex = (currentThemeIndex + 1) % THEMES.length;
    applyTheme(currentThemeIndex, true);
    renderHeader();
  };

  function renderHeader() {
    const role = auth.getRole();
    const currentTheme = THEMES[currentThemeIndex];

    const themeButtonHtml = `
      <button 
        type="button" 
        class="btn-theme-toggle" 
        id="theme-btn" 
        title="Current Theme: ${currentTheme.name} (Click to switch)" 
        aria-label="Toggle visual theme"
        onclick="window.cycleAppTheme()"
      >
        <span id="theme-icon">${currentTheme.icon}</span>
      </button>
    `;

    if (role === 'admin') {
      if (navRoot) {
        navRoot.innerHTML = `
          <button type="button" class="nav-btn ${activeView === 'home' ? 'active' : ''}" onclick="window.navigate('home')">Home</button>
          <button type="button" class="nav-btn ${activeView === 'dashboard' ? 'active' : ''}" onclick="window.navigate('dashboard')">Overview</button>
          <button type="button" class="nav-btn ${activeView === 'members' ? 'active' : ''}" onclick="window.navigate('members')">Members</button>
          <button type="button" class="nav-btn ${activeView === 'plans' ? 'active' : ''}" onclick="window.navigate('plans')">Plans</button>
          <button type="button" class="nav-btn ${activeView === 'attendance' ? 'active' : ''}" onclick="window.navigate('attendance')">Attendance</button>
          <button type="button" class="nav-btn ${activeView === 'dues' ? 'active' : ''}" onclick="window.navigate('dues')">Fee Dues</button>
          <button type="button" class="nav-btn ${activeView === 'payments' ? 'active' : ''}" onclick="window.navigate('payments')">Payments</button>
          <button type="button" class="nav-btn ${activeView === 'settings' ? 'active' : ''}" onclick="window.navigate('settings')">Settings</button>
        `;
      }
      if (headerActionsRoot) {
        headerActionsRoot.innerHTML = `
          ${themeButtonHtml}
          <div class="auth-role-tag admin-tag" title="Signed in as Administrator">
            <span class="role-tag-dot"></span>
            <span>Admin Console</span>
          </div>
          <button type="button" class="btn btn-sm btn-primary" onclick="openAddMemberModal()">+ Member</button>
          <button type="button" class="btn btn-sm btn-secondary" onclick="handleLogout()" title="Sign Out of Admin Console">Sign Out</button>
        `;
      }
    } else if (role === 'member') {
      const member = auth.getCurrentMember() || auth.getSession().user;
      const memFirstName = member ? member.full_name.split(' ')[0] : 'Member';

      if (navRoot) {
        navRoot.innerHTML = `
          <button type="button" class="nav-btn ${activeView === 'home' ? 'active' : ''}" onclick="window.navigate('home')">Home</button>
          <button type="button" class="nav-btn ${activeView === 'member-portal' ? 'active' : ''}" onclick="window.navigate('member-portal')">Member Portal</button>
        `;
      }
      if (headerActionsRoot) {
        headerActionsRoot.innerHTML = `
          ${themeButtonHtml}
          <button type="button" class="auth-role-tag member-tag" onclick="window.navigate('member-portal')" title="View Your Member Profile">
            <span class="role-tag-dot" style="background: #22c55e;"></span>
            <span>${memFirstName} (#${member ? member.member_id : ''})</span>
          </button>
          <button type="button" class="btn btn-sm btn-secondary" onclick="handleLogout()" title="Sign Out of Member Portal">Sign Out</button>
        `;
      }
    } else {
      // Guest / Visitor Header (Public Only)
      if (navRoot) {
        navRoot.innerHTML = `
          <button type="button" class="nav-btn ${activeView === 'home' ? 'active' : ''}" onclick="window.navigate('home')">Home</button>
          <button type="button" class="nav-btn" onclick="window.scrollToHomeSection('home-facilities')">Facilities</button>
          <button type="button" class="nav-btn" onclick="window.scrollToHomeSection('home-tour')">Virtual Tour</button>
          <button type="button" class="nav-btn" onclick="window.scrollToHomeSection('home-plans')">Membership Plans</button>
          <button type="button" class="nav-btn" onclick="window.scrollToHomeSection('home-location')">Location & Hours</button>
        `;
      }
      if (headerActionsRoot) {
        headerActionsRoot.innerHTML = `
          ${themeButtonHtml}
          <button type="button" class="btn btn-sm btn-secondary btn-portal-login" onclick="openAuthModal('member')" title="Member Sign In">
            Member Sign In
          </button>
          <button type="button" class="btn btn-sm btn-primary btn-admin-login" onclick="openAuthModal('admin')" title="Gym Staff / Management">
            Admin Portal
          </button>
        `;
      }
    }
  }

  function render() {
    renderHeader();

    if (activeView !== 'home') {
      cleanupHomeEffects();
    }

    switch (activeView) {
      case 'home':
        renderHome(container);
        break;
      case 'member-portal':
        renderMemberPortal(container);
        break;
      case 'dashboard':
        renderDashboard(container);
        break;
      case 'members':
        renderMembers(container);
        break;
      case 'plans':
        renderPlans(container);
        break;
      case 'attendance':
        renderAttendanceView(container);
        break;
      case 'dues':
        renderFeeDues(container);
        break;
      case 'payments':
        renderPayments(container);
        break;
      case 'settings':
        renderSettings(container);
        break;
      default:
        renderHome(container);
    }
  }

  window.navigate = function (view) {
    const role = auth.getRole();

    // Home is public for everyone without login
    if (view === 'home') {
      activeView = 'home';
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Member portal requires Member login
    if (view === 'member-portal') {
      if (role !== 'member') {
        showToast('Member login required to access Member Portal.', 'info');
        openAuthModal('member');
        return;
      }
      activeView = 'member-portal';
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Admin views require Admin login
    const adminViews = ['dashboard', 'members', 'plans', 'attendance', 'dues', 'payments', 'settings'];
    if (adminViews.includes(view)) {
      if (role !== 'admin') {
        showToast('Admin authentication required for management console.', 'warning');
        openAuthModal('admin');
        return;
      }
      activeView = view;
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    activeView = 'home';
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  window.scrollToHomeSection = function (sectionId) {
    if (activeView !== 'home') {
      activeView = 'home';
      render();
    }
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
  };

  store.subscribe(render);
  auth.subscribe(() => {
    // If logged out from a protected view, return to home
    const role = auth.getRole();
    if (role === 'guest' && activeView !== 'home') {
      activeView = 'home';
    } else if (role === 'member' && activeView !== 'home' && activeView !== 'member-portal') {
      activeView = 'member-portal';
    }
    render();
  });

  render();
}

// ==========================================
// 1. DASHBOARD VIEW
// ==========================================
function renderDashboard(container) {
  const metrics = getOverviewMetrics();
  const outstandingDues = store.getFeeDues().filter(d => d.status === 'Pending');
  const recentPayments = store.getPayments().slice(0, 5);

  container.innerHTML = `
    <div class="view-header">
      <div>
        <h1 class="view-title">Overview</h1>
        <p class="view-subtitle">Club performance and daily operations</p>
      </div>
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button type="button" class="btn btn-secondary" onclick="openGateCheckInModal()">Gate Check-In</button>
        <button type="button" class="btn btn-secondary" onclick="openAddMemberModal()">+ Add Member</button>
        <button type="button" class="btn btn-primary" onclick="openAddDueModal()">+ Create Fee Due</button>
      </div>
    </div>

    <!-- Metrics Row -->
    <div class="metrics-row">
      <div class="metric-card">
        <div class="metric-label">Active Members</div>
        <div class="metric-val tabular-nums">
          ${metrics.activeMembers} 
          <span style="font-size: 1rem; color: var(--text-muted); font-weight: 500;">/ ${metrics.totalMembers}</span>
        </div>
        <div class="metric-sub">${metrics.inactiveMembers} inactive (${((metrics.activeMembers / (metrics.totalMembers || 1)) * 100).toFixed(0)}% retention rate)</div>
      </div>

      <div class="metric-card">
        <div class="metric-label">Total Revenue Collected</div>
        <div class="metric-val tabular-nums" style="color: var(--accent-text);">
          ${formatINR(metrics.totalRevenue)}
        </div>
        <div class="metric-sub">${metrics.paymentsCount} settled transactions (${formatINR(metrics.totalPenaltyCollected)} late penalties)</div>
      </div>

      <div class="metric-card">
        <div class="metric-label">Outstanding Base Fees</div>
        <div class="metric-val tabular-nums" style="color: ${metrics.pendingDuesTotal > 0 ? 'var(--warning-text)' : 'var(--text-main)'};">
          ${formatINR(metrics.pendingDuesTotal)}
        </div>
        <div class="metric-sub">${outstandingDues.length} outstanding dues to collect</div>
      </div>

      <div class="metric-card">
        <div class="metric-label">Accrued Late Penalties</div>
        <div class="metric-val tabular-nums" style="color: ${metrics.pendingPenaltiesTotal > 0 ? 'var(--danger-text)' : 'var(--text-main)'};">
          ${formatINR(metrics.pendingPenaltiesTotal)}
        </div>
        <div class="metric-sub">${metrics.overdueDuesCount} dues past grace period</div>
      </div>
    </div>

    <!-- Collection Efficiency Progress Bar -->
    <div class="efficiency-banner">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);">Fee Collection Efficiency</span>
        <span style="font-size: 0.95rem; font-weight: 800; color: var(--accent-text);">${metrics.collectionEfficiency}%</span>
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" style="width: ${metrics.collectionEfficiency}%;"></div>
      </div>
    </div>

    <!-- Active Outstanding Dues Table -->
    <div class="table-card">
      <div class="table-toolbar">
        <div>
          <span class="table-toolbar-title">Active Fee Dues</span>
          <span class="badge badge-pending" style="margin-left: 0.5rem;">${outstandingDues.length} Pending</span>
        </div>
        <button type="button" class="btn btn-sm btn-secondary" onclick="window.navigate('dues')">Manage Dues →</button>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Due Date</th>
              <th>Base Fee</th>
              <th>Late Penalty</th>
              <th>Total Payable</th>
              <th>Overdue Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${outstandingDues.length === 0 ? `
              <tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">No outstanding dues.</td></tr>
            ` : outstandingDues.map(d => {
              const m = store.getMember(d.member_id);
              const p = calculateDuePenalty(d);
              const waUrl = m ? generateWhatsAppReminderUrl(m, d) : '#';

              return `
                <tr>
                  <td>
                    <a href="#" class="member-link" onclick="openMemberProfileModal(${d.member_id}); return false;">
                      <strong>${m ? m.full_name : 'Unknown'}</strong>
                    </a>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${m ? m.phone : ''}</div>
                  </td>
                  <td class="tabular-nums">${formatDate(d.due_date)}</td>
                  <td class="tabular-nums">${formatINR(d.fee_amount)}</td>
                  <td class="tabular-nums" style="color: ${p.penalty > 0 ? 'var(--danger-text)' : 'var(--text-muted)'};">
                    ${p.penalty > 0 ? `
                      <div style="font-weight: 700;">+${formatINR(p.penalty)}</div>
                      <div style="font-size: 0.72rem; color: var(--text-muted); line-height: 1.2;">
                        ${p.chargeableDays} billable days × ₹${store.getPenaltyRule().penalty_per_day}
                        ${p.isCapped ? ' (Capped)' : ''}
                      </div>
                    ` : p.withinGrace ? `
                      <span style="color: var(--warning-text); font-size: 0.8rem;">₹0 (In Grace Period)</span>
                    ` : `
                      <span style="color: var(--text-muted); font-size: 0.8rem;">₹0.00</span>
                    `}
                  </td>
                  <td class="tabular-nums font-bold" style="color: var(--text-main); font-size: 0.95rem;">
                    ${formatINR(p.totalPayable)}
                  </td>
                  <td>
                    ${p.penalty > 0 ? `
                      <span class="badge badge-overdue">Overdue (${p.daysOverdue}d)</span>
                    ` : p.withinGrace ? `
                      <span class="badge badge-inactive">Grace (${p.graceDaysRemaining}d left)</span>
                    ` : p.isDueToday ? `
                      <span class="badge badge-pending">Due Today</span>
                    ` : `
                      <span class="badge badge-pending">Due in ${p.daysUntilDue}d</span>
                    `}
                  </td>
                  <td style="text-align: right;">
                    <div style="display: inline-flex; gap: 0.35rem;">
                      ${m ? `
                        <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-secondary" title="Send WhatsApp Reminder">
                          💬 Remind
                        </a>
                      ` : ''}
                      <button type="button" class="btn btn-sm" style="background: linear-gradient(135deg, #0c2340 0%, #174276 100%); color: #fff; border: 1px solid #2b84ea; font-size: 0.76rem; padding: 0.3rem 0.55rem; display: inline-flex; align-items: center; gap: 0.25rem;" onclick="openRazorpayCheckout(${d.due_id})" title="Instant Razorpay Checkout">
                        ⚡ Razorpay
                      </button>
                      <button type="button" class="btn btn-sm btn-accent" onclick="openPayModal(${d.due_id})">
                        Collect Fee
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Recent Payments -->
    <div class="table-card">
      <div class="table-toolbar">
        <span class="table-toolbar-title">Recent Settled Payments & Invoices</span>
        <button type="button" class="btn btn-sm btn-secondary" onclick="window.navigate('payments')">All Payment History →</button>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Receipt</th>
              <th>Member</th>
              <th>Date Settled</th>
              <th>Fee Paid</th>
              <th>Penalty</th>
              <th>Total Paid</th>
              <th>Mode</th>
              <th style="text-align: right;">Invoice</th>
            </tr>
          </thead>
          <tbody>
            ${recentPayments.map(p => {
              const due = store.getFeeDue(p.due_id);
              const m = due ? store.getMember(due.member_id) : null;
              const total = Number(p.fee_paid) + Number(p.penalty_paid || 0);

              return `
                <tr>
                  <td class="tabular-nums font-bold">#${p.payment_id}</td>
                  <td>
                    ${m ? `
                      <a href="#" class="member-link" onclick="openMemberProfileModal(${m.member_id}); return false;">
                        ${m.full_name}
                      </a>
                    ` : 'Unknown'}
                  </td>
                  <td class="tabular-nums">${formatDate(p.paid_date)}</td>
                  <td class="tabular-nums">${formatINR(p.fee_paid)}</td>
                  <td class="tabular-nums">${p.penalty_paid > 0 ? formatINR(p.penalty_paid) : '—'}</td>
                  <td class="tabular-nums font-bold" style="color: var(--accent-text);">${formatINR(total)}</td>
                  <td><span class="badge badge-paid">${p.payment_mode}</span></td>
                  <td style="text-align: right;">
                    <button type="button" class="btn btn-sm btn-secondary" onclick="openReceiptModal(${p.payment_id})">
                      🧾 Receipt
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Live Gate Activity & Recent Check-Ins -->
    <div class="table-card" style="margin-top: 1.5rem;">
      <div class="table-toolbar">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span class="gate-live-pulse"></span>
          <span class="table-toolbar-title">Live Gate Turnstile & Recent Entries</span>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button type="button" class="btn btn-sm btn-primary" onclick="openGateCheckInModal()">⚡ + Check-In</button>
          <button type="button" class="btn btn-sm btn-secondary" onclick="window.navigate('attendance')">All Attendance Logs →</button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Date</th>
              <th>Member Name</th>
              <th>Method</th>
              <th>Gate Status</th>
              <th>Turnstile Notes</th>
            </tr>
          </thead>
          <tbody>
            ${store.getAttendance().slice(0, 5).map(att => {
              const mem = store.getMember(att.member_id);
              const isQr = att.method === 'QR Code';
              const isCard = att.method === 'RFID Card';
              return `
                <tr>
                  <td class="tabular-nums font-bold">${att.check_in_time}</td>
                  <td class="tabular-nums">${formatDate(att.check_in_date)}</td>
                  <td>
                    ${mem ? `
                      <a href="#" class="member-link" onclick="openMemberProfileModal(${mem.member_id}); return false;">
                        ${mem.full_name}
                      </a>
                    ` : `Member #${att.member_id}`}
                  </td>
                  <td>
                    <span class="attendance-method-badge ${isQr ? 'method-qr' : isCard ? 'method-rfid' : 'method-manual'}">
                      <span>${isQr ? '📱' : isCard ? '💳' : '✍️'}</span>
                      <span>${att.method}</span>
                    </span>
                  </td>
                  <td>
                    <span class="badge ${att.status === 'Allowed' ? 'badge-active' : att.status === 'Blocked' ? 'badge-danger' : 'badge-warning'}">
                      ${att.status}
                    </span>
                  </td>
                  <td style="font-size: 0.85rem; color: var(--text-secondary);">${att.notes || 'Turnstile Gate'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ==========================================
// 2. MEMBERS VIEW
// ==========================================
function renderMembers(container) {
  const members = store.getMembers();
  const plans = store.getPlans();

  let filtered = members.filter(m => {
    const matchSearch = (m.full_name || '').toLowerCase().includes(memberSearch) ||
                        (m.phone || '').includes(memberSearch) ||
                        (m.email && m.email.toLowerCase().includes(memberSearch));
    const matchStatus = memberFilter === 'ALL' || m.status === memberFilter;
    return matchSearch && matchStatus;
  });

  filtered.sort((a, b) => {
    if (memberSort === 'name') return a.full_name.localeCompare(b.full_name);
    if (memberSort === 'date') return new Date(b.join_date) - new Date(a.join_date);
    return b.member_id - a.member_id;
  });

  container.innerHTML = `
    <div class="view-header">
      <div>
        <h1 class="view-title">Members</h1>
        <p class="view-subtitle">${members.length} registered members</p>
      </div>
      <button type="button" class="btn btn-primary" onclick="openAddMemberModal()">+ Add Member</button>
    </div>

    <div class="table-card">
      <div class="table-toolbar">
        <input 
          type="search" 
          class="search-input" 
          placeholder="Search by name, phone, email..." 
          id="member-search"
          value="${escapeHtml(memberSearch)}"
        />
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <select id="member-filter-status" class="search-input" style="min-width: 140px;">
            <option value="ALL" ${memberFilter === 'ALL' ? 'selected' : ''}>All Statuses</option>
            <option value="Active" ${memberFilter === 'Active' ? 'selected' : ''}>Active Only</option>
            <option value="Inactive" ${memberFilter === 'Inactive' ? 'selected' : ''}>Inactive Only</option>
          </select>

          <select id="member-sort-select" class="search-input" style="min-width: 140px;">
            <option value="id" ${memberSort === 'id' ? 'selected' : ''}>Sort by ID</option>
            <option value="name" ${memberSort === 'name' ? 'selected' : ''}>Sort by Name</option>
            <option value="date" ${memberSort === 'date' ? 'selected' : ''}>Sort by Join Date</option>
          </select>
        </div>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Full Name</th>
              <th>Contact Phone</th>
              <th>Email</th>
              <th>Membership Plan</th>
              <th>Join Date</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.length === 0 ? `
              <tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">No members match the query.</td></tr>
            ` : filtered.map(m => {
              const plan = plans.find(p => p.plan_id === m.plan_id);
              return `
                <tr>
                  <td class="tabular-nums">#${m.member_id}</td>
                  <td>
                    <a href="#" class="member-link" onclick="openMemberProfileModal(${m.member_id}); return false;">
                      <strong>${m.full_name}</strong>
                    </a>
                  </td>
                  <td class="tabular-nums">${m.phone}</td>
                  <td>${m.email || '—'}</td>
                  <td>
                    <span class="badge" style="background: var(--bg-subtle); color: var(--text-secondary); border: 1px solid var(--border);">
                      ${plan ? plan.plan_name : 'Custom'}
                    </span>
                  </td>
                  <td class="tabular-nums">${formatDate(m.join_date)}</td>
                  <td>
                    <span class="badge badge-${m.status.toLowerCase()}">${m.status}</span>
                  </td>
                  <td style="text-align: right;">
                    <div style="display: inline-flex; gap: 0.35rem;">
                      <button 
                        type="button" 
                        class="btn btn-sm btn-secondary" 
                        onclick="openMemberProfileModal(${m.member_id})"
                        title="View Full Profile, Digital Pass & Billing"
                      >
                        Pass
                      </button>
                      <button 
                        type="button" 
                        class="btn btn-sm btn-secondary" 
                        onclick="openEditMemberModal(${m.member_id})"
                        title="Edit Member Information"
                      >
                        Edit
                      </button>
                      <button 
                        type="button" 
                        class="btn btn-sm btn-secondary" 
                        onclick="toggleMemberStatus(${m.member_id})"
                        title="Toggle Active/Inactive"
                      >
                        ${m.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button 
                        type="button" 
                        class="btn btn-sm btn-secondary" 
                        style="color: var(--danger-text);"
                        onclick="handleDeleteMember(${m.member_id})"
                        title="Delete Member"
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
    </div>
  `;

  const searchEl = container.querySelector('#member-search');
  if (searchEl) {
    searchEl.addEventListener('input', (e) => {
      memberSearch = e.target.value.toLowerCase().trim();
      renderMembers(container);
    });
  }

  const filterEl = container.querySelector('#member-filter-status');
  if (filterEl) {
    filterEl.addEventListener('change', (e) => {
      memberFilter = e.target.value;
      renderMembers(container);
    });
  }

  const sortEl = container.querySelector('#member-sort-select');
  if (sortEl) {
    sortEl.addEventListener('change', (e) => {
      memberSort = e.target.value;
      renderMembers(container);
    });
  }
}

// ==========================================
// 3. PLANS VIEW
// ==========================================
function renderPlans(container) {
  const plans = store.getPlans();
  const members = store.getMembers();

  container.innerHTML = `
    <div class="view-header">
      <div>
        <h1 class="view-title">Plans</h1>
        <p class="view-subtitle">Membership tiers and pricing</p>
      </div>
      <button type="button" class="btn btn-primary" onclick="openAddPlanModal()">+ Add Plan</button>
    </div>

    <div class="plans-list">
      ${plans.map(p => {
        const enrolled = members.filter(m => m.plan_id === p.plan_id && m.status === 'Active');
        const totalCost = p.duration_months * p.monthly_fee;
        return `
          <div class="plan-item">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
              <div class="plan-item-name">${p.plan_name}</div>
              <span class="badge" style="background: var(--bg-subtle); color: var(--text-muted); border: 1px solid var(--border);">
                ID #${p.plan_id}
              </span>
            </div>
            <div class="plan-item-price">
              ${formatINR(p.monthly_fee)} 
              <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">/ mo</span>
            </div>
            <div class="plan-item-duration">
              Duration: ${p.duration_months} Month${p.duration_months > 1 ? 's' : ''} • Billed ${formatINR(totalCost)} per cycle
            </div>
            
            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: auto; border-top: 1px solid var(--border); padding-top: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
              <span><strong>${enrolled.length}</strong> active members</span>
              <div style="display: flex; gap: 0.35rem;">
                <button type="button" class="btn btn-sm btn-secondary" onclick="openEditPlanModal(${p.plan_id})">Edit</button>
                <button type="button" class="btn btn-sm btn-secondary" style="color: var(--danger-text);" onclick="handleDeletePlan(${p.plan_id})">Delete</button>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ==========================================
// 4. FEE DUES VIEW (OUTSTANDING DUES ONLY)
// ==========================================
function renderFeeDues(container) {
  const outstandingDues = store.getFeeDues().filter(d => d.status === 'Pending');
  const members = store.getMembers();

  const filtered = outstandingDues.filter(d => {
    const m = members.find(mem => mem.member_id === d.member_id);
    const searchMatch = !duesSearch || 
      (m && m.full_name.toLowerCase().includes(duesSearch.toLowerCase())) ||
      (m && m.phone.includes(duesSearch)) ||
      String(d.due_id).includes(duesSearch);

    if (!searchMatch) return false;
    if (duesFilter === 'ALL') return true;

    const p = calculateDuePenalty(d);
    if (duesFilter === 'Overdue') return p.isOverdue;
    if (duesFilter === 'Grace') return p.withinGrace;
    if (duesFilter === 'Upcoming') return !p.isOverdue && !p.withinGrace;
    return true;
  });

  container.innerHTML = `
    <div class="view-header">
      <div>
        <h1 class="view-title">Fee Dues</h1>
        <p class="view-subtitle">Pending fee installments and overdue receivables</p>
      </div>
      <button type="button" class="btn btn-primary" onclick="openAddDueModal()">+ Create Fee Due</button>
    </div>

    <div class="table-card">
      <div class="table-toolbar">
        <input 
          type="search" 
          class="search-input" 
          placeholder="Search member, phone, due ID..." 
          id="dues-search"
          value="${escapeHtml(duesSearch)}"
        />
        <select id="dues-filter-status" class="search-input" style="min-width: 200px;">
          <option value="ALL" ${duesFilter === 'ALL' ? 'selected' : ''}>All Outstanding (${outstandingDues.length})</option>
          <option value="Overdue" ${duesFilter === 'Overdue' ? 'selected' : ''}>Overdue (Past Grace Period)</option>
          <option value="Grace" ${duesFilter === 'Grace' ? 'selected' : ''}>In Grace Period (₹0 Penalty)</option>
          <option value="Upcoming" ${duesFilter === 'Upcoming' ? 'selected' : ''}>Upcoming Dues</option>
        </select>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Due ID</th>
              <th>Member Name</th>
              <th>Due Date</th>
              <th>Base Fee</th>
              <th>Late Penalty</th>
              <th>Total Payable</th>
              <th>Status</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.length === 0 ? `
              <tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">🎉 Zero outstanding dues matching criteria.</td></tr>
            ` : filtered.map(d => {
              const m = members.find(mem => mem.member_id === d.member_id);
              const p = calculateDuePenalty(d);
              const waUrl = m ? generateWhatsAppReminderUrl(m, d) : '#';

              return `
                <tr>
                  <td class="tabular-nums">#${d.due_id}</td>
                  <td>
                    <a href="#" class="member-link" onclick="openMemberProfileModal(${m ? m.member_id : 0}); return false;">
                      <strong>${m ? m.full_name : 'Unknown'}</strong>
                    </a>
                  </td>
                  <td class="tabular-nums">${formatDate(d.due_date)}</td>
                  <td class="tabular-nums">${formatINR(d.fee_amount)}</td>
                  <td class="tabular-nums" style="color: ${p.penalty > 0 ? 'var(--danger-text)' : 'var(--text-muted)'};">
                    ${p.penalty > 0 ? `
                      <div style="font-weight: 700;">+${formatINR(p.penalty)}</div>
                      <div style="font-size: 0.72rem; color: var(--text-muted); line-height: 1.2;">
                        ${p.chargeableDays} billable days × ₹${store.getPenaltyRule().penalty_per_day}
                        ${p.isCapped ? ' (Capped)' : ''}
                      </div>
                    ` : p.withinGrace ? `
                      <span style="color: var(--warning-text); font-size: 0.8rem;">₹0 (In Grace Period)</span>
                    ` : `
                      <span style="color: var(--text-muted); font-size: 0.8rem;">₹0.00</span>
                    `}
                  </td>
                  <td class="tabular-nums font-bold" style="color: var(--text-main); font-size: 0.95rem;">
                    ${formatINR(p.totalPayable)}
                  </td>
                  <td>
                    ${p.penalty > 0 ? `
                      <span class="badge badge-overdue">Overdue (${p.daysOverdue}d)</span>
                    ` : p.withinGrace ? `
                      <span class="badge badge-inactive">Grace (${p.graceDaysRemaining}d left)</span>
                    ` : p.isDueToday ? `
                      <span class="badge badge-pending">Due Today</span>
                    ` : `
                      <span class="badge badge-pending">Due in ${p.daysUntilDue}d</span>
                    `}
                  </td>
                  <td style="text-align: right;">
                    <div style="display: inline-flex; gap: 0.35rem;">
                      ${m ? `
                        <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-secondary" title="Send WhatsApp Reminder">
                          💬 Remind
                        </a>
                      ` : ''}
                      <button type="button" class="btn btn-sm" style="background: linear-gradient(135deg, #0c2340 0%, #174276 100%); color: #fff; border: 1px solid #2b84ea; font-size: 0.76rem; padding: 0.3rem 0.55rem; display: inline-flex; align-items: center; gap: 0.25rem;" onclick="openRazorpayCheckout(${d.due_id})" title="Instant Razorpay Checkout">
                        ⚡ Razorpay
                      </button>
                      <button type="button" class="btn btn-sm btn-accent" onclick="openPayModal(${d.due_id})">
                        Collect
                      </button>
                      <button type="button" class="btn btn-sm btn-secondary" style="color: var(--danger-text);" onclick="handleDeleteDue(${d.due_id})" title="Cancel Due">
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
    </div>
  `;

  const searchEl = container.querySelector('#dues-search');
  if (searchEl) {
    searchEl.addEventListener('input', (e) => {
      duesSearch = e.target.value.trim();
      renderFeeDues(container);
    });
  }

  const filterEl = container.querySelector('#dues-filter-status');
  if (filterEl) {
    filterEl.addEventListener('change', (e) => {
      duesFilter = e.target.value;
      renderFeeDues(container);
    });
  }
}

// ==========================================
// 5. PAYMENTS VIEW
// ==========================================
function renderPayments(container) {
  const payments = store.getPayments();
  const dues = store.getFeeDues();
  const members = store.getMembers();

  const filtered = payments.filter(p => {
    const due = dues.find(d => d.due_id === p.due_id);
    const m = due ? members.find(mem => mem.member_id === due.member_id) : null;

    const matchesMode = paymentsFilterMode === 'ALL' || p.payment_mode === paymentsFilterMode;
    const matchesSearch = !paymentsSearch ||
      (m && m.full_name.toLowerCase().includes(paymentsSearch.toLowerCase())) ||
      String(p.payment_id).includes(paymentsSearch) ||
      String(p.due_id).includes(paymentsSearch);

    return matchesMode && matchesSearch;
  });

  container.innerHTML = `
    <div class="view-header">
      <div>
        <h1 class="view-title">Payments</h1>
        <p class="view-subtitle">Transaction history and receipts</p>
      </div>
    </div>

    <div class="table-card">
      <div class="table-toolbar">
        <input 
          type="search" 
          class="search-input" 
          placeholder="Search member, receipt #, due ID..." 
          id="payment-search"
          value="${escapeHtml(paymentsSearch)}"
        />
        <select id="payment-mode-filter" class="search-input" style="min-width: 140px;">
          <option value="ALL" ${paymentsFilterMode === 'ALL' ? 'selected' : ''}>All Modes</option>
          <option value="UPI" ${paymentsFilterMode === 'UPI' ? 'selected' : ''}>UPI</option>
          <option value="Cash" ${paymentsFilterMode === 'Cash' ? 'selected' : ''}>Cash</option>
          <option value="Card" ${paymentsFilterMode === 'Card' ? 'selected' : ''}>Card</option>
        </select>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Receipt #</th>
              <th>Due ID</th>
              <th>Member Name</th>
              <th>Date Settled</th>
              <th>Base Fee</th>
              <th>Penalty Paid</th>
              <th>Total Collected</th>
              <th>Mode</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.length === 0 ? `
              <tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">No payment transactions recorded yet.</td></tr>
            ` : filtered.map(p => {
              const due = dues.find(d => d.due_id === p.due_id);
              const m = due ? members.find(mem => mem.member_id === due.member_id) : null;
              const total = Number(p.fee_paid) + Number(p.penalty_paid || 0);

              return `
                <tr>
                  <td class="tabular-nums font-bold">#${p.payment_id}</td>
                  <td class="tabular-nums">#${p.due_id}</td>
                  <td>
                    ${m ? `
                      <a href="#" class="member-link" onclick="openMemberProfileModal(${m.member_id}); return false;">
                        <strong>${m.full_name}</strong>
                      </a>
                    ` : 'Unknown'}
                  </td>
                  <td class="tabular-nums">${formatDate(p.paid_date)}</td>
                  <td class="tabular-nums">${formatINR(p.fee_paid)}</td>
                  <td class="tabular-nums">${p.penalty_paid > 0 ? formatINR(p.penalty_paid) : '—'}</td>
                  <td class="tabular-nums font-bold" style="color: var(--accent-text); font-size: 0.95rem;">
                    ${formatINR(total)}
                  </td>
                  <td><span class="badge badge-paid">${p.payment_mode}</span></td>
                  <td style="text-align: right;">
                    <div style="display: inline-flex; gap: 0.35rem;">
                      <button type="button" class="btn btn-sm btn-secondary" onclick="openReceiptModal(${p.payment_id})">
                        🧾 Receipt
                      </button>
                      <button type="button" class="btn btn-sm btn-secondary" style="color: var(--danger-text);" onclick="handleVoidPayment(${p.payment_id})" title="Void / Revert payment">
                        Void
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  const searchEl = container.querySelector('#payment-search');
  if (searchEl) {
    searchEl.addEventListener('input', (e) => {
      paymentsSearch = e.target.value.trim();
      renderPayments(container);
    });
  }

  const filterEl = container.querySelector('#payment-mode-filter');
  if (filterEl) {
    filterEl.addEventListener('change', (e) => {
      paymentsFilterMode = e.target.value;
      renderPayments(container);
    });
  }
}

// ==========================================
// 6. SETTINGS VIEW
// ==========================================
function renderSettings(container) {
  const rule = store.getPenaltyRule();
  const cloud = store.getCloudStatus();
  const isConnected = cloud.status === 'connected';

  container.innerHTML = `
    <div class="view-header">
      <div>
        <h1 class="view-title">Settings</h1>
        <p class="view-subtitle">Penalty rules and system configuration</p>
      </div>
    </div>

    <div style="max-width: 650px; display: flex; flex-direction: column; gap: 1.5rem;">
      <!-- Cloud Database Sync Status -->
      <div class="table-card" style="padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
            <span style="font-weight: 700;">Database Storage Engine</span>
            <span class="badge ${isConnected ? 'badge-active' : 'badge-pending'}">
              ${isConnected ? `MongoDB Atlas · ${cloud.database || 'gym_db'}` : 'Local Browser Storage'}
            </span>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">
            ${isConnected
              ? `Live cloud sync enabled via /api/gym.${cloud.lastSyncedAt ? ` Last synced: ${new Date(cloud.lastSyncedAt).toLocaleTimeString()}` : ''}`
              : 'Running in offline/local fallback mode. Connect MongoDB Atlas in Vercel Storage to enable live multi-device cloud sync.'}
          </div>
        </div>
        <button type="button" class="btn btn-sm btn-secondary" id="btn-cloud-sync">
          🔄 Sync Now
        </button>
      </div>

      <div class="table-card">
        <div class="table-toolbar">
          <span class="table-toolbar-title">Penalty Rule Configuration</span>
        </div>
        <form id="form-penalty-settings" style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem;">
          <div class="form-field">
            <label for="rule-grace">Grace Period (Days)</label>
            <input type="number" id="rule-grace" min="0" value="${rule.grace_days}" required />
            <span style="font-size: 0.75rem; color: var(--text-muted);">Days after due date before daily late penalties begin accumulating. (e.g. 5 days)</span>
          </div>

          <div class="form-field">
            <label for="rule-rate">Penalty Rate per Day (₹)</label>
            <input type="number" step="0.5" min="0" id="rule-rate" value="${rule.penalty_per_day}" required />
            <span style="font-size: 0.75rem; color: var(--text-muted);">Amount added each day past the grace period. (e.g. ₹10.00/day)</span>
          </div>

          <div class="form-field">
            <label for="rule-max">Max Penalty Cap (₹)</label>
            <input type="number" step="1" min="0" id="rule-max" value="${rule.max_penalty}" required />
            <span style="font-size: 0.75rem; color: var(--text-muted);">Maximum allowable penalty ceiling limit for any single billing cycle. (e.g. ₹500.00)</span>
          </div>

          <div style="margin-top: 0.5rem;">
            <button type="submit" class="btn btn-primary">Save Penalty Rules</button>
          </div>
        </form>
      </div>

      <div class="table-card" style="padding: 1.5rem;">
        <div style="font-weight: 600; margin-bottom: 0.25rem;">Database Backup & Migration</div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem;">
          Save a complete JSON snapshot of all members, plans, dues, and payment ledgers or restore from a backup file.
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button type="button" class="btn btn-secondary" onclick="exportJsonBackupFile()">
            Download Backup
          </button>
          <button type="button" class="btn btn-secondary" onclick="openImportModal()">
            Restore Backup
          </button>
        </div>
      </div>

      <div class="table-card" style="padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; border-color: rgba(239, 68, 68, 0.3);">
        <div>
          <div style="font-weight: 600; color: var(--danger-text);">Reset Database</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">Restore initial club records.</div>
        </div>
        <button type="button" class="btn btn-secondary" style="border-color: var(--danger); color: var(--danger-text);" onclick="resetDatabasePrompt()">
          Reset Data
        </button>
      </div>
    </div>
  `;

  const syncBtn = container.querySelector('#btn-cloud-sync');
  if (syncBtn) {
    syncBtn.addEventListener('click', async () => {
      syncBtn.disabled = true;
      syncBtn.textContent = 'Syncing...';
      const ok = await store.syncFromCloud();
      showToast(ok ? 'Synced with MongoDB Atlas.' : 'MongoDB API not connected — using Local Storage.', ok ? 'success' : 'info');
    });
  }

  const form = container.querySelector('#form-penalty-settings');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      try {
        store.updatePenaltyRule({
          grace_days: container.querySelector('#rule-grace').value,
          penalty_per_day: container.querySelector('#rule-rate').value,
          max_penalty: container.querySelector('#rule-max').value
        });
        showToast('Penalty rule updated successfully.', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
}

// ==========================================
// MODALS & PRODUCTIVITY WORKFLOWS
// ==========================================

window.openMemberProfileModal = function (memberId) {
  const details = store.getMemberDetails(memberId);
  if (!details) return;
  const { member, plan, payments, totalPaid, pendingDues, totalPendingFee } = details;
  const memberAttendance = store.getAttendanceForMember(member.member_id);
  const dialog = document.getElementById('modal-generic');

  dialog.innerHTML = `
    <div class="modal-head">
      <div>
        <span class="modal-head-title">${member.full_name}</span>
        <span class="badge badge-${member.status.toLowerCase()}" style="margin-left: 0.5rem;">${member.status}</span>
      </div>
      <button type="button" class="btn btn-sm btn-secondary" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body-content" style="max-height: 80vh; overflow-y: auto;">
      <!-- Digital Membership Pass (RFID & QR) -->
      ${renderDigitalMemberPass(member, plan)}

      <div class="profile-card-grid">
        <div class="profile-stat-box">
          <div class="profile-stat-label">Member ID</div>
          <div class="profile-stat-val">#${member.member_id}</div>
        </div>
        <div class="profile-stat-box">
          <div class="profile-stat-label">Phone</div>
          <div class="profile-stat-val">${member.phone}</div>
        </div>
        <div class="profile-stat-box">
          <div class="profile-stat-label">Plan</div>
          <div class="profile-stat-val">${plan ? plan.plan_name : 'N/A'}</div>
        </div>
        <div class="profile-stat-box">
          <div class="profile-stat-label">Total Gym Visits</div>
          <div class="profile-stat-val">${memberAttendance.length} check-ins</div>
        </div>
      </div>

      <div style="background: var(--bg-body); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 1rem; display: flex; justify-content: space-around; text-align: center;">
        <div>
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Total Settled</div>
          <div style="font-size: 1.25rem; font-weight: 800; color: var(--accent-text);">${formatINR(totalPaid)}</div>
        </div>
        <div style="border-left: 1px solid var(--border);"></div>
        <div>
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Outstanding Dues</div>
          <div style="font-size: 1.25rem; font-weight: 800; color: ${totalPendingFee > 0 ? 'var(--warning-text)' : 'var(--text-main)'};">
            ${formatINR(totalPendingFee)}
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button type="button" class="btn btn-sm btn-primary" onclick="closeModal(); openRenewMemberModal(${member.member_id});">
          🔄 Renew Subscription
        </button>
        <button type="button" class="btn btn-sm btn-secondary" onclick="closeModal(); openEditMemberModal(${member.member_id});">
          ✏️ Edit Profile
        </button>
        <button type="button" class="btn btn-sm btn-secondary" onclick="closeModal(); toggleMemberStatus(${member.member_id});">
          ${member.status === 'Active' ? 'Deactivate' : 'Activate'}
        </button>
      </div>

      <div>
        <div style="font-size: 0.85rem; font-weight: 700; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-secondary);">
          Outstanding Billing Dues (${pendingDues.length})
        </div>
        <div class="table-wrap" style="border: 1px solid var(--border); border-radius: var(--radius-sm);">
          <table class="data-table">
            <thead>
              <tr>
                <th>Due Date</th>
                <th>Base Fee</th>
                <th>Penalty</th>
                <th>Total</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${pendingDues.length === 0 ? `
                <tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1rem;">No outstanding dues. Account in good standing!</td></tr>
              ` : pendingDues.map(d => {
                const p = calculateDuePenalty(d);
                return `
                  <tr>
                    <td class="tabular-nums">${formatDate(d.due_date)}</td>
                    <td class="tabular-nums">${formatINR(d.fee_amount)}</td>
                    <td class="tabular-nums" style="color: ${p.penalty > 0 ? 'var(--danger-text)' : 'inherit'};">
                      ${p.penalty > 0 ? `+${formatINR(p.penalty)}` : '₹0'}
                    </td>
                    <td class="tabular-nums font-bold">${formatINR(p.totalPayable)}</td>
                    <td style="text-align: right;">
                      <div style="display: inline-flex; gap: 0.35rem;">
                        <button type="button" class="btn btn-sm" style="background: linear-gradient(135deg, #0c2340 0%, #174276 100%); color: #fff; border: 1px solid #2b84ea; font-size: 0.75rem; padding: 0.25rem 0.5rem;" onclick="closeModal(); openRazorpayCheckout(${d.due_id});" title="Instant Razorpay Checkout">
                          ⚡ Razorpay
                        </button>
                        <button type="button" class="btn btn-sm btn-accent" onclick="closeModal(); openPayModal(${d.due_id});">
                          Collect
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div style="margin-top: 0.5rem;">
        <div style="font-size: 0.85rem; font-weight: 700; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-secondary);">
          Settled Payment History (${payments.length})
        </div>
        <div class="table-wrap" style="border: 1px solid var(--border); border-radius: var(--radius-sm);">
          <table class="data-table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Paid Date</th>
                <th>Fee Paid</th>
                <th>Penalty</th>
                <th>Mode</th>
                <th style="text-align: right;">Invoice</th>
              </tr>
            </thead>
            <tbody>
              ${payments.length === 0 ? `
                <tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1rem;">No payment transactions yet.</td></tr>
              ` : payments.map(pay => `
                  <tr>
                    <td class="tabular-nums">#${pay.payment_id}</td>
                    <td class="tabular-nums">${formatDate(pay.paid_date)}</td>
                    <td class="tabular-nums">${formatINR(pay.fee_paid)}</td>
                    <td class="tabular-nums">${pay.penalty_paid > 0 ? formatINR(pay.penalty_paid) : '—'}</td>
                    <td><span class="badge badge-paid">${pay.payment_mode}</span></td>
                    <td style="text-align: right;">
                      <button type="button" class="btn btn-sm btn-secondary" onclick="closeModal(); openReceiptModal(${pay.payment_id});">
                        Receipt
                      </button>
                    </td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Turnstile Attendance History -->
      <div style="margin-top: 0.5rem;">
        <div style="font-size: 0.85rem; font-weight: 700; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-secondary); display: flex; justify-content: space-between; align-items: center;">
          <span>Turnstile Attendance History (${memberAttendance.length} visits)</span>
          <button type="button" class="btn btn-sm btn-secondary" onclick="closeModal(); window.navigate('attendance');">All Club Logs →</button>
        </div>
        <div class="table-wrap" style="border: 1px solid var(--border); border-radius: var(--radius-sm);">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Method</th>
                <th>Status</th>
                <th>Turnstile / Location</th>
              </tr>
            </thead>
            <tbody>
              ${memberAttendance.length === 0 ? `
                <tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1rem;">No gate check-in logs recorded yet.</td></tr>
              ` : memberAttendance.slice(0, 8).map(att => `
                <tr>
                  <td class="tabular-nums">${formatDate(att.check_in_date)}</td>
                  <td class="tabular-nums font-bold">${att.check_in_time}</td>
                  <td>
                    <span class="attendance-method-badge ${att.method === 'QR Code' ? 'method-qr' : att.method === 'RFID Card' ? 'method-rfid' : 'method-manual'}">
                      <span>${att.method === 'QR Code' ? '📱' : att.method === 'RFID Card' ? '💳' : '✍️'}</span>
                      <span>${att.method}</span>
                    </span>
                  </td>
                  <td>
                    <span class="badge ${att.status === 'Allowed' ? 'badge-active' : att.status === 'Blocked' ? 'badge-danger' : 'badge-warning'}">
                      ${att.status}
                    </span>
                  </td>
                  <td style="font-size: 0.82rem; color: var(--text-secondary);">${att.notes || 'Turnstile Gate'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div class="modal-foot">
      <button type="button" class="btn btn-secondary" onclick="closeModal()">Close</button>
    </div>
  `;

  dialog.showModal();
};

window.openAddMemberModal = function () {
  const dialog = document.getElementById('modal-generic');
  const plans = store.getPlans();

  dialog.innerHTML = `
    <div class="modal-head">
      <span class="modal-head-title">Add New Member — Anytime Fitness Sohna</span>
      <button type="button" class="btn btn-sm btn-secondary" onclick="closeModal()">✕</button>
    </div>
    <form id="form-new-member">
      <div class="modal-body-content">
        <div class="form-field">
          <label>Full Name *</label>
          <input type="text" id="m-name" required placeholder="e.g. Vikram Singhania" />
        </div>
        <div class="form-field">
          <label>Phone Number *</label>
          <input type="tel" id="m-phone" required placeholder="+91 98000 00000" />
          <span style="font-size: 0.72rem; color: var(--text-muted);">Must be a unique mobile contact number.</span>
        </div>
        <div class="form-field">
          <label>Email Address</label>
          <input type="email" id="m-email" placeholder="vikram@example.com" />
        </div>
        <div class="form-field">
          <label>Membership Plan *</label>
          <select id="m-plan" required>
            ${plans.map(p => `
              <option value="${p.plan_id}">
                ${p.plan_name} (${p.duration_months} mo) - ${formatINR(p.monthly_fee)}/mo
              </option>
            `).join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Join Date</label>
          <input type="date" id="m-date" value="${new Date().toISOString().split('T')[0]}" />
        </div>
      </div>
      <div class="modal-foot">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Member</button>
      </div>
    </form>
  `;

  dialog.querySelector('#form-new-member').addEventListener('submit', (e) => {
    e.preventDefault();
    try {
      const newM = store.addMember({
        full_name: dialog.querySelector('#m-name').value,
        phone: dialog.querySelector('#m-phone').value,
        email: dialog.querySelector('#m-email').value,
        plan_id: dialog.querySelector('#m-plan').value,
        join_date: dialog.querySelector('#m-date').value,
        status: 'Active'
      });
      closeModal();
      showToast(`Member "${newM.full_name}" registered successfully.`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  dialog.showModal();
};

window.openEditMemberModal = function (memberId) {
  const m = store.getMember(memberId);
  if (!m) return;
  const dialog = document.getElementById('modal-generic');
  const plans = store.getPlans();

  dialog.innerHTML = `
    <div class="modal-head">
      <span class="modal-head-title">Edit Member #${m.member_id}</span>
      <button type="button" class="btn btn-sm btn-secondary" onclick="closeModal()">✕</button>
    </div>
    <form id="form-edit-member">
      <div class="modal-body-content">
        <div class="form-field">
          <label>Full Name *</label>
          <input type="text" id="em-name" value="${escapeHtml(m.full_name)}" required />
        </div>
        <div class="form-field">
          <label>Phone Number *</label>
          <input type="tel" id="em-phone" value="${escapeHtml(m.phone)}" required />
        </div>
        <div class="form-field">
          <label>Email Address</label>
          <input type="email" id="em-email" value="${escapeHtml(m.email || '')}" />
        </div>
        <div class="form-field">
          <label>Membership Plan *</label>
          <select id="em-plan" required>
            ${plans.map(p => `
              <option value="${p.plan_id}" ${p.plan_id === m.plan_id ? 'selected' : ''}>
                ${p.plan_name} (${p.duration_months} mo) - ${formatINR(p.monthly_fee)}/mo
              </option>
            `).join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Status</label>
          <select id="em-status">
            <option value="Active" ${m.status === 'Active' ? 'selected' : ''}>Active</option>
            <option value="Inactive" ${m.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
          </select>
        </div>
      </div>
      <div class="modal-foot">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Update Member</button>
      </div>
    </form>
  `;

  dialog.querySelector('#form-edit-member').addEventListener('submit', (e) => {
    e.preventDefault();
    try {
      store.updateMember(m.member_id, {
        full_name: dialog.querySelector('#em-name').value,
        phone: dialog.querySelector('#em-phone').value,
        email: dialog.querySelector('#em-email').value,
        plan_id: dialog.querySelector('#em-plan').value,
        status: dialog.querySelector('#em-status').value
      });
      closeModal();
      showToast('Member updated.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  dialog.showModal();
};

window.toggleMemberStatus = function (memberId) {
  const m = store.getMember(memberId);
  if (!m) return;
  const newStatus = m.status === 'Active' ? 'Inactive' : 'Active';
  store.updateMember(memberId, { status: newStatus });
  showToast(`${m.full_name} is now ${newStatus}`, 'info');
};

window.handleDeleteMember = function (memberId) {
  const m = store.getMember(memberId);
  if (!m) return;

  confirmModal(
    'Delete Member',
    `Are you sure you want to delete "${m.full_name}"? All associated settled history will be removed. Cannot delete if pending dues exist.`,
    () => {
      try {
        store.deleteMember(memberId);
        showToast(`Member "${m.full_name}" deleted.`, 'info');
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  );
};

window.openAddPlanModal = function () {
  const dialog = document.getElementById('modal-generic');

  dialog.innerHTML = `
    <div class="modal-head">
      <span class="modal-head-title">Add Membership Plan</span>
      <button type="button" class="btn btn-sm btn-secondary" onclick="closeModal()">✕</button>
    </div>
    <form id="form-new-plan">
      <div class="modal-body-content">
        <div class="form-field">
          <label>Plan Name *</label>
          <input type="text" id="p-name" required placeholder="e.g. Student Quarterly Special" />
        </div>
        <div class="form-field">
          <label>Duration (Months) *</label>
          <input type="number" min="1" id="p-duration" value="1" required />
        </div>
        <div class="form-field">
          <label>Monthly Fee (₹) *</label>
          <input type="number" min="1" step="0.5" id="p-fee" placeholder="1200.00" required />
        </div>
      </div>
      <div class="modal-foot">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Plan</button>
      </div>
    </form>
  `;

  dialog.querySelector('#form-new-plan').addEventListener('submit', (e) => {
    e.preventDefault();
    try {
      store.addPlan({
        plan_name: dialog.querySelector('#p-name').value,
        duration_months: dialog.querySelector('#p-duration').value,
        monthly_fee: dialog.querySelector('#p-fee').value
      });
      closeModal();
      showToast('Membership plan added.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  dialog.showModal();
};

window.openEditPlanModal = function (planId) {
  const plan = store.getPlan(planId);
  if (!plan) return;
  const dialog = document.getElementById('modal-generic');

  dialog.innerHTML = `
    <div class="modal-head">
      <span class="modal-head-title">Edit Plan #${plan.plan_id}</span>
      <button type="button" class="btn btn-sm btn-secondary" onclick="closeModal()">✕</button>
    </div>
    <form id="form-edit-plan">
      <div class="modal-body-content">
        <div class="form-field">
          <label>Plan Name *</label>
          <input type="text" id="ep-name" value="${escapeHtml(plan.plan_name)}" required />
        </div>
        <div class="form-field">
          <label>Duration (Months) *</label>
          <input type="number" min="1" id="ep-duration" value="${plan.duration_months}" required />
        </div>
        <div class="form-field">
          <label>Monthly Fee (₹) *</label>
          <input type="number" min="1" step="0.5" id="ep-fee" value="${plan.monthly_fee}" required />
        </div>
      </div>
      <div class="modal-foot">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Update Plan</button>
      </div>
    </form>
  `;

  dialog.querySelector('#form-edit-plan').addEventListener('submit', (e) => {
    e.preventDefault();
    try {
      store.updatePlan(plan.plan_id, {
        plan_name: dialog.querySelector('#ep-name').value,
        duration_months: dialog.querySelector('#ep-duration').value,
        monthly_fee: dialog.querySelector('#ep-fee').value
      });
      closeModal();
      showToast('Plan updated.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  dialog.showModal();
};

window.handleDeletePlan = function (planId) {
  const p = store.getPlan(planId);
  if (!p) return;

  confirmModal(
    'Delete Plan',
    `Are you sure you want to delete plan "${p.plan_name}"? This will fail if any members are currently enrolled.`,
    () => {
      try {
        store.deletePlan(planId);
        showToast(`Plan "${p.plan_name}" deleted.`, 'info');
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  );
};

window.openAddDueModal = function () {
  const dialog = document.getElementById('modal-generic');
  const members = store.getMembers().filter(m => m.status === 'Active');

  dialog.innerHTML = `
    <div class="modal-head">
      <span class="modal-head-title">Create Outstanding Fee Due</span>
      <button type="button" class="btn btn-sm btn-secondary" onclick="closeModal()">✕</button>
    </div>
    <form id="form-new-due">
      <div class="modal-body-content">
        <div class="form-field">
          <label>Member *</label>
          <select id="d-member" required>
            <option value="">-- Choose Member --</option>
            ${members.map(m => {
              const p = store.getPlan(m.plan_id);
              const fee = p ? p.duration_months * p.monthly_fee : 0;
              return `<option value="${m.member_id}" data-fee="${fee}">${m.full_name} (${p ? p.plan_name : 'No plan'})</option>`;
            }).join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Due Date *</label>
          <input type="date" id="d-date" value="${new Date().toISOString().split('T')[0]}" required />
        </div>
        <div class="form-field">
          <label>Fee Amount (₹) *</label>
          <input type="number" min="1" step="0.5" id="d-amount" placeholder="e.g. 1500.00" required />
        </div>
      </div>
      <div class="modal-foot">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Create Due</button>
      </div>
    </form>
  `;

  const memSelect = dialog.querySelector('#d-member');
  const amountInput = dialog.querySelector('#d-amount');
  memSelect.addEventListener('change', () => {
    const selectedOpt = memSelect.selectedOptions[0];
    if (selectedOpt && selectedOpt.dataset.fee) {
      amountInput.value = selectedOpt.dataset.fee;
    }
  });

  dialog.querySelector('#form-new-due').addEventListener('submit', (e) => {
    e.preventDefault();
    try {
      store.addFeeDue({
        member_id: dialog.querySelector('#d-member').value,
        due_date: dialog.querySelector('#d-date').value,
        fee_amount: dialog.querySelector('#d-amount').value
      });
      closeModal();
      showToast('Fee due created.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  dialog.showModal();
};

window.openRenewMemberModal = function (memberId) {
  try {
    const newDue = store.generateRenewalDue(memberId);
    showToast(`Next cycle due of ${formatINR(newDue.fee_amount)} scheduled for ${formatDate(newDue.due_date)}.`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.handleDeleteDue = function (dueId) {
  confirmModal(
    'Cancel Fee Due',
    `Are you sure you want to cancel Fee Due #${dueId}? Only unpaid dues can be cancelled.`,
    () => {
      try {
        store.deleteFeeDue(dueId);
        showToast(`Fee Due #${dueId} cancelled.`, 'info');
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  );
};

window.openPayModal = function (dueId) {
  const due = store.getFeeDue(dueId);
  if (!due) return;
  const m = store.getMember(due.member_id);
  const p = calculateDuePenalty(due);
  const rule = store.getPenaltyRule();
  const dialog = document.getElementById('modal-generic');

  dialog.innerHTML = `
    <div class="modal-head">
      <span class="modal-head-title">Collect Fee — Due #${due.due_id}</span>
      <button type="button" class="btn btn-sm btn-secondary" onclick="closeModal()">✕</button>
    </div>
    <form id="form-pay-due">
      <div class="modal-body-content">
        <div class="penalty-breakdown-card">
          <div class="row">
            <span style="font-weight: 700;">Member:</span>
            <span><strong>${m ? m.full_name : 'Unknown'}</strong> (#${due.member_id})</span>
          </div>
          <div class="row">
            <span>Scheduled Due Date:</span>
            <span class="tabular-nums">${formatDate(due.due_date)}</span>
          </div>
          <div class="row" style="margin-top: 0.25rem;">
            <span>Base Membership Fee:</span>
            <span class="tabular-nums font-bold">${formatINR(due.fee_amount)}</span>
          </div>

          ${p.daysOverdue > 0 ? `
            <div class="row" style="color: var(--text-muted); font-size: 0.8rem; margin-top: 0.35rem; border-top: 1px dashed var(--border); padding-top: 0.35rem;">
              <span>Total Days Elapsed:</span>
              <span class="tabular-nums">${p.daysOverdue} days</span>
            </div>
            <div class="row" style="color: var(--text-muted); font-size: 0.8rem;">
              <span>Free Grace Period (Waived):</span>
              <span class="tabular-nums">- ${rule.grace_days} days</span>
            </div>
            <div class="row" style="color: var(--danger-text); font-weight: 600; margin-top: 0.25rem;">
              <span>Billable Overdue Days:</span>
              <span class="tabular-nums">${p.chargeableDays} days @ ₹${rule.penalty_per_day}/day</span>
            </div>
            <div class="row" style="color: var(--danger-text); font-weight: 700;">
              <span>Late Penalty Fee:</span>
              <span class="tabular-nums">+${formatINR(p.penalty)} ${p.isCapped ? '(Max Cap Limit)' : ''}</span>
            </div>
          ` : `
            <div class="row" style="color: var(--text-muted); font-size: 0.8rem; margin-top: 0.35rem; border-top: 1px dashed var(--border); padding-top: 0.35rem;">
              <span>Late Penalty Fee:</span>
              <span class="tabular-nums">₹0.00 (${p.withinGrace ? `${p.graceDaysRemaining} days remaining in grace period` : 'Not overdue'})</span>
            </div>
          `}

          <div class="row total-row">
            <span>Total Payable:</span>
            <span class="tabular-nums" style="color: var(--accent-text);">${formatINR(p.totalPayable)}</span>
          </div>
        </div>

        <div class="form-field">
          <label>Late Penalty Amount to Charge (₹)</label>
          <input type="number" min="0" step="0.5" id="pay-penalty" value="${p.penalty}" />
          <span style="font-size: 0.72rem; color: var(--text-muted);">Manager can adjust or waive late penalty if authorized.</span>
        </div>

        <div class="form-field">
          <label>Payment Mode *</label>
          <select id="pay-mode" required>
            <option value="UPI" selected>UPI (GPay / PhonePe / Paytm)</option>
            <option value="Cash">Cash at Desk</option>
            <option value="Card">Debit / Credit Card</option>
          </select>
        </div>

        <div class="form-field">
          <label>Payment Date</label>
          <input type="date" id="pay-date" value="${new Date().toISOString().split('T')[0]}" required />
        </div>

        <div class="form-field">
          <label>Transaction Notes / Reference ID (Optional)</label>
          <input type="text" id="pay-notes" placeholder="e.g. Ref #UPI-98721 or Counter Receipt" />
        </div>
      </div>
      <div class="modal-foot" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button type="button" class="btn" style="background: linear-gradient(135deg, #0c2340 0%, #174276 100%); color: #fff; border: 1px solid #2b84ea; font-weight: 700; display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.5rem 0.85rem;" onclick="const pen = document.getElementById('pay-penalty')?.value; openRazorpayCheckout(${due.due_id}, pen);">
            ⚡ Pay via Razorpay
          </button>
          <button type="submit" class="btn btn-accent">Desk Settle</button>
        </div>
      </div>
    </form>
  `;

  dialog.querySelector('#form-pay-due').addEventListener('submit', (e) => {
    e.preventDefault();
    try {
      const penaltyCharged = dialog.querySelector('#pay-penalty').value;
      const payment = store.recordPayment({
        due_id: due.due_id,
        paid_date: dialog.querySelector('#pay-date').value,
        fee_paid: due.fee_amount,
        penalty_paid: penaltyCharged,
        payment_mode: dialog.querySelector('#pay-mode').value,
        notes: dialog.querySelector('#pay-notes').value
      });
      closeModal();
      showToast('Payment settled successfully.', 'success');
      openReceiptModal(payment.payment_id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  dialog.showModal();
};

window.openReceiptModal = function (paymentId) {
  const payment = store.getPayment(paymentId);
  if (!payment) return;
  const due = store.getFeeDue(payment.due_id);
  const member = due ? store.getMember(due.member_id) : null;
  const plan = member ? store.getPlan(member.plan_id) : null;
  const total = Number(payment.fee_paid) + Number(payment.penalty_paid || 0);

  const dialog = document.getElementById('modal-generic');

  dialog.innerHTML = `
    <div class="modal-head no-print">
      <span class="modal-head-title">Member Tax Invoice & Receipt</span>
      <button type="button" class="btn btn-sm btn-secondary" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body-content" style="padding: 2rem;">
      <div class="receipt-container" id="printable-invoice">
        <div class="receipt-header">
          <div>
            <div style="font-size: 1.3rem; font-weight: 800; letter-spacing: -0.01em; color: #111827;">ANYTIME FITNESS — SOHNA</div>
            <div style="font-size: 0.8rem; color: #6b7280;">Anytime Fitness Sohna Branch • Member Tax Invoice</div>
          </div>
          <div style="text-align: right;">
            <div class="badge badge-paid" style="font-size: 0.85rem; padding: 0.25rem 0.65rem;">PAID & SETTLED</div>
            <div style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">Receipt #${payment.payment_id}</div>
          </div>
        </div>

        <div class="receipt-meta-grid">
          <div>
            <div class="meta-label">Billed To</div>
            <div style="font-weight: 700; font-size: 0.95rem; color: #111827;">${member ? member.full_name : 'Unknown'}</div>
            <div style="font-size: 0.8rem; color: #6b7280;">${member ? member.phone : ''}</div>
            <div style="font-size: 0.8rem; color: #6b7280;">${member ? member.email : ''}</div>
          </div>
          <div style="text-align: right;">
            <div class="meta-label">Payment Information</div>
            <div style="font-size: 0.85rem; color: #374151;"><strong>Payment Date:</strong> ${formatDate(payment.paid_date)}</div>
            <div style="font-size: 0.85rem; color: #374151;"><strong>Mode:</strong> ${payment.payment_mode}</div>
            <div style="font-size: 0.85rem; color: #374151;"><strong>Plan:</strong> ${plan ? plan.plan_name : 'Custom Plan'}</div>
          </div>
        </div>

        <table class="receipt-table">
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: right;">Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong style="color: #111827;">Gym Membership Subscription (Fee Due #${payment.due_id})</strong>
                <div style="font-size: 0.75rem; color: #6b7280;">Scheduled Due Date: ${due ? formatDate(due.due_date) : '—'}</div>
              </td>
              <td class="tabular-nums font-bold" style="text-align: right; color: #111827;">${formatINR(payment.fee_paid)}</td>
            </tr>
            ${payment.penalty_paid > 0 ? `
              <tr>
                <td>
                  <strong style="color: #b91c1c;">Late Payment Fee</strong>
                  <div style="font-size: 0.75rem; color: #b91c1c;">Calculated under Anytime Fitness late fee policy</div>
                </td>
                <td class="tabular-nums font-bold" style="text-align: right; color: #b91c1c;">+${formatINR(payment.penalty_paid)}</td>
              </tr>
            ` : ''}
            <tr style="border-top: 2px solid #e5e7eb; font-weight: 800;">
              <td style="font-size: 1.05rem; color: #111827;">Total Settled:</td>
              <td class="tabular-nums" style="text-align: right; font-size: 1.15rem; color: #7c3aed;">
                ${formatINR(total)}
              </td>
            </tr>
          </tbody>
        </table>

        ${payment.notes ? `
          <div style="margin-top: 1rem; font-size: 0.8rem; color: #6b7280;">
            <strong>Notes / Reference:</strong> ${escapeHtml(payment.notes)}
          </div>
        ` : ''}

        <div style="margin-top: 1.75rem; border-top: 1px dashed #e5e7eb; padding-top: 0.75rem; text-align: center; font-size: 0.75rem; color: #9ca3af;">
          Thank you for training with Anytime Fitness Sohna! • Computer-generated tax invoice
        </div>
      </div>
    </div>
    <div class="modal-foot no-print">
      <button type="button" class="btn btn-secondary" onclick="closeModal()">Close</button>
      <button type="button" class="btn btn-primary" onclick="window.print()">🖨️ Print Receipt</button>
    </div>
  `;

  dialog.showModal();
};

window.handleVoidPayment = function (paymentId) {
  confirmModal(
    'Void Payment',
    `Are you sure you want to void Payment #${paymentId}? The associated Fee Due will be reverted back to 'Pending'.`,
    () => {
      try {
        store.deletePayment(paymentId);
        showToast(`Payment #${paymentId} voided. Fee due reverted to Outstanding.`, 'info');
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  );
};

function confirmModal(title, message, onConfirm) {
  const dialog = document.getElementById('modal-generic');

  dialog.innerHTML = `
    <div class="modal-head">
      <span class="modal-head-title">${escapeHtml(title)}</span>
      <button type="button" class="btn btn-sm btn-secondary" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body-content">
      <p style="font-size: 0.9rem; line-height: 1.5; color: var(--text-secondary);">${escapeHtml(message)}</p>
    </div>
    <div class="modal-foot">
      <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button type="button" class="btn btn-primary" id="btn-confirm-action" style="background-color: var(--danger); color: white;">Confirm</button>
    </div>
  `;

  dialog.querySelector('#btn-confirm-action').addEventListener('click', () => {
    closeModal();
    if (onConfirm) onConfirm();
  });

  dialog.showModal();
}

window.closeModal = function () {
  const dialog = document.getElementById('modal-generic');
  if (dialog) dialog.close();
};

window.resetDatabasePrompt = function () {
  confirmModal(
    'Reset Database',
    'This will wipe all existing entries and restore initial Anytime Fitness sample records. Are you sure?',
    () => {
      store.reset();
      showToast('Database reset to Anytime Fitness seed records.', 'info');
    }
  );
};

window.exportJsonBackupFile = function () {
  const json = store.exportJsonBackup();
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `anytime_fitness_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('JSON backup downloaded.', 'success');
};

window.openImportModal = function () {
  const dialog = document.getElementById('modal-generic');

  dialog.innerHTML = `
    <div class="modal-head">
      <span class="modal-head-title">Restore Database from JSON</span>
      <button type="button" class="btn btn-sm btn-secondary" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body-content">
      <div class="form-field">
        <label>Paste JSON Backup String</label>
        <textarea id="import-json-text" rows="8" class="search-input" style="font-family: var(--font-mono); font-size: 0.75rem;" placeholder="Paste { membership_plan: [...], member: [...] }"></textarea>
      </div>
    </div>
    <div class="modal-foot">
      <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button type="button" class="btn btn-primary" id="btn-do-import">Restore Database</button>
    </div>
  `;

  dialog.querySelector('#btn-do-import').addEventListener('click', () => {
    const raw = dialog.querySelector('#import-json-text').value;
    try {
      store.importJsonBackup(raw);
      closeModal();
      showToast('Database restored successfully from backup.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  dialog.showModal();
};

function showToast(msg, type = 'info') {
  let shelf = document.getElementById('toast-shelf');
  if (!shelf) {
    shelf = document.createElement('div');
    shelf.id = 'toast-shelf';
    document.body.appendChild(shelf);
  }

  const t = document.createElement('div');
  t.className = `minimal-toast toast-${type}`;
  t.textContent = msg;
  shelf.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateY(8px)';
    t.style.transition = 'all 200ms ease';
    setTimeout(() => t.remove(), 250);
  }, 2600);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', init);
