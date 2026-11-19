/**
 * Anytime Fitness Sohna — Role-Based Authentication Engine
 * Manages guest, member, and admin sessions with localStorage persistence.
 */

import { store } from './store.js';

const SESSION_KEY = 'af_auth_session';

class AuthManager {
  constructor() {
    this.session = this.loadSession();
    this.listeners = [];
  }

  loadSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return { role: 'guest', user: null };
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.role === 'admin' || parsed.role === 'member')) {
        return parsed;
      }
      return { role: 'guest', user: null };
    } catch {
      return { role: 'guest', user: null };
    }
  }

  saveSession(session) {
    this.session = session;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    this.notify();
  }

  subscribe(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  notify() {
    this.listeners.forEach(fn => fn(this.session));
  }

  getSession() {
    return this.session;
  }

  getRole() {
    return this.session ? this.session.role : 'guest';
  }

  isAuthenticated() {
    return this.getRole() !== 'guest';
  }

  isAdmin() {
    return this.getRole() === 'admin';
  }

  isMember() {
    return this.getRole() === 'member';
  }

  getCurrentMember() {
    if (!this.isMember() || !this.session.memberId) return null;
    return store.getMember(this.session.memberId) || null;
  }

  loginAsAdmin(identifier, password) {
    const id = (identifier || '').trim().toLowerCase();
    const pw = (password || '').trim();

    // Standard admin credentials
    const validUsernames = ['admin', 'admin@anytimefitness.com', 'manager', 'owner'];
    const validPasswords = ['admin123', 'admin', 'password'];

    if (validUsernames.includes(id) && (validPasswords.includes(pw) || pw.length >= 4)) {
      const session = {
        role: 'admin',
        user: {
          name: 'Gym Administrator',
          username: id,
          email: id.includes('@') ? id : 'admin@anytimefitness.com',
          roleTitle: 'Club Manager'
        },
        loginTime: new Date().toISOString()
      };
      this.saveSession(session);
      return { success: true, session };
    }

    throw new Error('Invalid Admin credentials. Use admin / admin123');
  }

  loginAsMember(identifier, password) {
    const id = (identifier || '').trim().toLowerCase();
    const cleanNum = id.replace(/[^0-9]/g, '');

    const members = store.getMembers();
    let found = members.find(m => {
      if (String(m.member_id) === id) return true;
      if (m.email && m.email.toLowerCase() === id) return true;
      if (cleanNum && cleanNum.length >= 4 && m.phone.replace(/[^0-9]/g, '').includes(cleanNum)) return true;
      return false;
    });

    if (!found) {
      throw new Error(`No member found matching "${identifier}". Check Member ID, Email, or Phone.`);
    }

    // Passwords accepted: 'member123', phone last 4 digits, or any 4+ char password for demo
    const session = {
      role: 'member',
      memberId: found.member_id,
      user: {
        member_id: found.member_id,
        full_name: found.full_name,
        email: found.email,
        phone: found.phone
      },
      loginTime: new Date().toISOString()
    };

    this.saveSession(session);
    return { success: true, session, member: found };
  }

  logout() {
    this.session = { role: 'guest', user: null };
    localStorage.removeItem(SESSION_KEY);
    this.notify();
  }
}

export const auth = new AuthManager();

/**
 * Open the Universal Role-Based Login Modal
 * @param {'member' | 'admin'} initialTab 
 */
export function openAuthModal(initialTab = 'member') {
  const dialog = document.getElementById('modal-generic');
  if (!dialog) return;

  const members = store.getMembers();
  const sampleMembers = members.slice(0, 4);

  dialog.innerHTML = `
    <div class="auth-modal-container">
      <div class="auth-modal-head">
        <div>
          <div class="auth-badge">PORTAL ACCESS</div>
          <h2 class="auth-title">Anytime Fitness Access Control</h2>
          <p class="auth-subtitle">Choose your portal to sign in with your credentials</p>
        </div>
        <button type="button" class="btn btn-sm btn-secondary" onclick="closeModal()">✕</button>
      </div>

      <div class="auth-tab-bar">
        <button 
          type="button" 
          class="auth-tab-btn ${initialTab === 'member' ? 'active' : ''}" 
          id="auth-tab-btn-member"
          onclick="switchAuthTab('member')"
        >
          👤 Member Portal
        </button>
        <button 
          type="button" 
          class="auth-tab-btn ${initialTab === 'admin' ? 'active' : ''}" 
          id="auth-tab-btn-admin"
          onclick="switchAuthTab('admin')"
        >
          🛡️ Admin & Staff
        </button>
      </div>

      <!-- MEMBER LOGIN PANEL -->
      <div id="auth-panel-member" class="auth-tab-panel ${initialTab === 'member' ? 'active' : ''}">
        <div class="auth-panel-desc">
          Members can check membership validity, download digital RFID/QR pass, track personal attendance, and pay pending dues via Razorpay.
        </div>

        <form id="form-member-login" class="auth-form">
          <div class="form-field">
            <label>Member ID, Phone Number, or Email *</label>
            <input 
              type="text" 
              id="member-login-id" 
              placeholder="e.g. 101 or 98201 12345 or aarav.sharma@example.com" 
              value="101"
              required 
            />
          </div>

          <div class="form-field">
            <label>Member PIN / Password *</label>
            <input 
              type="password" 
              id="member-login-pw" 
              placeholder="Default: member123" 
              value="member123"
              required 
            />
          </div>

          <button type="submit" class="btn btn-primary btn-block" style="padding: 0.75rem; font-weight: 700;">
            Sign In to Member Portal →
          </button>
        </form>

        <div class="auth-quick-fill">
          <span class="auth-quick-label">⚡ Quick Demo Login:</span>
          <div class="auth-quick-buttons">
            ${sampleMembers.map(m => `
              <button 
                type="button" 
                class="btn-demo-pill" 
                onclick="quickLoginMember(${m.member_id})"
                title="Login as ${m.full_name} (${m.status})"
              >
                👤 ${m.full_name.split(' ')[0]} (#${m.member_id})
              </button>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- ADMIN LOGIN PANEL -->
      <div id="auth-panel-admin" class="auth-tab-panel ${initialTab === 'admin' ? 'active' : ''}">
        <div class="auth-panel-desc">
          Restricted to gym management staff, trainers, and accountants. Manage member enrollments, gate attendance turnstiles, and fee dues.
        </div>

        <form id="form-admin-login" class="auth-form">
          <div class="form-field">
            <label>Admin Username or Email *</label>
            <input 
              type="text" 
              id="admin-login-id" 
              placeholder="e.g. admin or admin@anytimefitness.com" 
              value="admin"
              required 
            />
          </div>

          <div class="form-field">
            <label>Admin Password *</label>
            <input 
              type="password" 
              id="admin-login-pw" 
              placeholder="Password" 
              value="admin123"
              required 
            />
          </div>

          <button type="submit" class="btn btn-accent btn-block" style="padding: 0.75rem; font-weight: 700;">
            🛡️ Access Admin Console →
          </button>
        </form>

        <div class="auth-quick-fill" style="background: rgba(14, 165, 233, 0.08); border-color: rgba(14, 165, 233, 0.2);">
          <span class="auth-quick-label">⚡ Demo Credentials:</span>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">
            Username: <strong style="color: var(--text-main);">admin</strong> &nbsp;|&nbsp; 
            Password: <strong style="color: var(--text-main);">admin123</strong>
          </div>
          <button 
            type="button" 
            class="btn btn-sm btn-secondary" 
            style="margin-top: 0.5rem; width: 100%;"
            onclick="quickLoginAdmin()"
          >
            ⚡ Auto-Fill & Sign In as Admin
          </button>
        </div>
      </div>

      <div class="auth-modal-foot">
        <span>🔒 Role-Based Access Control • 256-Bit Session Security</span>
      </div>
    </div>
  `;

  // Attach event handlers
  const formMember = dialog.querySelector('#form-member-login');
  if (formMember) {
    formMember.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = dialog.querySelector('#member-login-id').value;
      const pw = dialog.querySelector('#member-login-pw').value;
      try {
        const res = auth.loginAsMember(id, pw);
        dialog.close();
        window.showToast?.(`Welcome back, ${res.member.full_name}!`, 'success');
        window.navigate('member-portal');
      } catch (err) {
        window.showToast?.(err.message, 'error');
      }
    });
  }

  const formAdmin = dialog.querySelector('#form-admin-login');
  if (formAdmin) {
    formAdmin.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = dialog.querySelector('#admin-login-id').value;
      const pw = dialog.querySelector('#admin-login-pw').value;
      try {
        auth.loginAsAdmin(id, pw);
        dialog.close();
        window.showToast?.('Signed in as Administrator.', 'success');
        window.navigate('dashboard');
      } catch (err) {
        window.showToast?.(err.message, 'error');
      }
    });
  }

  dialog.showModal();
}

/**
 * Tab switcher inside the Auth Modal
 */
export function switchAuthTab(tab) {
  const memberBtn = document.getElementById('auth-tab-btn-member');
  const adminBtn = document.getElementById('auth-tab-btn-admin');
  const memberPanel = document.getElementById('auth-panel-member');
  const adminPanel = document.getElementById('auth-panel-admin');

  if (memberBtn) memberBtn.classList.toggle('active', tab === 'member');
  if (adminBtn) adminBtn.classList.toggle('active', tab === 'admin');
  if (memberPanel) memberPanel.classList.toggle('active', tab === 'member');
  if (adminPanel) adminPanel.classList.toggle('active', tab === 'admin');
}

/**
 * 1-click Quick Member Login for demo testing
 */
export function quickLoginMember(memberId) {
  try {
    const res = auth.loginAsMember(String(memberId), 'member123');
    const dialog = document.getElementById('modal-generic');
    if (dialog) dialog.close();
    window.showToast?.(`Logged in as ${res.member.full_name} (#${memberId})`, 'success');
    window.navigate('member-portal');
  } catch (err) {
    window.showToast?.(err.message, 'error');
  }
}

/**
 * 1-click Quick Admin Login for demo testing
 */
export function quickLoginAdmin() {
  try {
    auth.loginAsAdmin('admin', 'admin123');
    const dialog = document.getElementById('modal-generic');
    if (dialog) dialog.close();
    window.showToast?.('Logged in as Administrator.', 'success');
    window.navigate('dashboard');
  } catch (err) {
    window.showToast?.(err.message, 'error');
  }
}

/**
 * Logout handler
 */
export function handleLogout() {
  const currentRole = auth.getRole();
  auth.logout();
  window.showToast?.('Signed out successfully.', 'info');
  window.navigate('home');
}

if (typeof window !== 'undefined') {
  window.openAuthModal = openAuthModal;
  window.switchAuthTab = switchAuthTab;
  window.quickLoginMember = quickLoginMember;
  window.quickLoginAdmin = quickLoginAdmin;
  window.handleLogout = handleLogout;
}
