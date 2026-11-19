/**
 * Anytime Fitness Sohna — Razorpay Checkout Simulation Engine
 * Replicates the authentic Razorpay Standard Checkout UI & transaction lifecycle.
 * Configured via VITE_RAZORPAY_KEY_ID from environment / config.
 */

import { CONFIG } from './config.js';
import { store } from './store.js';
import { formatINR, calculateDuePenalty } from './penalty.js';
import { generateQRCodeSVG } from './qr.js';

let activePaymentMethod = 'upi'; // 'upi' | 'card' | 'netbanking' | 'wallet'
let currentDueId = null;
let currentCustomPenalty = null;

function generatePaymentId() {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let rand = '';
  for (let i = 0; i < 14; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `pay_${rand}`;
}

function generateOrderId(dueId) {
  return `order_AF_${dueId}_${Date.now().toString().slice(-6)}`;
}

/**
 * Open the Razorpay Clone Checkout Modal
 */
export function openRazorpayCheckout(dueId, customPenalty = null) {
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
  const rzpKey = CONFIG.razorpayKeyId || 'rzp_test_1DP5mmOlF5G5ag';

  const upiPayload = `upi://pay?pa=anytimefitness.sohna@icici&pn=AnytimeFitnessSohna&am=${totalAmount.toFixed(2)}&cu=INR&tn=Due-${due.due_id}`;
  const upiQrSvg = generateQRCodeSVG(upiPayload, { size: 140, color: '#0c2340', bgColor: '#ffffff', quietZone: 1 });

  const dialog = document.getElementById('modal-generic');
  if (!dialog) return;

  dialog.innerHTML = `
    <div class="rzp-container">
      <!-- Razorpay Header -->
      <div class="rzp-header">
        <div class="rzp-header-top">
          <div class="rzp-merchant-info">
            <div class="rzp-merchant-logo">AF</div>
            <div>
              <div class="rzp-merchant-name">${CONFIG.razorpayMerchantName}</div>
              <div class="rzp-order-label">Due #${due.due_id} • ${plan ? plan.plan_name : 'Membership'}</div>
            </div>
          </div>
          <button type="button" class="rzp-close-btn" onclick="closeModal()" title="Cancel Payment">✕</button>
        </div>

        <div class="rzp-header-bottom">
          <div class="rzp-amount-badge">
            <span class="rzp-amount-curr">₹</span>
            <span class="rzp-amount-val">${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      <!-- Razorpay Main Body -->
      <div class="rzp-body" id="rzp-body-content">
        <!-- Sidebar Navigation -->
        <div class="rzp-nav">
          <button type="button" class="rzp-nav-item active" id="rzp-nav-upi" onclick="switchRazorpayMethod('upi')">
            <span class="rzp-nav-icon">📱</span>
            <div class="rzp-nav-text">
              <span class="rzp-nav-title">UPI / QR Code</span>
              <span class="rzp-nav-sub">Google Pay, PhonePe, Paytm</span>
            </div>
          </button>

          <button type="button" class="rzp-nav-item" id="rzp-nav-card" onclick="switchRazorpayMethod('card')">
            <span class="rzp-nav-icon">💳</span>
            <div class="rzp-nav-text">
              <span class="rzp-nav-title">Card</span>
              <span class="rzp-nav-sub">Visa, MasterCard, RuPay</span>
            </div>
          </button>

          <button type="button" class="rzp-nav-item" id="rzp-nav-netbanking" onclick="switchRazorpayMethod('netbanking')">
            <span class="rzp-nav-icon">🏛️</span>
            <div class="rzp-nav-text">
              <span class="rzp-nav-title">Netbanking</span>
              <span class="rzp-nav-sub">All Indian Banks</span>
            </div>
          </button>

          <button type="button" class="rzp-nav-item" id="rzp-nav-wallet" onclick="switchRazorpayMethod('wallet')">
            <span class="rzp-nav-icon">👛</span>
            <div class="rzp-nav-text">
              <span class="rzp-nav-title">Wallet</span>
              <span class="rzp-nav-sub">Paytm, PhonePe, Mobikwik</span>
            </div>
          </button>
        </div>

        <!-- Content Panel -->
        <div class="rzp-content">
          <!-- UPI Panel -->
          <div id="rzp-panel-upi" class="rzp-tab-panel active">
            <div class="rzp-qr-wrapper">
              <div class="rzp-qr-box">
                ${upiQrSvg}
                <div class="rzp-qr-badge">SCAN & PAY WITH ANY UPI APP</div>
              </div>
              <div class="rzp-upi-apps">
                <span class="rzp-app-pill">GPay</span>
                <span class="rzp-app-pill">PhonePe</span>
                <span class="rzp-app-pill">Paytm</span>
                <span class="rzp-app-pill">BHIM</span>
                <span class="rzp-app-pill">CRED</span>
              </div>
            </div>

            <div class="rzp-divider"><span>OR ENTER UPI ID</span></div>

            <div class="rzp-input-group">
              <input 
                type="text" 
                id="rzp-upi-id" 
                class="rzp-input" 
                placeholder="e.g. ${member ? member.phone.replace(/[^0-9]/g, '').slice(-10) : '9820112345'}@upi" 
                value="${member ? member.phone.replace(/[^0-9]/g, '').slice(-10) : '9820112345'}@okicici"
              />
              <button 
                type="button" 
                class="rzp-btn-pay" 
                onclick="processRazorpayTransaction('UPI', 'GPay/PhonePe App UPI Intent')"
              >
                Pay ${formatINR(totalAmount)}
              </button>
            </div>
          </div>

          <!-- Card Panel -->
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
                  />
                  <span class="rzp-card-brand">VISA</span>
                </div>
              </div>

              <div class="rzp-card-grid">
                <div class="rzp-field">
                  <label>EXPIRY (MM/YY)</label>
                  <input type="text" id="rzp-card-exp" class="rzp-input" placeholder="08/29" value="08/29" />
                </div>
                <div class="rzp-field">
                  <label>CVV / CVC</label>
                  <input type="password" id="rzp-card-cvv" class="rzp-input" maxlength="4" placeholder="•••" value="882" />
                </div>
              </div>

              <div class="rzp-field">
                <label>CARDHOLDER NAME</label>
                <input 
                  type="text" 
                  id="rzp-card-name" 
                  class="rzp-input" 
                  value="${member ? member.full_name : 'Aarav Sharma'}" 
                />
              </div>

              <button 
                type="button" 
                class="rzp-btn-pay" 
                onclick="processRazorpayTransaction('Card', 'HDFC Visa Card •••• 8829')"
              >
                Pay ${formatINR(totalAmount)}
              </button>
            </div>
          </div>

          <!-- Netbanking Panel -->
          <div id="rzp-panel-netbanking" class="rzp-tab-panel">
            <div class="rzp-bank-grid">
              <button type="button" class="rzp-bank-card active" onclick="selectBank('HDFC Bank', this)">
                <span class="rzp-bank-logo">🏛️</span>
                <span class="rzp-bank-name">HDFC Bank</span>
              </button>
              <button type="button" class="rzp-bank-card" onclick="selectBank('ICICI Bank', this)">
                <span class="rzp-bank-logo">🏛️</span>
                <span class="rzp-bank-name">ICICI Bank</span>
              </button>
              <button type="button" class="rzp-bank-card" onclick="selectBank('State Bank of India', this)">
                <span class="rzp-bank-logo">🏛️</span>
                <span class="rzp-bank-name">SBI</span>
              </button>
              <button type="button" class="rzp-bank-card" onclick="selectBank('Axis Bank', this)">
                <span class="rzp-bank-logo">🏛️</span>
                <span class="rzp-bank-name">Axis Bank</span>
              </button>
              <button type="button" class="rzp-bank-card" onclick="selectBank('Kotak Mahindra', this)">
                <span class="rzp-bank-logo">🏛️</span>
                <span class="rzp-bank-name">Kotak</span>
              </button>
              <button type="button" class="rzp-bank-card" onclick="selectBank('Punjab National Bank', this)">
                <span class="rzp-bank-logo">🏛️</span>
                <span class="rzp-bank-name">PNB</span>
              </button>
            </div>

            <button 
              type="button" 
              class="rzp-btn-pay" 
              style="margin-top: 1rem;" 
              onclick="processRazorpayTransaction('Netbanking', 'Netbanking HDFC Retail')"
            >
              Pay ${formatINR(totalAmount)}
            </button>
          </div>

          <!-- Wallet Panel -->
          <div id="rzp-panel-wallet" class="rzp-tab-panel">
            <div class="rzp-bank-grid">
              <button type="button" class="rzp-bank-card active" onclick="selectBank('Paytm Wallet', this)">
                <span class="rzp-bank-logo">👛</span>
                <span class="rzp-bank-name">Paytm Wallet</span>
              </button>
              <button type="button" class="rzp-bank-card" onclick="selectBank('PhonePe Wallet', this)">
                <span class="rzp-bank-logo">👛</span>
                <span class="rzp-bank-name">PhonePe Wallet</span>
              </button>
              <button type="button" class="rzp-bank-card" onclick="selectBank('Amazon Pay', this)">
                <span class="rzp-bank-logo">👛</span>
                <span class="rzp-bank-name">Amazon Pay</span>
              </button>
              <button type="button" class="rzp-bank-card" onclick="selectBank('Mobikwik', this)">
                <span class="rzp-bank-logo">👛</span>
                <span class="rzp-bank-name">Mobikwik</span>
              </button>
            </div>

            <button 
              type="button" 
              class="rzp-btn-pay" 
              style="margin-top: 1rem;" 
              onclick="processRazorpayTransaction('Wallet', 'Paytm Wallet Settlement')"
            >
              Pay ${formatINR(totalAmount)}
            </button>
          </div>
        </div>
      </div>

      <!-- Razorpay Processing Overlay (Hidden by default) -->
      <div id="rzp-processing-overlay" class="rzp-overlay" style="display: none;">
        <div class="rzp-spinner"></div>
        <div class="rzp-proc-title">Processing Payment</div>
        <div class="rzp-proc-sub">Communicating with bank payment gateway...</div>
        <div class="rzp-proc-order">${orderId} • ${formatINR(totalAmount)}</div>
        <div class="rzp-proc-tip">Please do not refresh or close this window</div>
      </div>

      <!-- Razorpay Success Overlay (Hidden by default) -->
      <div id="rzp-success-overlay" class="rzp-overlay rzp-success-state" style="display: none;">
        <div class="rzp-success-icon">
          <svg viewBox="0 0 52 52" width="56" height="56">
            <circle class="rzp-checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
            <path class="rzp-checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
        </div>
        <div class="rzp-success-title">Payment Successful!</div>
        <div class="rzp-success-amt">${formatINR(totalAmount)} Paid</div>
        <div class="rzp-success-meta" id="rzp-success-payment-id">Payment ID: pay_...</div>
        <div class="rzp-success-note">Generating official GST payment invoice...</div>
      </div>

      <!-- Razorpay Footer -->
      <div class="rzp-footer">
        <div class="rzp-secure-badge">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
          </svg>
          <span>Secured by <strong>Razorpay</strong> | PCI-DSS Compliant</span>
        </div>
        <div class="rzp-brands">
          <span>UPI</span> • <span>VISA</span> • <span>MasterCard</span> • <span>RuPay</span>
        </div>
      </div>
    </div>
  `;

  dialog.showModal();
}

/**
 * Handle Switching Razorpay Payment Methods
 */
function switchMethod(method) {
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
 * Simulate selecting a specific bank
 */
function selectBank(bankName, el) {
  document.querySelectorAll('.rzp-bank-card').forEach(c => c.classList.remove('active'));
  if (el) el.classList.add('active');
}

/**
 * Process the simulated transaction with realistic states
 */
function processTransaction(mode = 'UPI', bankDetails = '') {
  if (!currentDueId) return;

  const due = store.getFeeDue(currentDueId);
  if (!due) return;

  const p = calculateDuePenalty(due);
  const penaltyAmount = currentCustomPenalty !== null ? Number(currentCustomPenalty) : p.penalty;
  const totalAmount = Number(due.fee_amount) + penaltyAmount;
  const paymentId = generatePaymentId();

  const procOverlay = document.getElementById('rzp-processing-overlay');
  const succOverlay = document.getElementById('rzp-success-overlay');
  const payIdEl = document.getElementById('rzp-success-payment-id');

  // Step 1: Show Processing State
  if (procOverlay) procOverlay.style.display = 'flex';

  // Step 2: Transition to Success after 1.5 seconds
  setTimeout(() => {
    if (procOverlay) procOverlay.style.display = 'none';
    if (succOverlay) {
      succOverlay.style.display = 'flex';
      if (payIdEl) payIdEl.textContent = `Payment ID: ${paymentId}`;
    }

    // Step 3: Record payment in store after 1 second of success screen
    setTimeout(() => {
      try {
        const paymentNotes = `Razorpay Payment ID: ${paymentId} | Mode: ${mode} | ${bankDetails} | Key: ${CONFIG.razorpayKeyId}`;
        const newPayment = store.recordPayment({
          due_id: due.due_id,
          paid_date: new Date().toISOString().split('T')[0],
          fee_paid: Number(due.fee_amount),
          penalty_paid: penaltyAmount,
          payment_mode: mode === 'Card' ? 'Card' : mode === 'Netbanking' ? 'UPI' : 'UPI',
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
        }, 300);
      } catch (err) {
        window.showToast?.(err.message, 'error');
      }
    }, 1200);
  }, 1600);
}

if (typeof window !== 'undefined') {
  window.openRazorpayCheckout = openRazorpayCheckout;
  window.switchRazorpayMethod = switchMethod;
  window.selectBank = selectBank;
  window.processRazorpayTransaction = processTransaction;
}
