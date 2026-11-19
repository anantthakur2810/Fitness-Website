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

    if (!id || !pw) {
      throw new Error('Please enter both admin username and password.');
    }

    const validUsernames = ['admin', 'admin@anytimefitness.com', 'manager'];
    const validPasswords = ['admin123'];

    if (validUsernames.includes(id) && validPasswords.includes(pw)) {
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

    throw new Error('Invalid Admin username or password.');
  }

  loginAsMember(identifier, password) {
    const id = (identifier || '').trim().toLowerCase();
    const cleanNum = id.replace(/[^0-9]/g, '');
    const pw = (password || '').trim();

    if (!id || !pw) {
      throw new Error('Please enter your member ID/phone/email and password.');
    }

    const members = store.getMembers();
    const found = members.find(m => {
      if (String(m.member_id) === id) return true;
      if (m.email && m.email.toLowerCase() === id) return true;
      if (cleanNum && cleanNum.length >= 4 && m.phone.replace(/[^0-9]/g, '').includes(cleanNum)) return true;
      return false;
    });

    if (!found) {
      throw new Error('Member not found. Please check your Member ID, Phone, or Email.');
    }

    // Require member123 or member's phone last 4 digits
    const phoneDigits = found.phone.replace(/[^0-9]/g, '');
    const last4 = phoneDigits.slice(-4);
    if (pw !== 'member123' && pw !== last4) {
      throw new Error('Incorrect password. Please try again.');
    }

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
 * Open the Universal Role-Based Login Modal (Secure: No pre-filled IDs or demo buttons)
 * @param {'member' | 'admin'} initialTab 
 */
export function openAuthModal(initialTab = 'member') {
  const dialog = document.getElementById('modal-generic');
  if (!dialog) return;

  dialog.innerHTML = `
    <div class="auth-modal-container">
      <div class="auth-modal-head">
        <div>
          <h2 class="auth-title">Sign In</h2>
          <p class="auth-subtitle">Anytime Fitness Sohna</p>
        </div>
        <button type="button" class="auth-close-btn" onclick="closeModal()" title="Close Modal">✕</button>
      </div>

      <div class="auth-tab-bar">
        <button 
          type="button" 
          class="auth-tab-btn ${initialTab === 'member' ? 'active' : ''}" 
          id="auth-tab-btn-member"
          onclick="switchAuthTab('member')"
        >
          Member Portal
        </button>
        <button 
          type="button" 
          class="auth-tab-btn ${initialTab === 'admin' ? 'active' : ''}" 
          id="auth-tab-btn-admin"
          onclick="switchAuthTab('admin')"
        >
          Admin & Staff
        </button>
      </div>

      <!-- MEMBER LOGIN PANEL -->
      <div id="auth-panel-member" class="auth-tab-panel ${initialTab === 'member' ? 'active' : ''}">
        <form id="form-member-login" class="auth-form">
          <div class="form-field">
            <label>Member ID, Phone Number, or Email *</label>
            <input 
              type="text" 
              id="member-login-id" 
              placeholder="Member ID, phone, or email" 
              required 
              autocomplete="username"
            />
          </div>

          <div class="form-field">
            <label>Member PIN / Password *</label>
            <input 
              type="password" 
              id="member-login-pw" 
              placeholder="••••••••" 
              required 
              autocomplete="current-password"
            />
          </div>

          <button type="submit" class="btn btn-block auth-submit-btn">
            Sign In
          </button>
        </form>
      </div>

      <!-- ADMIN LOGIN PANEL -->
      <div id="auth-panel-admin" class="auth-tab-panel ${initialTab === 'admin' ? 'active' : ''}">
        <form id="form-admin-login" class="auth-form">
          <div class="form-field">
            <label>Admin Username or Email *</label>
            <input 
              type="text" 
              id="admin-login-id" 
              placeholder="Admin username or email" 
              required 
              autocomplete="username"
            />
          </div>

          <div class="form-field">
            <label>Admin Password *</label>
            <input 
              type="password" 
              id="admin-login-pw" 
              placeholder="••••••••" 
              required 
              autocomplete="current-password"
            />
          </div>

          <button type="submit" class="btn btn-block auth-submit-btn">
            Sign In
          </button>
        </form>
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
 * Logout handler
 */
export function handleLogout() {
  auth.logout();
  window.showToast?.('Signed out successfully.', 'info');
  window.navigate('home');
}

if (typeof window !== 'undefined') {
  window.openAuthModal = openAuthModal;
  window.switchAuthTab = switchAuthTab;
  window.handleLogout = handleLogout;
}
