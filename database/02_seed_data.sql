-- ============================================================================
-- APEX GYM MANAGEMENT SYSTEM — SEED DATA SCRIPT
-- File: database/02_seed_data.sql
-- Realistic test dataset for live evaluation and teacher demonstration
-- ============================================================================

USE gym_db;

-- ----------------------------------------------------------------------------
-- 1. Membership Plans
-- ----------------------------------------------------------------------------
INSERT INTO membership_plan (plan_id, plan_name, duration_months, monthly_fee) VALUES
(1, 'Monthly Standard', 1, 1500.00),
(2, 'Quarterly Fitness', 3, 1200.00),
(3, 'Half-Yearly Pro', 6, 1000.00),
(4, 'Annual Elite', 12, 850.00),
(5, 'Student Special (Quarterly)', 3, 900.00);

-- ----------------------------------------------------------------------------
-- 2. Penalty Rule Policy
-- ----------------------------------------------------------------------------
INSERT INTO penalty_rule (rule_id, grace_days, penalty_per_day, max_penalty) VALUES
(1, 5, 10.00, 500.00);

-- ----------------------------------------------------------------------------
-- 3. Gym Members (15 realistic records)
-- ----------------------------------------------------------------------------
INSERT INTO member (member_id, full_name, phone, email, join_date, plan_id, status) VALUES
(101, 'Aarav Sharma', '+91 98201 12345', 'aarav.sharma@example.com', '2026-01-10', 4, 'Active'),
(102, 'Pooja Iyer', '+91 98333 45678', 'pooja.iyer@example.com', '2026-03-15', 2, 'Active'),
(103, 'Rohan Gupta', '+91 97123 98765', 'rohan.gupta@example.com', '2026-05-01', 3, 'Active'),
(104, 'Kavita Patil', '+91 96543 21098', 'kavita.patil@example.com', '2026-08-20', 1, 'Active'),
(105, 'Arjun Nair', '+91 93210 98765', 'arjun.nair@example.com', '2026-02-01', 1, 'Inactive'),
(106, 'Sneha Kulkarni', '+91 98111 22334', 'sneha.k@example.com', '2026-01-20', 4, 'Active'),
(107, 'Vikram Singhania', '+91 98765 43210', 'vikram.s@example.com', '2026-04-10', 3, 'Active'),
(108, 'Ananya Deshmukh', '+91 99200 11223', 'ananya.d@example.com', '2026-08-01', 5, 'Active'),
(109, 'Aditya Verma', '+91 98450 67890', 'aditya.v@example.com', '2026-07-15', 2, 'Active'),
(110, 'Meera Joshi', '+91 97654 32109', 'meera.joshi@example.com', '2026-09-01', 1, 'Active'),
(111, 'Kunal Malhotra', '+91 98321 65498', 'kunal.m@example.com', '2026-02-15', 4, 'Active'),
(112, 'Priya Sen', '+91 99887 76655', 'priya.sen@example.com', '2026-08-15', 5, 'Active'),
(113, 'Rajesh Choudhary', '+91 91234 56780', 'rajesh.c@example.com', '2026-03-01', 1, 'Inactive'),
(114, 'Neha Bansal', '+91 98222 33445', 'neha.bansal@example.com', '2026-06-10', 2, 'Active'),
(115, 'Siddharth Roy', '+91 97531 86420', 'sid.roy@example.com', '2026-05-20', 3, 'Active');

-- ----------------------------------------------------------------------------
-- 4. Fee Dues (Covering Settled, Overdue, In Grace, and Upcoming)
-- ----------------------------------------------------------------------------
INSERT INTO fee_due (due_id, member_id, due_date, fee_amount, status) VALUES
-- Settled / Paid on time
(1, 101, '2026-10-01', 10200.00, 'Paid'),
(2, 102, '2026-10-05', 3600.00, 'Paid'),
(3, 106, '2026-10-10', 10200.00, 'Paid'),
(4, 107, '2026-10-12', 6000.00, 'Paid'),
(5, 111, '2026-10-15', 10200.00, 'Paid'),

-- Settled / Paid late with penalty
(6, 103, '2026-09-15', 6000.00, 'Paid'),
(7, 105, '2026-09-01', 1500.00, 'Paid'),

-- Currently Overdue (Past Grace Period -> Penalty applied)
(8, 104, '2026-10-10', 1500.00, 'Pending'),   -- 26d overdue (21d chargeable -> ₹210 penalty)
(9, 109, '2026-10-20', 3600.00, 'Pending'),   -- 16d overdue (11d chargeable -> ₹110 penalty)
(10, 113, '2026-09-01', 1500.00, 'Pending'),  -- 65d overdue (Capped at ₹500 Max Penalty)

-- Currently in Grace Period (Overdue by 1-5 days -> ₹0 penalty)
(11, 110, '2026-11-02', 1500.00, 'Pending'),  -- 3d overdue (2 grace days remaining)
(12, 108, '2026-11-04', 2700.00, 'Pending'),  -- 1d overdue (4 grace days remaining)

-- Upcoming Dues (Future due date)
(13, 112, '2026-11-10', 2700.00, 'Pending'),  -- Due in 5 days
(14, 114, '2026-11-20', 3600.00, 'Pending'),  -- Due in 15 days
(15, 115, '2026-12-01', 6000.00, 'Pending');  -- Due next month

-- ----------------------------------------------------------------------------
-- 5. Payment Records (Across UPI, Cash, and Card)
-- ----------------------------------------------------------------------------
INSERT INTO payment (payment_id, due_id, paid_date, fee_paid, penalty_paid, payment_mode, notes) VALUES
(501, 1, '2026-10-01', 10200.00, 0.00, 'Card', 'Annual Elite plan payment - HDFC Credit Card'),
(502, 2, '2026-10-05', 3600.00, 0.00, 'UPI', 'Google Pay ref #982348712'),
(503, 3, '2026-10-10', 10200.00, 0.00, 'UPI', 'PhonePe ref #339182390'),
(504, 4, '2026-10-12', 6000.00, 0.00, 'Cash', 'Counter Cash Settlement'),
(505, 5, '2026-10-15', 10200.00, 0.00, 'Card', 'ICICI Debit Card'),
(506, 6, '2026-10-05', 6000.00, 150.00, 'UPI', 'Late settlement with ₹150 penalty - Paytm'),
(507, 7, '2026-09-20', 1500.00, 100.00, 'Cash', 'Final settlement before deactivation');

-- ----------------------------------------------------------------------------
-- 6. attendance
-- Sample check-in events across RFID cards, QR codes, and turnstile gates
-- ----------------------------------------------------------------------------
INSERT INTO attendance (attendance_id, member_id, check_in_date, check_in_time, method, status, notes) VALUES
(1001, 101, '2026-11-19', '06:12:40', 'RFID Card', 'Allowed', 'Turnstile A (East Wing)'),
(1002, 102, '2026-11-19', '06:34:15', 'QR Code', 'Allowed', 'Mobile App Pass Scan'),
(1003, 106, '2026-11-19', '07:05:22', 'RFID Card', 'Allowed', 'Smart Band Tap'),
(1004, 107, '2026-11-19', '07:22:50', 'QR Code', 'Allowed', 'Turnstile B'),
(1005, 104, '2026-11-19', '08:15:10', 'QR Code', 'Overdue Warning', 'Pending fee ₹1,500 overdue alert'),
(1006, 111, '2026-11-19', '08:45:00', 'RFID Card', 'Allowed', 'Turnstile A'),
(1007, 103, '2026-11-19', '09:10:35', 'QR Code', 'Allowed', 'Turnstile A'),
(1008, 109, '2026-11-19', '11:05:18', 'RFID Card', 'Overdue Warning', 'Pending fee ₹3,600 alert'),
(1009, 114, '2026-11-19', '12:30:45', 'Manual', 'Allowed', 'Front Desk Manual Log'),
(1010, 101, '2026-11-18', '06:15:00', 'RFID Card', 'Allowed', 'Turnstile A'),
(1011, 102, '2026-11-18', '06:40:12', 'QR Code', 'Allowed', 'Turnstile B'),
(1012, 108, '2026-11-18', '07:18:40', 'QR Code', 'Allowed', 'Turnstile A'),
(1013, 112, '2026-11-18', '08:02:55', 'RFID Card', 'Allowed', 'Turnstile B'),
(1014, 105, '2026-11-18', '10:14:20', 'RFID Card', 'Blocked', 'Turnstile Locked - Inactive Member'),
(1015, 115, '2026-11-18', '18:45:30', 'QR Code', 'Allowed', 'Evening Peak Session'),
(1016, 106, '2026-11-17', '07:00:10', 'RFID Card', 'Allowed', 'Turnstile A'),
(1017, 107, '2026-11-17', '07:30:45', 'QR Code', 'Allowed', 'Turnstile B'),
(1018, 110, '2026-11-17', '08:12:00', 'RFID Card', 'Allowed', 'Turnstile A'),
(1019, 111, '2026-11-17', '17:50:20', 'RFID Card', 'Allowed', 'Turnstile A'),
(1020, 114, '2026-11-17', '19:15:10', 'QR Code', 'Allowed', 'Turnstile B');

