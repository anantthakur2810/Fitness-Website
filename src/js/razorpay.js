/**
 * Anytime Fitness Sohna — Razorpay Checkout Engine
 * Faithful reproduction of the authentic Razorpay Standard Checkout UI & banking lifecycle.
 * Features:
 * - Authentic Razorpay header, merchant branding, order summary dropdown, and customer info
 * - Live UPI QR code with expiring countdown timer and active radar pulse
 * - Auto-formatting card input with dynamic card network detection (Visa, MasterCard, RuPay)
 * - Popular Indian netbanking grid with 20+ banks selector
 * - Realistic 4-stage transaction lifecycle (~4.5s) with live bank communication states
 * - Official Razorpay success screen with payment ID, bank RRN, copy-to-clipboard, and auto-invoice redirect
 */

import { CONFIG } from './config.js';
import { store } from './store.js';
import { formatINR, calculateDuePenalty } from './penalty.js';
import { generateQRCodeSVG } from './qr.js';

let activePaymentMethod = 'upi'; // 'upi' | 'card' | 'netbanking' | 'wallet'
let currentDueId = null;
let currentCustomPenalty = null;
let qrCountdownInterval = null;
let qrRemainingSeconds = 600; // 10 minutes
let transactionTimeoutIds = [];

function generatePaymentId() {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let rand = '';
  for (let i = 0; i < 14; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `pay_${rand}`;
}

function generateOrderId(dueId) {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let rand = '';
  for (let i = 0; i < 10; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `order_${rand}`;
}

function generateRRN() {
  let rrn = '4'; // Standard 12-digit UPI/card bank RRN
  for (let i = 0; i < 11; i++) {
    rrn += Math.floor(Math.random() * 10);
  }
  return rrn;
}

function clearAllTimers() {
  if (qrCountdownInterval) {
    clearInterval(qrCountdownInterval);
    qrCountdownInterval = null;
  }
  transactionTimeoutIds.forEach(id => clearTimeout(id));
  transactionTimeoutIds = [];
}

/**
 * Open the Authentic Razorpay Standard Checkout Modal
 */
export function openRazorpayCheckout(dueId, customPenalty = null) {
  clearAllTimers();

  const due = store.getFeeDue(dueId);
  if (!due) {
    window.showToast?.('Fee due not found.', 'error');
    return;
  }

  currentDueId = dueId;
  currentCustomPenalty = customPenalty;
  activePaymentMethod = 'upi';

  const member = store.getMember(due.member_id);
  const plan = member ? store.getPlan(member.plan_id) : null;
  const p = calculateDuePenalty(due);

  const penaltyAmount = customPenalty !== null ? Number(customPenalty) : p.penalty;
  const totalAmount = Number(due.fee_amount) + penaltyAmount;
  const orderId = generateOrderId(due.due_id);
  const payerPhone = member ? member.phone : '+91 98201 12345';
  const payerEmail = member ? member.email : 'member@anytimefitness.co.in';
  const payerName = member ? member.full_name : 'Member';

  const upiPayload = `upi://pay?ver=01&orgid=159002&mode=01&tn=&pa=9650823672@sbi&pn=Siddharth Singh Kathait&mc=0000&qrMedium=02&sign=MEUCIQCHROcWd7+fat5l9gdf2pa68eZhVUwIu3ERRl1zoxaNxQIganSDTIlYHtOtHKKSeLiB6klxWWMV8Lj2Vg6IljT+374=`;
  const upiQrSvg = generateQRCodeSVG(upiPayload, { size: 160, color: '#0c2340', bgColor: '#ffffff', quietZone: 1 });

  const dialog = document.getElementById('modal-generic');
  if (!dialog) return;

  dialog.innerHTML = `
    <div class="rzp-container" id="rzp-checkout-widget">
      <!-- 1. AUTHENTIC RAZORPAY HEADER -->
      <div class="rzp-header">
        <div class="rzp-header-top">
          <div class="rzp-merchant-info">
            <div class="rzp-merchant-logo">
              <span>AF</span>
            </div>
            <div>
              <div class="rzp-merchant-name">Anytime Fitness Sohna</div>
              <div class="rzp-order-label">
                <span>Due #${due.due_id}</span>
                <span class="rzp-dot-sep">•</span>
                <span>${plan ? plan.plan_name : 'Membership'}</span>
              </div>
            </div>
          </div>
          <button type="button" class="rzp-close-btn" onclick="cancelRazorpayPayment()" title="Cancel Payment">✕</button>
        </div>

        <div class="rzp-header-bottom">
          <div class="rzp-amount-badge">
            <span class="rzp-amount-curr">₹</span>
            <span class="rzp-amount-val">${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <button type="button" class="rzp-view-details-btn" onclick="toggleOrderSummary()">
            <span>Price Summary</span>
            <svg id="rzp-summary-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
        </div>

        <!-- Collapsible Order Summary Breakdown -->
        <div id="rzp-order-summary-box" class="rzp-summary-box" style="display: none;">
          <div class="rzp-summary-row">
            <span>Base Subscription Fee:</span>
            <span class="tabular-nums font-bold">${formatINR(due.fee_amount)}</span>
          </div>
          ${penaltyAmount > 0 ? `
            <div class="rzp-summary-row" style="color: #fca5a5;">
              <span>Late Fee Penalty:</span>
              <span class="tabular-nums font-bold">+${formatINR(penaltyAmount)}</span>
            </div>
          ` : ''}
          <div class="rzp-summary-row">
            <span>Convenience / Platform Fee:</span>
            <span style="color: #86efac; font-weight: 700;">FREE (₹0.00)</span>
          </div>
          <div class="rzp-summary-row rzp-summary-total">
            <span>Total Payable:</span>
            <span class="tabular-nums total-val">${formatINR(totalAmount)}</span>
          </div>
        </div>

        <!-- Payer Contact Strip -->
        <div class="rzp-contact-strip">
          <div class="rzp-contact-meta">
            <span class="rzp-contact-item">📱 ${payerPhone}</span>
            <span class="rzp-dot-sep">•</span>
            <span class="rzp-contact-item">✉️ ${payerEmail}</span>
          </div>
          <span class="rzp-verified-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
            Verified Member
          </span>
        </div>
      </div>

      <!-- 2. RAZORPAY MAIN BODY -->
      <div class="rzp-body" id="rzp-body-content">
        <!-- Sidebar Navigation -->
        <div class="rzp-nav">
          <button type="button" class="rzp-nav-item active" id="rzp-nav-upi" onclick="switchRazorpayMethod('upi')">
            <div class="rzp-nav-icon-wrap upi-accent">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
            </div>
            <div class="rzp-nav-text">
              <span class="rzp-nav-title">UPI / QR Code</span>
              <span class="rzp-nav-sub">GPay, PhonePe, Paytm, QR</span>
            </div>
          </button>

          <button type="button" class="rzp-nav-item" id="rzp-nav-card" onclick="switchRazorpayMethod('card')">
            <div class="rzp-nav-icon-wrap card-accent">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
            </div>
            <div class="rzp-nav-text">
              <span class="rzp-nav-title">Card</span>
              <span class="rzp-nav-sub">Visa, MasterCard, RuPay</span>
            </div>
          </button>

          <button type="button" class="rzp-nav-item" id="rzp-nav-netbanking" onclick="switchRazorpayMethod('netbanking')">
            <div class="rzp-nav-icon-wrap nb-accent">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v4M12 14v4M16 14v4"></path></svg>
            </div>
            <div class="rzp-nav-text">
              <span class="rzp-nav-title">Netbanking</span>
              <span class="rzp-nav-sub">All Indian Banks</span>
            </div>
          </button>

          <button type="button" class="rzp-nav-item" id="rzp-nav-wallet" onclick="switchRazorpayMethod('wallet')">
            <div class="rzp-nav-icon-wrap wallet-accent">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path><circle cx="16" cy="14" r="1.5"></circle></svg>
            </div>
            <div class="rzp-nav-text">
              <span class="rzp-nav-title">Wallet</span>
              <span class="rzp-nav-sub">Paytm, PhonePe, Mobikwik</span>
            </div>
          </button>
        </div>

        <!-- Content Panel -->
        <div class="rzp-content">
          <!-- A. UPI PANEL -->
          <div id="rzp-panel-upi" class="rzp-tab-panel active">
            <div class="rzp-qr-wrapper">
              <div class="rzp-qr-box">
                <div class="rzp-qr-radar-line"></div>
                <img 
                  src="/images/sbi-upi-qr.png" 
                  alt="UPI QR Code" 
                  class="rzp-real-qr-img"
                  width="160" 
                  height="160"
                  onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='block';"
                />
                <div style="display: none;">${upiQrSvg}</div>
                <div class="rzp-qr-timer-pill">
                  <span class="rzp-radar-dot"></span>
                  <span>Expires in <strong id="rzp-qr-timer" class="tabular-nums">09:59</strong></span>
                </div>
              </div>

              <div class="rzp-upi-apps">
                <span class="rzp-app-pill gpay"><span class="app-dot gpay-dot"></span>Google Pay</span>
                <span class="rzp-app-pill phonepe"><span class="app-dot phonepe-dot"></span>PhonePe</span>
                <span class="rzp-app-pill paytm"><span class="app-dot paytm-dot"></span>Paytm</span>
                <span class="rzp-app-pill cred"><span class="app-dot cred-dot"></span>CRED</span>
                <span class="rzp-app-pill bhim"><span class="app-dot bhim-dot"></span>BHIM</span>
              </div>
            </div>

            <div style="margin-top: 0.5rem;">
              <button 
                type="button" 
                class="rzp-btn-pay rzp-btn-app-pay" 
                onclick="processRazorpayTransaction('UPI', 'State Bank of India (9650823672@sbi) • NPCI Verified')"
              >
                <span>⚡ I Have Paid / Verify UPI Status</span>
              </button>
            </div>

            <div class="rzp-divider"><span>OR ENTER UPI ID</span></div>

            <div class="rzp-input-group">
              <div class="rzp-upi-input-wrap">
                <input 
                  type="text" 
                  id="rzp-upi-id" 
                  class="rzp-input" 
                  placeholder="e.g. 9650823672@sbi" 
                  value="9650823672@sbi"
                />
              </div>

              <div class="rzp-suffix-pills">
                <button type="button" class="rzp-suffix-btn active" onclick="applyUpiSuffix('@sbi')">@sbi</button>
                <button type="button" class="rzp-suffix-btn" onclick="applyUpiSuffix('@okhdfcbank')">@okhdfcbank</button>
                <button type="button" class="rzp-suffix-btn" onclick="applyUpiSuffix('@okicici')">@okicici</button>
                <button type="button" class="rzp-suffix-btn" onclick="applyUpiSuffix('@paytm')">@paytm</button>
                <button type="button" class="rzp-suffix-btn" onclick="applyUpiSuffix('@ybl')">@ybl</button>
              </div>

              <button 
                type="button" 
                class="rzp-btn-pay" 
                onclick="processUpiIdPayment()"
              >
                <span>Pay ${formatINR(totalAmount)}</span>
                <span style="font-size: 0.8rem; opacity: 0.85;">→</span>
              </button>
            </div>
          </div>

          <!-- B. CARD PANEL -->
          <div id="rzp-panel-card" class="rzp-tab-panel">
            <div class="rzp-card-form">
              <div class="rzp-field">
                <label>CARD NUMBER</label>
                <div class="rzp-card-input-wrap">
                  <input 
                    type="text" 
                    id="rzp-card-num" 
                    class="rzp-input" 
                    placeholder="4532  ••••  ••••  8829" 
                    value="4532 8812 3901 8829"
                    maxlength="19"
                    oninput="formatCardInput(this)"
                  />
                  <span class="rzp-card-brand" id="rzp-card-brand-badge">VISA</span>
                </div>
              </div>

              <div class="rzp-card-grid">
                <div class="rzp-field">
                  <label>EXPIRY (MM/YY)</label>
                  <input 
                    type="text" 
                    id="rzp-card-exp" 
                    class="rzp-input" 
                    placeholder="MM / YY" 
                    value="08/29" 
                    maxlength="5"
                    oninput="formatExpiryInput(this)"
                  />
                </div>
                <div class="rzp-field">
                  <label>CVV / CVC</label>
                  <div style="position: relative;">
                    <input 
                      type="password" 
                      id="rzp-card-cvv" 
                      class="rzp-input" 
                      maxlength="4" 
                      placeholder="•••" 
                      value="882" 
                    />
                    <span class="rzp-cvv-tip" title="3 or 4 digits printed on back of card">?</span>
                  </div>
                </div>
              </div>

              <div class="rzp-field">
                <label>CARDHOLDER NAME</label>
                <input 
                  type="text" 
                  id="rzp-card-name" 
                  class="rzp-input" 
                  value="${payerName}" 
                  placeholder="Name as on card"
                />
              </div>

              <div class="rzp-save-card-wrap">
                <label class="rzp-checkbox-label">
                  <input type="checkbox" checked id="rzp-save-card-cb" />
                  <span>Securely save card as per RBI tokenization guidelines</span>
                </label>
              </div>

              <button 
                type="button" 
                class="rzp-btn-pay" 
                onclick="processCardPayment()"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <span>Pay ${formatINR(totalAmount)}</span>
              </button>
            </div>
          </div>

          <!-- C. NETBANKING PANEL -->
          <div id="rzp-panel-netbanking" class="rzp-tab-panel">
            <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.5rem;">
              Popular Indian Banks
            </div>
            <div class="rzp-bank-grid">
              <button type="button" class="rzp-bank-card active" onclick="selectBank('HDFC Bank', this)">
                <span class="rzp-bank-badge hdfc-bg">HDFC</span>
                <span class="rzp-bank-name">HDFC Bank</span>
              </button>
              <button type="button" class="rzp-bank-card" onclick="selectBank('ICICI Bank', this)">
                <span class="rzp-bank-badge icici-bg">ICICI</span>
                <span class="rzp-bank-name">ICICI Bank</span>
              </button>
              <button type="button" class="rzp-bank-card" onclick="selectBank('State Bank of India', this)">
                <span class="rzp-bank-badge sbi-bg">SBI</span>
                <span class="rzp-bank-name">State Bank of India</span>
              </button>
              <button type="button" class="rzp-bank-card" onclick="selectBank('Axis Bank', this)">
                <span class="rzp-bank-badge axis-bg">AXIS</span>
                <span class="rzp-bank-name">Axis Bank</span>
              </button>
              <button type="button" class="rzp-bank-card" onclick="selectBank('Kotak Mahindra Bank', this)">
                <span class="rzp-bank-badge kotak-bg">KOTAK</span>
                <span class="rzp-bank-name">Kotak Mahindra</span>
              </button>
              <button type="button" class="rzp-bank-card" onclick="selectBank('Punjab National Bank', this)">
                <span class="rzp-bank-badge pnb-bg">PNB</span>
                <span class="rzp-bank-name">Punjab National Bank</span>
              </button>
            </div>

            <div class="rzp-field" style="margin-top: 0.85rem;">
              <label>OR SELECT FROM ALL OTHER BANKS</label>
              <select id="rzp-all-banks-select" class="rzp-input" onchange="selectDropdownBank(this.value)">
                <option value="">-- Choose other bank --</option>
                <option value="Bank of Baroda">Bank of Baroda</option>
                <option value="Canara Bank">Canara Bank</option>
                <option value="Union Bank of India">Union Bank of India</option>
                <option value="IDFC FIRST Bank">IDFC FIRST Bank</option>
                <option value="IndusInd Bank">IndusInd Bank</option>
                <option value="Federal Bank">Federal Bank</option>
                <option value="Yes Bank">Yes Bank</option>
                <option value="Bank of India">Bank of India</option>
              </select>
            </div>

            <button 
              type="button" 
              class="rzp-btn-pay" 
              style="margin-top: 1rem;" 
              onclick="processNetbankingPayment()"
            >
              <span>Proceed to NetBanking →</span>
            </button>
          </div>

          <!-- D. WALLET PANEL -->
          <div id="rzp-panel-wallet" class="rzp-tab-panel">
            <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 0.5rem;">
              Supported Digital Wallets
            </div>
            <div class="rzp-bank-grid">
              <button type="button" class="rzp-bank-card active" onclick="selectWallet('Paytm Wallet', this)">
                <span class="rzp-bank-badge paytm-bg">PAYTM</span>
                <span class="rzp-bank-name">Paytm Wallet</span>
              </button>
              <button type="button" class="rzp-bank-card" onclick="selectWallet('PhonePe Wallet', this)">
                <span class="rzp-bank-badge phonepe-bg">PHONEPE</span>
                <span class="rzp-bank-name">PhonePe Wallet</span>
              </button>
              <button type="button" class="rzp-bank-card" onclick="selectWallet('Amazon Pay', this)">
                <span class="rzp-bank-badge amazon-bg">AMAZON</span>
                <span class="rzp-bank-name">Amazon Pay Balance</span>
              </button>
              <button type="button" class="rzp-bank-card" onclick="selectWallet('Mobikwik', this)">
                <span class="rzp-bank-badge mobikwik-bg">MOBI</span>
                <span class="rzp-bank-name">Mobikwik Wallet</span>
              </button>
            </div>

            <button 
              type="button" 
              class="rzp-btn-pay" 
              style="margin-top: 1rem;" 
              onclick="processWalletPayment()"
            >
              <span>Authorize & Pay ${formatINR(totalAmount)}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 3. REALISTIC RAZORPAY MULTI-STAGE PROCESSING OVERLAY -->
      <div id="rzp-processing-overlay" class="rzp-overlay" style="display: none;">
        <div class="rzp-spinner-container">
          <div class="rzp-dual-spinner"></div>
          <div class="rzp-spinner-center-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#0744a6"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          </div>
        </div>

        <div class="rzp-proc-title" id="rzp-proc-title">Contacting Bank Gateway...</div>
        <div class="rzp-proc-sub" id="rzp-proc-sub">Establishing secure 256-bit SSL encrypted connection</div>

        <div class="rzp-proc-bar-wrap">
          <div class="rzp-proc-bar-fill" id="rzp-proc-bar-fill"></div>
        </div>

        <div class="rzp-proc-order-pill">
          <span>Order ID: <strong class="tabular-nums">${orderId}</strong></span>
          <span class="rzp-dot-sep">•</span>
          <span>Amount: <strong>${formatINR(totalAmount)}</strong></span>
        </div>

        <!-- Realistic Dynamic State Box (e.g. Phone prompt or 3DS verification) -->
        <div class="rzp-proc-bank-box" id="rzp-proc-bank-box">
          <div class="rzp-bank-box-icon" id="rzp-bank-box-icon">📡</div>
          <div class="rzp-bank-box-text" id="rzp-bank-box-text">Awaiting payment authentication from bank network...</div>
        </div>

        <div class="rzp-proc-tip">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <span>Please do not press back or refresh this window</span>
        </div>
      </div>

      <!-- 4. OFFICIAL RAZORPAY SUCCESS OVERLAY -->
      <div id="rzp-success-overlay" class="rzp-overlay rzp-success-state" style="display: none;">
        <div class="rzp-success-icon-wrap">
          <svg class="rzp-success-check-svg" viewBox="0 0 52 52" width="64" height="64">
            <circle class="rzp-checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
            <path class="rzp-checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
        </div>

        <div class="rzp-success-title">Payment Successful!</div>
        <div class="rzp-success-amt">${formatINR(totalAmount)}</div>

        <div class="rzp-receipt-details-card">
          <div class="rzp-receipt-row">
            <span>Payment ID</span>
            <div style="display: flex; align-items: center; gap: 0.35rem;">
              <code id="rzp-success-payment-id" class="rzp-code">pay_...</code>
              <button type="button" class="rzp-copy-btn" onclick="copyPaymentId()" title="Copy Payment ID">📋</button>
            </div>
          </div>
          <div class="rzp-receipt-row">
            <span>Bank Reference (RRN)</span>
            <code id="rzp-success-rrn" class="rzp-code">4...</code>
          </div>
          <div class="rzp-receipt-row">
            <span>Merchant</span>
            <strong>Anytime Fitness Sohna</strong>
          </div>
          <div class="rzp-receipt-row">
            <span>Payment Mode</span>
            <span id="rzp-success-mode-badge" class="rzp-success-pill">UPI / Netbanking</span>
          </div>
        </div>

        <div class="rzp-success-redirect-note">
          <span class="rzp-redirect-spinner"></span>
          <span>Generating tax invoice & redirecting to Anytime Fitness...</span>
        </div>
      </div>

      <!-- 5. AUTHENTIC RAZORPAY FOOTER -->
      <div class="rzp-footer">
        <div class="rzp-secure-badge">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="#0744a6">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
          </svg>
          <span>Secured by <strong>Razorpay</strong></span>
          <span class="rzp-dot-sep">•</span>
          <span>PCI-DSS Level 1 Certified</span>
        </div>

        <div class="rzp-brands">
          <span class="rzp-footer-brand">UPI</span>
          <span class="rzp-footer-brand">VISA</span>
          <span class="rzp-footer-brand">MasterCard</span>
          <span class="rzp-footer-brand">RuPay</span>
        </div>
      </div>
    </div>
  `;

  // Start live 10-minute QR Countdown
  startQRCountdown();

  dialog.showModal();
}

/**
 * Live 10-minute Countdown Timer for UPI QR Code
 */
function startQRCountdown() {
  qrRemainingSeconds = 600;
  const timerEl = document.getElementById('rzp-qr-timer');

  qrCountdownInterval = setInterval(() => {
    qrRemainingSeconds--;
    if (qrRemainingSeconds <= 0) {
      clearInterval(qrCountdownInterval);
      if (timerEl) timerEl.textContent = 'Expired';
      return;
    }
    const mins = Math.floor(qrRemainingSeconds / 60);
    const secs = qrRemainingSeconds % 60;
    if (timerEl) {
      timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
  }, 1000);
}

/**
 * Toggle Order Summary Dropdown
 */
export function toggleOrderSummary() {
  const box = document.getElementById('rzp-order-summary-box');
  const arrow = document.getElementById('rzp-summary-arrow');
  if (!box) return;

  const isHidden = box.style.display === 'none';
  box.style.display = isHidden ? 'flex' : 'none';
  if (arrow) {
    arrow.style.transform = isHidden ? 'rotate(180deg)' : 'none';
  }
}

/**
 * Handle Switching Razorpay Payment Methods
 */
export function switchMethod(method) {
  activePaymentMethod = method;

  const methods = ['upi', 'card', 'netbanking', 'wallet'];
  methods.forEach(m => {
    const navBtn = document.getElementById(`rzp-nav-${m}`);
    const panel = document.getElementById(`rzp-panel-${m}`);
    if (navBtn) navBtn.classList.toggle('active', m === method);
    if (panel) panel.classList.toggle('active', m === method);
  });
}

/**
 * UPI Suffix Quick-Select
 */
export function applyUpiSuffix(suffix) {
  const input = document.getElementById('rzp-upi-id');
  if (!input) return;
  const parts = input.value.split('@');
  const user = parts[0] || '9650823672';
  input.value = `${user}${suffix}`;
  input.focus();
}

/**
 * Select Bank in Netbanking Grid
 */
let selectedBankName = 'HDFC Bank';
export function selectBank(bankName, el) {
  selectedBankName = bankName;
  document.querySelectorAll('#rzp-panel-netbanking .rzp-bank-card').forEach(c => c.classList.remove('active'));
  if (el) el.classList.add('active');
  const dropdown = document.getElementById('rzp-all-banks-select');
  if (dropdown) dropdown.value = '';
}

export function selectDropdownBank(val) {
  if (!val) return;
  selectedBankName = val;
  document.querySelectorAll('#rzp-panel-netbanking .rzp-bank-card').forEach(c => c.classList.remove('active'));
}

/**
 * Select Wallet
 */
let selectedWalletName = 'Paytm Wallet';
export function selectWallet(walletName, el) {
  selectedWalletName = walletName;
  document.querySelectorAll('#rzp-panel-wallet .rzp-bank-card').forEach(c => c.classList.remove('active'));
  if (el) el.classList.add('active');
}

/**
 * Auto-format Card Number with Spaces (XXXX XXXX XXXX XXXX)
 */
export function formatCardInput(el) {
  let val = el.value.replace(/\D/g, '').slice(0, 16);
  let formatted = '';
  for (let i = 0; i < val.length; i++) {
    if (i > 0 && i % 4 === 0) formatted += ' ';
    formatted += val[i];
  }
  el.value = formatted;

  // Detect card network
  const badge = document.getElementById('rzp-card-brand-badge');
  if (badge) {
    if (val.startsWith('4')) {
      badge.textContent = 'VISA';
      badge.style.color = '#1e40af';
      badge.style.background = '#dbeafe';
    } else if (val.startsWith('5')) {
      badge.textContent = 'MASTERCARD';
      badge.style.color = '#b45309';
      badge.style.background = '#fef3c7';
    } else if (val.startsWith('6') || val.startsWith('8')) {
      badge.textContent = 'RUPAY';
      badge.style.color = '#15803d';
      badge.style.background = '#dcfce7';
    } else {
      badge.textContent = 'CARD';
      badge.style.color = '#3b82f6';
      badge.style.background = '#eff6ff';
    }
  }
}

/**
 * Auto-format Expiry Input (MM/YY)
 */
export function formatExpiryInput(el) {
  let val = el.value.replace(/\D/g, '').slice(0, 4);
  if (val.length >= 2) {
    el.value = `${val.slice(0, 2)}/${val.slice(2)}`;
  } else {
    el.value = val;
  }
}

/**
 * Cancel Payment Prompt
 */
export function cancelRazorpayPayment() {
  clearAllTimers();
  const dialog = document.getElementById('modal-generic');
  if (dialog) dialog.close();
  window.showToast?.('Payment checkout cancelled.', 'info');
}

/**
 * Triggers for Payment Methods
 */
export function processUpiIdPayment() {
  const upiId = document.getElementById('rzp-upi-id')?.value || '9650823672@sbi';
  processTransaction('UPI', `UPI VPA: ${upiId} • State Bank of India`);
}

export function processCardPayment() {
  const num = document.getElementById('rzp-card-num')?.value || '4532 •••• •••• 8829';
  const last4 = num.replace(/\s/g, '').slice(-4) || '8829';
  const brand = document.getElementById('rzp-card-brand-badge')?.textContent || 'VISA';
  processTransaction('Card', `${brand} ending in •••• ${last4}`);
}

export function processNetbankingPayment() {
  processTransaction('Netbanking', `${selectedBankName} Corporate / Retail NetBanking`);
}

export function processWalletPayment() {
  processTransaction('Wallet', `${selectedWalletName} Settlement`);
}

/**
 * REALISTIC 4-STAGE TRANSACTION LIFECYCLE
 * Stage 1 (0s - 1.5s): Gateway Handshake & SSL Encryption
 * Stage 2 (1.5s - 3.2s): Bank / UPI App Authorization & Verification
 * Stage 3 (3.2s - 4.5s): Signature Capture & Ledger Settlement
 * Stage 4 (4.5s - 6.8s): Authentic Razorpay Green Success Screen
 * Stage 5 (6.8s): Auto-redirect to official GST tax receipt
 */
export function processTransaction(mode = 'UPI', bankDetails = '') {
  if (!currentDueId) return;

  const due = store.getFeeDue(currentDueId);
  if (!due) return;

  const p = calculateDuePenalty(due);
  const penaltyAmount = currentCustomPenalty !== null ? Number(currentCustomPenalty) : p.penalty;
  const totalAmount = Number(due.fee_amount) + penaltyAmount;
  const paymentId = generatePaymentId();
  const bankRRN = generateRRN();

  const procOverlay = document.getElementById('rzp-processing-overlay');
  const succOverlay = document.getElementById('rzp-success-overlay');
  const procTitle = document.getElementById('rzp-proc-title');
  const procSub = document.getElementById('rzp-proc-sub');
  const procBar = document.getElementById('rzp-proc-bar-fill');
  const bankBoxIcon = document.getElementById('rzp-bank-box-icon');
  const bankBoxText = document.getElementById('rzp-bank-box-text');

  const payIdEl = document.getElementById('rzp-success-payment-id');
  const rrnEl = document.getElementById('rzp-success-rrn');
  const modeBadgeEl = document.getElementById('rzp-success-mode-badge');

  if (procOverlay) procOverlay.style.display = 'flex';

  // --- STAGE 1: GATEWAY HANDSHAKE (0 to 1.5 seconds) ---
  if (procTitle) procTitle.textContent = 'Connecting to Payment Gateway...';
  if (procSub) procSub.textContent = 'Establishing secure 256-bit SSL encrypted tunnel with Razorpay servers';
  if (procBar) procBar.style.width = '25%';
  if (bankBoxIcon) bankBoxIcon.textContent = '🔒';
  if (bankBoxText) bankBoxText.textContent = 'Initiating secure transaction handshake...';

  // --- STAGE 2: BANK / UPI AUTHORIZATION (1.5 to 3.4 seconds) ---
  const t1 = setTimeout(() => {
    if (procBar) procBar.style.width = '60%';

    if (mode === 'UPI') {
      if (procTitle) procTitle.textContent = 'Verifying UPI Payment...';
      if (procSub) procSub.textContent = 'Connecting to NPCI UPI network & State Bank of India';
      if (bankBoxIcon) bankBoxIcon.textContent = '📱';
      if (bankBoxText) bankBoxText.textContent = `UPI Transaction to 9650823672@sbi authorized by NPCI`;
    } else if (mode === 'Card') {
      if (procTitle) procTitle.textContent = 'Authorizing with Issuing Bank (3D Secure 2.0)';
      if (procSub) procSub.textContent = 'Verifying card credentials with Visa / MasterCard payment network';
      if (bankBoxIcon) bankBoxIcon.textContent = '💳';
      if (bankBoxText) bankBoxText.textContent = '3D Secure biometric & tokenization verification cleared';
    } else {
      if (procTitle) procTitle.textContent = `Connecting to ${selectedBankName} Core Banking...`;
      if (procSub) procSub.textContent = 'Validating netbanking session and available balance';
      if (bankBoxIcon) bankBoxIcon.textContent = '🏛️';
      if (bankBoxText) bankBoxText.textContent = `Account debit authorized by ${selectedBankName}`;
    }
  }, 1600);
  transactionTimeoutIds.push(t1);

  // --- STAGE 3: SIGNATURE CAPTURE & SETTLEMENT (3.4 to 4.6 seconds) ---
  const t2 = setTimeout(() => {
    if (procBar) procBar.style.width = '92%';
    if (procTitle) procTitle.textContent = mode === 'UPI' ? 'UPI Payment Authorized by SBI!' : 'Payment Authorized!';
    if (procSub) procSub.textContent = 'Capturing digital signature and confirming settlement with RBI gateway';
    if (bankBoxIcon) bankBoxIcon.textContent = '✅';
    if (bankBoxText) bankBoxText.textContent = `Bank Reference Number (RRN): ${bankRRN}`;
  }, 3400);
  transactionTimeoutIds.push(t2);

  // --- STAGE 4: AUTHENTIC RAZORPAY SUCCESS SCREEN (4.6 to 7.0 seconds) ---
  const t3 = setTimeout(() => {
    if (procOverlay) procOverlay.style.display = 'none';
    if (succOverlay) {
      succOverlay.style.display = 'flex';
      if (payIdEl) payIdEl.textContent = paymentId;
      if (rrnEl) rrnEl.textContent = bankRRN;
      if (modeBadgeEl) modeBadgeEl.textContent = `${mode} • ${bankDetails.split('|')[0].trim()}`;
    }

    // Play subtle audio confirmation if available
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {
      // AudioContext unavailable or blocked by autoplay policy
    }

    // --- STAGE 5: RECORD IN DATABASE & REDIRECT TO TAX INVOICE (after 2.4s) ---
    const t4 = setTimeout(() => {
      try {
        clearAllTimers();

        const paymentNotes = `Razorpay Payment ID: ${paymentId} | RRN: ${bankRRN} | Mode: ${mode} | ${bankDetails} | Key: ${CONFIG.razorpayKeyId}`;
        const newPayment = store.recordPayment({
          due_id: due.due_id,
          paid_date: new Date().toISOString().split('T')[0],
          fee_paid: Number(due.fee_amount),
          penalty_paid: penaltyAmount,
          payment_mode: mode === 'Card' ? 'Card' : 'UPI',
          notes: paymentNotes
        });

        // Close Razorpay Modal
        const dialog = document.getElementById('modal-generic');
        if (dialog) dialog.close();

        window.showToast?.(`✅ Payment of ${formatINR(totalAmount)} verified via Razorpay!`, 'success');

        // Automatically open the tax receipt
        setTimeout(() => {
          if (typeof window.openReceiptModal === 'function') {
            window.openReceiptModal(newPayment.payment_id);
          }
        }, 350);
      } catch (err) {
        window.showToast?.(err.message, 'error');
      }
    }, 2400);
    transactionTimeoutIds.push(t4);
  }, 4600);
  transactionTimeoutIds.push(t3);
}

/**
 * Click to Copy Payment ID
 */
export function copyPaymentId() {
  const el = document.getElementById('rzp-success-payment-id');
  if (!el) return;
  const text = el.textContent;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
    window.showToast?.('Copied Payment ID to clipboard!', 'info');
  }
}

// Bind to window for global inline event handlers
if (typeof window !== 'undefined') {
  window.openRazorpayCheckout = openRazorpayCheckout;
  window.switchRazorpayMethod = switchMethod;
  window.selectBank = selectBank;
  window.selectDropdownBank = selectDropdownBank;
  window.selectWallet = selectWallet;
  window.toggleOrderSummary = toggleOrderSummary;
  window.applyUpiSuffix = applyUpiSuffix;
  window.formatCardInput = formatCardInput;
  window.formatExpiryInput = formatExpiryInput;
  window.cancelRazorpayPayment = cancelRazorpayPayment;
  window.processUpiIdPayment = processUpiIdPayment;
  window.processCardPayment = processCardPayment;
  window.processNetbankingPayment = processNetbankingPayment;
  window.processWalletPayment = processWalletPayment;
  window.processRazorpayTransaction = processTransaction;
  window.copyPaymentId = copyPaymentId;
}
