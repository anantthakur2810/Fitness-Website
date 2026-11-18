-- ============================================================================
-- APEX GYM MANAGEMENT SYSTEM — DATABASE VIEWS
-- File: database/03_views.sql
-- Pre-aggregated relational views for gym reporting and analytics
-- ============================================================================

USE gym_db;

-- ----------------------------------------------------------------------------
-- View 1: v_member_dues_ledger
-- Complete subscription ledger joining member, plan, fee_due, and payment
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_member_dues_ledger AS
SELECT 
    m.member_id,
    m.full_name,
    m.phone,
    m.email,
    p.plan_name,
    p.duration_months,
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

-- ----------------------------------------------------------------------------
-- View 2: v_revenue_by_plan
-- Aggregates revenue, enrolled members, and average collection per plan tier
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- View 3: v_overdue_defaulters
-- Real-time watchlist of members with pending dues past the grace period
-- ----------------------------------------------------------------------------
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
    r.penalty_per_day,
    LEAST(r.max_penalty, GREATEST(0, DATEDIFF(CURRENT_DATE, d.due_date) - r.grace_days) * r.penalty_per_day) AS calculated_penalty,
    (d.fee_amount + LEAST(r.max_penalty, GREATEST(0, DATEDIFF(CURRENT_DATE, d.due_date) - r.grace_days) * r.penalty_per_day)) AS total_payable
FROM fee_due d
JOIN member m ON d.member_id = m.member_id
CROSS JOIN penalty_rule r
WHERE d.status = 'Pending' AND DATEDIFF(CURRENT_DATE, d.due_date) > r.grace_days;

-- ----------------------------------------------------------------------------
-- View 4: v_payment_mode_analytics
-- Financial reconciliation broken down by Cash, UPI, and Card
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_payment_mode_analytics AS
SELECT 
    payment_mode,
    COUNT(payment_id) AS total_transactions,
    SUM(fee_paid) AS total_fee_collected,
    SUM(penalty_paid) AS total_penalties_collected,
    SUM(fee_paid + penalty_paid) AS gross_revenue_collected,
    ROUND(AVG(fee_paid + penalty_paid), 2) AS average_ticket_size
FROM payment
GROUP BY payment_mode;

