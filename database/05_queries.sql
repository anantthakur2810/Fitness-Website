-- ============================================================================
-- APEX GYM MANAGEMENT SYSTEM — ACADEMIC SQL QUERIES
-- File: database/05_queries.sql
-- Demonstration queries for Semester 3 DBMS Capstone viva and evaluation
-- ============================================================================

USE gym_db;

-- ----------------------------------------------------------------------------
-- 1. INNER JOIN across 3 Tables: Member Ledger with Plan & Due Details
-- Evaluates relational joining across member, membership_plan, and fee_due
-- ----------------------------------------------------------------------------
SELECT 
    m.member_id,
    m.full_name,
    m.phone,
    p.plan_name,
    p.monthly_fee,
    d.due_id,
    d.due_date,
    d.fee_amount,
    d.status AS due_status
FROM member m
INNER JOIN membership_plan p ON m.plan_id = p.plan_id
INNER JOIN fee_due d ON m.member_id = d.member_id
ORDER BY d.due_date ASC;

-- ----------------------------------------------------------------------------
-- 2. AGGREGATE FUNCTION + GROUP BY + SUM: Total Revenue per Membership Plan
-- Groups payments by plan name and calculates total fees and penalties collected
-- ----------------------------------------------------------------------------
SELECT 
    p.plan_id,
    p.plan_name,
    COUNT(DISTINCT m.member_id) AS total_enrolled_members,
    SUM(pay.fee_paid) AS total_membership_fees,
    SUM(pay.penalty_paid) AS total_late_penalties,
    SUM(pay.fee_paid + pay.penalty_paid) AS gross_revenue
FROM membership_plan p
INNER JOIN member m ON p.plan_id = m.plan_id
INNER JOIN fee_due d ON m.member_id = d.member_id
INNER JOIN payment pay ON d.due_id = pay.due_id
GROUP BY p.plan_id, p.plan_name
ORDER BY gross_revenue DESC;

-- ----------------------------------------------------------------------------
-- 3. GROUP BY with HAVING Clause: High-Performing Membership Plans
-- Filters plans generating more than ₹10,000 in gross revenue
-- ----------------------------------------------------------------------------
SELECT 
    p.plan_name,
    COUNT(pay.payment_id) AS total_payments,
    SUM(pay.fee_paid + pay.penalty_paid) AS gross_collection
FROM membership_plan p
JOIN member m ON p.plan_id = m.plan_id
JOIN fee_due d ON m.member_id = d.member_id
JOIN payment pay ON d.due_id = pay.due_id
GROUP BY p.plan_name
HAVING gross_collection >= 10000.00;

-- ----------------------------------------------------------------------------
-- 4. LEFT OUTER JOIN: Identify Members with Zero Completed Payments
-- Finds members who joined but haven't settled any fee dues yet
-- ----------------------------------------------------------------------------
SELECT 
    m.member_id,
    m.full_name,
    m.phone,
    m.join_date,
    m.status
FROM member m
LEFT JOIN fee_due d ON m.member_id = d.member_id AND d.status = 'Paid'
WHERE d.due_id IS NULL;

-- ----------------------------------------------------------------------------
-- 5. SUBQUERY with IN: Members on Long-Term Plans (6 or 12 months)
-- ----------------------------------------------------------------------------
SELECT 
    member_id, 
    full_name, 
    phone, 
    join_date 
FROM member
WHERE plan_id IN (
    SELECT plan_id 
    FROM membership_plan 
    WHERE duration_months >= 6
);

-- ----------------------------------------------------------------------------
-- 6. CORRELATED SUBQUERY: Members with Pending Dues Higher than Average
-- Identifies high-value defaulters
-- ----------------------------------------------------------------------------
SELECT 
    d.due_id,
    m.full_name,
    d.fee_amount,
    d.due_date
FROM fee_due d
JOIN member m ON d.member_id = m.member_id
WHERE d.status = 'Pending'
  AND d.fee_amount > (
      SELECT AVG(fee_amount) 
      FROM fee_due 
      WHERE status = 'Pending'
  );

-- ----------------------------------------------------------------------------
-- 7. DATE ARITHMETIC & DATEDIFF: Real-Time Penalty Computation
-- Evaluates the grace period and daily rate according to penalty_rule
-- ----------------------------------------------------------------------------
SELECT 
    m.full_name,
    d.due_date,
    d.fee_amount,
    DATEDIFF(CURRENT_DATE, d.due_date) AS days_past_due,
    r.grace_days,
    GREATEST(0, DATEDIFF(CURRENT_DATE, d.due_date) - r.grace_days) AS chargeable_days,
    LEAST(r.max_penalty, GREATEST(0, DATEDIFF(CURRENT_DATE, d.due_date) - r.grace_days) * r.penalty_per_day) AS late_fee_penalty,
    (d.fee_amount + LEAST(r.max_penalty, GREATEST(0, DATEDIFF(CURRENT_DATE, d.due_date) - r.grace_days) * r.penalty_per_day)) AS total_amount_due
FROM fee_due d
JOIN member m ON d.member_id = m.member_id
CROSS JOIN penalty_rule r
WHERE d.status = 'Pending'
ORDER BY days_past_due DESC;

-- ----------------------------------------------------------------------------
-- 8. PAYMENT MODE BREAKDOWN: Summary by Payment Gateway / Desk
-- ----------------------------------------------------------------------------
SELECT 
    payment_mode,
    COUNT(payment_id) AS transactions_count,
    SUM(fee_paid + penalty_paid) AS total_settled,
    ROUND(AVG(fee_paid + penalty_paid), 2) AS average_transaction_amount
FROM payment
GROUP BY payment_mode
ORDER BY total_settled DESC;

