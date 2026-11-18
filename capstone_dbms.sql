-- ============================================================================
-- ANYTIME FITNESS SOHNA — COMPLETE RELATIONAL DATABASE SCRIPT
-- File: capstone_dbms.sql
-- Single-file installer for MySQL Workbench / phpMyAdmin / MySQL CLI
-- DBMS Capstone Project (Semester 3)
-- Detailed modular scripts available in ./database/
-- ============================================================================

CREATE DATABASE IF NOT EXISTS gym_db;
USE gym_db;

-- ============================================================================
-- 1. DDL: TABLE CREATION
-- ============================================================================
DROP TABLE IF EXISTS payment;
DROP TABLE IF EXISTS fee_due;
DROP TABLE IF EXISTS penalty_rule;
DROP TABLE IF EXISTS member;
DROP TABLE IF EXISTS membership_plan;

CREATE TABLE membership_plan (
    plan_id          INT PRIMARY KEY AUTO_INCREMENT,
    plan_name        VARCHAR(50) NOT NULL,
    duration_months  INT NOT NULL CHECK (duration_months > 0),
    monthly_fee      DECIMAL(8,2) NOT NULL CHECK (monthly_fee > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE member (
    member_id   INT PRIMARY KEY AUTO_INCREMENT,
    full_name   VARCHAR(100) NOT NULL,
    phone       VARCHAR(20) UNIQUE NOT NULL,
    email       VARCHAR(100),
    join_date   DATE NOT NULL,
    plan_id     INT NOT NULL,
    status      ENUM('Active','Inactive') DEFAULT 'Active',
    CONSTRAINT fk_member_plan 
        FOREIGN KEY (plan_id) REFERENCES membership_plan(plan_id) 
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE penalty_rule (
    rule_id          INT PRIMARY KEY AUTO_INCREMENT,
    grace_days       INT NOT NULL DEFAULT 5 CHECK (grace_days >= 0),
    penalty_per_day  DECIMAL(6,2) NOT NULL DEFAULT 10.00 CHECK (penalty_per_day >= 0),
    max_penalty      DECIMAL(8,2) NOT NULL DEFAULT 500.00 CHECK (max_penalty >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE fee_due (
    due_id      INT PRIMARY KEY AUTO_INCREMENT,
    member_id   INT NOT NULL,
    due_date    DATE NOT NULL,
    fee_amount  DECIMAL(8,2) NOT NULL CHECK (fee_amount > 0),
    status      ENUM('Pending','Paid') DEFAULT 'Pending',
    CONSTRAINT fk_fee_due_member 
        FOREIGN KEY (member_id) REFERENCES member(member_id) 
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE payment (
    payment_id    INT PRIMARY KEY AUTO_INCREMENT,
    due_id        INT NOT NULL,
    paid_date     DATE NOT NULL,
    fee_paid      DECIMAL(8,2) NOT NULL CHECK (fee_paid >= 0),
    penalty_paid  DECIMAL(8,2) DEFAULT 0.00 CHECK (penalty_paid >= 0),
    payment_mode  ENUM('Cash','UPI','Card') NOT NULL,
    notes         VARCHAR(255) DEFAULT NULL,
    CONSTRAINT fk_payment_due 
        FOREIGN KEY (due_id) REFERENCES fee_due(due_id) 
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 2. INDEXES
-- ============================================================================
CREATE INDEX idx_member_phone ON member(phone);
CREATE INDEX idx_member_plan ON member(plan_id);
CREATE INDEX idx_fee_due_member ON fee_due(member_id);
CREATE INDEX idx_fee_due_status ON fee_due(status);
CREATE INDEX idx_fee_due_date ON fee_due(due_date);
CREATE INDEX idx_payment_due ON payment(due_id);
CREATE INDEX idx_payment_date ON payment(paid_date);
CREATE INDEX idx_payment_mode ON payment(payment_mode);

-- ============================================================================
-- 3. SEED DATA (SAMPLE RECORDS)
-- ============================================================================
INSERT INTO membership_plan (plan_id, plan_name, duration_months, monthly_fee) VALUES
(1, 'Monthly Standard', 1, 1500.00),
(2, 'Quarterly Fitness', 3, 1200.00),
(3, 'Half-Yearly Pro', 6, 1000.00),
(4, 'Annual Elite', 12, 850.00),
(5, 'Student Special (Quarterly)', 3, 900.00);

INSERT INTO penalty_rule (rule_id, grace_days, penalty_per_day, max_penalty) VALUES
(1, 5, 10.00, 500.00);

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

INSERT INTO fee_due (due_id, member_id, due_date, fee_amount, status) VALUES
(1, 101, '2026-10-01', 10200.00, 'Paid'),
(2, 102, '2026-10-05', 3600.00, 'Paid'),
(3, 106, '2026-10-10', 10200.00, 'Paid'),
(4, 107, '2026-10-12', 6000.00, 'Paid'),
(5, 111, '2026-10-15', 10200.00, 'Paid'),
(6, 103, '2026-09-15', 6000.00, 'Paid'),
(7, 105, '2026-09-01', 1500.00, 'Paid'),
(8, 104, '2026-10-10', 1500.00, 'Pending'),
(9, 109, '2026-10-20', 3600.00, 'Pending'),
(10, 113, '2026-09-01', 1500.00, 'Pending'),
(11, 110, '2026-11-02', 1500.00, 'Pending'),
(12, 108, '2026-11-04', 2700.00, 'Pending'),
(13, 112, '2026-11-10', 2700.00, 'Pending'),
(14, 114, '2026-11-20', 3600.00, 'Pending'),
(15, 115, '2026-12-01', 6000.00, 'Pending');

INSERT INTO payment (payment_id, due_id, paid_date, fee_paid, penalty_paid, payment_mode, notes) VALUES
(501, 1, '2026-10-01', 10200.00, 0.00, 'Card', 'Annual Elite plan payment - HDFC Credit Card'),
(502, 2, '2026-10-05', 3600.00, 0.00, 'UPI', 'Google Pay ref #982348712'),
(503, 3, '2026-10-10', 10200.00, 0.00, 'UPI', 'PhonePe ref #339182390'),
(504, 4, '2026-10-12', 6000.00, 0.00, 'Cash', 'Counter Cash Settlement'),
(505, 5, '2026-10-15', 10200.00, 0.00, 'Card', 'ICICI Debit Card'),
(506, 6, '2026-10-05', 6000.00, 150.00, 'UPI', 'Late settlement with ₹150 penalty - Paytm'),
(507, 7, '2026-09-20', 1500.00, 100.00, 'Cash', 'Final settlement before deactivation');

-- ============================================================================
-- 4. VIEWS
-- ============================================================================
CREATE OR REPLACE VIEW v_member_dues_ledger AS
SELECT 
    m.member_id,
    m.full_name,
    m.phone,
    p.plan_name,
    d.due_id,
    d.due_date,
    d.fee_amount,
    d.status AS due_status,
    pay.payment_id,
    pay.paid_date,
    pay.fee_paid,
    pay.penalty_paid,
    pay.payment_mode
FROM member m
JOIN membership_plan p ON m.plan_id = p.plan_id
JOIN fee_due d ON m.member_id = d.member_id
LEFT JOIN payment pay ON d.due_id = pay.due_id;

CREATE OR REPLACE VIEW v_revenue_by_plan AS
SELECT 
    p.plan_id,
    p.plan_name,
    p.duration_months,
    p.monthly_fee,
    COUNT(DISTINCT m.member_id) AS enrolled_members,
    COALESCE(SUM(pay.fee_paid), 0) AS total_fee_collected,
    COALESCE(SUM(pay.penalty_paid), 0) AS total_penalties_collected,
    COALESCE(SUM(pay.fee_paid + pay.penalty_paid), 0) AS gross_revenue
FROM membership_plan p
LEFT JOIN member m ON p.plan_id = m.plan_id
LEFT JOIN fee_due d ON m.member_id = d.member_id
LEFT JOIN payment pay ON d.due_id = pay.due_id
GROUP BY p.plan_id, p.plan_name, p.duration_months, p.monthly_fee;

CREATE OR REPLACE VIEW v_overdue_defaulters AS
SELECT 
    m.member_id,
    m.full_name,
    m.phone,
    d.due_id,
    d.due_date,
    d.fee_amount AS base_fee,
    DATEDIFF(CURRENT_DATE, d.due_date) AS total_days_overdue,
    r.grace_days,
    GREATEST(0, DATEDIFF(CURRENT_DATE, d.due_date) - r.grace_days) AS chargeable_days,
    LEAST(r.max_penalty, GREATEST(0, DATEDIFF(CURRENT_DATE, d.due_date) - r.grace_days) * r.penalty_per_day) AS calculated_penalty,
    (d.fee_amount + LEAST(r.max_penalty, GREATEST(0, DATEDIFF(CURRENT_DATE, d.due_date) - r.grace_days) * r.penalty_per_day)) AS total_payable
FROM fee_due d
JOIN member m ON d.member_id = m.member_id
CROSS JOIN penalty_rule r
WHERE d.status = 'Pending' AND DATEDIFF(CURRENT_DATE, d.due_date) > r.grace_days;

-- ============================================================================
-- 5. STORED PROCEDURES & TRIGGERS
-- ============================================================================
DELIMITER //

DROP PROCEDURE IF EXISTS sp_record_payment //
CREATE PROCEDURE sp_record_payment (
    IN p_due_id INT,
    IN p_paid_date DATE,
    IN p_fee_paid DECIMAL(8,2),
    IN p_penalty_paid DECIMAL(8,2),
    IN p_payment_mode VARCHAR(10),
    IN p_notes VARCHAR(255)
)
BEGIN
    DECLARE v_current_status VARCHAR(10);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    SELECT status INTO v_current_status FROM fee_due WHERE due_id = p_due_id;

    IF v_current_status IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Fee due does not exist.';
    ELSEIF v_current_status = 'Paid' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Fee due is already Paid.';
    ELSE
        START TRANSACTION;
            INSERT INTO payment (due_id, paid_date, fee_paid, penalty_paid, payment_mode, notes)
            VALUES (p_due_id, p_paid_date, p_fee_paid, p_penalty_paid, p_payment_mode, p_notes);

            UPDATE fee_due SET status = 'Paid' WHERE due_id = p_due_id;
        COMMIT;
    END IF;
END //

DROP TRIGGER IF EXISTS trg_validate_payment //
CREATE TRIGGER trg_validate_payment
BEFORE INSERT ON payment
FOR EACH ROW
BEGIN
    IF NEW.fee_paid < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Fee paid cannot be negative.';
    END IF;
    IF NEW.penalty_paid < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Penalty paid cannot be negative.';
    END IF;
END //

DELIMITER ;
