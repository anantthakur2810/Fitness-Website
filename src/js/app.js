/**
 * Anytime Fitness Sohna — Member Management & Club Portal Engine
 * Full implementation across Phases 1 - 7:
 * - Role-Based Routing (Admin, Member, Public)
 * - Operations Overview with Lightweight SVG Charts
 * - Gate Check-In & Turnstile Attendance with Overdue Penalty Warnings
 * - Digital Member Passes with Model-2 QR Codes
 * - Equipment Inventory & Maintenance Defect Pipeline
 * - Member Referral Hub & Reward Fulfillment
 * - Command Palette (Ctrl+K / Cmd+K)
 * - Notification Bell with 4 Operational Health Groups
 * - UTF-8 BOM CSV Exports on all tabular datasets
 * - PWA Shell & Mobile Sticky Bottom Tab Bar
 */

import { store } from './store.js';
import { calculateDuePenalty, formatINR, formatDate, getOverviewMetrics, generateWhatsAppReminderUrl } from './penalty.js';
import { renderHome, cleanupHomeEffects } from './home.js';
import { auth } from './auth.js';
import { renderAvatar } from './avatar.js';
import { exportToCsv } from './export-csv.js';
import { generateQRCodeSVG } from './qr.js';
import { renderRevenueTrendChart, renderPaymentSplitDonut, renderPlanEnrollmentChart } from './charts.js';
import { renderAttendanceView, openGateCheckInModal } from './attendance.js';
import { renderEquipmentView, getEquipmentSummaryCounts, openAddEquipmentModal, openEditEquipmentModal, openReportIssueModal } from './equipment.js';
import { renderReferralsView, openCreateReferralModal, grantReferralReward } from './referrals.js';
import { renderMemberPortal } from './member-portal.js';
import { openCommandPalette, initCommandPalette } from './command-palette.js';
import { renderNotificationDropdown } from './notifications.js';

let activeView = 'home';
let memberSearch = '';
let memberFilter = 'ALL';
let memberSort = 'id';

let duesFilter = 'ALL';
let duesSearch = '';

let paymentsFilterMode = 'ALL';
let paymentsSearch = '';

// Theme Cycling Engine
const THEMES = [
  { id: 'theme-dark', name: 'Dark Obsidian', icon: '🌙' },
  { id: 'theme-purple', name: 'Anytime Purple', icon: '🟣' },
  { id: 'theme-light', name: 'Studio Light', icon: '☀️' },
  { id: 'theme-emerald', name: 'Cyber Emerald', icon: '⚡' }
];

let currentThemeIndex = 0;

export function init() {
  const container = document.getElementById('view-root');

  // Initialize theme from localStorage
  const savedTheme = localStorage.getItem('af_theme') || 'theme-dark';
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

  const themeBtn = document.getElementById('theme-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      currentThemeIndex = (currentThemeIndex + 1) % THEMES.length;
      applyTheme(currentThemeIndex, true);
    });
  }

  // Initialize global Command Palette (Ctrl+K)
  initCommandPalette();

  // Role changes update UI navigation and triggers re-render
  auth.subscribe(() => {
    updateRoleUI();
    const user = auth.getUser();
    if (user.isMember && !['home', 'member-portal', 'attendance'].includes(activeView)) {
      activeView = 'member-portal';
    } else if (user.isPublic && activeView !== 'home') {
      activeView = 'home';
    }
    render();
  });

  updateRoleUI();

  window.navigate = function (view) {
    if (!auth.canAccess(view)) {
      showToast('Access restricted for current role. Switch roles via header badge.', 'warning');
      return;
    }
    activeView = view;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  store.subscribe(render);
  render();
}

/**
 * Updates Header Nav Links, Role Badge, Header Action and Mobile Tab Bar
 */
function updateRoleUI() {
  const user = auth.getUser();
  const navContainer = document.getElementById('main-nav-links');
  const roleBtn = document.getElementById('btn-role-switcher');
  const headerActionBtn = document.getElementById('btn-header-action');
  const bellSlot = document.getElementById('header-bell-slot');
  const mobileBar = document.getElementById('mobile-tab-bar');

  // 1. Header Role Switcher Text
  if (roleBtn) {
    if (user.isAdmin) {
      roleBtn.innerHTML = '🛡️ Manager';
      roleBtn.title = 'Current Role: Gym Manager (Click to switch)';
    } else if (user.isMember) {
      const name = user.member ? user.member.full_name.split(' ')[0] : 'Member';
      roleBtn.innerHTML = `👤 ${name}`;
      roleBtn.title = `Logged in as ${user.member ? user.member.full_name : 'Member'} (Click to switch)`;
    } else {
      roleBtn.innerHTML = '🌐 Visitor';
      roleBtn.title = 'Current Role: Public Visitor (Click to login)';
    }
  }

  // 2. Header Action Button
  if (headerActionBtn) {
    if (user.isAdmin) {
      headerActionBtn.textContent = '+ Member';
      headerActionBtn.onclick = () => window.openAddMemberModal();
      headerActionBtn.style.display = 'inline-block';
    } else if (user.isMember) {
      headerActionBtn.textContent = 'Digital Pass';
      headerActionBtn.onclick = () => window.navigate('member-portal');
      headerActionBtn.style.display = 'inline-block';
    } else {
      headerActionBtn.textContent = 'Free Trial';
      headerActionBtn.onclick = () => {
        window.navigate('home');
        setTimeout(() => {
          const el = document.getElementById('section-trial-pass');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      };
      headerActionBtn.style.display = 'inline-block';
    }
  }

  // 3. Notification Bell Slot
  if (bellSlot) {
    if (user.isAdmin) {
      bellSlot.style.display = 'inline-block';
      renderNotificationDropdown(bellSlot);
    } else {
      bellSlot.style.display = 'none';
      bellSlot.innerHTML = '';
    }
  }

  // 4. Desktop Navigation Links
  if (navContainer) {
    if (user.isAdmin) {
      navContainer.innerHTML = `
        <button type="button" class="nav-btn ${activeView === 'home' ? 'active' : ''}" data-view="home">Home</button>
        <button type="button" class="nav-btn ${activeView === 'dashboard' ? 'active' : ''}" data-view="dashboard">Overview</button>
        <button type="button" class="nav-btn ${activeView === 'members' ? 'active' : ''}" data-view="members">Members</button>
        <button type="button" class="nav-btn ${activeView === 'attendance' ? 'active' : ''}" data-view="attendance">Attendance</button>
        <button type="button" class="nav-btn ${activeView === 'dues' ? 'active' : ''}" data-view="dues">Fee Dues</button>
        <button type="button" class="nav-btn ${activeView === 'payments' ? 'active' : ''}" data-view="payments">Payments</button>
        <button type="button" class="nav-btn ${activeView === 'equipment' ? 'active' : ''}" data-view="equipment">Equipment</button>
        <button type="button" class="nav-btn ${activeView === 'referrals' ? 'active' : ''}" data-view="referrals">Referrals</button>
        <button type="button" class="nav-btn ${activeView === 'plans' ? 'active' : ''}" data-view="plans">Plans</button>
        <button type="button" class="nav-btn ${activeView === 'settings' ? 'active' : ''}" data-view="settings">Settings</button>
      `;
    } else if (user.isMember) {
      navContainer.innerHTML = `
        <button type="button" class="nav-btn ${activeView === 'home' ? 'active' : ''}" data-view="home">Club Home</button>
        <button type="button" class="nav-btn ${activeView === 'member-portal' ? 'active' : ''}" data-view="member-portal">My Pass &amp; Dues</button>
        <button type="button" class="nav-btn ${activeView === 'attendance' ? 'active' : ''}" data-view="attendance">Gate Scans</button>
        <button type="button" class="nav-btn" onclick="openTermsModal()">Terms</button>
      `;
    } else {
      navContainer.innerHTML = `
        <button type="button" class="nav-btn ${activeView === 'home' ? 'active' : ''}" data-view="home">Home</button>
        <button type="button" class="nav-btn" onclick="scrollToSection('section-trial-pass')">Free Trial</button>
        <button type="button" class="nav-btn" onclick="scrollToSection('section-calculator')">BMI Calculator</button>
        <button type="button" class="nav-btn" onclick="scrollToSection('section-classes')">Class Timetable</button>
        <button type="button" class="nav-btn" onclick="scrollToSection('section-trainers')">Coaches</button>
        <button type="button" class="nav-btn" onclick="openTermsModal()">Terms</button>
      `;
    }

    // Bind clicks
    navContainer.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.navigate(btn.dataset.view);
      });
    });
  }

  // 5. Mobile Sticky Bottom Tab Bar (Phase 7 Item 20)
  if (mobileBar) {
    if (user.isAdmin) {
      mobileBar.innerHTML = `
        <button type="button" class="mobile-tab-btn ${activeView === 'dashboard' ? 'active' : ''}" onclick="window.navigate('dashboard')">
          <span class="mobile-tab-icon">📊</span>
          <span>Overview</span>
        </button>
        <button type="button" class="mobile-tab-btn ${activeView === 'members' ? 'active' : ''}" onclick="window.navigate('members')">
          <span class="mobile-tab-icon">👥</span>
          <span>Members</span>
        </button>
        <button type="button" class="mobile-tab-btn" onclick="openGateCheckInModal()" style="color:var(--accent-text);">
          <span class="mobile-tab-icon" style="background:var(--accent-subtle); padding:2px 8px; border-radius:999px;">🚪</span>
          <span>Check-In</span>
        </button>
        <button type="button" class="mobile-tab-btn ${activeView === 'dues' ? 'active' : ''}" onclick="window.navigate('dues')">
          <span class="mobile-tab-icon">💰</span>
          <span>Dues</span>
        </button>
        <button type="button" class="mobile-tab-btn ${activeView === 'equipment' ? 'active' : ''}" onclick="window.navigate('equipment')">
          <span class="mobile-tab-icon">🏋️</span>
          <span>Equipment</span>
        </button>
      `;
    } else if (user.isMember) {
      mobileBar.innerHTML = `
        <button type="button" class="mobile-tab-btn ${activeView === 'home' ? 'active' : ''}" onclick="window.navigate('home')">
          <span class="mobile-tab-icon">🏠</span>
          <span>Home</span>
        </button>
        <button type="button" class="mobile-tab-btn ${activeView === 'member-portal' ? 'active' : ''}" onclick="window.navigate('member-portal')">
          <span class="mobile-tab-icon">📱</span>
          <span>My Pass</span>
        </button>
        <button type="button" class="mobile-tab-btn ${activeView === 'attendance' ? 'active' : ''}" onclick="window.navigate('attendance')">
          <span class="mobile-tab-icon">🏃</span>
          <span>Attendance</span>
        </button>
        <button type="button" class="mobile-tab-btn" onclick="openTermsModal()">
          <span class="mobile-tab-icon">📜</span>
          <span>Terms</span>
        </button>
      `;
    } else {
      mobileBar.innerHTML = `
        <button type="button" class="mobile-tab-btn ${activeView === 'home' ? 'active' : ''}" onclick="window.navigate('home')">
          <span class="mobile-tab-icon">🏠</span>
          <span>Home</span>
        </button>
        <button type="button" class="mobile-tab-btn" onclick="scrollToSection('section-trial-pass')">
          <span class="mobile-tab-icon">🎟️</span>
          <span>Free Trial</span>
        </button>
        <button type="button" class="mobile-tab-btn" onclick="scrollToSection('section-classes')">
          <span class="mobile-tab-icon">🗓️</span>
          <span>Classes</span>
        </button>
        <button type="button" class="mobile-tab-btn" onclick="openRoleModal()">
          <span class="mobile-tab-icon">🔑</span>
          <span>Login</span>
        </button>
      `;
    }
  }
}

function scrollToSection(id) {
  if (activeView !== 'home') {
    window.navigate('home');
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  } else {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }
}

function render() {
  const container = document.getElementById('view-root');
  if (!container) return;

  updateRoleUI();

  if (activeView !== 'home') {
    cleanupHomeEffects();
  }

  switch (activeView) {
    case 'home':
      renderHome(container);
      break;
    case 'dashboard':
      renderDashboard(container);
      break;
    case 'members':
      renderMembers(container);
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
    case 'equipment':
      renderEquipmentView(container);
      break;
    case 'referrals':
      renderReferralsView(container);
      break;
    case 'member-portal':
      renderMemberPortal(container);
      break;
    case 'plans':
      renderPlans(container);
      break;
    case 'settings':
      renderSettings(container);
      break;
    default:
      renderHome(container);
  }
}

// ==========================================
// 1. DASHBOARD VIEW (With SVG Charts)
// ==========================================
function renderDashboard(container) {
  const metrics = getOverviewMetrics();
  const outstandingDues = store.getFeeDues().filter(d => d.status === 'Pending');
  const recentPayments = store.getPayments().slice(0, 5);
  const equipCounts = getEquipmentSummaryCounts();

  container.innerHTML = `
    <div class="view-header">
      <div>
        <h1 class="view-title">Operations Overview &amp; Analytics</h1>
        <p class="view-subtitle">Anytime Fitness Sector 34 Sohna — Live operational telemetry, revenue and floor assets</p>
      </div>
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button type="button" class="btn btn-secondary" onclick="openGateCheckInModal()">🚪 Front-Desk Check-In</button>
        <button type="button" class="btn btn-secondary" onclick="openAddMemberModal()">+ Add Member</button>
        <button type="button" class="btn btn-primary" onclick="openAddDueModal()">+ Create Fee Due</button>
      </div>
    </div>

    <!-- Core Metrics Row -->
    <div class="metrics-row" style="margin-bottom: 1.5rem;">
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
        <div class="metric-sub">${outstandingDues.length} pending dues awaiting settlement</div>
      </div>

      <div class="metric-card" style="border-left: 4px solid var(--danger);">
        <div class="metric-label">Accrued Late Penalties</div>
        <div class="metric-val tabular-nums" style="color: ${metrics.pendingPenaltiesTotal > 0 ? 'var(--danger-text)' : 'var(--text-main)'};">
          ${formatINR(metrics.pendingPenaltiesTotal)}
        </div>
        <div class="metric-sub">${metrics.overdueDuesCount} dues past 5-day grace period</div>
      </div>
    </div>

    <!-- SVG Charts Grid (Phase 3 Item 9) -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
      <div id="chart-rev-slot"></div>
      <div id="chart-donut-slot"></div>
    </div>

    <!-- Plan Enrollment Breakdown Chart -->
    <div id="chart-plans-slot" style="margin-bottom: 1.5rem;"></div>

    <!-- Floor Equipment Health Summary Banner (Phase 6 Item 18) -->
    <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.25rem; margin-bottom: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <h3 style="margin: 0; font-size: 1.05rem; color: var(--text-main);">Gym Floor Assets &amp; Maintenance Status</h3>
          <p style="margin: 0.2rem 0 0 0; font-size: 0.8rem; color: var(--text-muted);">Current health of machines and free weights across all zones</p>
        </div>
        <button type="button" class="btn btn-sm btn-secondary" onclick="window.navigate('equipment')">Manage Floor Inventory →</button>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem;">
        <div style="background: var(--bg-subtle); padding: 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--border);">
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Operational Machines</div>
          <div class="tabular-nums" style="font-size: 1.4rem; font-weight: 700; color: #10b981;">${equipCounts.working} / ${equipCounts.total}</div>
        </div>
        <div style="background: var(--bg-subtle); padding: 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--border);">
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Needs Repair / Broken</div>
          <div class="tabular-nums" style="font-size: 1.4rem; font-weight: 700; color: var(--danger-text);">${equipCounts.broken + equipCounts.needsRepair} units</div>
        </div>
        <div style="background: var(--bg-subtle); padding: 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--border);">
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Missing / Requisitions</div>
          <div class="tabular-nums" style="font-size: 1.4rem; font-weight: 700; color: var(--warning-text);">${equipCounts.missing + equipCounts.required} items</div>
        </div>
        <div style="background: var(--bg-subtle); padding: 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--border);">
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Open Defect Tickets</div>
          <div class="tabular-nums" style="font-size: 1.4rem; font-weight: 700; color: var(--accent-text);">${equipCounts.issues} pending</div>
        </div>
      </div>
    </div>

    <!-- Active Outstanding Dues Table -->
    <div class="table-card">
      <div class="table-toolbar">
        <div>
          <span class="table-toolbar-title">Active Outstanding Fee Dues</span>
          <span class="badge badge-pending" style="margin-left: 0.5rem;">${outstandingDues.length} Outstanding</span>
        </div>
        <button type="button" class="btn btn-sm btn-secondary" onclick="window.navigate('dues')">Manage Outstanding Dues →</button>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Due Date</th>
              <th>Base Fee</th>
              <th>Late Penalty (Transparent Math)</th>
              <th>Total Payable</th>
              <th>Overdue Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${outstandingDues.length === 0 ? `
              <tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">🎉 Zero outstanding dues! All gym fees are settled.</td></tr>
            ` : outstandingDues.map(d => {
              const m = store.getMember(d.member_id);
              const p = calculateDuePenalty(d);
              const waUrl = m ? generateWhatsAppReminderUrl(m, d) : '#';

              return `
                <tr>
                  <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      ${renderAvatar(m, 28)}
                      <div>
                        <a href="#" class="member-link" onclick="openMemberProfileModal(${d.member_id}); return false;">
                          <strong>${m ? m.full_name : 'Unknown'}</strong>
                        </a>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${m ? m.phone : ''}</div>
                      </div>
                    </div>
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
                        <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-secondary" title="Send WhatsApp Fee Notice">
                          💬 Notify
                        </a>
                      ` : ''}
                      <button type="button" class="btn btn-sm btn-accent" onclick="openPayModal(${d.due_id})">
                        💳 Collect Fee
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

  // Render SVG charts
  const revSlot = container.querySelector('#chart-rev-slot');
  if (revSlot) renderRevenueTrendChart(revSlot, store.getPayments());

  const donutSlot = container.querySelector('#chart-donut-slot');
  if (donutSlot) renderPaymentSplitDonut(donutSlot, store.getPayments());

  const plansSlot = container.querySelector('#chart-plans-slot');
  if (plansSlot) renderPlanEnrollmentChart(plansSlot, store.getMembers(), store.getPlans());
}

// ==========================================
// 2. MEMBERS VIEW (With Avatars & CSV Export)
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
        <h1 class="view-title">Gym Members Directory</h1>
        <p class="view-subtitle">${members.length} registered members at Anytime Fitness Sohna</p>
      </div>
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button type="button" class="btn btn-primary" onclick="openAddMemberModal()">+ Add New Member</button>
        <button type="button" class="btn btn-secondary" id="btn-export-members">📥 Export CSV</button>
      </div>
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
              <th>Member</th>
              <th>Contact Phone</th>
              <th>Email</th>
              <th>Membership Plan</th>
              <th>Referral Code</th>
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
                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                      ${renderAvatar(m, 34)}
                      <div>
                        <a href="#" class="member-link" onclick="openMemberProfileModal(${m.member_id}); return false;">
                          <strong>${m.full_name}</strong>
                        </a>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">Joined ${formatDate(m.join_date)}</div>
                      </div>
                    </div>
                  </td>
                  <td class="tabular-nums">${m.phone}</td>
                  <td>${m.email || '—'}</td>
                  <td>
                    <span class="badge" style="background: var(--bg-subtle); color: var(--text-secondary); border: 1px solid var(--border);">
                      ${plan ? plan.plan_name : 'Custom'}
                    </span>
                  </td>
                  <td>
                    <span class="badge" style="font-family: var(--font-mono); font-size: 0.75rem; background: var(--bg-card); border: 1px solid var(--border);">
                      ${m.referral_code}
                    </span>
                  </td>
                  <td>
                    <span class="badge badge-${m.status.toLowerCase()}">${m.status}</span>
                  </td>
                  <td style="text-align: right;">
                    <div style="display: inline-flex; gap: 0.35rem;">
                      <button 
                        type="button" 
                        class="btn btn-sm btn-secondary" 
                        onclick="openGateCheckInModal(${m.member_id})"
                        title="Check-In at Gate"
                      >
                        🚪 Entry
                      </button>
                      <button 
                        type="button" 
                        class="btn btn-sm btn-secondary" 
                        onclick="openMemberProfileModal(${m.member_id})"
                        title="View Full Profile &amp; Pass"
                      >
                        Profile
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

  // Attach search and filter listeners
  container.querySelector('#member-search')?.addEventListener('input', (e) => {
    memberSearch = e.target.value.toLowerCase().trim();
    renderMembers(container);
  });

  container.querySelector('#member-filter-status')?.addEventListener('change', (e) => {
    memberFilter = e.target.value;
    renderMembers(container);
  });

  container.querySelector('#member-sort-select')?.addEventListener('change', (e) => {
    memberSort = e.target.value;
    renderMembers(container);
  });

  // Export CSV Handler (Phase 3 Item 11)
  container.querySelector('#btn-export-members')?.addEventListener('click', () => {
    const headers = ['Member ID', 'Full Name', 'Phone', 'Email', 'Plan ID', 'Plan Name', 'Join Date', 'Status', 'Referral Code'];
    const rows = filtered.map(m => {
      const p = store.getPlan(m.plan_id);
      return [
        m.member_id,
        m.full_name,
        m.phone,
        m.email || '',
        m.plan_id,
        p ? p.plan_name : 'Custom',
        m.join_date,
        m.status,
        m.referral_code
      ];
    });
    exportToCsv('AnytimeFitness_Members_Export', headers, rows);
  });
}

// ==========================================
// 3. FEE DUES VIEW (With CSV Export)
// ==========================================
function renderFeeDues(container) {
  const dues = store.getFeeDues();
  const rule = store.getPenaltyRule();

  let filtered = dues.filter(d => {
    if (duesFilter === 'PENDING' && d.status !== 'Pending') return false;
    if (duesFilter === 'OVERDUE') {
      if (d.status !== 'Pending') return false;
      const p = calculateDuePenalty(d);
      if (p.penalty <= 0) return false;
    }
    if (duesSearch) {
      const m = store.getMember(d.member_id);
      const nameMatch = m && m.full_name.toLowerCase().includes(duesSearch);
      const phoneMatch = m && m.phone.includes(duesSearch);
      const idMatch = String(d.due_id).includes(duesSearch);
      if (!nameMatch && !phoneMatch && !idMatch) return false;
    }
    return true;
  });

  container.innerHTML = `
    <div class="view-header">
      <div>
        <h1 class="view-title">Fee Dues &amp; Penalty Ledger</h1>
        <p class="view-subtitle">Automated grace calculations (5 days free, ₹10/day, max ₹500)</p>
      </div>
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button type="button" class="btn btn-primary" onclick="openAddDueModal()">+ Create Fee Due</button>
        <button type="button" class="btn btn-secondary" id="btn-export-dues">📥 Export CSV</button>
      </div>
    </div>

    <div class="table-card">
      <div class="table-toolbar">
        <input 
          type="search" 
          class="search-input" 
          placeholder="Search by member name, phone or due #..." 
          id="dues-search"
          value="${escapeHtml(duesSearch)}"
        />
        <div style="display: flex; gap: 0.5rem;">
          <button type="button" class="btn btn-sm ${duesFilter === 'ALL' ? 'btn-accent' : 'btn-secondary'} dues-tab" data-filter="ALL">All Dues</button>
          <button type="button" class="btn btn-sm ${duesFilter === 'PENDING' ? 'btn-accent' : 'btn-secondary'} dues-tab" data-filter="PENDING">Pending Only</button>
          <button type="button" class="btn btn-sm ${duesFilter === 'OVERDUE' ? 'btn-accent' : 'btn-secondary'} dues-tab" data-filter="OVERDUE">Overdue Past Grace</button>
        </div>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Due #</th>
              <th>Member</th>
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
              <tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">No fee dues match the criteria.</td></tr>
            ` : filtered.map(d => {
              const m = store.getMember(d.member_id);
              const isPending = d.status === 'Pending';
              const p = calculateDuePenalty(d);
              const waUrl = m ? generateWhatsAppReminderUrl(m, d) : '#';

              return `
                <tr>
                  <td class="tabular-nums font-bold">#${d.due_id}</td>
                  <td>
                    ${m ? `
                      <a href="#" class="member-link" onclick="openMemberProfileModal(${m.member_id}); return false;">
                        <strong>${m.full_name}</strong>
                      </a>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">${m.phone}</div>
                    ` : 'Unknown'}
                  </td>
                  <td class="tabular-nums">${formatDate(d.due_date)}</td>
                  <td class="tabular-nums">${formatINR(d.fee_amount)}</td>
                  <td class="tabular-nums" style="color: ${isPending && p.penalty > 0 ? 'var(--danger-text)' : 'var(--text-muted)'};">
                    ${isPending ? (p.penalty > 0 ? `+${formatINR(p.penalty)}` : '₹0') : '—'}
                  </td>
                  <td class="tabular-nums font-bold" style="color: var(--accent-text);">
                    ${formatINR(isPending ? p.totalPayable : d.fee_amount)}
                  </td>
                  <td>
                    <span class="badge ${isPending ? (p.penalty > 0 ? 'badge-overdue' : 'badge-pending') : 'badge-paid'}">
                      ${d.status} ${isPending && p.penalty > 0 ? `(${p.daysOverdue}d late)` : ''}
                    </span>
                  </td>
                  <td style="text-align: right;">
                    <div style="display: inline-flex; gap: 0.35rem;">
                      ${isPending ? `
                        ${m ? `
                          <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-secondary" title="WhatsApp Payment Link">
                            💬
                          </a>
                        ` : ''}
                        <button type="button" class="btn btn-sm btn-accent" onclick="openPayModal(${d.due_id})">
                          💳 Settle
                        </button>
                        <button type="button" class="btn btn-sm btn-secondary" style="color: var(--danger-text);" onclick="handleDeleteDue(${d.due_id})" title="Cancel Due">
                          ✕
                        </button>
                      ` : `
                        <span style="font-size: 0.8rem; color: #10b981; font-weight: 600;">Settled ✓</span>
                      `}
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

  container.querySelector('#dues-search')?.addEventListener('input', (e) => {
    duesSearch = e.target.value.toLowerCase().trim();
    renderFeeDues(container);
  });

  container.querySelectorAll('.dues-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      duesFilter = tab.dataset.filter;
      renderFeeDues(container);
    });
  });

  container.querySelector('#btn-export-dues')?.addEventListener('click', () => {
    const headers = ['Due ID', 'Member ID', 'Member Name', 'Phone', 'Due Date', 'Base Fee Amount', 'Late Penalty Amount', 'Total Payable', 'Status'];
    const rows = filtered.map(d => {
      const m = store.getMember(d.member_id);
      const p = calculateDuePenalty(d);
      return [
        d.due_id,
        d.member_id,
        m ? m.full_name : '',
        m ? m.phone : '',
        d.due_date,
        d.fee_amount,
        d.status === 'Pending' ? p.penalty : 0,
        d.status === 'Pending' ? p.totalPayable : d.fee_amount,
        d.status
      ];
    });
    exportToCsv('AnytimeFitness_Fee_Dues_Export', headers, rows);
  });
}

// ==========================================
// 4. PAYMENTS VIEW (With Preset Tags & CSV Export)
// ==========================================
function renderPayments(container) {
  const payments = store.getPayments();

  let filtered = payments.filter(p => {
    if (paymentsFilterMode !== 'ALL' && p.payment_mode !== paymentsFilterMode) return false;
    if (paymentsSearch) {
      const due = store.getFeeDue(p.due_id);
      const m = due ? store.getMember(due.member_id) : null;
      const nameMatch = m && m.full_name.toLowerCase().includes(paymentsSearch);
      const idMatch = String(p.payment_id).includes(paymentsSearch);
      const notesMatch = (p.notes || '').toLowerCase().includes(paymentsSearch);
      if (!nameMatch && !idMatch && !notesMatch) return false;
    }
    return true;
  });

  container.innerHTML = `
    <div class="view-header">
      <div>
        <h1 class="view-title">Payment Collections &amp; Receipts</h1>
        <p class="view-subtitle">${payments.length} transactions processed via UPI, Card, and Cash</p>
      </div>
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button type="button" class="btn btn-secondary" id="btn-export-payments">📥 Export CSV</button>
      </div>
    </div>

    <div class="table-card">
      <div class="table-toolbar">
        <input 
          type="search" 
          class="search-input" 
          placeholder="Search by receipt #, member name, or notes..." 
          id="payments-search"
          value="${escapeHtml(paymentsSearch)}"
        />
        <div style="display: flex; gap: 0.5rem;">
          <button type="button" class="btn btn-sm ${paymentsFilterMode === 'ALL' ? 'btn-accent' : 'btn-secondary'} pay-mode-tab" data-mode="ALL">All Modes</button>
          <button type="button" class="btn btn-sm ${paymentsFilterMode === 'UPI' ? 'btn-accent' : 'btn-secondary'} pay-mode-tab" data-mode="UPI">UPI</button>
          <button type="button" class="btn btn-sm ${paymentsFilterMode === 'Card' ? 'btn-accent' : 'btn-secondary'} pay-mode-tab" data-mode="Card">Card</button>
          <button type="button" class="btn btn-sm ${paymentsFilterMode === 'Cash' ? 'btn-accent' : 'btn-secondary'} pay-mode-tab" data-mode="Cash">Cash</button>
        </div>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Receipt #</th>
              <th>Member</th>
              <th>Date Settled</th>
              <th>Fee Paid</th>
              <th>Penalty Paid</th>
              <th>Total Collected</th>
              <th>Mode &amp; Tag</th>
              <th>Reference / Notes</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.length === 0 ? `
              <tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">No payment transactions found.</td></tr>
            ` : filtered.map(p => {
              const due = store.getFeeDue(p.due_id);
              const m = due ? store.getMember(due.member_id) : null;
              const total = Number(p.fee_paid) + Number(p.penalty_paid || 0);

              return `
                <tr>
                  <td class="tabular-nums font-bold">#${p.payment_id}</td>
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
                  <td class="tabular-nums font-bold" style="color: var(--accent-text);">${formatINR(total)}</td>
                  <td>
                    <span class="badge badge-paid">${p.payment_mode}</span>
                    ${p.tag ? `<span class="badge" style="font-size:0.7rem; background:var(--bg-card); border:1px solid var(--border); margin-left:0.25rem;">${p.tag}</span>` : ''}
                  </td>
                  <td>
                    <span style="font-size: 0.8rem; color: var(--text-secondary);">${p.notes || '—'}</span>
                  </td>
                  <td style="text-align: right;">
                    <div style="display: inline-flex; gap: 0.35rem;">
                      <button type="button" class="btn btn-sm btn-secondary" onclick="openReceiptModal(${p.payment_id})">
                        🧾 Receipt
                      </button>
                      <button type="button" class="btn btn-sm btn-secondary" style="color: var(--danger-text);" onclick="handleVoidPayment(${p.payment_id})" title="Void Transaction">
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

  container.querySelector('#payments-search')?.addEventListener('input', (e) => {
    paymentsSearch = e.target.value.toLowerCase().trim();
    renderPayments(container);
  });

  container.querySelectorAll('.pay-mode-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      paymentsFilterMode = tab.dataset.mode;
      renderPayments(container);
    });
  });

  container.querySelector('#btn-export-payments')?.addEventListener('click', () => {
    const headers = ['Receipt #', 'Due ID', 'Member Name', 'Paid Date', 'Fee Paid', 'Penalty Paid', 'Total Settled', 'Payment Mode', 'Preset Tag', 'Notes'];
    const rows = filtered.map(p => {
      const due = store.getFeeDue(p.due_id);
      const m = due ? store.getMember(due.member_id) : null;
      const total = Number(p.fee_paid) + Number(p.penalty_paid || 0);
      return [
        p.payment_id,
        p.due_id,
        m ? m.full_name : '',
        p.paid_date,
        p.fee_paid,
        p.penalty_paid || 0,
        total,
        p.payment_mode,
        p.tag || '',
        p.notes || ''
      ];
    });
    exportToCsv('AnytimeFitness_Payments_Export', headers, rows);
  });
}

// ==========================================
// 5. PLANS VIEW
// ==========================================
function renderPlans(container) {
  const plans = store.getPlans();
  const members = store.getMembers();

  container.innerHTML = `
    <div class="view-header">
      <div>
        <h1 class="view-title">Membership Plans</h1>
        <p class="view-subtitle">Subscription packages and monthly billing structures</p>
      </div>
      <button type="button" class="btn btn-primary" onclick="openAddPlanModal()">+ Add New Plan</button>
    </div>

    <div class="plans-grid">
      ${plans.map(p => {
        const enrolled = members.filter(m => m.plan_id === p.plan_id).length;
        const totalCost = p.duration_months * p.monthly_fee;

        return `
          <div class="plan-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
              <span class="badge" style="background: var(--bg-subtle); color: var(--text-secondary); border: 1px solid var(--border);">
                Plan #${p.plan_id}
              </span>
              <span class="badge badge-active">${enrolled} Enrolled</span>
            </div>
            <div class="plan-name">${p.plan_name}</div>
            <div class="plan-fee">
              ${formatINR(p.monthly_fee)} <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: normal;">/ month</span>
            </div>
            <div class="plan-duration">
              ${p.duration_months} Month${p.duration_months > 1 ? 's' : ''} term · Total ${formatINR(totalCost)}
            </div>

            <div style="margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; gap: 0.5rem;">
              <button type="button" class="btn btn-sm btn-secondary" onclick="openEditPlanModal(${p.plan_id})">
                Edit Plan
              </button>
              <button type="button" class="btn btn-sm btn-secondary" style="color: var(--danger-text);" onclick="handleDeletePlan(${p.plan_id})">
                Delete
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ==========================================
// 6. SETTINGS VIEW (DBMS Console & Reset)
// ==========================================
function renderSettings(container) {
  const rule = store.getPenaltyRule();
  const sqlLogs = store.getSqlLogs();

  container.innerHTML = `
    <div class="view-header">
      <div>
        <h1 class="view-title">Database &amp; Operational Policies</h1>
        <p class="view-subtitle">Anytime Fitness Sohna — Late penalty formulas, SQL telemetry, and backups</p>
      </div>
      <button type="button" class="btn btn-secondary" onclick="exportJsonBackupFile()">
        💾 Download Backup JSON
      </button>
    </div>

    <!-- Penalty Rule Editor -->
    <div class="table-card" style="margin-bottom: 1.5rem; padding: 1.5rem;">
      <h3 style="margin-top: 0; margin-bottom: 0.5rem; color: var(--text-main);">Statutory Late Fee Calculation Engine</h3>
      <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1.25rem;">
        Formula: <code>Late Fee = Max(0, Days Elapsed - Grace Days) × Penalty/Day</code> (Capped at Max Penalty Limit)
      </p>

      <form id="form-penalty-rule" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; align-items: end;">
        <div class="form-field" style="margin-bottom: 0;">
          <label>Grace Period (Days)</label>
          <input type="number" id="set-grace" value="${rule.grace_days}" min="0" required />
        </div>
        <div class="form-field" style="margin-bottom: 0;">
          <label>Penalty Per Day (₹)</label>
          <input type="number" id="set-rate" value="${rule.penalty_per_day}" min="0" step="0.5" required />
        </div>
        <div class="form-field" style="margin-bottom: 0;">
          <label>Maximum Penalty Cap (₹)</label>
          <input type="number" id="set-cap" value="${rule.max_penalty}" min="0" step="10" required />
        </div>
        <div>
          <button type="submit" class="btn btn-primary" style="width: 100%;">Save Penalty Formula</button>
        </div>
      </form>
    </div>

    <!-- Live SQL Transaction Query Log -->
    <div class="table-card" style="margin-bottom: 1.5rem;">
      <div class="table-toolbar">
        <div>
          <span class="table-toolbar-title">Live SQL Transaction Activity</span>
          <span class="badge badge-active" style="margin-left: 0.5rem;">gym_db</span>
        </div>
        <button type="button" class="btn btn-sm btn-secondary" onclick="downloadSqlDump()">Export .SQL Dump</button>
      </div>
      <div style="background: var(--bg-body); padding: 1rem; font-family: var(--font-mono); font-size: 0.8rem; max-height: 280px; overflow-y: auto; line-height: 1.6; color: var(--text-secondary);">
        ${sqlLogs.map(l => `
          <div style="margin-bottom: 0.4rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.35rem;">
            <span style="color: var(--text-muted);">[${l.timestamp}]</span> 
            <span style="color: var(--accent-text);">${escapeHtml(l.query)}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Data Reset & Import Tools -->
    <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
      <button type="button" class="btn btn-secondary" onclick="openImportModal()">
        📥 Restore from JSON Backup
      </button>
      <button type="button" class="btn btn-secondary" style="color: var(--danger-text);" onclick="resetDatabasePrompt()">
        ⚠️ Reset Database to Clean Seed State
      </button>
    </div>
  `;

  container.querySelector('#form-penalty-rule')?.addEventListener('submit', (e) => {
    e.preventDefault();
    try {
      store.updatePenaltyRule({
        grace_days: container.querySelector('#set-grace').value,
        penalty_per_day: container.querySelector('#set-rate').value,
        max_penalty: container.querySelector('#set-cap').value
      });
      showToast('Penalty rule updated.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

// ==========================================
// GLOBAL ROLE SWITCHER MODAL (Phase 1 Item 1)
// ==========================================
window.openRoleModal = function () {
  const dialog = document.getElementById('modal-generic');
  if (!dialog) return;

  const user = auth.getUser();
  const members = store.getMembers().sort((a, b) => a.full_name.localeCompare(b.full_name));

  dialog.innerHTML = `
    <div class="modal-head">
      <div>
        <span class="modal-head-title">🔐 Switch Access Experience</span>
        <span class="badge badge-active" style="margin-left: 0.5rem;">Role-Based Routing</span>
      </div>
      <button type="button" class="btn btn-sm btn-secondary" onclick="closeModal()">✕</button>
    </div>

    <div style="padding: 1.25rem;">
      <p style="color: var(--text-secondary); font-size: 0.88rem; margin-top: 0; margin-bottom: 1.25rem;">
        Test the dual-portal architecture of Anytime Fitness Sohna. Switch between Manager operations, personal member portal, or public visitor mode.
      </p>

      <div style="display: grid; gap: 1rem;">
        <!-- Option 1: Admin / Manager -->
        <div style="background: var(--bg-card); border: 2px solid ${user.isAdmin ? 'var(--accent)' : 'var(--border)'}; border-radius: var(--radius-md); padding: 1rem; cursor: pointer;" onclick="selectRole('admin')">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
            <strong style="color: var(--text-main); font-size: 1.05rem;">🛡️ Gym Manager (Admin Portal)</strong>
            ${user.isAdmin ? '<span class="badge badge-active">Active</span>' : ''}
          </div>
          <div style="font-size: 0.8rem; color: var(--text-secondary);">
            Full administrative access: Operations Overview, Members, Turnstile Attendance, Fee Dues, Payments, Equipment Inventory, and Database Settings.
          </div>
        </div>

        <!-- Option 2: Member Portal -->
        <div style="background: var(--bg-card); border: 2px solid ${user.isMember ? 'var(--accent)' : 'var(--border)'}; border-radius: var(--radius-md); padding: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <strong style="color: var(--text-main); font-size: 1.05rem;">👤 Member Portal (User Pass)</strong>
            ${user.isMember ? '<span class="badge badge-active">Active</span>' : ''}
          </div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.75rem;">
            Personal member view: Digital 24/7 QR Pass, active plan expiry, fee due settlement, workout streak, referral rewards, and floor fault reporting.
          </div>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <select id="role-member-select" class="form-control" style="flex: 1; font-size: 0.85rem;">
              ${members.map(m => `
                <option value="${m.member_id}" ${user.memberId === m.member_id ? 'selected' : ''}>
                  #${m.member_id} - ${m.full_name} (${m.phone}) - ${m.status}
                </option>
              `).join('')}
            </select>
            <button type="button" class="btn btn-sm btn-primary" onclick="selectMemberFromDropdown()">
              Login as Member
            </button>
          </div>
        </div>

        <!-- Option 3: Public Visitor -->
        <div style="background: var(--bg-card); border: 2px solid ${user.isPublic ? 'var(--accent)' : 'var(--border)'}; border-radius: var(--radius-md); padding: 1rem; cursor: pointer;" onclick="selectRole('public')">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
            <strong style="color: var(--text-main); font-size: 1.05rem;">🌐 Public Visitor (Landing Page)</strong>
            ${user.isPublic ? '<span class="badge badge-active">Active</span>' : ''}
          </div>
          <div style="font-size: 0.8rem; color: var(--text-secondary);">
            Unauthenticated experience: Explore club walkthrough, photo gallery, weekly class timetable, coach roster, BMI &amp; calorie recommender, and book free trial pass.
          </div>
        </div>
      </div>
    </div>

    <div class="modal-foot">
      <button type="button" class="btn btn-secondary" onclick="closeModal()">Close</button>
    </div>
  `;

  if (!dialog.open) dialog.showModal();
};

window.selectRole = function (role) {
  if (role === 'admin') {
    auth.loginAsAdmin();
    showToast('Switched to Gym Manager (Admin Portal)', 'info');
    closeModal();
    window.navigate('dashboard');
  } else if (role === 'public') {
    auth.loginAsPublic();
    showToast('Switched to Public Visitor', 'info');
    closeModal();
    window.navigate('home');
  }
};

window.selectMemberFromDropdown = function () {
  const select = document.getElementById('role-member-select');
  if (!select) return;
  const memberId = select.value;
  auth.loginAsMember(memberId);
  const m = store.getMember(memberId);
  showToast(`Logged in as Member: ${m ? m.full_name : 'Member'}`, 'info');
  closeModal();
  window.navigate('member-portal');
};

// ==========================================
// MEMBER PROFILE & DIGITAL PASS MODAL (Phase 4 Item 14)
// ==========================================
window.openMemberProfileModal = function (memberId) {
  const details = store.getMemberDetails(memberId);
  if (!details) return;
  const { dues, payments } = details;
  const plan = store.getPlan(details.plan_id);
  const pendingDues = dues.filter(d => d.status === 'Pending');
  const totalPaid = payments.reduce((acc, p) => acc + (p.fee_paid || 0) + (p.penalty_paid || 0), 0);
  const totalPendingFee = pendingDues.reduce((acc, d) => acc + calculateDuePenalty(d).total_payable, 0);

  const dialog = document.getElementById('modal-generic');
  if (!dialog) return;

  const qrSvg = generateQRCodeSVG(`AF-PASS-${details.member_id}`, 95);

  dialog.innerHTML = `
    <div class="modal-head">
      <div>
        <span class="modal-head-title">${details.full_name}</span>
        <span class="badge badge-${details.status.toLowerCase()}" style="margin-left: 0.5rem;">${details.status}</span>
      </div>
      <button type="button" class="btn btn-sm btn-secondary" onclick="closeModal()">✕</button>
    </div>

    <div class="modal-body-content" style="max-height: 80vh; overflow-y: auto;">
      <!-- Digital Member Pass QR Card (Phase 4 Item 14) -->
      <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-card); padding: 1rem; border-radius: var(--radius-md); border: 2px solid var(--accent); margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <div style="background: #ffffff; padding: 6px; border-radius: var(--radius-sm); box-shadow: 0 4px 12px rgba(0,0,0,0.25); display: flex;">
            ${qrSvg}
          </div>
          <div>
            <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Digital Member Pass (Model-2 QR)</div>
            <strong style="color: var(--text-main); font-family: var(--font-mono); font-size: 1.15rem;">AF-PASS-${details.member_id}</strong>
            <div style="font-size: 0.8rem; color: var(--accent-text); margin-top: 0.25rem;">
              Referral Code: ${details.referral_code}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Scan at gate for contactless turnstile entry</div>
          </div>
        </div>

        <div style="display: flex; gap: 0.4rem; flex-direction: column;">
          <button type="button" class="btn btn-sm btn-primary" onclick="closeModal(); openGateCheckInModal(${details.member_id});">
            🚪 Gate Check-In
          </button>
          <button type="button" class="btn btn-sm btn-secondary" onclick="window.print()">
            🖨️ Print Pass
          </button>
        </div>
      </div>

      <!-- Personal & Plan Statistics Grid -->
      <div class="profile-card-grid">
        <div class="profile-stat-box">
          <div class="profile-stat-label">Phone Contact</div>
          <div class="profile-stat-val">${details.phone}</div>
        </div>
        <div class="profile-stat-box">
          <div class="profile-stat-label">Enrolled Plan</div>
          <div class="profile-stat-val">${plan ? plan.plan_name : 'Standard'}</div>
        </div>
        <div class="profile-stat-box">
          <div class="profile-stat-label">Join Date</div>
          <div class="profile-stat-val">${formatDate(details.join_date)}</div>
        </div>
        <div class="profile-stat-box">
          <div class="profile-stat-label">Outstanding Dues</div>
          <div class="profile-stat-val" style="color: ${totalPendingFee > 0 ? 'var(--danger-text)' : '#10b981'};">
            ${formatINR(totalPendingFee)}
          </div>
        </div>
      </div>

      <!-- Quick Action Buttons -->
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.25rem;">
        <button type="button" class="btn btn-sm btn-primary" onclick="closeModal(); openRenewMemberModal(${details.member_id});">
          🔄 Renew Subscription Cycle
        </button>
        <button type="button" class="btn btn-sm btn-secondary" onclick="closeModal(); openEditMemberModal(${details.member_id});">
          ✏️ Edit Profile
        </button>
        <button type="button" class="btn btn-sm btn-secondary" onclick="closeModal(); toggleMemberStatus(${details.member_id});">
          ${details.status === 'Active' ? 'Deactivate' : 'Activate'}
        </button>
      </div>

      <!-- Outstanding Dues Section -->
      <div>
        <div style="font-size: 0.85rem; font-weight: 700; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-secondary);">
          Billing Ledger (${pendingDues.length} Pending Dues)
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
                <tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1rem;">No outstanding dues. Account in active standing!</td></tr>
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
                      <button type="button" class="btn btn-sm btn-accent" onclick="closeModal(); openPayModal(${d.due_id});">
                        💳 Settle Due
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
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

window.openMemberModal = window.openMemberProfileModal;

// ==========================================
// ADD MEMBER MODAL (With Terms Checkbox & Referral Code)
// ==========================================
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
          <label>Mobile Number (+91) *</label>
          <input type="tel" id="m-phone" required placeholder="+91 98000 00000" />
          <span style="font-size: 0.72rem; color: var(--text-muted);">Must be a unique 10-digit mobile number.</span>
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
        <div class="form-field">
          <label>Referred by Friend Code (Optional)</label>
          <input type="text" id="m-ref-code" placeholder="e.g. AF-REF-101" />
        </div>

        <!-- Terms & Conditions Checkbox (Phase 2 Item 8) -->
        <div style="background: var(--bg-card); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border); margin-top: 0.75rem;">
          <label style="display: flex; align-items: flex-start; gap: 0.5rem; cursor: pointer; font-size: 0.82rem; color: var(--text-main);">
            <input type="checkbox" id="m-terms-accept" required checked style="margin-top: 2px;" />
            <span>
              I confirm that the member accepts the 
              <a href="#" onclick="openTermsModal(); return false;" style="color: var(--accent-text); text-decoration: underline;">
                Anytime Fitness Sohna Terms &amp; Conditions
              </a>, 
              including 24/7 key-fob rules and 5-day grace period late fee policies.
            </span>
          </label>
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
      const termsAccepted = dialog.querySelector('#m-terms-accept').checked;
      if (!termsAccepted) {
        showToast('You must accept the Terms & Conditions.', 'error');
        return;
      }

      const newM = store.addMember({
        full_name: dialog.querySelector('#m-name').value,
        phone: dialog.querySelector('#m-phone').value,
        email: dialog.querySelector('#m-email').value,
        plan_id: dialog.querySelector('#m-plan').value,
        join_date: dialog.querySelector('#m-date').value,
        referrer_code: dialog.querySelector('#m-ref-code').value,
        terms_accepted: true,
        status: 'Active'
      });
      closeModal();
      showToast(`Member "${newM.full_name}" registered successfully!`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  dialog.showModal();
};

// ==========================================
// EDIT MEMBER MODAL
// ==========================================
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
          <label>Membership Plan</label>
          <select id="em-plan">
            ${plans.map(p => `
              <option value="${p.plan_id}" ${p.plan_id === m.plan_id ? 'selected' : ''}>
                ${p.plan_name} (${formatINR(p.monthly_fee)}/mo)
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
  showToast(`Member marked as ${newStatus}.`, 'info');
};

window.handleDeleteMember = function (memberId) {
  const m = store.getMember(memberId);
  if (!m) return;

  confirmModal(
    'Delete Member Record',
    `Are you sure you want to permanently delete ${m.full_name} (#${m.member_id})? This will delete all associated dues and attendance logs.`,
    () => {
      try {
        store.deleteMember(memberId);
        showToast('Member deleted.', 'info');
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  );
};

// ==========================================
// FEE COLLECTION MODAL (With Preset Tags - Phase 3 Item 13)
// ==========================================
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
        <!-- Penalty Breakdown Card -->
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

        <!-- Quick Preset Tags (Phase 3 Item 13) -->
        <div class="form-field">
          <label>Quick Preset Payment Tags</label>
          <div style="display: flex; gap: 0.35rem; flex-wrap: wrap; margin-bottom: 0.35rem;">
            <button type="button" class="preset-tag-btn" data-tag="GPay" data-mode="UPI">GPay</button>
            <button type="button" class="preset-tag-btn" data-tag="PhonePe" data-mode="UPI">PhonePe</button>
            <button type="button" class="preset-tag-btn" data-tag="POS Terminal" data-mode="Card">POS Terminal</button>
            <button type="button" class="preset-tag-btn" data-tag="Cash" data-mode="Cash">Cash</button>
            <button type="button" class="preset-tag-btn" data-tag="Penalty Waived - Medical" data-mode="UPI">Penalty Waived - Medical</button>
          </div>
          <input type="hidden" id="pay-tag" value="" />
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
      <div class="modal-foot">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-accent">Confirm &amp; Settle</button>
      </div>
    </form>
  `;

  // Preset tag chips handler
  const tagBtns = dialog.querySelectorAll('.preset-tag-btn');
  tagBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tagBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tag = btn.dataset.tag;
      const mode = btn.dataset.mode;

      dialog.querySelector('#pay-tag').value = tag;
      dialog.querySelector('#pay-mode').value = mode;

      if (tag === 'Penalty Waived - Medical') {
        dialog.querySelector('#pay-penalty').value = 0;
        dialog.querySelector('#pay-notes').value = 'Medical exemption waived by manager';
      }
    });
  });

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
        notes: dialog.querySelector('#pay-notes').value,
        tag: dialog.querySelector('#pay-tag').value
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

window.openCollectFeeModal = window.openPayModal;

// ==========================================
// RECEIPT / INVOICE MODAL
// ==========================================
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
      <span class="modal-head-title">Member Tax Invoice &amp; Receipt</span>
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
            <div class="badge badge-paid" style="font-size: 0.85rem; padding: 0.25rem 0.65rem;">PAID &amp; SETTLED</div>
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
            <div style="font-size: 0.85rem; color: #374151;"><strong>Mode:</strong> ${payment.payment_mode} ${payment.tag ? `(${payment.tag})` : ''}</div>
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

// ==========================================
// PLANS & DUES MODALS
// ==========================================
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
          <input type="text" id="p-name" placeholder="e.g. 3-Month Summer Cut" required />
        </div>
        <div class="form-field">
          <label>Duration (Months) *</label>
          <input type="number" min="1" id="p-duration" value="3" required />
        </div>
        <div class="form-field">
          <label>Monthly Fee (₹) *</label>
          <input type="number" min="1" step="0.5" id="p-fee" placeholder="1200" required />
        </div>
      </div>
      <div class="modal-foot">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Create Plan</button>
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
          <input type="number" min="1" step="0.5" id="d-amount" placeholder="0.00" required />
        </div>
      </div>
      <div class="modal-foot">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Create Due</button>
      </div>
    </form>
  `;

  dialog.querySelector('#d-member').addEventListener('change', (e) => {
    const sel = e.target.options[e.target.selectedIndex];
    const fee = sel.dataset.fee;
    if (fee) dialog.querySelector('#d-amount').value = fee;
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

// ==========================================
// DBMS UTILITIES & EXPORTS
// ==========================================
window.downloadSqlDump = function () {
  const sql = store.generateSqlDump();
  const blob = new Blob([sql], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `anytime_fitness_dump_${new Date().toISOString().split('T')[0]}.sql`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('SQL dump downloaded.', 'success');
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
      <button type="submit" class="btn btn-primary" id="btn-do-import">Restore Database</button>
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

// ==========================================
// MODAL & TOAST HELPERS
// ==========================================
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

export function showToast(msg, type = 'info') {
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

window.showToast = showToast;

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', init);
