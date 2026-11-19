-- ============================================================================
-- APEX GYM MANAGEMENT SYSTEM — DDL SCHEMA SCRIPT
-- File: database/01_schema.sql
-- Relational Schema with Constraints, Foreign Keys & Performance Indexes
-- Compatible with MySQL 8.0+ / MariaDB 10.5+
-- ============================================================================

CREATE DATABASE IF NOT EXISTS gym_db;
USE gym_db;

-- Drop dependent tables in reverse order for safe execution
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS payment;
DROP TABLE IF EXISTS fee_due;
DROP TABLE IF EXISTS penalty_rule;
DROP TABLE IF EXISTS member;
DROP TABLE IF EXISTS membership_plan;

-- ----------------------------------------------------------------------------
-- Table 1: membership_plan
-- Defines gym membership tiers, duration in months, and monthly subscription cost
-- ----------------------------------------------------------------------------
CREATE TABLE membership_plan (
    plan_id          INT PRIMARY KEY AUTO_INCREMENT,
    plan_name        VARCHAR(50) NOT NULL,
    duration_months  INT NOT NULL CHECK (duration_months > 0),
    monthly_fee      DECIMAL(8,2) NOT NULL CHECK (monthly_fee > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Table 2: member
-- Stores registered gym members. Enforces unique phone number per member.
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- Table 3: penalty_rule
-- Configures late fee policies: grace period, daily charge, and upper ceiling cap
-- ----------------------------------------------------------------------------
CREATE TABLE penalty_rule (
    rule_id          INT PRIMARY KEY AUTO_INCREMENT,
    grace_days       INT NOT NULL DEFAULT 5 CHECK (grace_days >= 0),
    penalty_per_day  DECIMAL(6,2) NOT NULL DEFAULT 10.00 CHECK (penalty_per_day >= 0),
    max_penalty      DECIMAL(8,2) NOT NULL DEFAULT 500.00 CHECK (max_penalty >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Table 4: fee_due
-- Tracks periodic fee schedules for members with Pending/Paid statuses
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- Table 5: payment
-- Records settled revenue transactions against fee dues
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- Table 6: attendance
-- Records member turnstile check-ins via RFID cards, QR passes, or manual gate entries
-- ----------------------------------------------------------------------------
CREATE TABLE attendance (
    attendance_id   INT PRIMARY KEY AUTO_INCREMENT,
    member_id       INT NOT NULL,
    check_in_date   DATE NOT NULL,
    check_in_time   TIME NOT NULL,
    method          ENUM('QR Code','RFID Card','Manual') NOT NULL DEFAULT 'QR Code',
    status          ENUM('Allowed','Overdue Warning','Blocked') NOT NULL DEFAULT 'Allowed',
    notes           VARCHAR(255) DEFAULT NULL,
    CONSTRAINT fk_attendance_member 
        FOREIGN KEY (member_id) REFERENCES member(member_id) 
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- Performance Indexes (Optimizing JOINs and Lookups)
-- ----------------------------------------------------------------------------
CREATE INDEX idx_member_phone ON member(phone);
CREATE INDEX idx_member_plan ON member(plan_id);
CREATE INDEX idx_fee_due_member ON fee_due(member_id);
CREATE INDEX idx_fee_due_status ON fee_due(status);
CREATE INDEX idx_fee_due_date ON fee_due(due_date);
CREATE INDEX idx_payment_due ON payment(due_id);
CREATE INDEX idx_payment_date ON payment(paid_date);
CREATE INDEX idx_payment_mode ON payment(payment_mode);
CREATE INDEX idx_attendance_member ON attendance(member_id);
CREATE INDEX idx_attendance_date ON attendance(check_in_date);
CREATE INDEX idx_attendance_method ON attendance(method);
CREATE INDEX idx_attendance_status ON attendance(status);

